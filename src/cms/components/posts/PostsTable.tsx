'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Archive, ArchiveRestore, Eye, MoreHorizontal, Pencil, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { adminFetch } from '@/cms/lib/client'
import { cn } from '@/cms/lib/utils'
import { safeUrl } from '@/cms/lib/sanitize'
import { Button } from '@/cms/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/cms/components/ui/alert-dialog'
import { LocalTime } from '@/cms/components/dashboard/LocalTime'
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from './list/Menu'
import { usePostsNav } from './list/PostsNav'
import type { ListPermissions, PostRow } from './list/types'

type BulkAction = 'publish' | 'unpublish' | 'archive' | 'delete'

// Long enough to notice the toast and reach its Undo button.
const UNDO_MS = 8000
const plural = (count: number, word = 'post') => `${count} ${word}${count === 1 ? '' : 's'}`
const editHref = (id: string) => `/admin/posts/${encodeURIComponent(id)}/edit`

async function bulk(ids: string[], action: BulkAction) {
  if (ids.length) await adminFetch('/api/admin/posts/bulk', { method: 'POST', json: { ids, action } })
}

/** Puts archived posts back the way they were: drafts as drafts, published (or scheduled) posts as published. */
async function restore(previous: Map<string, PostRow['status']>) {
  const back = (status: PostRow['status']) => [...previous].filter(([, value]) => value === status).map(([id]) => id)
  await bulk(back('DRAFT'), 'unpublish')
  await bulk(back('PUBLISHED'), 'publish')
}

const STATUS_STYLE = {
  draft: { label: 'Draft', pill: 'bg-[var(--status-draft-bg)] text-[var(--status-draft-fg)]', dot: 'bg-[var(--status-draft)]' },
  scheduled: { label: 'Scheduled', pill: 'bg-[var(--status-scheduled-bg)] text-[var(--status-scheduled-fg)]', dot: 'bg-[var(--status-scheduled)]' },
  published: { label: 'Published', pill: 'bg-[var(--status-published-bg)] text-[var(--status-published-fg)]', dot: 'bg-[var(--status-published)]' },
  archived: { label: 'Archived', pill: 'bg-[var(--status-archived-bg)] text-[var(--status-archived-fg)]', dot: 'bg-[var(--status-archived)]' },
} as const

const statusKey = (post: PostRow) => post.scheduled ? 'scheduled' : post.status === 'PUBLISHED' ? 'published' : post.status === 'ARCHIVED' ? 'archived' : 'draft'

export function StatusPill({ post }: { post: PostRow }) {
  const style = STATUS_STYLE[statusKey(post)]
  return <span className={cn('inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-[9px] text-xs font-[550]', style.pill)}><span aria-hidden="true" className={cn('size-1.5 rounded-full', style.dot)} />{style.label}</span>
}

// Neutral tints for posts without a cover, picked from the id so a post keeps its colour.
const TINTS = ['bg-[var(--tint-1)]', 'bg-[var(--tint-2)]', 'bg-[var(--tint-3)]', 'bg-[var(--tint-4)]', 'bg-[var(--tint-5)]', 'bg-[var(--tint-0)]']
const tintFor = (id: string) => TINTS[[...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % TINTS.length]

function Thumb({ post }: { post: PostRow }) {
  const url = safeUrl(post.featuredImage)
  // eslint-disable-next-line @next/next/no-img-element -- CMS media are served as is from /cms/*
  if (url) return <img src={url} alt="" loading="lazy" className="h-8 w-11 flex-none rounded-md border object-cover" />
  return <span aria-hidden="true" className={cn('h-8 w-11 flex-none rounded-md dark:bg-muted', tintFor(post.id))} />
}

const SKELETON_ROWS = 8

export function PostsTableSkeleton({ selectable }: { selectable: boolean }) {
  return (
    <tbody aria-hidden="true">
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <tr key={index} className="border-b border-border/70">
          {selectable && <td className="w-10 px-3 py-3"><div className="cms-skeleton size-4" /></td>}
          <td className="px-3 py-3"><div className="flex items-center gap-3"><div className="cms-skeleton h-8 w-11 flex-none" /><div className="flex-1 space-y-1.5"><div className="cms-skeleton h-3.5" style={{ width: `${55 + (index * 13) % 30}%` }} /><div className="cms-skeleton h-3" style={{ width: `${35 + (index * 17) % 25}%` }} /></div></div></td>
          <td className="px-3 py-3"><div className="cms-skeleton h-6 w-20 rounded-full" /></td>
          <td className="hidden px-3 py-3 md:table-cell"><div className="cms-skeleton h-3.5 w-16" /></td>
          <td className="hidden px-3 py-3 lg:table-cell"><div className="flex items-center gap-2"><div className="cms-skeleton size-[22px] rounded-full" /><div className="cms-skeleton h-3.5 w-16" /></div></td>
          <td className="hidden px-3 py-3 sm:table-cell"><div className="cms-skeleton h-3.5 w-14" /></td>
          <td className="w-[110px] px-3 py-3" />
        </tr>
      ))}
    </tbody>
  )
}

