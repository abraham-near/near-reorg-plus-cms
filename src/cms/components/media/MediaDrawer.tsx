'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Copy, Download, Loader2, RefreshCw, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { adminFetch, AdminApiError } from '@/cms/lib/client'
import { cn } from '@/cms/lib/utils'
import { Button } from '@/cms/components/ui/button'
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/cms/components/ui/alert-dialog'
import { isCmsMediaUrl } from './reference-values'
import { FileTypeIcon } from './MediaTile'
import { CheckMark } from './UploadTray'
import type { MediaDetail, MediaItem, MediaReference } from './types'
import { acceptAttribute, checkUpload, formatBytes, isImage, typeLabel } from './upload-limits'

type Props = {
  item: MediaItem
  canEdit: boolean
  canUpload: boolean
  canDelete: boolean
  onClose: () => void
  /** Alt text or file name saved. */
  onChange: (item: MediaItem) => void
  /** A new file took this one's place in posts; the original stays in the library. */
  onReplaced: (originalId: string, replacement: MediaItem) => void
  onDeleted: (id: string) => void
}

/** Recommended alt text length; screen readers handle longer text, the server accepts 500. */
const ALT_TARGET = 125
const ALT_MAX = 500

const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Please retry.'

/** Right-hand detail panel for one file (Media B structure, light theme). Esc or ✕ closes it. */
export function MediaDrawer(props: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const confirming = useRef(false)
  const flush = useRef<(() => void) | null>(null)
  const { onClose } = props

  // First open moves focus into the panel; switching files keeps it where the person is.
  useEffect(() => { closeRef.current?.focus({ preventScroll: true }) }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || confirming.current) return
      flush.current?.()
      onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return <aside
    aria-label="File details"
    className="cms-drawer fixed top-0 right-0 bottom-0 z-30 flex w-full flex-col gap-[18px] overflow-y-auto border-l border-border bg-card p-5 text-card-foreground shadow-[-24px_0_48px_rgb(var(--shadow)/.08)] sm:w-[440px]"
  >
    <DrawerBody key={props.item.id} {...props} closeRef={closeRef} confirmingRef={confirming} flushRef={flush} />
  </aside>
}

