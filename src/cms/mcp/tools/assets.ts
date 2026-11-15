import { z } from 'zod'
import { ok, ToolError, type Ctx, type Def } from './shared'

const id = z.string().min(1).max(100)
const tax = { name: z.string().min(1).max(160), slug: z.string().min(1).max(120).optional() }
const enc = encodeURIComponent

export const assetTools: Def[] = [
  {
    name: 'create_category', title: 'Create category', annotations: { destructiveHint: false }, requires: ['taxonomy:manage'],
    description: 'Create a blog category.', shape: tax,
    run: async (a: { name: string; slug?: string }, { api }: Ctx) => ok(await api.request('POST', '/api/admin/categories', { body: a })),
  },
  {
    name: 'create_tag', title: 'Create tag', annotations: { destructiveHint: false }, requires: ['taxonomy:manage'],
    description: 'Create a blog tag.', shape: tax,
    run: async (a: { name: string; slug?: string }, { api }: Ctx) => ok(await api.request('POST', '/api/admin/tags', { body: a })),
  },
  {
    name: 'update_media', title: 'Update media', annotations: { destructiveHint: false, idempotentHint: true }, requires: ['media:edit'],
    description: 'Change the alt text or filename of an uploaded image. Neither changes the image URL, so posts that use it keep working.',
    shape: { id, alt: z.string().max(500).nullable().optional(), filename: z.string().min(1).max(200).optional() },
    run: async (a: { id: string; alt?: string | null; filename?: string }, { api }: Ctx) => {
      const body = { ...(a.alt !== undefined ? { alt: a.alt } : {}), ...(a.filename ? { filename: a.filename } : {}) }
      if (!Object.keys(body).length) throw new ToolError('Provide alt or filename')
      return ok(await api.request('PATCH', `/api/admin/media/${enc(a.id)}`, { body }))
    },
  },
]
