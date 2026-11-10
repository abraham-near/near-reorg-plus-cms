import { z } from 'zod'
import { ok, ToolError, type Ctx, type Def } from './shared'
import { prepareUpload } from '../uploads'

const id = z.string().min(1).max(100)
const tax = { name: z.string().min(1).max(160), slug: z.string().min(1).max(120).optional() }
const enc = encodeURIComponent

export const assetTools: Def[] = [
  {
    name: 'create_category', title: 'Create category', annotations: {},
    description: 'Create a blog category.', shape: tax,
    run: async (a: { name: string; slug?: string }, { api }: Ctx) => ok(await api.request('POST', '/api/admin/categories', { body: a })),
  },
  {
    name: 'create_tag', title: 'Create tag', annotations: {},
    description: 'Create a blog tag.', shape: tax,
    run: async (a: { name: string; slug?: string }, { api }: Ctx) => ok(await api.request('POST', '/api/admin/tags', { body: a })),
  },
  {
    name: 'upload_media', title: 'Upload image', annotations: {},
    description: 'Upload an image (jpg, png, gif, webp, avif; max 15 MB) from inside NEAR_CMS_UPLOAD_DIR to the media library. path is relative to that folder.',
    shape: { path: z.string().min(1).max(1000), alt: z.string().max(500).optional() },
    run: async (a: { path: string; alt?: string }, { api, uploadDir }: Ctx) => {
      const { blob, filename } = await prepareUpload(a.path, uploadDir)
      const form = new FormData()
      form.append('file', blob, filename)
      form.append('imagesOnly', '1')
      if (a.alt) form.append('alt', a.alt)
      return ok(await api.request('POST', '/api/admin/media', { form }))
    },
  },
  {
    name: 'update_media', title: 'Update media', annotations: { idempotentHint: true },
    description: 'Change the alt text or filename of an uploaded image. Neither changes the image URL, so posts that use it keep working.',
    shape: { id, alt: z.string().max(500).nullable().optional(), filename: z.string().min(1).max(200).optional() },
    run: async (a: { id: string; alt?: string | null; filename?: string }, { api }: Ctx) => {
      const body = { ...(a.alt !== undefined ? { alt: a.alt } : {}), ...(a.filename ? { filename: a.filename } : {}) }
      if (!Object.keys(body).length) throw new ToolError('Provide alt or filename')
      return ok(await api.request('PATCH', `/api/admin/media/${enc(a.id)}`, { body }))
    },
  },
]
