import { z } from 'zod'
import { shapePost, type RawPost } from './read'
import { isLive, ok, ToolError, type Ctx, type Def } from './shared'

const id = z.string().min(1).max(100)
const iso = z.iso.datetime({ offset: true })
const ids = z.array(z.string().min(1).max(100)).max(100)
const meta = {
  excerpt: z.string().max(10_000).optional(),
  featuredImage: z.string().max(2048).optional().describe('URL of an uploaded image'),
  metaTitle: z.string().max(500).optional(),
  metaDescription: z.string().max(5000).optional(),
  metaImage: z.string().max(2048).optional().describe('Social share image URL; defaults to featuredImage'),
  categoryIds: ids.optional(),
  tagIds: ids.optional(),
}
const META_KEYS = Object.keys(meta) as (keyof typeof meta)[]
const pick = (a: Record<string, unknown>, keys: readonly string[]) => Object.fromEntries(keys.filter((k) => a[k] !== undefined).map((k) => [k, a[k]]))
const path = (postId: string, sub = '') => `/api/admin/posts/${encodeURIComponent(postId)}${sub}`

const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120)

// Lock is held only around the write; always released, even if the write fails.
async function withLock<T>(api: Ctx['api'], postId: string, fn: () => Promise<T>): Promise<T> {
  await api.request('POST', path(postId, '/lock'), { body: {} })
  try {
    return await fn()
  } finally {
    await api.request('DELETE', path(postId, '/lock'), { body: {} }).catch((e) => console.error('near-cms: unlock failed:', (e as Error).message))
  }
}

/** Drafts, scheduled and live posts can be edited through a token; archived ones come back first. */
async function loadEditable(api: Ctx['api'], postId: string) {
  const post = await api.request<RawPost>('GET', path(postId))
  if (post.status === 'ARCHIVED') throw new ToolError('This post is archived. Move it back with unpublish_post (to DRAFT) first, then edit it.')
  return post
}

export const postTools: Def[] = [
  {
    name: 'create_draft', title: 'Create draft post', annotations: { idempotentHint: false },
    description: 'Create a new DRAFT blog post whose body is the given HTML. It is not public until publish_post or schedule_post.',
    shape: { title: z.string().min(1).max(500), slug: z.string().min(1).max(200).optional(), html: z.string().max(1_400_000), ...meta },
    run: async (a: { title: string; slug?: string; html: string } & Record<string, unknown>, { api }: Ctx) => {
      const slug = a.slug ?? slugify(a.title)
      if (!slug) throw new ToolError('Could not derive a slug from the title; pass slug explicitly')
      const body = { title: a.title, slug, status: 'DRAFT', body: a.html, ...pick(a, META_KEYS) }
      return ok(shapePost(api.origin, await api.request<RawPost>('POST', '/api/admin/posts', { body }), true))
    },
  },
  {
    name: 'update_post', title: 'Update post', annotations: { destructiveHint: false, idempotentHint: true },
    description: 'Edit a draft, scheduled or live post. On a live post the change is public right away: first tell the person exactly what will change and wait for their yes. html replaces the whole body. The slug of a published post cannot change, and archived posts must be moved back to draft first. Every save keeps a revision the person can restore in the editor.',
    shape: { id, title: z.string().min(1).max(500).optional(), html: z.string().min(1).max(1_400_000).optional(), slug: z.string().min(1).max(200).optional(), ...meta },
    run: async (a: { id: string; title?: string; html?: string; slug?: string } & Record<string, unknown>, { api }: Ctx) => {
      const post = await loadEditable(api, a.id)
      const patch: Record<string, unknown> = { ...pick(a, ['title', ...META_KEYS]) }
      if (a.slug !== undefined && a.slug !== post.slug) {
        if (post.status === 'PUBLISHED') throw new ToolError(`This post is ${isLive(post) ? 'live' : 'scheduled'}: its URL (slug) can only change in the CMS editor (${api.origin}/admin/posts/${a.id}/edit).`)
        patch.slug = a.slug
      }
      if (a.html !== undefined) patch.body = a.html
      if (!Object.keys(patch).length) throw new ToolError('No changes supplied')
      const saved = await withLock(api, a.id, () => api.request<RawPost>('PATCH', path(a.id), { body: { ...patch, expectedUpdatedAt: post.updatedAt } }))
      return ok(shapePost(api.origin, saved, true))
    },
  },
  {
    name: 'publish_post', title: 'Publish post now', annotations: { destructiveHint: false, idempotentHint: true },
    description: 'Publish a draft, scheduled or archived post now. It goes live immediately: run the ready-to-publish checklist and get the person\'s explicit yes before calling.',
    shape: { id },
    run: async (a: { id: string }, { api }: Ctx) => {
      const post = await api.request<RawPost>('GET', path(a.id))
      if (isLive(post)) throw new ToolError('This post is already live.')
      const now = Date.now()
      const body: Record<string, unknown> = { status: 'PUBLISHED', expectedUpdatedAt: post.updatedAt }
      // A post that was live before keeps its original date; a new or scheduled one goes out now.
      if (!post.publishedAt || Date.parse(post.publishedAt) > now) body.publishedAt = new Date(now).toISOString()
      return ok(shapePost(api.origin, await withLock(api, a.id, () => api.request<RawPost>('PATCH', path(a.id), { body }))))
    },
  },
  {
    name: 'schedule_post', title: 'Schedule post', annotations: { idempotentHint: true },
    description: 'Schedule a draft to go live at a future time, or change the time of a post that is already scheduled. Confirm the exact date, time and time zone with the person before calling. publishAt is ISO 8601 with a UTC offset, e.g. 2026-11-03T15:00:00-05:00. To publish right away, use publish_post.',
    shape: { id, publishAt: iso },
    run: async (a: { id: string; publishAt: string }, { api }: Ctx) => {
      const at = Date.parse(a.publishAt)
      if (!(at > Date.now())) throw new ToolError('publishAt must be in the future; to publish now, use publish_post')
      const post = await loadEditable(api, a.id)
      if (isLive(post)) throw new ToolError('This post is already live. Scheduling it would take it off the site until then; ask the person, and use unpublish_post first if they agree.')
      const body = { status: 'PUBLISHED', publishedAt: a.publishAt, expectedUpdatedAt: post.updatedAt }
      return ok(shapePost(api.origin, await withLock(api, a.id, () => api.request<RawPost>('PATCH', path(a.id), { body }))))
    },
  },
  {
    name: 'unpublish_post', title: 'Unpublish post', annotations: { destructiveHint: true, idempotentHint: true },
    description: 'Take a post offline by moving it to DRAFT or ARCHIVED. This removes a live page from the public site.',
    shape: { id, to: z.enum(['DRAFT', 'ARCHIVED']) },
    run: async (a: { id: string; to: 'DRAFT' | 'ARCHIVED' }, { api }: Ctx) => {
      const post = await api.request<RawPost>('GET', path(a.id))
      const saved = await withLock(api, a.id, () => api.request<RawPost>('PATCH', path(a.id), { body: { status: a.to, expectedUpdatedAt: post.updatedAt } }))
      return ok(shapePost(api.origin, saved))
    },
  },
]
