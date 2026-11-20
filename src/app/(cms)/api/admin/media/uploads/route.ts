import { z } from 'zod'
import { requirePermission } from '@/cms/lib/auth'
import { startUpload } from '@/cms/lib/chunked-upload'
import { HttpError, json, parseJson, route } from '@/cms/lib/http'
import { rateLimit } from '@/cms/lib/rate-limit'

// Starts a video upload sent in parts (src/cms/lib/chunked-upload.ts). Signed-in people only: API tokens (Claude) upload
// images only, through POST /api/admin/media.
const startSchema = z.object({
  filename: z.string().min(1).max(300),
  ext: z.string().min(1).max(10),
  size: z.number().int().positive(),
  videosOnly: z.boolean().optional(),
  replaceId: z.string().min(1).max(100).optional(),
}).strict()

/** POST /api/admin/media/uploads {filename, ext, size, videosOnly?, replaceId?} → {ticket, partSize, parts} */
export const POST = route(async (req) => {
  const { user } = await requirePermission('media:upload')
  const input = await parseJson(req, startSchema, 4096)
  if (input.replaceId) await requirePermission('media:edit')
  if (!(await rateLimit(`upload:${user.id}`, 60, 60)).ok) throw new HttpError(429, 'Too many uploads. Try again in a minute.')
  return json(await startUpload(user.id, input), 201)
})
