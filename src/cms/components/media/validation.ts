import { z } from 'zod'
import { cleanFilename, MAX_UPLOAD_BYTES } from '@/cms/lib/media'
import { HttpError, parseJson } from '@/cms/lib/http'

export const mediaPatchSchema = z.object({
  filename: z.string().trim().min(1).max(200).transform(cleanFilename).optional(),
  alt: z.string().trim().max(500).nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'No changes provided')
export const deleteSchema = z.object({ force: z.boolean().default(false) }).strict()
export const bulkDeleteSchema = deleteSchema.extend({ ids: z.array(z.string().min(1).max(100)).min(1).max(100).transform((ids) => [...new Set(ids)]) })
const uploadFieldsSchema = z.object({
  alt: z.string().trim().max(500).optional(),
  imagesOnly: z.enum(['0', '1']).default('0'),
  replaceEverywhere: z.enum(['0', '1']).default('0'),
}).strict()

export async function readMediaUpload(req: Request) {
  const limit = MAX_UPLOAD_BYTES + 64 * 1024
  if (Number(req.headers.get('content-length') ?? 0) > limit) throw new HttpError(413, 'File too large')
  const reader = req.body?.getReader()
  if (!reader) throw new HttpError(400, 'No file provided')
  const chunks: Uint8Array[] = []
  let length = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    length += value.byteLength
    if (length > limit) { await reader.cancel(); throw new HttpError(413, 'File too large') }
    chunks.push(value)
  }
  let form: FormData
  try {
    form = await new Response(Buffer.concat(chunks), { headers: { 'content-type': req.headers.get('content-type') || '' } }).formData()
  } catch { throw new HttpError(400, 'Invalid form data') }
  if (Array.from(form.keys()).some((key) => !['file', 'alt', 'imagesOnly', 'replaceEverywhere'].includes(key))) throw new HttpError(400, 'Unexpected upload field')
  if (['alt', 'imagesOnly', 'replaceEverywhere'].some((key) => form.getAll(key).length > 1)) throw new HttpError(400, 'Duplicate upload field')
  if (form.getAll('file').length !== 1) throw new HttpError(400, 'Provide one file')
  const file = form.get('file')
  if (!(file instanceof File)) throw new HttpError(400, 'No file provided')
  const fields = await parseJson(new Request(req.url, { method: 'POST', body: JSON.stringify(Object.fromEntries([...form].filter(([key]) => key !== 'file'))) }), uploadFieldsSchema, 4096)
  return { file, ...fields }
}
