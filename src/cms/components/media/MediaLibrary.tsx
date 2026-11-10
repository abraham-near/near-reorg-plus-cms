'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { FileText, Search, Upload, Copy, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { adminFetch } from '@/cms/lib/client'
import { formatAdminDate } from '@/cms/lib/utils'
import { Button } from '@/cms/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/cms/components/ui/dialog'
import { isCmsMediaUrl } from './reference-values'
import type { MediaItem, MediaReference } from './types'

type Props = { canUpload: boolean; canEdit: boolean; canDelete: boolean }
type Result = { items: MediaItem[]; total: number; page: number; pageSize: number }
const inputClass = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Please retry.'

export default function MediaLibrary({ canUpload, canEdit, canDelete }: Props) {
  const [result, setResult] = useState<Result>({ items: [], total: 0, page: 1, pageSize: 24 })
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [active, setActive] = useState<MediaItem | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [queue, setQueue] = useState<{ name: string; status: string }[]>([])
  const [busy, setBusy] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [force, setForce] = useState(false)
  const requestId = useRef(0)
  const uploadInput = useRef<HTMLInputElement>(null)

  const load = useCallback(async (page = 1) => {
    const id = ++requestId.current
    setLoading(true)
    setError('')
    try {
      const data = await adminFetch<Result>(`/api/admin/media?${new URLSearchParams({ page: String(page), q: search, type })}`)
      if (id === requestId.current) { setResult(data); setSelected([]) }
    } catch (error) { if (id === requestId.current) setError(errorMessage(error)) }
    finally { if (id === requestId.current) setLoading(false) }
  }, [search, type])

  useEffect(() => {
    const timer = setTimeout(() => { void load() }, 200)
    return () => { clearTimeout(timer); requestId.current++ }
  }, [load])

  async function upload(files: File[]) {
    if (!files.length || busy) return
    const limited = files.slice(0, 25)
    setBusy(true)
    setQueue(limited.map((file) => ({ name: file.name, status: 'Queued' })))
    let completed = 0
    for (let i = 0; i < limited.length; i++) {
      setQueue((q) => q.map((row, index) => index === i ? { ...row, status: 'Uploading…' } : row))
      try {
        const body = new FormData()
        body.set('file', limited[i])
        await adminFetch('/api/admin/media', { method: 'POST', body })
        completed++
        setQueue((q) => q.map((row, index) => index === i ? { ...row, status: 'Uploaded' } : row))
      } catch (error) { setQueue((q) => q.map((row, index) => index === i ? { ...row, status: errorMessage(error) } : row)) }
    }
    setBusy(false)
    const message = `${completed} of ${limited.length} files uploaded`
    if (completed === limited.length) toast.success(message)
    else if (completed) toast.warning(message)
    else toast.error('No files uploaded. Check the errors below and try again.')
    await load()
  }

  async function bulkDelete() {
    setBusy(true)
    try {
      const data = await adminFetch<{ deleted: number; failures: { error: string }[] }>('/api/admin/media/bulk', { method: 'DELETE', json: { ids: selected, force } })
      if (data.failures.length) toast.error(`${data.deleted} deleted. ${data.failures.length} kept: ${data.failures[0].error}`)
      else toast.success(`${data.deleted} files deleted`)
      setBulkOpen(false)
      setForce(false)
      await load()
    } catch (error) { toast.error(errorMessage(error)) }
    finally { setBusy(false) }
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-3xl font-bold">Media</h1><p className="mt-1 text-sm text-muted-foreground">Upload, organize and see where your files are used.</p></div>
      {canUpload && <Button onClick={() => { setUploadOpen(true); setQueue([]) }}><Upload className="size-4" />Upload files</Button>}
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <label className="relative min-w-48 flex-1"><span className="sr-only">Search files</span><Search className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" /><input className={`${inputClass} pl-9`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search filename or alt text…" /></label>
      <label><span className="sr-only">File type</span><select className={inputClass} value={type} onChange={(e) => setType(e.target.value)}><option value="all">All types</option><option value="image">Images</option><option value="video">Videos</option><option value="other">Other files</option></select></label>
      <span className="text-sm text-muted-foreground">{result.total} {result.total === 1 ? 'file' : 'files'}</span>
    </div>
    {canDelete && result.items.length > 0 && <div className="flex flex-wrap items-center gap-3 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={selected.length === result.items.length} onChange={(e) => setSelected(e.target.checked ? result.items.map((item) => item.id) : [])} />Select this page</label>{selected.length > 0 && <Button variant="destructive" size="sm" onClick={() => setBulkOpen(true)}>Delete {selected.length} selected</Button>}</div>}
    {error ? <div role="alert" className="rounded-md border border-destructive p-4"><p>{error}</p><Button className="mt-3" variant="outline" onClick={() => load()}>Retry</Button></div> : loading ? <p role="status" className="py-12 text-muted-foreground">Loading files…</p> : result.items.length === 0 ? <div className="rounded-lg border border-dashed p-12 text-center"><FileText className="mx-auto mb-3 size-8 text-muted-foreground" /><p>{search || type !== 'all' ? 'No matching files.' : 'No files yet.'}</p>{canUpload && <Button className="mt-4" variant="outline" onClick={() => setUploadOpen(true)}>Upload your first file</Button>}</div> : <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {result.items.map((item) => <article key={item.id} className="relative overflow-hidden rounded-lg border border-border bg-card">
        {canDelete && <label className="absolute top-2 left-2 z-10 rounded bg-background p-1"><span className="sr-only">Select {item.filename}</span><input type="checkbox" checked={selected.includes(item.id)} onChange={(e) => setSelected((ids) => e.target.checked ? [...ids, item.id] : ids.filter((id) => id !== item.id))} /></label>}
        <button className="block w-full text-left" onClick={() => setActive(item)}><div className="flex aspect-[4/3] items-center justify-center bg-muted">{item.mimeType.startsWith('image/') && isCmsMediaUrl(item.url) ? <img src={item.url} alt={item.alt || ''} loading="lazy" className="h-full w-full object-contain" /> : <FileText className="size-12 text-muted-foreground" />}</div><div className="p-3"><p className="truncate text-sm font-medium" title={item.filename}>{item.filename}</p><p className="mt-1 truncate text-xs text-muted-foreground">{(item.size / 1024).toFixed(1)} KB · {item.mimeType}</p></div></button>
      </article>)}
    </div>}
    <div className="flex items-center justify-between gap-3"><Button variant="outline" disabled={loading || result.page <= 1} onClick={() => load(result.page - 1)}>Previous</Button><span className="text-sm text-muted-foreground">Page {result.page} of {Math.max(1, Math.ceil(result.total / result.pageSize))}</span><Button variant="outline" disabled={loading || result.page * result.pageSize >= result.total} onClick={() => load(result.page + 1)}>Next</Button></div>
    <Dialog open={uploadOpen} onOpenChange={(open) => { if (!busy) setUploadOpen(open) }}><DialogContent><DialogHeader><DialogTitle>Upload files</DialogTitle><DialogDescription>Up to 25 at a time. Images up to 15 MB, documents up to 50 MB, video up to 200 MB. The server checks the file contents.</DialogDescription></DialogHeader><button disabled={busy} className="rounded-lg border-2 border-dashed p-10 text-center disabled:opacity-50" onClick={() => uploadInput.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void upload(Array.from(e.dataTransfer.files)) }}><Upload className="mx-auto mb-3 size-8" />Drop files or browse</button><input ref={uploadInput} type="file" multiple hidden onChange={(e) => { void upload(Array.from(e.target.files || [])); e.target.value = '' }} /><ul className="max-h-64 space-y-2 overflow-auto text-sm" aria-live="polite">{queue.map((row, i) => <li key={i} className="flex justify-between gap-3"><span className="truncate">{row.name}</span><span>{row.status}</span></li>)}</ul><Button disabled={busy} onClick={() => setUploadOpen(false)}>Done</Button></DialogContent></Dialog>
    <Dialog open={bulkOpen} onOpenChange={setBulkOpen}><DialogContent><DialogHeader><DialogTitle>Delete {selected.length} files?</DialogTitle><DialogDescription>Files will be permanently removed. Files still in use are kept unless you explicitly force deletion.</DialogDescription></DialogHeader><label className="flex gap-2 text-sm"><input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} />Force deletion even if referenced (breaks content)</label><Button variant="destructive" disabled={busy} onClick={bulkDelete}>{busy ? 'Deleting…' : 'Delete selected files'}</Button></DialogContent></Dialog>
    {active && <MediaDetails key={active.id} item={active} canEdit={canEdit} canUpload={canUpload} canDelete={canDelete} onClose={() => setActive(null)} onChanged={async () => { await load(result.page) }} />}
  </div>
}