export default function PostsTable({ posts, permissions, empty }: { posts: PostRow[]; permissions: ListPermissions; empty: React.ReactNode }) {
  const router = useRouter()
  const { pending } = usePostsNav()
  const [selected, setSelected] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null)
  const selectable = permissions.write
  const tableBox = useRef<HTMLDivElement>(null)
  const byId = new Map(posts.map((post) => [post.id, post]))
  const allSelected = posts.length > 0 && selected.length === posts.length

  useEffect(() => {
    if (!selected.length) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' && !document.querySelector('[role="alertdialog"],[role="menu"]')) setSelected([]) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected.length])

  async function run(work: () => Promise<void>, failure: string) {
    setBusy(true)
    try { await work() } catch (error) { toast.error(error instanceof Error ? error.message : failure) } finally { setBusy(false) }
  }

  function archive(ids: string[]) {
    const previous = new Map(ids.flatMap((id) => { const post = byId.get(id); return post && post.status !== 'ARCHIVED' ? [[id, post.status] as const] : [] }))
    if (!previous.size) { toast.info(ids.length === 1 ? 'Already archived' : 'These posts are already archived'); return }
    return run(async () => {
      await bulk([...previous.keys()], 'archive')
      setSelected([])
      router.refresh()
      toast.success(`${plural(previous.size)} archived`, {
        duration: UNDO_MS,
        action: {
          label: 'Undo',
          onClick: () => void restore(previous)
            .then(() => { toast.success(previous.size === 1 ? 'Post restored' : `${plural(previous.size)} restored`); router.refresh() })
            .catch((error: unknown) => toast.error(error instanceof Error ? error.message : 'Could not undo')),
        },
      })
    }, 'Could not archive')
  }

  function unarchive(id: string) {
    return run(async () => {
      await bulk([id], 'unpublish')
      router.refresh()
      toast.success('Moved to drafts', {
        duration: UNDO_MS,
        action: { label: 'Undo', onClick: () => void bulk([id], 'archive').then(() => router.refresh()).catch((error: unknown) => toast.error(error instanceof Error ? error.message : 'Could not undo')) },
      })
    }, 'Could not unarchive')
  }

  function publish(ids: string[]) {
    return run(async () => {
      await bulk(ids, 'publish')
      setSelected([])
      router.refresh()
      toast.success(`${plural(ids.length)} published`)
    }, 'Could not publish')
  }

  function remove(ids: string[]) {
    return run(async () => {
      await bulk(ids, 'delete')
      setSelected((current) => current.filter((id) => !ids.includes(id)))
      setConfirmDelete(null)
      router.refresh()
      toast.success(`${plural(ids.length)} deleted`)
    }, 'Could not delete')
  }

  const toggle = (id: string, on: boolean) => setSelected((current) => on ? [...current, id] : current.filter((item) => item !== id))

  function openRow(event: React.MouseEvent<HTMLTableRowElement>, id: string) {
    const target = event.target as HTMLElement
    if (target.closest('a,button,input,label,[role="menuitem"],[data-no-row-click]')) return
    if (window.getSelection()?.toString()) return
    if (event.metaKey || event.ctrlKey) window.open(editHref(id), '_blank', 'noopener')
    else router.push(editHref(id))
  }

  const headClass = 'border-b px-3 py-2.5 text-left text-xs font-[550] text-muted-foreground'
  return (
    <>
      <div ref={tableBox} className="overflow-x-auto">
        <table className="w-full border-collapse text-[13.5px]" aria-busy={pending || undefined}>
          <thead>
            <tr>
              {selectable && (
                <th scope="col" className={cn(headClass, 'w-10')}>
                  <input
                    type="checkbox"
                    aria-label="Select all posts on this page"
                    className="size-4 accent-[var(--primary)] align-middle"
                    disabled={busy || pending || !posts.length}
                    checked={allSelected}
                    ref={(element) => { if (element) element.indeterminate = selected.length > 0 && !allSelected }}
                    onChange={(event) => setSelected(event.target.checked ? posts.map((post) => post.id) : [])}
                  />
                </th>
              )}
              <th scope="col" className={cn(headClass, 'min-w-64')}>Post</th>
              <th scope="col" className={headClass}>Status</th>
              <th scope="col" className={cn(headClass, 'hidden md:table-cell')}>Category</th>
              <th scope="col" className={cn(headClass, 'hidden lg:table-cell')}>Author</th>
              <th scope="col" className={cn(headClass, 'hidden sm:table-cell')}>Edited</th>
              <th scope="col" className={cn(headClass, 'w-[110px]')}><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          {pending ? <PostsTableSkeleton selectable={selectable} /> : posts.length > 0 && (
            <tbody>
              {posts.map((post, index) => {
                const isSelected = selected.includes(post.id)
                return (
                  <tr
                    key={post.id}
                    onClick={(event) => openRow(event, post.id)}
                    style={{ animationDelay: `${Math.min(index, 10) * 24}ms` }}
                    className={cn('group cms-fade-up cursor-pointer border-b border-border/70 transition-colors', isSelected ? 'bg-accent/50 hover:bg-accent/70' : 'hover:bg-muted/60')}
                  >
                    {selectable && (
                      <td className="w-10 p-0" data-no-row-click>
                        <label className="flex cursor-pointer items-center px-3 py-3">
                          <input type="checkbox" aria-label={`Select ${post.title || 'untitled post'}`} className="size-4 accent-[var(--primary)]" disabled={busy} checked={isSelected} onChange={(event) => toggle(post.id, event.target.checked)} />
                        </label>
                      </td>
                    )}
                    <td className="max-w-[28rem] px-3 py-3">
                      <div className="flex items-center gap-3">
                        <Thumb post={post} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Link href={editHref(post.id)} className="truncate font-[550] text-foreground outline-none hover:underline focus-visible:underline">{post.title || 'Untitled post'}</Link>
                            {post.visibility === 'UNLISTED' && <span className="flex-none rounded border px-1 text-[10.5px] text-muted-foreground">Unlisted</span>}
                            {post.locked && <span className="flex-none rounded bg-[var(--warning-bg)] px-1.5 text-[10.5px] font-medium text-[var(--warning-fg)]">Being edited</span>}
                          </div>
                          {post.excerpt && <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">{post.excerpt}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3"><StatusPill post={post} /></td>
                    <td className="hidden px-3 py-3 text-secondary-foreground md:table-cell">{post.category ?? <span className="text-muted-foreground">—</span>}</td>
                    <td className="hidden px-3 py-3 lg:table-cell">
                      {post.author
                        ? <span className="inline-flex items-center gap-2 whitespace-nowrap"><span aria-hidden="true" className="grid size-[22px] place-items-center rounded-full bg-accent text-[10px] font-[650] text-accent-foreground">{post.author.initials}</span>{post.author.name}</span>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="hidden px-3 py-3 text-muted-foreground sm:table-cell">
                      {post.scheduled && post.publishedAt ? <LocalTime value={post.publishedAt} /> : <LocalTime value={post.updatedAt} />}
                    </td>
                    {/* The actions cell never opens the row: its menu opens on pointerdown, so the click that follows can land outside the button. */}
                    <td className="px-3 py-2" data-no-row-click onClick={(event) => event.stopPropagation()}>
                      <RowActions
                        post={post}
                        permissions={permissions}
                        disabled={busy}
                        onArchive={() => archive([post.id])}
                        onUnarchive={() => unarchive(post.id)}
                        onDelete={() => setConfirmDelete([post.id])}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          )}
        </table>
      </div>
      {!pending && posts.length === 0 && empty}

      {selected.length > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-30" ref={alignWith(tableBox)}>
          <div className="flex justify-center px-4">
            <div
              role="toolbar"
              aria-label="Bulk actions"
              style={{ '--origin': 'bottom center' } as React.CSSProperties}
              className="cms-pop pointer-events-auto flex max-w-full flex-wrap items-center gap-1.5 rounded-xl bg-[var(--inverse)] py-1.5 pl-3.5 pr-1.5 text-[13px] text-white shadow-[0_12px_32px_rgb(0_0_0/0.25)] ring-1 ring-white/10"
            >
              <b className="mr-2 font-semibold" aria-live="polite">{selected.length} selected</b>
              {permissions.publish && <BarButton disabled={busy} onClick={() => publish(selected)}>Publish</BarButton>}
              <BarButton disabled={busy} onClick={() => archive(selected)}>Archive</BarButton>
              {permissions.delete && <BarButton disabled={busy} className="text-[var(--inverse-danger)]" onClick={() => setConfirmDelete(selected)}>Delete</BarButton>}
              <button type="button" aria-label="Clear selection" className="grid size-[30px] place-items-center rounded-lg text-[var(--inverse-muted)] outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white/60" onClick={() => setSelected([])}><X className="size-4" /></button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => { if (!open && !busy) setConfirmDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {confirmDelete?.length === 1 ? 'this post' : plural(confirmDelete?.length ?? 0)} permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete?.length === 1 ? <>&ldquo;{byId.get(confirmDelete[0])?.title || 'Untitled post'}&rdquo; will be deleted. </> : <>{plural(confirmDelete?.length ?? 0)} will be deleted. </>}
              This can&rsquo;t be undone. To hide a post but keep it, archive it instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={(event) => { event.preventDefault(); if (confirmDelete) void remove(confirmDelete) }}>
              {busy ? 'Deleting…' : `Delete ${confirmDelete?.length === 1 ? 'post' : plural(confirmDelete?.length ?? 0)}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

/** Ref callback that keeps a fixed element horizontally over `box` (the table), so the bulk bar centres on the content, not the window. */
function alignWith(box: React.RefObject<HTMLElement | null>) {
  return (element: HTMLElement | null) => {
    if (!element) return
    const place = () => {
      const rect = box.current?.getBoundingClientRect()
      if (!rect) return
      element.style.left = `${rect.left}px`
      element.style.right = 'auto'
      element.style.width = `${rect.width}px`
    }
    place()
    // The table's box changes with the window and when the sidebar collapses.
    const observer = new ResizeObserver(place)
    if (box.current) observer.observe(box.current)
    window.addEventListener('resize', place)
    return () => { observer.disconnect(); window.removeEventListener('resize', place) }
  }
}

function BarButton({ className, ...props }: React.ComponentProps<'button'>) {
  return <button type="button" className={cn('cms-press h-[30px] rounded-lg border border-[var(--inverse-border)] bg-[var(--inverse-raised)] px-3 font-[550] text-white outline-none hover:bg-[var(--inverse-hover)] focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-50', className)} {...props} />
}

function RowActions({ post, permissions, disabled, onArchive, onUnarchive, onDelete }: {
  post: PostRow
  permissions: ListPermissions
  disabled: boolean
  onArchive: () => void
  onUnarchive: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  // Archiving or restoring a published post changes what is live, which needs publishing rights.
  const canArchive = permissions.write && post.status !== 'ARCHIVED' && (post.status !== 'PUBLISHED' || permissions.publish)
  const canUnarchive = permissions.write && permissions.publish && post.status === 'ARCHIVED'
  const title = post.title || 'untitled post'
  return (
    <div data-no-row-click className={cn('flex items-center justify-end gap-1 transition-opacity duration-100 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100', open ? 'opacity-100' : 'opacity-0')}>
      <Button asChild variant="outline" size="xs" className="h-7 px-2 text-xs">
        <Link href={editHref(post.id)} aria-label={`${permissions.write ? 'Edit' : 'Open'} ${title}`}>{permissions.write ? 'Edit' : 'Open'}</Link>
      </Button>
      <Menu open={open} onOpenChange={setOpen}>
        <MenuTrigger asChild>
          <Button variant="outline" size="icon-xs" className="size-7" aria-label={`More actions for ${title}`} disabled={disabled}><MoreHorizontal /></Button>
        </MenuTrigger>
        <MenuContent>
          <MenuItem asChild><Link href={`/admin/posts/${encodeURIComponent(post.id)}/preview`} target="_blank"><Eye />Preview</Link></MenuItem>
          {permissions.write && <MenuItem asChild><Link href={editHref(post.id)}><Pencil />Edit</Link></MenuItem>}
          {canArchive && <MenuItem onSelect={onArchive}><Archive />Archive</MenuItem>}
          {canUnarchive && <MenuItem onSelect={onUnarchive}><ArchiveRestore />Unarchive to drafts</MenuItem>}
          {permissions.delete && <><MenuSeparator /><MenuItem destructive onSelect={() => requestAnimationFrame(onDelete)}><Trash2 />Delete…</MenuItem></>}
        </MenuContent>
      </Menu>
    </div>
  )
}
