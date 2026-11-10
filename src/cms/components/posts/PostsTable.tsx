'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { adminFetch } from '@/cms/lib/client'
import { formatAdminDate } from '@/cms/lib/utils'
import { useNow } from '@/cms/lib/useStoredState'
import { Button } from '@/cms/components/ui/button'
import type { PostListItem, PostPermissions } from './types'

type Action = 'publish' | 'unpublish' | 'archive' | 'delete'
export default function PostsTable({ posts, permissions }: { posts: PostListItem[]; permissions: PostPermissions }) {
  const router = useRouter()
  const now = useNow(30_000)
  const [selected, setSelected] = useState<string[]>([])
  const [action, setAction] = useState<Action>('archive')
  const [busy, setBusy] = useState(false)
  async function apply(ids: string[], nextAction: Action) {
    if (!ids.length || (nextAction === 'delete' && !window.confirm(`Permanently delete ${ids.length} post${ids.length === 1 ? '' : 's'}? This cannot be undone.`))) return
    setBusy(true)
    try {
      await adminFetch('/api/admin/posts/bulk', { method: 'POST', json: { ids, action: nextAction } })
      setSelected([])
      toast.success(`${ids.length} post${ids.length === 1 ? '' : 's'} updated`)
      router.refresh()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not update posts') }
    finally { setBusy(false) }
  }
  return <>
    {permissions.write && <div className="flex flex-wrap items-center gap-3 border-b p-3">
      <p className="mr-auto text-sm text-muted-foreground">{selected.length ? `${selected.length} selected` : 'Select posts for bulk actions'}</p>
      <select className="h-9 rounded-md border bg-background px-2 text-sm" aria-label="Bulk action" value={action} disabled={busy} onChange={(event) => setAction(event.target.value as Action)}><option value="archive">Archive</option><option value="unpublish">Move to draft</option>{permissions.publish && <option value="publish">Publish</option>}{permissions.delete && <option value="delete">Delete permanently</option>}</select>
      <Button type="button" variant="outline" disabled={busy || selected.length === 0} onClick={() => apply(selected, action)}>{busy ? 'Working…' : 'Apply'}</Button>
    </div>}
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-muted/40 text-muted-foreground"><tr>
      {permissions.write && <th scope="col" className="w-10 px-4 py-3"><input type="checkbox" aria-label="Select all posts on this page" disabled={busy} checked={selected.length === posts.length && posts.length > 0} onChange={(event) => setSelected(event.target.checked ? posts.map((post) => post.id) : [])} /></th>}
      <th scope="col" className="min-w-64 px-4 py-3 font-medium">Post</th><th scope="col" className="px-4 py-3 font-medium">Status</th><th scope="col" className="hidden px-4 py-3 font-medium lg:table-cell">Author</th><th scope="col" className="hidden px-4 py-3 font-medium md:table-cell">Last updated</th><th scope="col" className="px-4 py-3 font-medium"><span className="sr-only">Actions</span></th>
    </tr></thead><tbody className="divide-y">{posts.map((post) => {
      const scheduled = post.status === 'PUBLISHED' && post.publishedAt && now && new Date(post.publishedAt) > now
      const locked = post.lockedAt && now && now.getTime() - new Date(post.lockedAt).getTime() < 90_000
      return <tr key={post.id} className="hover:bg-muted/20">
        {permissions.write && <td className="px-4 py-4"><input type="checkbox" aria-label={`Select ${post.title}`} disabled={busy} checked={selected.includes(post.id)} onChange={(event) => setSelected(event.target.checked ? [...selected, post.id] : selected.filter((id) => id !== post.id))} /></td>}
        <td className="max-w-md px-4 py-4"><Link href={`/admin/posts/${post.id}/edit`} className="font-medium hover:underline">{post.title}</Link><p className="mt-1 break-all text-xs text-muted-foreground">/blog/{post.slug}</p>{locked && <p className="mt-1 text-xs text-muted-foreground">Currently being edited</p>}</td>
        <td className="px-4 py-4"><span className="inline-flex rounded-full bg-muted px-2 py-1 text-xs">{scheduled ? 'Scheduled' : post.status.charAt(0) + post.status.slice(1).toLowerCase()}</span><p className="mt-1 text-xs text-muted-foreground">{post.visibility.toLowerCase()}</p>{scheduled && <p className="mt-1 whitespace-nowrap text-xs text-muted-foreground">{formatAdminDate(post.publishedAt)}</p>}</td>
        <td className="hidden px-4 py-4 text-muted-foreground lg:table-cell">{post.author?.name ?? post.author?.email ?? '—'}</td><td className="hidden whitespace-nowrap px-4 py-4 text-xs text-muted-foreground md:table-cell">{formatAdminDate(post.updatedAt)}</td>
        <td className="px-3 py-4"><div className="flex justify-end gap-1"><Button size="icon-sm" variant="ghost" asChild><Link href={`/admin/posts/${post.id}/edit`} aria-label={`${permissions.write ? 'Edit' : 'View'} ${post.title}`}><Pencil /></Link></Button><Button size="icon-sm" variant="ghost" asChild><Link href={`/admin/posts/${post.id}/preview`} target="_blank" aria-label={`Preview ${post.title}`}><Eye /></Link></Button>{permissions.delete && <Button type="button" size="icon-sm" variant="ghost" aria-label={`Delete ${post.title}`} disabled={busy} onClick={() => apply([post.id], 'delete')}><Trash2 /></Button>}</div></td>
      </tr>
    })}</tbody></table></div>
  </>
}
