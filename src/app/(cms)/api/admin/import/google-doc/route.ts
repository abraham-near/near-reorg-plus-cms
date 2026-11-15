import { z } from 'zod'
import { requireActor } from '@/cms/lib/auth'
import { HttpError, json, parseJson, route } from '@/cms/lib/http'
import { importDocxAsDraft } from '@/cms/lib/import/docx-to-post'
import { fetchGoogleDoc, parseGoogleDocId } from '@/cms/lib/import/google-doc'
import { canActor } from '@/cms/lib/permissions'
import { rateLimit } from '@/cms/lib/rate-limit'

const schema = z.object({ url: z.string().min(1).max(2048) }).strict()

/**
 * POST /api/admin/import/google-doc { url } → a new DRAFT made from the Google Doc (text and images).
 * Only ever creates a draft: there is no way to name an existing post, publish or schedule here.
 */
export const POST = route(async (req) => {
  const { user } = await requireActor(req, 'post:write')
  if (!canActor(user, 'media:upload')) throw new HttpError(403, 'Importing a document needs permission to upload images')
  const { url } = await parseJson(req, schema, 8 * 1024)
  const id = parseGoogleDocId(url)
  const limit = await rateLimit(`gdoc-import:${user.id}`, 10, 600)
  if (!limit.ok) throw new HttpError(429, 'Too many imports. Wait a few minutes and try again.')
  const doc = await fetchGoogleDoc(id, user.email)
  return json(await importDocxAsDraft(doc.bytes, { name: doc.name, source: doc.source, documentId: id }, user, req), 201)
}, { token: true })
