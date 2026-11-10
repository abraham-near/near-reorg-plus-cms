'use client'

import { useEffect, useEffectEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowUp, ArrowDown, Eye, ImagePlus, LockKeyhole, Save, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import BlockEditor from '@/cms/components/editor/BlockEditor'
import MediaPickerModal from '@/cms/components/media/MediaPickerModal'
import { Button } from '@/cms/components/ui/button'
import { Input } from '@/cms/components/ui/input'
import { Label } from '@/cms/components/ui/label'
import { Textarea } from '@/cms/components/ui/textarea'
import { AdminApiError, adminFetch } from '@/cms/lib/client'
import { formatAdminDate, slugify } from '@/cms/lib/utils'
import { useNow } from '@/cms/lib/useStoredState'
import { safeUrl } from '@/cms/lib/sanitize'
import RevisionsPanel from './RevisionsPanel'
import type { PostPermissions, PostRecord, TaxonomyOption } from './types'

type Status = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
type Visibility = 'PUBLIC' | 'UNLISTED'
type Form = {
  title: string; slug: string; excerpt: string; featuredImage: string; metaTitle: string; metaDescription: string
  metaImage: string; visibility: Visibility; publishedAt: string; categoryIds: string[]; tagIds: string[]; body: string
}
const fieldClass = 'w-full rounded-md border bg-background px-3 py-2 text-sm'
function formFromPost(post: PostRecord | null): Form {
  return {
    title: post?.title ?? '', slug: post?.slug ?? '', excerpt: post?.excerpt ?? '', featuredImage: post?.featuredImage ?? '',
    metaTitle: post?.metaTitle ?? '', metaDescription: post?.metaDescription ?? '', metaImage: post?.metaImage ?? '',
    visibility: post?.visibility ?? 'PUBLIC', publishedAt: post?.publishedAt?.slice(0, 16) ?? '',
    categoryIds: post?.categories.map((join) => join.categoryId) ?? [], tagIds: post?.tags.map((tag) => tag.id) ?? [],
    body: post?.body ?? '',
  }
}

export default function PostForm({ initialPost, categories, tags, permissions }: { initialPost: PostRecord | null; categories: TaxonomyOption[]; tags: TaxonomyOption[]; permissions: PostPermissions }) {
  const router = useRouter()
  const now = useNow(30_000)
  const [post, setPost] = useState(initialPost)
  const [form, setForm] = useState(() => formFromPost(initialPost))
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [mediaField, setMediaField] = useState<'featuredImage' | 'metaImage' | null>(null)
  const [lock, setLock] = useState<'checking' | 'ready' | 'blocked'>(initialPost && permissions.write ? 'checking' : 'ready')
  const [lockMessage, setLockMessage] = useState('')
  const postId = post?.id
  const editable = permissions.write && lock === 'ready' && !busy

  useEffect(() => {
    if (!postId || !permissions.write) return
    let active = true
    async function acquire() {
      try {
        await adminFetch(`/api/admin/posts/${postId}/lock`, { method: 'POST', json: {} })
        if (active) { setLock('ready'); setLockMessage('') }
      } catch (error) {
        if (active) {
          setLock('blocked')
          setLockMessage(error instanceof AdminApiError && error.status === 423 ? (error.message.includes('API token') ? 'Claude (an API token) is saving this post. Retry in a minute.' : 'Another editor holds this post’s edit lock.') : 'The edit lock could not be renewed. Retry before saving.')
        }
      }
    }
    const release = () => { void adminFetch(`/api/admin/posts/${postId}/lock`, { method: 'DELETE', json: {}, keepalive: true }).catch(() => {}) }
    void acquire()
    const timer = setInterval(acquire, 30_000)
    // A full page load (reload, typed URL, closed tab) does not unmount React: release the lock then too.
    window.addEventListener('pagehide', release)
    return () => {
      active = false
      clearInterval(timer)
      window.removeEventListener('pagehide', release)
      release()
    }
  }, [postId, permissions.write])
  useEffect(() => {
    if (!dirty) return
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [dirty])

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setDirty(true)
  }
  function acceptPost(saved: PostRecord) {
    setPost(saved)
    setForm(formFromPost(saved))
    setDirty(false)
    setError('')
  }
  async function save(status: Status = post?.status ?? 'DRAFT') {
    if (!editable) return
    if (!form.title.trim() || !form.slug.trim()) { setError('Title and slug are required.'); return }
    setBusy(true)
    setError('')
    try {
      const saved = await adminFetch<PostRecord>(post ? `/api/admin/posts/${post.id}` : '/api/admin/posts', {
        method: post ? 'PATCH' : 'POST',
        json: { ...form, status, ...(post ? { expectedUpdatedAt: post.updatedAt } : {}), publishedAt: form.publishedAt ? new Date(`${form.publishedAt}:00Z`).toISOString() : null },
      })
      acceptPost(saved)
      toast.success(status === 'PUBLISHED' ? (saved.publishedAt && new Date(saved.publishedAt) > new Date() ? 'Post scheduled' : 'Post published') : status === 'ARCHIVED' ? 'Post archived' : 'Draft saved')
      if (!post) router.replace(`/admin/posts/${saved.id}/edit`)
      router.refresh()
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not save the post') }
    finally { setBusy(false) }
  }
  const saveFromKeyboard = useEffectEvent((event: KeyboardEvent) => {
    if (!permissions.write || (!event.metaKey && !event.ctrlKey) || event.altKey || event.key.toLowerCase() !== 's') return
    event.preventDefault()
    if (editable && !event.repeat) void save()
  })
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => saveFromKeyboard(event)
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function guardNavigation(event: { preventDefault: () => void }) {
    if (busy) {
      event.preventDefault()
      toast.info('Wait for the current operation to finish before leaving.')
      return
    }
    if (dirty && !window.confirm('Leave this editor and discard your unsaved changes?')) event.preventDefault()
  }
  async function remove() {
    if (!post || !editable || !window.confirm(`Permanently delete “${post.title}”? This cannot be undone.`)) return
    setBusy(true)
    try {
      await adminFetch(`/api/admin/posts/${post.id}`, { method: 'DELETE', json: {} })
      setDirty(false)
      toast.success('Post deleted')
      router.push('/admin/posts')
      router.refresh()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not delete post') }
    finally { setBusy(false) }
  }
  async function takeLock(override: boolean) {
    if (!postId) return
    try {
      await adminFetch(`/api/admin/posts/${postId}/lock`, { method: 'POST', json: { override } })
      setLock('ready')
      setLockMessage('')
    } catch (error) { setLockMessage(error instanceof Error ? error.message : 'Could not acquire the lock') }
  }
  function orderCategory(index: number, direction: number) {
    const ids = [...form.categoryIds]
    const destination = index + direction
    if (destination < 0 || destination >= ids.length) return
    const previous = ids[index]
    ids[index] = ids[destination]
    ids[destination] = previous
    update('categoryIds', ids)
  }
  const futurePublish = !!form.publishedAt && !!now && new Date(`${form.publishedAt}:00Z`) > now
  const scheduled = post?.status === 'PUBLISHED' && !!post.publishedAt && now && new Date(post.publishedAt) > now
  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0"><Link href="/admin/posts" onNavigate={guardNavigation} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />All posts</Link><h1 className="text-2xl font-semibold">{post ? permissions.write ? 'Edit post' : 'View post' : 'New post'}</h1><p className="mt-1 text-sm text-muted-foreground">{post ? `${scheduled ? 'Scheduled' : post.status.charAt(0) + post.status.slice(1).toLowerCase()} · Last saved ${formatAdminDate(post.updatedAt)}` : 'Create a draft, then preview and publish when ready.'}{dirty ? ' · Unsaved changes' : ''}</p></div>
      <div className="flex flex-wrap gap-2">
        {post && <Button variant="outline" asChild><Link href={`/admin/posts/${post.id}/preview`} target="_blank"><Eye />Preview</Link></Button>}
        {permissions.write && <Button type="button" disabled={!editable} onClick={() => save()}><Save />{busy ? 'Saving…' : post && post.status !== 'DRAFT' ? 'Save changes' : 'Save draft'}</Button>}
      </div>
    </header>
    {error && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}
    {lock !== 'ready' && <div role="status" className="flex flex-wrap items-center gap-3 rounded-md border bg-muted p-4 text-sm"><LockKeyhole className="size-4" /><p className="flex-1">{lock === 'checking' ? 'Checking edit access…' : lockMessage}</p>{lock === 'blocked' && <><Button type="button" variant="outline" size="sm" onClick={() => takeLock(false)}>Retry</Button>{permissions.overrideLock && <Button type="button" size="sm" onClick={() => { if (window.confirm('Take over this post? The other editor will lose their editing lock.')) void takeLock(true) }}>Take over lock</Button>}</>}</div>}
    {!permissions.write && <p className="rounded-md border bg-muted p-3 text-sm">You have read-only access to posts.</p>}
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-6">
        <fieldset disabled={!editable} className="space-y-5">
          <div className="space-y-2"><Label htmlFor="post-title">Title</Label><Input id="post-title" className="h-auto py-3 text-xl font-semibold" maxLength={500} value={form.title} onChange={(event) => { const title = event.target.value; setForm((current) => ({ ...current, title, slug: !post && current.slug === slugify(current.title) ? slugify(title) : current.slug })); setDirty(true) }} placeholder="Post title" required /></div>
          <div className="space-y-2"><Label htmlFor="post-slug">Slug</Label><div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">/blog/</span><Input id="post-slug" value={form.slug} maxLength={200} onChange={(event) => update('slug', event.target.value)} placeholder="post-title" required /></div><p className="text-xs text-muted-foreground">The post’s address. Avoid changing it once published: links to the old address stop working.</p></div>
          <div className="space-y-2"><Label htmlFor="post-excerpt">Excerpt</Label><Textarea id="post-excerpt" value={form.excerpt} onChange={(event) => update('excerpt', event.target.value)} placeholder="A short introduction for post listings" maxLength={10000} rows={3} /></div>
        </fieldset>
        <section aria-labelledby="post-body-label" className="space-y-3"><h2 id="post-body-label" className="font-semibold">Body</h2><p className="text-xs text-muted-foreground">Type <kbd className="rounded border px-1">/</kbd> for headings, lists, images, tables and more.</p>
          <BlockEditor label="Post body" value={form.body} onChange={(value) => update('body', value)} editable={editable} autosaveLabel={dirty ? 'Unsaved changes' : post ? `Saved ${formatAdminDate(post.updatedAt)}` : 'New draft'} />
        </section>
        <details className="rounded-lg border bg-card p-5" open><summary className="cursor-pointer font-semibold">Search and social sharing</summary><fieldset disabled={!editable} className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="meta-title">Meta title</Label><Input id="meta-title" value={form.metaTitle} onChange={(event) => update('metaTitle', event.target.value)} maxLength={500} placeholder="Defaults to the post title" /><p className="text-xs text-muted-foreground">{form.metaTitle.length} characters</p></div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="meta-description">Meta description</Label><Textarea id="meta-description" value={form.metaDescription} onChange={(event) => update('metaDescription', event.target.value)} maxLength={5000} placeholder="Defaults to the excerpt" /><p className="text-xs text-muted-foreground">{form.metaDescription.length} characters</p></div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="meta-image">Social image</Label><div className="flex gap-2"><Input id="meta-image" value={form.metaImage} onChange={(event) => update('metaImage', event.target.value)} placeholder="Defaults to the featured image" /><Button type="button" variant="outline" onClick={() => setMediaField('metaImage')}>Choose</Button></div><p className="text-xs text-muted-foreground">Shown when the post is shared on social networks. 1200 × 630 works best.</p></div>
        </fieldset></details>
      </div>
      <aside className="space-y-6 rounded-lg border bg-card p-5">
        <section className="space-y-4"><h2 className="font-semibold">Publication</h2><fieldset disabled={!editable} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="post-visibility">Visibility</Label><select id="post-visibility" className={fieldClass} value={form.visibility} onChange={(event) => update('visibility', event.target.value as Visibility)}><option value="PUBLIC">Public</option><option value="UNLISTED">Unlisted</option></select><p className="text-xs text-muted-foreground">{form.visibility === 'UNLISTED' ? 'Reachable by its link only: hidden from listings and search engines.' : 'Visible in listings and search engines.'}</p></div>
          <div className="space-y-2"><Label htmlFor="post-published">Publish at (UTC)</Label><Input id="post-published" type="datetime-local" value={form.publishedAt} onChange={(event) => update('publishedAt', event.target.value)} disabled={!permissions.publish} /><p className="text-xs text-muted-foreground">Leave empty to publish now. A future time schedules the post: it goes live on its own.</p></div>
        </fieldset>
          {permissions.publish && <div className="flex flex-col gap-2">{post?.status !== 'PUBLISHED' && <Button type="button" disabled={!editable} onClick={() => save('PUBLISHED')}>{futurePublish ? 'Schedule' : 'Publish now'}</Button>}{post?.status === 'PUBLISHED' && <Button type="button" disabled={!editable} variant="outline" onClick={() => save('DRAFT')}>Unpublish to draft</Button>}</div>}
          {permissions.write && post && post.status !== 'ARCHIVED' && <Button type="button" className="w-full" disabled={!editable} variant="ghost" onClick={() => save('ARCHIVED')}>Archive post</Button>}
          {permissions.write && post?.status === 'ARCHIVED' && <Button type="button" className="w-full" disabled={!editable} variant="outline" onClick={() => save('DRAFT')}>Move to draft</Button>}
        </section>
        <section className="space-y-3 border-t pt-5"><h2 className="font-semibold">Featured image</h2>{safeUrl(form.featuredImage) ? <div className="relative overflow-hidden rounded-md border"><img src={safeUrl(form.featuredImage)!} alt="Featured image preview" className="aspect-video w-full object-cover" />{editable && <Button type="button" variant="secondary" size="icon-sm" className="absolute right-2 top-2" aria-label="Remove featured image" onClick={() => update('featuredImage', '')}><X /></Button>}</div> : <div className="flex aspect-video items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">No featured image</div>}<Button type="button" className="w-full" variant="outline" disabled={!editable} onClick={() => setMediaField('featuredImage')}><ImagePlus />Choose image</Button></section>
        <section className="space-y-3 border-t pt-5"><h2 className="font-semibold">Categories</h2><p className="text-xs text-muted-foreground">The first category is the main one. Reorder with the arrows.</p>
          <ol className="space-y-2">{form.categoryIds.map((id, index) => <li key={id} className="flex items-center gap-1 rounded border px-2 py-1 text-sm"><span className="flex-1">{index + 1}. {categories.find((item) => item.id === id)?.name ?? 'Unknown category'}</span><Button type="button" size="icon-xs" variant="ghost" aria-label="Move category up" disabled={!editable || index === 0} onClick={() => orderCategory(index, -1)}><ArrowUp /></Button><Button type="button" size="icon-xs" variant="ghost" aria-label="Move category down" disabled={!editable || index === form.categoryIds.length - 1} onClick={() => orderCategory(index, 1)}><ArrowDown /></Button><Button type="button" size="icon-xs" variant="ghost" aria-label="Remove category" disabled={!editable} onClick={() => update('categoryIds', form.categoryIds.filter((item) => item !== id))}><X /></Button></li>)}</ol>
          <select aria-label="Add category" disabled={!editable} className={fieldClass} value="" onChange={(event) => { if (event.target.value) update('categoryIds', [...form.categoryIds, event.target.value]) }}><option value="">Add a category…</option>{categories.filter((item) => !form.categoryIds.includes(item.id)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        </section>
        <section className="space-y-3 border-t pt-5"><h2 className="font-semibold">Tags</h2>{tags.length ? <fieldset disabled={!editable} className="max-h-52 space-y-2 overflow-auto">{tags.map((tag) => <label key={tag.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.tagIds.includes(tag.id)} onChange={(event) => update('tagIds', event.target.checked ? [...form.tagIds, tag.id] : form.tagIds.filter((id) => id !== tag.id))} />{tag.name}</label>)}</fieldset> : <p className="text-sm text-muted-foreground">No tags have been created.</p>}{permissions.manageTaxonomy && <Link href="/admin/categories" onNavigate={guardNavigation} className="inline-block text-sm underline">Manage categories and tags</Link>}</section>
        {post && <><RevisionsPanel postId={post.id} expectedUpdatedAt={post.updatedAt} canRestore={editable} onRestore={acceptPost} onRestoreBusyChange={setBusy} /><div className="space-y-2 border-t pt-5"><p className="text-xs text-muted-foreground">Author: {post.author?.name ?? post.author?.email ?? 'Not assigned'}<br />Last editor: {post.lastEditedBy?.name ?? post.lastEditedBy?.email ?? '—'}</p>{permissions.delete && <Button type="button" className="w-full" variant="ghost" disabled={!editable} onClick={remove}><Trash2 />Delete post</Button>}</div></>}
      </aside>
    </div>
    <MediaPickerModal open={!!mediaField} onClose={() => setMediaField(null)} onSelect={(selected) => { const url = safeUrl(Array.isArray(selected) ? selected[0] : selected); if (mediaField && url) update(mediaField, url); setMediaField(null) }} />
  </div>
}
