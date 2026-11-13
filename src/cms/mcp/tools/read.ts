import { z } from 'zod'
import { isLive, ok, postUrls, type Ctx, type Def } from './shared'

export type RawPost = {
  id: string; slug: string; title: string; status: string; visibility: string; body: string
  publishedAt: string | null; updatedAt: string
  excerpt?: string | null; featuredImage?: string | null; metaTitle?: string | null
  metaDescription?: string | null; metaImage?: string | null
  categories?: { category: { id: string; name: string; slug: string } }[]; tags?: { id: string; name: string; slug: string }[]
  author?: { name: string | null } | null
}

export function shapePost(origin: string, p: RawPost, withBody = false) {
  return {
    id: p.id, slug: p.slug, title: p.title, status: p.status, visibility: p.visibility,
    publishedAt: p.publishedAt, updatedAt: p.updatedAt, live: isLive(p),
    excerpt: p.excerpt ?? null, featuredImage: p.featuredImage ?? null,
    metaTitle: p.metaTitle ?? null, metaDescription: p.metaDescription ?? null, metaImage: p.metaImage ?? null,
    categories: p.categories?.map((c) => c.category), tags: p.tags, author: p.author?.name ?? null,
    ...(withBody ? { bodyHtml: p.body ?? '' } : {}),
    ...postUrls(origin, p.id),
  }
}

const RO = { readOnlyHint: true }
const page = z.number().int().min(1).max(100000).optional()

export const readTools: Def[] = [
  {
    name: 'whoami', title: 'Who am I', annotations: RO, requires: ['admin:access'], shape: {},
    description: 'Show which CMS user and API token this server uses, with its capabilities.',
    run: async (_a: never, { api }: Ctx) => ok(await api.request('GET', '/api/admin/whoami'), false),
  },
  {
    name: 'list_posts', title: 'List posts', annotations: RO, requires: ['content:read'],
    description: 'List blog posts (newest edited first). Filter by text, status or scheduled-only.',
    shape: { q: z.string().max(200).optional(), status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(), scheduled: z.boolean().optional(), page, limit: z.number().int().min(1).max(50).optional() },
    run: async (a: { q?: string; status?: string; scheduled?: boolean; page?: number; limit?: number }, { api }: Ctx) => {
      const r = await api.request<{ posts: RawPost[]; total: number; page: number; limit: number }>('GET', '/api/admin/posts', {
        query: { q: a.q, status: a.status, scheduled: a.scheduled ? 'true' : undefined, page: a.page, limit: a.limit ?? 20 },
      })
      return ok({ total: r.total, page: r.page, limit: r.limit, posts: r.posts.map((p) => shapePost(api.origin, p)) })
    },
  },
  {
    name: 'get_post', title: 'Get post', annotations: RO, requires: ['content:read'],
    description: 'Get one post: its metadata and body HTML.',
    shape: { id: z.string().min(1).max(100) },
    run: async (a: { id: string }, { api }: Ctx) =>
      ok(shapePost(api.origin, await api.request<RawPost>('GET', `/api/admin/posts/${encodeURIComponent(a.id)}`), true)),
  },
  {
    name: 'list_categories', title: 'List categories', annotations: RO, requires: ['content:read'], shape: {},
    description: 'List all blog categories.',
    run: async (_a: never, { api }: Ctx) => ok(await api.request('GET', '/api/admin/categories')),
  },
  {
    name: 'list_tags', title: 'List tags', annotations: RO, requires: ['content:read'], shape: {},
    description: 'List all blog tags.',
    run: async (_a: never, { api }: Ctx) => ok(await api.request('GET', '/api/admin/tags')),
  },
  {
    name: 'list_media', title: 'List media', annotations: RO, requires: ['content:read'],
    description: 'List uploaded images in the media library.',
    shape: { q: z.string().max(200).optional(), page },
    run: async (a: { q?: string; page?: number }, { api }: Ctx) =>
      ok(await api.request('GET', '/api/admin/media', { query: { q: a.q, page: a.page, type: 'image' } })),
  },
]
