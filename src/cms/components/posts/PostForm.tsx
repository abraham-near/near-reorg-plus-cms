'use client'

import { useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Archive, ArchiveRestore, CalendarClock, ChevronDown, ChevronRight, Eye, History, ImagePlus, LockKeyhole, MoreHorizontal, RotateCcw, Trash2, Undo2, X } from 'lucide-react'
import { DropdownMenu } from 'radix-ui'
import { toast } from 'sonner'
import BlockEditor from '@/cms/components/editor/BlockEditor'
import MediaPickerModal from '@/cms/components/media/MediaPickerModal'
import { useNavigationGuard } from '@/cms/components/NavigationGuardProvider'
import { Button } from '@/cms/components/ui/button'
import { Input } from '@/cms/components/ui/input'
import { Label } from '@/cms/components/ui/label'
import { Textarea } from '@/cms/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/cms/components/ui/tooltip'
import { AdminApiError, adminFetch } from '@/cms/lib/client'
import { cn, fallbackSlug, slugify } from '@/cms/lib/utils'
import { useNow } from '@/cms/lib/useStoredState'
import { safeUrl } from '@/cms/lib/sanitize'
import PostProperties, { AutoTextarea, PostStatusChip, type DisplayStatus } from './PostProperties'
import PublishDialog, { SITE_HOST, type PublishKind } from './PublishDialog'
import RevisionsPanel from './RevisionsPanel'
import SaveState, { type SaveStatus } from './SaveState'
import { countWords, publishChecks, readingMinutes, snippet, type CheckKey } from './publish-checks'
import { formatLocalDateTime } from './schedule-time'
import type { PostPermissions, PostRecord, TaxonomyOption } from './types'

type Status = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
type Visibility = 'PUBLIC' | 'UNLISTED'
type Form = {
  title: string; slug: string; excerpt: string; featuredImage: string; metaTitle: string; metaDescription: string
  metaImage: string; visibility: Visibility; categoryIds: string[]; tagIds: string[]; body: string
}
/** status/publishedAt change only through explicit actions (publish, schedule, archive…); `blocking` disables the form meanwhile. */
type SaveOptions = { status?: Status; publishedAt?: string | null; auto?: boolean; blocking?: boolean }

/** Drafts save themselves this long after the last change. Published and scheduled posts never autosave. */
const AUTOSAVE_MS = 2000

function formFromPost(post: PostRecord | null): Form {
  return {
    title: post?.title ?? '', slug: post?.slug ?? '', excerpt: post?.excerpt ?? '', featuredImage: post?.featuredImage ?? '',
    metaTitle: post?.metaTitle ?? '', metaDescription: post?.metaDescription ?? '', metaImage: post?.metaImage ?? '',
    visibility: post?.visibility ?? 'PUBLIC',
    categoryIds: post?.categories.map((join) => join.categoryId) ?? [], tagIds: post?.tags.map((tag) => tag.id) ?? [],
    body: post?.body ?? '',
  }
}
/** True when the post's URL still follows its title: a draft never published whose slug is the title's (maybe with a -2 suffix or a post-xxxxxx fallback). */
function slugFollowsTitle(post: PostRecord | null): boolean {
  if (!post) return true
  if (post.status !== 'DRAFT' || post.publishedAt) return false
  const base = slugify(post.title)
  return base ? post.slug === base || new RegExp(`^${base}-\\d+$`).test(post.slug) : /^post-[a-z0-9]{6}$/.test(post.slug)
}

// Reloading /admin/posts/new after its first save reopens that draft (the URL stays /new while you
// write, see persist()). Per tab, and only on the first editor mount after a real page load.
const NEW_DRAFT_KEY = 'cms:new-post-draft'
let documentChecked = false
function reloadedDraftId(): string | null {
  if (documentChecked) return null
  documentChecked = true
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    return nav?.type === 'reload' ? sessionStorage.getItem(NEW_DRAFT_KEY) : null
  } catch { return null }
}
function rememberNewDraft(id: string | null) {
  try { if (id) sessionStorage.setItem(NEW_DRAFT_KEY, id)
    else sessionStorage.removeItem(NEW_DRAFT_KEY) } catch { /* private mode: reload just opens a blank editor */ }
}

const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const menuItem = 'flex h-8 cursor-pointer select-none items-center gap-2 rounded-md px-2 text-[13px] outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-muted'
const portalContainer = () => typeof document === 'undefined' ? undefined : document.querySelector<HTMLElement>('.admin-wrapper') ?? undefined

