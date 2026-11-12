'use client'

import { useEffect, useState } from 'react'
import { History, RotateCcw, X } from 'lucide-react'
import { toast } from 'sonner'
import { adminFetch } from '@/cms/lib/client'
import { Button } from '@/cms/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/cms/components/ui/dialog'
import { formatLocalDateTime } from './schedule-time'
import type { PostRecord } from './types'

type Revision = { id: string; message: string | null; createdAt: string; author: { name: string | null; email: string } | null }

/** Revision history as a right-side drawer (.cms-drawer). Loads when opened. */
export default function RevisionsPanel({ open, onOpenChange, postId, expectedUpdatedAt, canRestore, onRestore, onRestoreBusyChange }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  postId: string
  expectedUpdatedAt: string
  canRestore: boolean
  onRestore: (post: PostRecord) => void
  onRestoreBusyChange: (busy: boolean) => void
}) {
  const [revisions, setRevisions] = useState<Revision[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function load() {
    setBusy(true)
    setError('')
    try { setRevisions((await adminFetch<{ revisions: Revision[] }>(`/api/admin/posts/${postId}/revisions`)).revisions) }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not load revisions') }
    finally { setBusy(false) }
  }
  useEffect(() => {
    if (!open) return
    let active = true
    adminFetch<{ revisions: Revision[] }>(`/api/admin/posts/${postId}/revisions`)
      .then((data) => { if (active) { setRevisions(data.revisions)
        setError('') } })
      .catch((error: unknown) => { if (active) setError(error instanceof Error ? error.message : 'Could not load revisions') })
    return () => { active = false }
  }, [open, postId])
  async function restore(revision: Revision) {
    if (!canRestore || busy) return
    if (!window.confirm(`Restore the version saved on ${formatLocalDateTime(revision.createdAt)}? Unsaved edits will be replaced. Your current saved version remains in history.`)) return
    setBusy(true)
    onRestoreBusyChange(true)
    try {
      onRestore(await adminFetch<PostRecord>(`/api/admin/posts/${postId}/revisions`, { method: 'POST', json: { revisionId: revision.id, expectedUpdatedAt } }))
      toast.success('Revision restored')
      await load()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not restore revision') }
    finally {
      setBusy(false)
      onRestoreBusyChange(false)
    }
  }
  const loading = revisions === null && !error

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent showCloseButton={false} className="cms-drawer left-auto right-0 top-0 flex h-dvh max-h-dvh w-full max-w-[400px] translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-y-0 border-r-0 p-0 shadow-[0_0_40px_rgba(15,15,15,.12)] sm:max-w-[400px]">
      <div className="flex items-center gap-2 border-b border-[#f1f1ef] px-5 py-4">
        <History className="size-4 text-muted-foreground" aria-hidden />
        <div className="min-w-0 flex-1"><DialogTitle className="text-base font-semibold">Revision history</DialogTitle><DialogDescription className="text-xs">A version is kept every time the post is saved.</DialogDescription></div>
        <DialogClose asChild><Button type="button" variant="ghost" size="icon-sm" className="cms-press" aria-label="Close"><X /></Button></DialogClose>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-3" aria-busy={busy || loading}>
        {loading && <ul aria-label="Loading revisions" className="space-y-4 py-2">{[0, 1, 2, 3].map((i) => <li key={i} className="space-y-2"><div className="cms-skeleton h-3.5 w-2/3" /><div className="cms-skeleton h-3 w-1/3" /></li>)}</ul>}
        {error && <p role="alert" className="py-2 text-sm text-destructive">{error}</p>}
        {revisions?.length === 0 && <p className="py-2 text-sm text-muted-foreground">Previous versions appear here after you save changes.</p>}
        {revisions && revisions.length > 0 && <ol className="divide-y divide-[#f1f1ef]">{revisions.map((revision, index) => <li key={revision.id} className="cms-fade-up flex items-start gap-3 py-3" style={{ animationDelay: `${Math.min(index, 8) * 20}ms` }}>
          <div className="min-w-0 flex-1"><p className="text-sm font-medium">{formatLocalDateTime(revision.createdAt)}</p><p className="mt-0.5 text-xs text-muted-foreground">{revision.author?.name ?? revision.author?.email ?? 'Unknown editor'}{revision.message ? ` · ${revision.message}` : ''}</p></div>
          {canRestore && <Button type="button" size="sm" variant="outline" className="cms-press h-7" disabled={busy} onClick={() => restore(revision)}><RotateCcw />Restore</Button>}
        </li>)}</ol>}
      </div>
      <div className="border-t border-[#f1f1ef] px-5 py-3"><Button type="button" variant="ghost" size="sm" className="cms-press" disabled={busy} onClick={load}>Refresh history</Button></div>
    </DialogContent>
  </Dialog>
}