function DrawerBody({ item, canEdit, canUpload, canDelete, onClose, onChange, onReplaced, onDeleted, closeRef, confirmingRef, flushRef }: Props & {
  closeRef: React.RefObject<HTMLButtonElement | null>
  confirmingRef: React.RefObject<boolean>
  flushRef: React.RefObject<(() => void) | null>
}) {
  const [detail, setDetail] = useState<MediaDetail | null>(null)
  const [loadError, setLoadError] = useState('')
  const [current, setCurrent] = useState(item)
  const [alt, setAlt] = useState(item.alt ?? '')
  const [filename, setFilename] = useState(item.filename)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [size, setSize] = useState<{ w: number; h: number } | null>(item.width && item.height ? { w: item.width, h: item.height } : null)
  const [busy, setBusy] = useState<'replace' | 'delete' | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [references, setReferences] = useState<MediaReference[] | null>(null)
  const replaceInput = useRef<HTMLInputElement>(null)
  const image = isImage(current)
  const altId = `media-alt-${item.id}`

  useEffect(() => { confirmingRef.current = confirmOpen }, [confirmOpen, confirmingRef])

  useEffect(() => {
    let cancelled = false
    adminFetch<MediaDetail>(`/api/admin/media/${item.id}`)
      .then((data) => { if (!cancelled) { setDetail(data); setReferences(data.references) } })
      .catch((error) => { if (!cancelled) setLoadError(errorMessage(error)) })
    return () => { cancelled = true }
  }, [item.id])

  // "Saved" stays briefly, then gets out of the way.
  useEffect(() => {
    if (saveState !== 'saved') return
    const timer = setTimeout(() => setSaveState('idle'), 2000)
    return () => clearTimeout(timer)
  }, [saveState])

  async function save(patch: { alt?: string | null; filename?: string }) {
    setSaveState('saving')
    try {
      const saved = await adminFetch<MediaItem>(`/api/admin/media/${current.id}`, { method: 'PATCH', json: patch })
      setCurrent(saved)
      onChange(saved)
      setSaveState('saved')
    } catch (error) {
      setSaveState('error')
      toast.error(`Couldn't save: ${errorMessage(error)}`)
    }
  }
  const altDirty = alt.trim() !== (current.alt ?? '').trim()
  const nameDirty = filename.trim() !== current.filename && filename.trim().length > 0
  const saveAlt = () => { if (altDirty && canEdit) void save({ alt: alt.trim() || null }) }
  const saveName = () => { if (nameDirty && canEdit) void save({ filename: filename.trim() }) }
  // Closing with Esc skips the blur, so the panel saves what is pending first.
  useEffect(() => {
    flushRef.current = () => { saveAlt(); saveName() }
    return () => { flushRef.current = null }
  })

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(new URL(current.url, window.location.origin).href)
      toast.success('URL copied')
    } catch { toast.error("Couldn't copy the URL") }
  }

  async function replace(file: File) {
    const problem = checkUpload(file, { imagesOnly: image })
    if (problem) { toast.error(problem); return }
    setBusy('replace')
    try {
      const body = new FormData()
      body.set('file', file)
      body.set('replaceEverywhere', '1')
      const result = await adminFetch<{ media: MediaItem; updated: number; occurrences: number }>(`/api/admin/media/${current.id}/replace`, { method: 'POST', body })
      if (result.media.id === current.id) toast.info('That is the same file. Nothing changed.')
      else {
        toast.success(result.updated ? `File replaced in ${result.updated} ${result.updated === 1 ? 'post' : 'posts'}. The original stays in the library.` : 'New file uploaded. No posts used the original.')
        onReplaced(current.id, result.media)
      }
    } catch (error) { toast.error(errorMessage(error)) }
    finally { setBusy(null) }
  }

  async function remove(force: boolean) {
    setBusy('delete')
    try {
      await adminFetch(`/api/admin/media/${current.id}`, { method: 'DELETE', json: { force } })
      toast.success(`${current.filename} deleted`)
      setConfirmOpen(false)
      onDeleted(current.id)
    } catch (error) {
      // Someone added it to a post in the meantime: show where, and offer to delete anyway.
      const details = error instanceof AdminApiError ? error.details as { references?: MediaReference[] } | undefined : undefined
      if (error instanceof AdminApiError && error.status === 409 && details?.references) setReferences(details.references)
      else { toast.error(errorMessage(error)); setConfirmOpen(false) }
    } finally { setBusy(null) }
  }

  const uploadedAt = new Date(current.createdAt)
  const uploader = detail?.uploadedBy ? (detail.uploadedBy.name || detail.uploadedBy.email) : null
  const used = references?.length ?? 0

  return <>
    <div className="flex items-center gap-2">
      {canEdit
        ? <input
          aria-label="File name"
          value={filename}
          maxLength={200}
          onChange={(event) => setFilename(event.target.value)}
          onBlur={() => { if (!filename.trim()) setFilename(current.filename); else saveName() }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
            if (event.key === 'Escape') { const input = event.currentTarget; event.stopPropagation(); setFilename(current.filename); requestAnimationFrame(() => input.blur()) }
          }}
          className="-ml-1.5 h-8 min-w-0 flex-1 truncate rounded-md border border-transparent bg-transparent px-1.5 text-sm font-semibold hover:border-input focus:border-input focus:outline-none focus-visible:outline-none focus:ring-[3px] focus:ring-ring/30"
        />
        : <h2 className="min-w-0 flex-1 truncate text-sm font-semibold" title={current.filename}>{current.filename}</h2>}
      <button ref={closeRef} type="button" aria-label="Close details" onClick={() => { flushRef.current?.(); onClose() }} className="cms-press grid size-[30px] flex-none place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
        <X className="size-4" />
      </button>
    </div>

    <div className="relative grid aspect-[4/3] flex-none place-items-center overflow-hidden rounded-xl bg-muted">
      {image && isCmsMediaUrl(current.url)
        // eslint-disable-next-line @next/next/no-img-element -- CMS files are already sized; no optimizer for /cms
        ? <img src={current.url} alt={current.alt ?? ''} className="max-h-full max-w-full object-contain" onLoad={(event) => { const img = event.currentTarget; if (img.naturalWidth) setSize({ w: img.naturalWidth, h: img.naturalHeight }) }} />
        : current.mimeType.startsWith('video/') && isCmsMediaUrl(current.url)
          ? <video src={current.url} controls preload="metadata" className="max-h-full max-w-full" onLoadedMetadata={(event) => { const v = event.currentTarget; if (v.videoWidth) setSize({ w: v.videoWidth, h: v.videoHeight }) }} />
          : <FileTypeIcon item={current} />}
      <span className="pointer-events-none absolute right-2.5 bottom-2.5 rounded-md bg-black/65 px-2 py-[3px] text-[11.5px] text-white tabular-nums">
        {size ? `${size.w} × ${size.h} · ` : ''}{formatBytes(current.size)}
      </span>
    </div>

    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <label htmlFor={altId} className="text-xs font-medium text-secondary-foreground">
          Alt text{image && <span className="font-normal text-[var(--warning-fg)]"> · required for publishing</span>}
        </label>
        <span className="flex-1" />
        <SaveBadge state={saveState} />
      </div>
      <textarea
        id={altId}
        rows={3}
        value={alt}
        maxLength={ALT_MAX}
        readOnly={!canEdit}
        aria-describedby={`${altId}-count`}
        placeholder={image ? 'Describe what the image shows' : 'Describe the file'}
        onChange={(event) => setAlt(event.target.value)}
        onBlur={saveAlt}
        className="w-full resize-none rounded-lg border border-input bg-background px-2.5 py-2 text-[13px] leading-relaxed placeholder:text-muted-foreground focus:border-ring focus:outline-none focus-visible:outline-none focus:ring-[3px] focus:ring-ring/20 read-only:bg-muted"
      />
      <div className="mt-1 flex items-center gap-2 text-[11.5px] text-muted-foreground">
        <span>{canEdit ? 'Saved when you click away.' : 'You can view but not edit this.'}</span>
        <span className="flex-1" />
        <span id={`${altId}-count`} className={cn('tabular-nums', alt.length > ALT_TARGET && 'text-[var(--warning-fg)]')} aria-live="polite">
          {alt.length} / {ALT_TARGET}<span className="sr-only"> recommended characters</span>
        </span>
      </div>
    </div>

    <div>
      <span className="mb-1.5 block text-xs font-medium text-secondary-foreground">
        {references === null ? 'Where it is used' : used ? `Used in ${used} ${used === 1 ? 'post' : 'posts'}` : 'Not used in any post yet'}
      </span>
      {references === null
        ? loadError ? <p className="text-[13px] text-destructive">{loadError}</p> : <div className="flex flex-col gap-1.5"><span className="cms-skeleton block h-9" /><span className="cms-skeleton block h-9" /></div>
        : used > 0 && <ul className="flex flex-col gap-1.5">
          {references.map((ref) => <li key={`${ref.entityType}:${ref.id}`}>
            <UsageLink reference={ref} />
          </li>)}
        </ul>}
    </div>

    <dl className="grid grid-cols-2 gap-3">
      <div><dt className="text-xs text-muted-foreground">Uploaded</dt><dd className="mt-0.5 text-[13px]" title={uploadedAt.toLocaleString()}>{uploadedAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}{uploader && ` · ${uploader}`}</dd></div>
      <div><dt className="text-xs text-muted-foreground">Type</dt><dd className="mt-0.5 text-[13px]">{typeLabel(current)}</dd></div>
    </dl>

    <div className="mt-auto flex flex-wrap gap-2 border-t border-border pt-4">
      <Button type="button" variant="outline" size="sm" onClick={copyUrl}><Copy />Copy URL</Button>
      {canEdit && canUpload && <>
        <Button type="button" variant="outline" size="sm" disabled={busy !== null} onClick={() => replaceInput.current?.click()}>
          {busy === 'replace' ? <Loader2 className="cms-spin" /> : <RefreshCw />}{busy === 'replace' ? 'Replacing…' : 'Replace file'}
        </Button>
        <input ref={replaceInput} type="file" hidden accept={acceptAttribute(image)} onChange={(event) => { const file = event.target.files?.[0]; if (file) void replace(file); event.target.value = '' }} />
      </>}
      {isCmsMediaUrl(current.url) && <Button type="button" variant="outline" size="sm" asChild><a href={current.url} download={current.filename}><Download />Download</a></Button>}
      <span className="flex-1" />
      {canDelete && <Button type="button" variant="ghost" size="sm" disabled={busy !== null} className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setConfirmOpen(true)}><Trash2 />Delete</Button>}
    </div>

    <AlertDialog open={confirmOpen} onOpenChange={(open) => { if (busy !== 'delete') setConfirmOpen(open) }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{used ? 'This file is still in use' : `Delete ${current.filename}?`}</AlertDialogTitle>
          <AlertDialogDescription>
            {used
              ? `It appears in ${used} ${used === 1 ? 'post' : 'posts'}. Deleting it breaks the image or link there; replacing the file keeps those posts working.`
              : 'The file is removed for good. Old revisions and other websites that link to it will stop showing it.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {used > 0 && references && <ul className="flex max-h-48 flex-col gap-1.5 overflow-y-auto">
          {references.map((ref) => <li key={`${ref.entityType}:${ref.id}`}><UsageLink reference={ref} /></li>)}
        </ul>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy === 'delete'}>Cancel</AlertDialogCancel>
          {/* A plain button: the dialog stays open if the server reports new references. */}
          <Button type="button" variant="destructive" disabled={busy === 'delete'} onClick={() => void remove(used > 0)}>
            {busy === 'delete' && <Loader2 className="cms-spin" />}{used ? 'Delete anyway' : 'Delete file'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
}

const STATUS_DOT: Record<string, { dot: string; label: string }> = {
  PUBLISHED: { dot: 'bg-[var(--status-published)]', label: 'Published' },
  SCHEDULED: { dot: 'bg-[var(--status-scheduled)]', label: 'Scheduled' },
  DRAFT: { dot: 'bg-[var(--status-draft)]', label: 'Draft' },
  ARCHIVED: { dot: 'bg-[var(--status-archived)]', label: 'Archived' },
}

function UsageLink({ reference }: { reference: MediaReference }) {
  const status = STATUS_DOT[reference.status ?? ''] ?? STATUS_DOT.DRAFT
  const content = <>
    <span aria-hidden="true" className={cn('size-2 flex-none rounded-full', status.dot)} />
    <span className="min-w-0 flex-1 truncate">{reference.title || 'Untitled'}</span>
    {reference.status && <span className="flex-none text-[11.5px] text-muted-foreground">{status.label}</span>}
  </>
  const className = 'flex items-center gap-2.5 rounded-lg bg-muted px-2.5 py-2 text-[13px] text-secondary-foreground'
  return reference.path
    ? <Link href={reference.path} className={cn(className, 'transition-colors duration-[var(--dur-fast)] hover:bg-secondary hover:text-foreground')}>{content}</Link>
    : <span className={className}>{content}</span>
}

function SaveBadge({ state }: { state: 'idle' | 'saving' | 'saved' | 'error' }) {
  if (state === 'idle') return null
  return <span role="status" key={state} className={cn(
    'cms-fade-up inline-flex h-5 items-center gap-1 rounded-full px-2 text-[11.5px] font-medium',
    state === 'saving' && 'text-muted-foreground',
    state === 'saved' && 'bg-accent text-accent-foreground',
    state === 'error' && 'text-destructive',
  )}>
    {state === 'saving' && <><Loader2 className="cms-spin size-3" />Saving…</>}
    {state === 'saved' && <><CheckMark className="size-3" />Saved</>}
    {state === 'error' && 'Not saved'}
  </span>
}