function MediaDetails({ item, canEdit, canUpload, canDelete, onClose, onChanged }: { item: MediaItem; onClose: () => void; onChanged: () => Promise<void> } & Props) {
  const [current, setCurrent] = useState(item)
  const [filename, setFilename] = useState(item.filename)
  const [alt, setAlt] = useState(item.alt || '')
  const [references, setReferences] = useState<MediaReference[] | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [replaceEverywhere, setReplaceEverywhere] = useState(true)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [force, setForce] = useState(false)
  const replaceInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    adminFetch<{ references: MediaReference[] }>(`/api/admin/media/${current.id}`)
      .then((data) => { if (!cancelled) setReferences(data.references) })
      .catch((error) => { if (!cancelled) setError(errorMessage(error)) })
    return () => { cancelled = true }
  }, [current.id])

  async function save() {
    setBusy(true)
    setError('')
    try {
      const saved = await adminFetch<MediaItem>(`/api/admin/media/${current.id}`, { method: 'PATCH', json: { filename, alt } })
      setCurrent(saved)
      setFilename(saved.filename)
      setAlt(saved.alt || '')
      toast.success('File details saved')
      await onChanged()
    } catch (error) { setError(errorMessage(error)) }
    finally { setBusy(false) }
  }
  async function replace(file: File) {
    setBusy(true)
    setError('')
    try {
      const body = new FormData()
      body.set('file', file)
      body.set('replaceEverywhere', replaceEverywhere ? '1' : '0')
      const result = await adminFetch<{ media: MediaItem; updated: number; occurrences: number }>(`/api/admin/media/${current.id}/replace`, { method: 'POST', body })
      setCurrent(result.media)
      setFilename(result.media.filename)
      setAlt(result.media.alt || '')
      toast.success(`Replaced ${result.occurrences} references in ${result.updated} records. Original file retained.`)
      await onChanged()
    } catch (error) { setError(errorMessage(error)) }
    finally { setBusy(false) }
  }
  async function remove() {
    setBusy(true)
    setError('')
    try {
      await adminFetch(`/api/admin/media/${current.id}`, { method: 'DELETE', json: { force } })
      toast.success('File deleted')
      await onChanged()
      onClose()
    } catch (error) { setError(errorMessage(error)); setDeleteOpen(false) }
    finally { setBusy(false) }
  }
  const publicUrl = current.url
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose() }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl"><DialogHeader><DialogTitle>File details</DialogTitle><DialogDescription className="break-all">{current.filename} · {(current.size / 1024).toFixed(1)} KB · {formatAdminDate(current.updatedAt)}</DialogDescription></DialogHeader><div className="grid gap-6 md:grid-cols-2"><div className="space-y-4"><div className="flex min-h-48 items-center justify-center rounded-lg bg-muted p-4">{current.mimeType.startsWith('image/') && isCmsMediaUrl(current.url) ? <img src={current.url} alt={current.alt || ''} className="max-h-80 object-contain" /> : <FileText className="size-16 text-muted-foreground" />}</div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(new URL(publicUrl, window.location.origin).href); toast.success('URL copied') } catch { toast.error('Unable to copy URL') } }}><Copy className="size-4" />Copy URL</Button>{isCmsMediaUrl(current.url) && <Button variant="outline" asChild><a href={publicUrl} target="_blank" rel="noreferrer"><ExternalLink className="size-4" />Open file</a></Button>}</div><p className="break-all text-xs text-muted-foreground">{publicUrl}</p><section className="space-y-2"><h3 className="font-semibold">Where used</h3>{references === null ? <p className="text-sm text-muted-foreground">Loading references…</p> : references.length ? <ul className="space-y-2 text-sm">{references.map((ref) => <li key={`${ref.entityType}:${ref.id}`}>{ref.path ? <a href={ref.path} className="underline">{ref.title}</a> : ref.title}<span className="block text-xs text-muted-foreground">{ref.entityType} · {ref.occurrences} {ref.occurrences === 1 ? 'reference' : 'references'} in {ref.fields.join(', ')}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">No current content references.</p>}<p className="text-xs text-muted-foreground">Historical revisions and external websites may still use this file.</p></section></div><div className="space-y-4">{error && <p role="alert" className="rounded border border-destructive p-3 text-sm">{error}</p>}<label className="block text-sm font-medium">Filename<input disabled={!canEdit || busy} value={filename} onChange={(e) => setFilename(e.target.value)} className={`${inputClass} mt-1`} maxLength={200} /></label><label className="block text-sm font-medium">Alt text<input disabled={!canEdit || busy} value={alt} onChange={(e) => setAlt(e.target.value)} className={`${inputClass} mt-1`} maxLength={500} /></label>{canEdit && <Button disabled={busy || !filename.trim()} onClick={save}>{busy ? 'Working…' : 'Save details'}</Button>}{canEdit && canUpload && <div className="space-y-3 border-t pt-4"><h3 className="font-semibold">Replace file</h3><p className="text-sm text-muted-foreground">Creates a new file URL. The original remains in the library.</p><label className="flex gap-2 text-sm"><input type="checkbox" checked={replaceEverywhere} onChange={(e) => setReplaceEverywhere(e.target.checked)} disabled={busy} />Replace everywhere in CMS content</label><Button variant="outline" disabled={busy} onClick={() => replaceInput.current?.click()}>Choose replacement</Button><input ref={replaceInput} type="file" hidden onChange={(e) => { const file = e.target.files?.[0]; if (file) void replace(file); e.target.value = '' }} /></div>}{canDelete && <div className="border-t pt-4">{deleteOpen ? <div className="space-y-3"><p className="text-sm">Permanently delete this file?</p><label className="flex gap-2 text-sm"><input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} />Force deletion even if referenced</label><div className="flex gap-2"><Button disabled={busy} variant="destructive" onClick={remove}>Confirm deletion</Button><Button disabled={busy} variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button></div></div> : <Button variant="destructive" disabled={busy} onClick={() => setDeleteOpen(true)}>Delete file</Button>}</div>}</div></div></DialogContent></Dialog>
}
