'use client'

import { useState } from 'react'
import { History } from 'lucide-react'
import { toast } from 'sonner'
import { adminFetch } from '@/cms/lib/client'
import { formatAdminDate } from '@/cms/lib/utils'
import { Button } from '@/cms/components/ui/button'
import type { PostRecord } from './types'

type Revision = { id: string; message: string | null; createdAt: string; author: { name: string | null; email: string } | null }
export default function RevisionsPanel({ postId, expectedUpdatedAt, canRestore, onRestore, onRestoreBusyChange }: {
  postId: string
  expectedUpdatedAt: string
  canRestore: boolean
  onRestore: (post: PostRecord) => void
  onRestoreBusyChange: (busy: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const [revisions, setRevisions] = useState<Revision[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function load() {
    setOpen(true)
    setBusy(true)
    setError('')
    try { setRevisions((await adminFetch<{ revisions: Revision[] }>(`/api/admin/posts/${postId}/revisions`)).revisions) }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not load revisions') }
    finally { setBusy(false) }
  }
  async function restore(revision: Revision) {
    if (!canRestore || busy) return
    if (!window.confirm(`Restore the version saved on ${formatAdminDate(revision.createdAt)}? Unsaved edits will be replaced. Your current saved version remains in history.`)) return
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
  return <section className="border-t pt-5">
    <Button type="button" variant="ghost" className="w-full justify-between px-0" onClick={() => open ? setOpen(false) : void load()} aria-expanded={open}><span className="flex items-center gap-2"><History className="size-4" />Revision history</span><span>{open ? '−' : '+'}</span></Button>
    {open && <div className="mt-3 space-y-3">
      {busy && <p role="status" className="text-sm text-muted-foreground">Loading revisions…</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {!busy && !error && revisions.length === 0 && <p className="text-sm text-muted-foreground">Previous versions appear here after you save changes.</p>}
      <ul className="space-y-3">{revisions.map((revision) => <li key={revision.id} className="border-b pb-3 text-sm"><p>{formatAdminDate(revision.createdAt)}</p><p className="text-xs text-muted-foreground">{revision.author?.name ?? revision.author?.email ?? 'Unknown editor'}{revision.message ? ` · ${revision.message}` : ''}</p>{canRestore && <Button type="button" className="mt-1" size="sm" variant="outline" disabled={busy} onClick={() => restore(revision)}>Restore</Button>}</li>)}</ul>
      <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={load}>Refresh history</Button>
    </div>}
  </section>
}