export default function PostForm({ initialPost, categories, tags, permissions }: { initialPost: PostRecord | null; categories: TaxonomyOption[]; tags: TaxonomyOption[]; permissions: PostPermissions }) {
  const router = useRouter()
  const now = useNow(15_000)
  const { setIsDirty } = useNavigationGuard()
  const [post, setPost] = useState(initialPost)
  const [form, setForm] = useState(() => formFromPost(initialPost))
  const [dirty, setDirty] = useState(false)
  const [changes, setChanges] = useState(0)
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(() => initialPost ? new Date(initialPost.updatedAt) : null)
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState(false)
  const [gone, setGone] = useState(false)
  const [mediaField, setMediaField] = useState<'featuredImage' | 'metaImage' | null>(null)
  const [lock, setLock] = useState<'checking' | 'ready' | 'blocked'>(initialPost && permissions.write ? 'checking' : 'ready')
  const [lockMessage, setLockMessage] = useState('')
  const [publish, setPublish] = useState<{ open: boolean; kind: PublishKind; mode: 'checklist' | 'schedule'; session: number }>({ open: false, kind: 'publish', mode: 'checklist', session: 0 })
  const [revisionsOpen, setRevisionsOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [editorWords, setEditorWords] = useState<number | null>(null)
  // The URL follows the title until the post is published or someone edits the URL by hand.
  const [slugAuto, setSlugAuto] = useState(() => slugFollowsTitle(initialPost))
  const fallbackSlugRef = useRef('')
  const seoRef = useRef<HTMLDetailsElement>(null)
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const excerptRef = useRef<HTMLTextAreaElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  // Saves read the latest values through refs: an autosave timer or a queued save must never send a stale form or updatedAt.
  const postRef = useRef(post)
  const formRef = useRef(form)
  const dirtyRef = useRef(dirty)
  const lockRef = useRef(lock)
  const revRef = useRef(0)
  const inflight = useRef<Promise<void> | null>(null)
  const afterPublishClose = useRef<(() => void) | null>(null)
  const slugAutoRef = useRef(slugAuto)
  const lockMessageRef = useRef(lockMessage)
  // Next keeps up to 3 visited pages alive but hidden (cacheComponents + <Activity>). A hidden editor
  // must not refresh or navigate the visible page, and when it is shown again it must catch up.
  const activeRef = useRef(false)
  const shownRef = useRef(0)
  useEffect(() => {
    postRef.current = post
    formRef.current = form
    dirtyRef.current = dirty
    lockRef.current = lock
    slugAutoRef.current = slugAuto
    lockMessageRef.current = lockMessage
  })

  // Reloading /admin/posts/new after its first save: reopen that draft instead of a blank page.
  useEffect(() => {
    if (initialPost) return
    const id = reloadedDraftId()
    if (id) router.replace(`/admin/posts/${encodeURIComponent(id)}/edit`)
    else rememberNewDraft(null)
  }, [initialPost, router])
  useEffect(() => { if (initialPost) reloadedDraftId() }, [initialPost])

  /** Reads the saved post again: taken when it is newer and nothing local is unsaved, else flagged as a conflict. */
  async function catchUp() {
    const current = postRef.current
    if (!current) return
    try {
      const fresh = await adminFetch<PostRecord>(`/api/admin/posts/${current.id}`)
      if (fresh.updatedAt === postRef.current?.updatedAt) return
      if (dirtyRef.current) setConflict(true)
      else acceptPost(fresh)
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 404) setGone(true)
    }
  }
  const catchUpFromEffect = useEffectEvent(() => catchUp())
  useLayoutEffect(() => {
    activeRef.current = true
    shownRef.current += 1
    if (shownRef.current > 1) void catchUpFromEffect()
    return () => { activeRef.current = false }
  }, [])

  const postId = post?.id
  const editable = permissions.write && lock === 'ready' && !busy
  const scheduled = post?.status === 'PUBLISHED' && !!post.publishedAt && !!now && new Date(post.publishedAt) > now
  const live = post?.status === 'PUBLISHED' && !scheduled
  const wasLive = !!post?.publishedAt && !!now && new Date(post.publishedAt) <= now
  const displayStatus: DisplayStatus = !post || post.status === 'DRAFT' ? 'Draft' : post.status === 'ARCHIVED' ? 'Archived' : scheduled ? 'Scheduled' : 'Published'
  const canAutosave = permissions.write && lock === 'ready' && (!post || post.status === 'DRAFT') && !conflict && !gone

  // Edit lock: acquire, renew every 30 s, release on unmount and on full page loads.
  useEffect(() => {
    if (!postId || !permissions.write) return
    let active = true
    // Only a lock this editor holds is released: leaving a post someone else is editing must not free theirs.
    let held = false
    async function acquire() {
      try {
        await adminFetch(`/api/admin/posts/${postId}/lock`, { method: 'POST', json: {} })
        held = true
        if (!active) return
        // Edit access came back after someone else had it: load their saves before typing over them.
        if (lockRef.current === 'blocked') await catchUpFromEffect()
        setLock('ready')
        setLockMessage('')
      } catch (error) {
        held = false
        if (active) {
          setLock('blocked')
          setLockMessage(error instanceof AdminApiError && error.status === 423 ? (error.message.includes('API token') ? 'Claude (an API token) is saving this post. Retry in a minute.' : 'Another editor holds this post’s edit lock.') : 'The edit lock could not be renewed. Retry before saving.')
        }
      }
    }
    const release = () => {
      if (!held) return
      held = false
      void adminFetch(`/api/admin/posts/${postId}/lock`, { method: 'DELETE', json: {}, keepalive: true }).catch(() => {})
    }
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
  // The sidebar asks before leaving while there are unsaved changes.
  useEffect(() => { setIsDirty(dirty) }, [dirty, setIsDirty])
  useEffect(() => () => setIsDirty(false), [setIsDirty])

  function markChanged() {
    revRef.current += 1
    setDirty(true)
    setChanges((count) => count + 1)
  }
  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    markChanged()
  }
  function acceptPost(saved: PostRecord) {
    revRef.current += 1
    postRef.current = saved
    setPost(saved)
    setForm(formFromPost(saved))
    setSlugAuto(slugFollowsTitle(saved))
    setConflict(false)
    setDirty(false)
    setSavedAt(new Date())
    setSaveFailed(false)
    setError('')
  }

  /** The one save path (autosave, ⌘S, Update, publish, schedule, archive). Saves queue behind each other. */
  async function persist(options: SaveOptions = {}): Promise<PostRecord | null> {
    if (!permissions.write) return null
    // Publish/Schedule disable the form before waiting for a running autosave, so a second click cannot queue a second save.
    if (options.blocking) setBusy(true)
    try {
      while (inflight.current) await inflight.current
      return await persistNow(options)
    } finally {
      if (options.blocking) setBusy(false)
    }
  }
  async function persistNow(options: SaveOptions): Promise<PostRecord | null> {
    const current = postRef.current
    if (lockRef.current !== 'ready') {
      // An autosave just waits for the lock; a click must say why nothing happened (it shows inside the publish dialog too).
      if (!options.auto) setError(lockMessageRef.current || 'You do not have edit access to this post right now. Retry in a moment.')
      return null
    }
    if (options.auto && (!dirtyRef.current || (current && current.status !== 'DRAFT'))) return null
    const values = formRef.current
    if (!values.title.trim()) {
      if (!options.auto) { setError('Add a title before saving.')
        titleRef.current?.focus() }
      return null
    }
    if (!values.slug.trim()) {
      if (!options.auto) setError('Add a URL for this post (under the title, in URL).')
      return null
    }
    const rev = revRef.current
    const status = options.status ?? current?.status ?? 'DRAFT'
    const json = { ...values, ...(slugAutoRef.current ? { autoSlug: true } : {}), status, ...(current ? { expectedUpdatedAt: current.updatedAt } : {}), ...(options.publishedAt !== undefined ? { publishedAt: options.publishedAt } : {}) }
    let done = () => {}
    inflight.current = new Promise<void>((resolve) => { done = resolve })
    setSaving(true)
    try {
      const saved = await adminFetch<PostRecord>(current ? `/api/admin/posts/${current.id}` : '/api/admin/posts', { method: current ? 'PATCH' : 'POST', json })
      postRef.current = saved
      setPost(saved)
      setSavedAt(new Date())
      setSaveFailed(false)
      setError('')
      // Edits made while the request was in flight stay in the form and stay dirty (the next autosave sends them).
      if (revRef.current === rev) {
        dirtyRef.current = false
        setDirty(false)
        // Status changes take the server's view of the post; plain saves keep the form as typed (no cursor jumps).
        if (options.blocking) setForm(formFromPost(saved))
      }
      // The server may have taken the next free URL (launch-2): show it, unless the URL was edited meanwhile.
      if (saved.slug !== values.slug) setForm((form) => form.slug === values.slug ? { ...form, slug: saved.slug } : form)
      // A new post keeps its /admin/posts/new URL while you write: changing the URL by hand desynchronized
      // Next's router (New post reopened the previous post). Reload reopens it (rememberNewDraft).
      if (!current) {
        rememberNewDraft(saved.id)
        document.title = document.title.replace(/^New post/, 'Edit post')
      }
      // The sidebar's Recent drafts and the lists read the title and status: refresh them (client state is kept).
      if (activeRef.current && (!current || current.title !== saved.title || current.status !== saved.status || current.publishedAt !== saved.publishedAt)) router.refresh()
      return saved
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save the post'
      setSaveFailed(true)
      setError(message)
      if (error instanceof AdminApiError && error.status === 409 && message.startsWith('Post changed')) setConflict(true)
      if (error instanceof AdminApiError && error.status === 404) setGone(true)
      if (error instanceof AdminApiError && error.status === 423) { setLock('blocked')
        setLockMessage(message) }
      // A field in the collapsed "Search & social" section is invalid: open it so the field can be fixed.
      if (/Validation failed:.*\bmeta(Title|Description|Image)\b/.test(message) && seoRef.current) seoRef.current.open = true
      return null
    } finally {
      setSaving(false)
      inflight.current = null
      done()
    }
  }
  async function saveNow() {
    const current = postRef.current
    const saved = await persist()
    if (saved && current && current.status !== 'DRAFT') toast.success(current.status === 'ARCHIVED' ? 'Changes saved' : scheduled ? 'Scheduled post updated' : 'Changes published')
  }

  const runAutosave = useEffectEvent(() => { void persist({ auto: true }) })
  useEffect(() => {
    if (!changes || !canAutosave) return
    const timer = setTimeout(() => runAutosave(), AUTOSAVE_MS)
    return () => clearTimeout(timer)
  }, [changes, canAutosave])

  // The editor flushes its latest HTML on ⌘S too (BlockEditor), so save on the next tick, after that
  // update has rendered: saving in this same keypress would read the body from before it.
  const saveLatest = useEffectEvent(() => { void saveNow() })
  const saveFromKeyboard = useEffectEvent((event: KeyboardEvent) => {
    if (!permissions.write || (!event.metaKey && !event.ctrlKey) || event.altKey || event.key.toLowerCase() !== 's') return
    event.preventDefault()
    if (editable && !event.repeat) setTimeout(() => saveLatest(), 0)
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
      dirtyRef.current = false
      setDirty(false)
      setIsDirty(false)
      toast.success('Post deleted')
      // replace, not push: Back must not return to the editor of a post that no longer exists.
      router.replace('/admin/posts')
      router.refresh()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not delete post') }
    finally { setBusy(false) }
  }
  async function takeLock(override: boolean) {
    if (!postId) return
    try {
      await adminFetch(`/api/admin/posts/${postId}/lock`, { method: 'POST', json: { override } })
      // Load what the previous holder saved before letting this editor type over it.
      await catchUp()
      setLock('ready')
      setLockMessage('')
    } catch (error) { setLockMessage(error instanceof Error ? error.message : 'Could not acquire the lock') }
  }
  async function changeStatus(status: Status, message: string) {
    if (await persist({ status, blocking: true })) toast.success(message)
  }

  function openPublish(kind: PublishKind, mode: 'checklist' | 'schedule') {
    setError('')
    setPublish((current) => ({ open: true, kind, mode, session: current.session + 1 }))
  }
  async function publishNow(): Promise<string | null> {
    const saved = await persist({ status: 'PUBLISHED', publishedAt: null, blocking: true })
    if (!saved) return null
    toast.success('Post published')
    return `“${saved.title}” is live at ${SITE_HOST}/blog/${saved.slug}${saved.visibility === 'UNLISTED' ? ' (unlisted: reachable by link only)' : ''}.`
  }
  async function schedulePost(iso: string): Promise<string | null> {
    const kind = publish.kind
    const saved = await persist({ status: 'PUBLISHED', publishedAt: iso, blocking: true })
    if (!saved?.publishedAt) return null
    const future = new Date(saved.publishedAt) > new Date()
    toast.success(kind === 'date' ? 'Publish date updated' : future ? 'Post scheduled' : 'Post published')
    return future ? `It goes live on its own: ${formatLocalDateTime(saved.publishedAt)}.` : `Shown as published ${formatLocalDateTime(saved.publishedAt)}.`
  }

  function focusBody() {
    const editor = bodyRef.current?.querySelector<HTMLElement>('.ProseMirror')
    editor?.focus()
    editor?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }
  /** A checklist "fix" closes the dialog, then takes the editor to that field (after Radix restores focus). */
  function fix(key: CheckKey) {
    afterPublishClose.current = () => {
      if (key === 'title') titleRef.current?.focus()
      else if (key === 'summary') excerptRef.current?.focus()
      else if (key === 'category') { titleRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
        setCategoryOpen(true) }
      else if (key === 'cover') setMediaField('featuredImage')
      else if (key === 'alt') {
        const image = [...(bodyRef.current?.querySelectorAll<HTMLImageElement>('.ProseMirror img') ?? [])].find((img) => !img.getAttribute('alt')?.trim())
        if (image) { image.scrollIntoView({ block: 'center', behavior: 'smooth' })
          image.classList.add('ring-2', 'ring-[var(--warning-fg)]')
          setTimeout(() => image.classList.remove('ring-2', 'ring-[var(--warning-fg)]'), 2400)
          toast.info('Select the highlighted image to add its description.') }
        else focusBody()
      } else focusBody()
    }
    setPublish((current) => ({ ...current, open: false }))
  }

  async function openPreview() {
    const current = postRef.current
    const url = (id: string) => `/admin/posts/${id}/preview`
    if (current && !(dirty && current.status === 'DRAFT')) {
      window.open(url(current.id), '_blank')
      if (dirty) toast.info('The preview shows the last saved version. Update to include your changes.')
      return
    }
    if (!form.title.trim()) { toast.error('Add a title before previewing.')
      titleRef.current?.focus()
      return }
    // Open the tab now (inside the click) so pop-up blockers allow it, then point it at the saved post.
    const tab = window.open('about:blank', '_blank')
    const saved = await persist()
    if (saved) { if (tab) tab.location.href = url(saved.id)
      else window.open(url(saved.id), '_blank') }
    else tab?.close()
  }

  // The editor reports its own count; until it does (or if it never mounts), count the saved HTML.
  const htmlWords = useMemo(() => countWords(form.body), [form.body])
  const words = editorWords ?? htmlWords
  const checks = useMemo(() => publishChecks({
    title: form.title, excerpt: form.excerpt, featuredImage: form.featuredImage, body: form.body,
    categoryNames: form.categoryIds.map((id) => categories.find((item) => item.id === id)?.name ?? 'Unknown category'),
  }), [form.title, form.excerpt, form.featuredImage, form.body, form.categoryIds, categories])
  const saveStatus: SaveStatus = saving ? 'saving' : saveFailed ? 'error' : dirty ? 'dirty' : post ? 'saved' : 'new'
  const cover = safeUrl(form.featuredImage)
  const socialImage = safeUrl(form.metaImage)
  const dateLabel = !post || post.status !== 'PUBLISHED' || !post.publishedAt
    // Each variant has its own key: React swaps the whole element instead of removing a bare text node,
    // which crashes when a translator or extension has rewritten that text (see src/app/(cms)/layout.tsx).
    ? <span key="empty" className="text-muted-foreground">Empty · publishes when you click Publish</span>
    : !now ? <span key="pending" className="text-muted-foreground">…</span>
      : scheduled ? <span key="scheduled" className="inline-flex items-center gap-1.5"><CalendarClock className="size-3.5 text-[var(--status-scheduled)]" aria-hidden /><span>Scheduled · {formatLocalDateTime(post.publishedAt)}</span></span>
        : <span key="published">{formatLocalDateTime(post.publishedAt)}</span>
  const onOpenDate = permissions.publish && editable && post?.status !== 'ARCHIVED'
    ? () => openPublish(scheduled ? 'reschedule' : live ? 'date' : 'publish', 'schedule')
    : undefined
  const saveHint = `${isMac() ? '⌘' : 'Ctrl+'}S saves`

  let primary: React.ReactNode = null
  if (permissions.publish && (live || scheduled)) {
    primary = <Button key="update" type="button" size="sm" className="cms-press" disabled={!editable || !dirty} onClick={() => void saveNow()}><span key={busy ? 'saving' : 'idle'}>{busy ? 'Saving…' : 'Update'}</span></Button>
  } else if (permissions.publish) {
    primary = <Button key="publish" type="button" size="sm" className="cms-press" disabled={!editable} onClick={() => openPublish('publish', 'checklist')}><span>Publish</span><ChevronDown className="size-3.5" aria-hidden /></Button>
  } else if (permissions.write) {
    primary = <Button key="save" type="button" size="sm" className="cms-press" disabled={!editable || !dirty} onClick={() => void saveNow()}><span>Save</span></Button>
  }

  return <div className="min-h-full">
    {/* Top bar: stays visible while #admin-main scrolls */}
    <header className="sticky top-0 z-30 flex min-h-[52px] flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-[var(--border-soft)] bg-background/95 px-5 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
        <Link href="/admin/posts" onNavigate={guardNavigation} className="rounded text-muted-foreground hover:text-foreground">Posts</Link>
        <span aria-hidden className="text-[var(--text-faint)]">/</span>
        <span aria-current="page" className="max-w-[320px] truncate font-medium">{form.title.trim() || 'Untitled'}</span>
      </nav>
      <PostStatusChip status={displayStatus} />
      <span className="grow" />
      {permissions.write && <SaveState status={saveStatus} savedAt={savedAt} now={now} error={error} onRetry={editable ? () => void persist() : undefined} />}
      <Button type="button" variant="outline" size="sm" className="cms-press" onClick={() => void openPreview()} disabled={busy}><Eye />Preview</Button>
      {primary && <Tooltip><TooltipTrigger asChild><span className="inline-flex">{primary}</span></TooltipTrigger><TooltipContent side="bottom">{live || scheduled ? `Publishes your changes · ${saveHint}` : `Drafts save automatically · ${saveHint}`}</TooltipContent></Tooltip>}
      {post && <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild><Button type="button" variant="ghost" size="icon-sm" className="cms-press" aria-label="More actions"><MoreHorizontal /></Button></DropdownMenu.Trigger>
        <DropdownMenu.Portal container={portalContainer()}>
          <DropdownMenu.Content align="end" sideOffset={6} className="cms-pop z-50 min-w-[220px] rounded-[10px] border border-[var(--border)] bg-popover p-[5px] text-popover-foreground shadow-[0_12px_30px_rgba(15,15,15,.12)] [--origin:top_right]">
            <DropdownMenu.Item className={menuItem} onSelect={() => setRevisionsOpen(true)}><History className="size-4 text-muted-foreground" />Revision history</DropdownMenu.Item>
            {permissions.publish && scheduled && <DropdownMenu.Item className={menuItem} disabled={!editable} onSelect={() => openPublish('reschedule', 'schedule')}><CalendarClock className="size-4 text-muted-foreground" />Reschedule…</DropdownMenu.Item>}
            {permissions.publish && post.status === 'PUBLISHED' && <DropdownMenu.Item className={menuItem} disabled={!editable} onSelect={() => void changeStatus('DRAFT', scheduled ? 'Unscheduled · now a draft' : 'Unpublished · now a draft')}><Undo2 className="size-4 text-muted-foreground" />{scheduled ? 'Unschedule to draft' : 'Unpublish to draft'}</DropdownMenu.Item>}
            {permissions.write && post.status !== 'ARCHIVED' && <DropdownMenu.Item className={menuItem} disabled={!editable} onSelect={() => void changeStatus('ARCHIVED', 'Post archived')}><Archive className="size-4 text-muted-foreground" />Archive</DropdownMenu.Item>}
            {permissions.write && post.status === 'ARCHIVED' && <DropdownMenu.Item className={menuItem} disabled={!editable} onSelect={() => void changeStatus('DRAFT', 'Moved to drafts')}><ArchiveRestore className="size-4 text-muted-foreground" />Move to drafts</DropdownMenu.Item>}
            {permissions.delete && <><DropdownMenu.Separator className="my-1 h-px bg-[var(--border-soft)]" /><DropdownMenu.Item className={cn(menuItem, 'text-destructive data-[highlighted]:bg-destructive/10')} disabled={!editable} onSelect={() => void remove()}><Trash2 className="size-4" />Delete post</DropdownMenu.Item></>}
            <DropdownMenu.Separator className="my-1 h-px bg-[var(--border-soft)]" />
            <p className="px-2 py-1.5 text-xs leading-relaxed text-muted-foreground">Author: {post.author?.name ?? post.author?.email ?? 'Not assigned'}<br />Last edited by {post.lastEditedBy?.name ?? post.lastEditedBy?.email ?? '—'}</p>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>}
    </header>

    {(lock !== 'ready' || !permissions.write || error || conflict || gone) && <div className="mx-auto mt-4 w-full max-w-[720px] space-y-2 px-6">
      {gone && <div role="alert" className="cms-fade-up flex flex-wrap items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"><p className="flex-1">This post no longer exists: it was deleted. Copy anything you want to keep.</p><Button type="button" size="sm" variant="outline" className="cms-press" asChild><Link href="/admin/posts">Go to posts</Link></Button></div>}
      {lock !== 'ready' && <div role="status" className="cms-fade-up flex flex-wrap items-center gap-3 rounded-lg bg-muted px-4 py-3 text-sm"><LockKeyhole className="size-4" aria-hidden /><p className="flex-1">{lock === 'checking' ? 'Checking edit access…' : lockMessage}</p>{lock === 'blocked' && <><Button type="button" variant="outline" size="sm" className="cms-press" onClick={() => takeLock(false)}>Retry</Button>{permissions.overrideLock && <Button type="button" size="sm" className="cms-press" onClick={() => { if (window.confirm('Take over this post? The other editor will lose their editing lock.')) void takeLock(true) }}>Take over lock</Button>}</>}</div>}
      {!permissions.write && <p className="rounded-lg bg-muted px-4 py-3 text-sm">You have read-only access to posts.</p>}
      {(error || conflict) && <div role="alert" className="cms-fade-up flex flex-wrap items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        <p className="flex-1">{conflict ? 'This post was saved somewhere else (another tab, another person or Claude) after you opened it. Reload to get that version (copy anything you want to keep first); autosave is paused.' : error}</p>
        {conflict ? <Button type="button" size="sm" variant="outline" className="cms-press" onClick={() => window.location.reload()}><RotateCcw />Reload</Button>
          : <Button type="button" size="icon-xs" variant="ghost" aria-label="Dismiss" onClick={() => setError('')}><X /></Button>}
      </div>}
    </div>}

    <div className="flex justify-center px-6 pb-28">
      <article className="w-full max-w-[720px]">
        {/* Cover = the featured image */}
        {cover ? <div className="group relative -mx-6 h-[200px] overflow-hidden rounded-b-xl bg-muted sm:h-[220px]">
          <img src={cover} alt="" className="cms-fade-up size-full object-cover" />
          {editable && <div className="absolute bottom-3 right-3 flex gap-1.5 opacity-100 transition-opacity duration-[var(--dur-fast)] sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
            <Button type="button" size="sm" variant="outline" className="cms-press h-7 bg-background/90 text-xs" onClick={() => setMediaField('featuredImage')}>Change cover</Button>
            <Button type="button" size="sm" variant="outline" className="cms-press h-7 bg-background/90 text-xs" onClick={() => update('featuredImage', '')}>Remove</Button>
          </div>}
        </div> : <div className="pt-10">{editable && <Button type="button" variant="ghost" size="sm" className="cms-press -ml-2 h-7 text-xs text-muted-foreground" onClick={() => setMediaField('featuredImage')}><ImagePlus />Add cover</Button>}</div>}

        <AutoTextarea ref={titleRef} aria-label="Post title" placeholder="Untitled" value={form.title} maxLength={500} disabled={!editable}
          onChange={(event) => {
            const title = event.target.value.replace(/\n/g, ' ')
            // Until a post has been published, its URL follows the title (unless someone edited the URL by hand).
            // Titles with no Latin letters get one stable post-xxxxxx URL; the server adds -2, -3… if taken.
            const followTitle = slugAuto && (!post || (post.status === 'DRAFT' && !post.publishedAt))
            if (followTitle && !fallbackSlugRef.current) fallbackSlugRef.current = fallbackSlug()
            setForm((current) => ({ ...current, title, slug: followTitle ? slugify(title) || fallbackSlugRef.current : current.slug }))
            markChanged()
          }}
          onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault()
            focusBody() } }}
          className={cn('mb-4 text-[40px] font-bold leading-[1.12] tracking-[-0.02em] placeholder:text-[var(--text-faint)] disabled:opacity-100', cover ? 'mt-9' : 'mt-3')} />

        <PostProperties status={displayStatus} editable={editable} manageTaxonomy={permissions.manageTaxonomy} categories={categories} tags={tags}
          categoryIds={form.categoryIds} onCategoryIds={(ids) => update('categoryIds', ids)} categoryOpen={categoryOpen} onCategoryOpenChange={setCategoryOpen}
          tagIds={form.tagIds} onTagIds={(ids) => update('tagIds', ids)} dateLabel={dateLabel} onOpenDate={onOpenDate}
          slug={form.slug} onSlug={(slug) => { setSlugAuto(false)
            update('slug', slug) }} wasLive={wasLive} savedSlug={post?.slug ?? null}
          visibility={form.visibility} onVisibility={(value) => update('visibility', value)}
          excerpt={form.excerpt} onExcerpt={(value) => update('excerpt', value)} excerptRef={excerptRef} onNavigate={guardNavigation} />

        <div ref={bodyRef} className="pt-5">
          <BlockEditor label="Post body" value={form.body} onChange={(value) => update('body', value)} editable={editable} onWordCount={setEditorWords} />
        </div>

        <details ref={seoRef} className="group mt-14 border-t border-[var(--border-soft)] pt-3">
          <summary className="-mx-1.5 flex cursor-pointer list-none items-center gap-2 rounded-md px-1.5 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground [&::-webkit-details-marker]:hidden">
            <ChevronRight className="size-4 transition-transform duration-[var(--dur-base)] group-open:rotate-90" aria-hidden />Search &amp; social
            <span className="hidden font-normal sm:inline">· how the post looks in search results and when shared</span>
          </summary>
          <fieldset disabled={!editable} className="cms-fade-up mt-3 space-y-5 pb-4 pl-6">
            <div className="space-y-1.5"><div className="flex items-baseline justify-between"><Label htmlFor="meta-title" className="text-[13px]">Meta title</Label><span className={cn('text-xs', form.metaTitle.length > 60 ? 'text-[var(--warning-fg)]' : 'text-muted-foreground')}>{form.metaTitle.length} / 60</span></div>
              <Input id="meta-title" value={form.metaTitle} onChange={(event) => update('metaTitle', event.target.value)} maxLength={500} placeholder={form.title || 'Defaults to the post title'} /></div>
            <div className="space-y-1.5"><div className="flex items-baseline justify-between"><Label htmlFor="meta-description" className="text-[13px]">Meta description</Label><span className={cn('text-xs', form.metaDescription.length > 160 ? 'text-[var(--warning-fg)]' : 'text-muted-foreground')}>{form.metaDescription.length} / 160</span></div>
              <Textarea id="meta-description" value={form.metaDescription} onChange={(event) => update('metaDescription', event.target.value)} maxLength={5000} rows={3} placeholder={form.excerpt || 'Defaults to the summary'} /></div>
            <div className="space-y-1.5"><Label htmlFor="meta-image" className="text-[13px]">Social image</Label>
              <div className="flex items-start gap-3">
                <div className="grid aspect-[1200/630] w-32 flex-none place-items-center overflow-hidden rounded-md bg-muted text-center text-xs text-muted-foreground">{socialImage ? <img src={socialImage} alt="Social image preview" className="size-full object-cover" /> : cover ? <img src={cover} alt="Social image preview (cover)" className="size-full object-cover opacity-70" /> : 'None'}</div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex gap-2"><Input id="meta-image" value={form.metaImage} onChange={(event) => update('metaImage', event.target.value)} placeholder="Defaults to the cover image" /><Button type="button" variant="outline" className="cms-press" onClick={() => setMediaField('metaImage')}>Choose</Button></div>
                  <p className="text-xs text-muted-foreground">Shown when the post is shared on social networks. 1200 × 630 works best.</p>
                </div>
              </div>
            </div>
          </fieldset>
        </details>
      </article>
    </div>

    <div aria-live="off" className="pointer-events-none fixed bottom-4 right-5 z-20 hidden items-center gap-2.5 rounded-lg border border-[var(--tint-0)] bg-background px-2.5 py-1.5 text-xs text-muted-foreground shadow-[0_4px_16px_rgba(0,0,0,.06)] sm:flex">
      {words} {words === 1 ? 'word' : 'words'} · {readingMinutes(words)} min read
    </div>

    {permissions.publish && <PublishDialog key={publish.session} open={publish.open} onOpenChange={(open) => setPublish((current) => ({ ...current, open }))}
      kind={publish.kind} initialMode={publish.mode} checks={checks} busy={busy} dirty={dirty} error={publish.open ? error : ''}
      preview={{ title: form.metaTitle || form.title, description: form.metaDescription || form.excerpt || snippet(form.body), image: socialImage ?? cover, slug: form.slug }}
      visibility={form.visibility} onVisibilityChange={(value) => update('visibility', value)} publishedAt={post?.publishedAt ?? null}
      previewHref={post ? `/admin/posts/${post.id}/preview` : null}
      onPublishNow={publishNow} onSchedule={schedulePost} onFix={fix}
      onCloseAutoFocus={(event) => { const run = afterPublishClose.current
        if (run) { event.preventDefault()
          afterPublishClose.current = null
          requestAnimationFrame(run) } }} />}
    {post && <RevisionsPanel open={revisionsOpen} onOpenChange={setRevisionsOpen} postId={post.id} expectedUpdatedAt={post.updatedAt} canRestore={editable} onRestore={acceptPost} onRestoreBusyChange={setBusy} />}
    <MediaPickerModal open={!!mediaField} onClose={() => setMediaField(null)} onSelect={(selected) => { const url = safeUrl(Array.isArray(selected) ? selected[0] : selected)
      if (mediaField && url) update(mediaField, url)
      setMediaField(null) }} />
  </div>
}

/**
 * Mounts the editor with a key that gives a fresh form on every click into it, while Back/Forward
 * restore what you were doing. Next keeps visited pages alive (cacheComponents), and the state slot
 * of /admin/posts/[id]/edit does not include the id, so without this "New post" or another post
 * could reopen a previous form (and save into the previous post).
 */
export function PostEditor(props: Parameters<typeof PostForm>[0]) {
  const { bfcacheId } = useRouter()
  const { newPostRun } = useNavigationGuard()
  const key = props.initialPost ? `${props.initialPost.id}:${bfcacheId}` : `new:${bfcacheId}:${newPostRun}`
  return <PostForm key={key} {...props} />
}
