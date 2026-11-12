'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ImageUp, Search, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { adminFetch } from '@/cms/lib/client'
import { cn } from '@/cms/lib/utils'
import { Button } from '@/cms/components/ui/button'
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/cms/components/ui/alert-dialog'
import { DropOverlay, useFileDrag } from './DropOverlay'
import { MediaDrawer } from './MediaDrawer'
import { GRID_CLASS, MediaTile, MediaTileSkeleton } from './MediaTile'
import type { MediaItem } from './types'
import { UploadTray } from './UploadTray'
import { acceptAttribute, tileMeta, uploadLimitLines } from './upload-limits'
import { useMediaList, type MediaFilters } from './useMediaList'
import { useUploadQueue } from './useUploadQueue'

type Props = { canUpload: boolean; canEdit: boolean; canDelete: boolean; startUpload?: boolean }

const controlClass = 'h-[34px] rounded-lg border border-input bg-background px-2.5 text-[13px] text-foreground shadow-[0_1px_2px_rgb(var(--shadow)/.04)]'

const matchesType = (item: MediaItem, type: MediaFilters['type']) =>
  type === 'all' || (type === 'image' ? item.mimeType.startsWith('image/') : type === 'video' ? item.mimeType.startsWith('video/') : !/^(image|video)\//.test(item.mimeType))

/** The media library page (Media A): grid, drop anywhere to upload, detail drawer on the right. */
export default function MediaLibrary({ canUpload, canEdit, canDelete, startUpload = false }: Props) {
  const [q, setQ] = useState('')
  const [type, setType] = useState<MediaFilters['type']>('all')
  const [unused, setUnused] = useState(false)
  const list = useMediaList({ q, type, unused })
  const [usage, setUsage] = useState<Record<string, number>>({})
  const requested = useRef(new Set<string>())
  const [fresh, setFresh] = useState<Set<string>>(() => new Set())
  const [active, setActive] = useState<MediaItem | null>(null)
  const [selecting, setSelecting] = useState(false)
  const [picked, setPicked] = useState<Set<string>>(() => new Set())
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkForce, setBulkForce] = useState(false)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [hint, setHint] = useState(startUpload && canUpload)
  const fileInput = useRef<HTMLInputElement>(null)
  const filtered = q.trim() !== '' || type !== 'all' || unused

  // Usage counts ("In 2 posts") for tiles we have not asked about yet.
  useEffect(() => {
    const ids = list.items.map((item) => item.id).filter((id) => !requested.current.has(id))
    if (!ids.length) return
    for (const id of ids) requested.current.add(id)
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100)
      adminFetch<{ usage: Record<string, number> }>(`/api/admin/media/usage?ids=${encodeURIComponent(chunk.join(','))}`)
        .then((data) => setUsage((current) => ({ ...current, ...data.usage })))
        .catch(() => { for (const id of chunk) requested.current.delete(id) })
    }
  }, [list.items])

  const forgetUsage = useCallback((ids: string[]) => {
    for (const id of ids) requested.current.delete(id)
    setUsage((current) => Object.fromEntries(Object.entries(current).filter(([id]) => !ids.includes(id))))
  }, [])

  const { prepend } = list
  const onUploaded = useCallback((media: MediaItem) => {
    if (!matchesType(media, type)) return
    if (!requested.current.has(media.id)) { requested.current.add(media.id); setUsage((current) => ({ ...current, [media.id]: 0 })) }
    setFresh((current) => new Set(current).add(media.id))
    prepend(media)
  }, [prepend, type])
  const uploads = useUploadQueue({ onUploaded })
  const { add: addUpload } = uploads
  const addFiles = useCallback((files: File[]) => { setHint(false); addUpload(files) }, [addUpload])
  const drag = useFileDrag(addFiles, { enabled: canUpload, anchorId: 'admin-main' })

  // Arriving from the dashboard's "Upload images": browsers only open the file picker after a click,
  // so try it and otherwise show the hint with its own button. The parameter is dropped from the URL.
  useEffect(() => {
    if (!startUpload || !canUpload) return
    const url = new URL(window.location.href)
    url.searchParams.delete('upload')
    window.history.replaceState(window.history.state, '', url)
    try { fileInput.current?.showPicker() } catch { /* needs a user gesture; the hint stays */ }
  }, [startUpload, canUpload])

  const closeDrawer = useCallback(() => {
    const id = active?.id
    setActive(null)
    if (id) requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-media-id="${CSS.escape(id)}"]`)?.focus())
  }, [active?.id])

  function openTile(item: MediaItem) {
    if (selecting) {
      setPicked((current) => { const next = new Set(current); if (next.has(item.id)) next.delete(item.id); else next.add(item.id); return next })
      return
    }
    setActive((current) => current?.id === item.id ? null : item)
  }

  async function bulkDelete() {
    setBulkBusy(true)
    try {
      const data = await adminFetch<{ deleted: number; deletedIds: string[]; failures: { id: string; error: string }[] }>('/api/admin/media/bulk', { method: 'DELETE', json: { ids: [...picked], force: bulkForce } })
      list.remove(data.deletedIds)
      if (data.failures.length) toast.warning(`${data.deleted} deleted. ${data.failures.length} kept: ${data.failures[0].error}`)
      else toast.success(`${data.deleted} ${data.deleted === 1 ? 'file' : 'files'} deleted`)
      setPicked(new Set(data.failures.map((failure) => failure.id)))
      if (!data.failures.length) setSelecting(false)
      setBulkOpen(false)
      setBulkForce(false)
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Delete failed') }
    finally { setBulkBusy(false) }
  }

  const pickedInUse = [...picked].filter((id) => (usage[id] ?? 0) > 0).length
  const [limitFirst, limitSecond] = uploadLimitLines()

  return <div className={cn('transition-[padding] duration-[var(--dur-slow)] ease-[var(--ease-out)]', active && 'xl:pr-[380px]')}>
    <div className="flex flex-wrap items-center gap-3">
      <h1 className="text-2xl font-semibold">Media</h1>
      <span className="text-[13px] text-muted-foreground" aria-live="polite">{list.loading && !list.items.length ? '' : `${list.total} ${list.total === 1 ? 'file' : 'files'}`}</span>
      <span className="flex-1" />
      <label className={cn(controlClass, 'flex w-full items-center gap-2 sm:w-[260px] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20')}>
        <Search className="size-4 flex-none text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Search files</span>
        <input type="search" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search name or alt text" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground focus-visible:outline-none" />
        {q && <button type="button" aria-label="Clear search" onClick={() => setQ('')} className="text-muted-foreground hover:text-foreground"><X className="size-3.5" /></button>}
      </label>
      <label><span className="sr-only">File type</span>
        <select value={type} onChange={(event) => setType(event.target.value as MediaFilters['type'])} className={controlClass}>
          <option value="all">All types</option><option value="image">Images</option><option value="video">Videos</option><option value="other">Other files</option>
        </select>
      </label>
      <button type="button" aria-pressed={unused} onClick={() => setUnused((value) => !value)} className={cn(controlClass, 'cms-press font-medium', unused ? 'border-transparent bg-accent text-accent-foreground' : 'hover:bg-muted')}>Unused only</button>
      {canDelete && <button type="button" aria-pressed={selecting} onClick={() => { setSelecting((value) => !value); setPicked(new Set()); setActive(null) }} className={cn(controlClass, 'cms-press font-medium', selecting ? 'border-transparent bg-accent text-accent-foreground' : 'hover:bg-muted')}>{selecting ? 'Done' : 'Select'}</button>}
      {canUpload && <Button type="button" className="h-[34px]" onClick={() => fileInput.current?.click()}><Upload />Upload</Button>}
      <input ref={fileInput} type="file" multiple hidden accept={acceptAttribute()} onChange={(event) => { addFiles(Array.from(event.target.files ?? [])); event.target.value = '' }} />
    </div>

    {hint && <div role="status" className="cms-fade-up mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-primary bg-accent px-4 py-3 text-[13px] text-accent-foreground">
      <ImageUp className="size-5 flex-none" aria-hidden="true" />
      <span className="min-w-0 flex-1"><b className="font-semibold">Drop files anywhere on this page</b>, or choose them. {limitFirst}.</span>
      <Button type="button" size="sm" autoFocus onClick={() => fileInput.current?.click()}>Choose files</Button>
      <button type="button" aria-label="Dismiss" onClick={() => setHint(false)} className="grid size-7 place-items-center rounded-md hover:bg-background/60"><X className="size-4" /></button>
    </div>}

    {list.error
      ? <div role="alert" className="mt-6 rounded-xl border border-destructive/40 p-4 text-[13px]"><p>{list.error}</p><Button className="mt-3" size="sm" variant="outline" onClick={() => void list.reload()}>Retry</Button></div>
      : list.loading && !list.items.length
        ? <div className={cn(GRID_CLASS, 'mt-[22px]')} role="status" aria-label="Loading files">{Array.from({ length: 12 }, (_, i) => <MediaTileSkeleton key={i} />)}</div>
        : !list.items.length
          ? <EmptyState filtered={filtered} canUpload={canUpload} limits={[limitFirst, limitSecond]} onUpload={() => fileInput.current?.click()} onClear={() => { setQ(''); setType('all'); setUnused(false) }} />
          : <>
            <div className={cn(GRID_CLASS, 'mt-[22px] transition-opacity duration-[var(--dur-base)]', list.loading && 'opacity-60')} aria-busy={list.loading}>
              {list.items.map((item) => <MediaTile
                key={item.id}
                item={item}
                meta={tileMeta(item, usage[item.id])}
                selected={selecting ? picked.has(item.id) : active?.id === item.id}
                checkable={selecting}
                fresh={fresh.has(item.id)}
                onClick={() => openTile(item)}
              />)}
              {list.loadingMore && Array.from({ length: 4 }, (_, i) => <MediaTileSkeleton key={`more-${i}`} />)}
            </div>
            {list.hasMore && <div className="mt-8 flex justify-center"><Button type="button" variant="outline" size="sm" disabled={list.loadingMore} onClick={list.loadMore}>{list.loadingMore ? 'Loading…' : `Load more (${list.total - list.items.length} left)`}</Button></div>}
          </>}

    {selecting && picked.size > 0 && <div className="cms-pop fixed bottom-7 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 text-[13px] shadow-[0_16px_40px_rgb(var(--shadow)/.14)] [--origin:bottom_center]">
      <span className="font-medium">{picked.size} selected</span>
      <Button type="button" size="sm" variant="ghost" onClick={() => setPicked(new Set())}>Clear</Button>
      <Button type="button" size="sm" variant="destructive" onClick={() => setBulkOpen(true)}>Delete</Button>
    </div>}

    <AlertDialog open={bulkOpen} onOpenChange={(open) => { if (!bulkBusy) setBulkOpen(open) }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {picked.size} {picked.size === 1 ? 'file' : 'files'}?</AlertDialogTitle>
          <AlertDialogDescription>
            Files are removed for good. {pickedInUse ? `${pickedInUse} of them ${pickedInUse === 1 ? 'is' : 'are'} used in posts and will be kept unless you tick the box below.` : 'Files still used in posts are kept.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <label className="flex items-start gap-2 text-[13px]"><input type="checkbox" className="mt-0.5 accent-[var(--destructive)]" checked={bulkForce} onChange={(event) => setBulkForce(event.target.checked)} />Also delete files that are used in posts (their images break)</label>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={bulkBusy}>Cancel</AlertDialogCancel>
          <Button type="button" variant="destructive" disabled={bulkBusy} onClick={() => void bulkDelete()}>{bulkBusy ? 'Deleting…' : bulkForce ? 'Delete anyway' : 'Delete'}</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {active && <MediaDrawer
      item={active}
      canEdit={canEdit}
      canUpload={canUpload}
      canDelete={canDelete}
      onClose={closeDrawer}
      onChange={(item) => { list.replace(item.id, item); setActive((current) => current?.id === item.id ? item : current) }}
      onReplaced={(originalId, replacement) => {
        forgetUsage([originalId, replacement.id])
        setFresh((current) => new Set(current).add(replacement.id))
        list.prepend(replacement)
        setActive(replacement)
      }}
      onDeleted={(id) => {
        const index = list.items.findIndex((item) => item.id === id)
        const next = list.items[index + 1] ?? list.items[index - 1]
        list.remove([id])
        setActive(null)
        requestAnimationFrame(() => (next ? document.querySelector<HTMLElement>(`[data-media-id="${CSS.escape(next.id)}"]`) : document.querySelector<HTMLElement>('h1'))?.focus())
      }}
    />}

    {canUpload && <DropOverlay state={drag} className="fixed inset-3" />}
    <UploadTray rows={uploads.rows} onRetry={uploads.retry} onRemove={uploads.remove} onClear={uploads.clear} className="fixed right-7 bottom-7" />
  </div>
}

function EmptyState({ filtered, canUpload, limits, onUpload, onClear }: { filtered: boolean; canUpload: boolean; limits: string[]; onUpload: () => void; onClear: () => void }) {
  return <div className="cms-fade-up mt-6 flex flex-col items-center rounded-2xl border-2 border-dashed border-border px-6 py-16 text-center">
    <span className="grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground"><ImageUp className="size-6" aria-hidden="true" /></span>
    {filtered
      ? <><p className="mt-4 text-base font-semibold">No files match</p><p className="mt-1 text-[13px] text-muted-foreground">Try another name, or clear the filters.</p><Button type="button" variant="outline" size="sm" className="mt-4" onClick={onClear}>Clear filters</Button></>
      : <>
        <p className="mt-4 text-base font-semibold">No files yet</p>
        <p className="mt-1 text-[13px] text-muted-foreground">{canUpload ? 'Drag images or documents anywhere on this page, or choose them.' : 'Files uploaded by publishers appear here.'}</p>
        {canUpload && <><Button type="button" className="mt-5" onClick={onUpload}><Upload />Upload files</Button>
          {limits.map((line) => <p key={line} className="mt-2 text-xs text-muted-foreground first-of-type:mt-4">{line}</p>)}</>}
      </>}
  </div>
}
