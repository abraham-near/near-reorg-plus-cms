import { audit } from '@/cms/lib/audit'
import { requirePermission } from '@/cms/lib/auth'
import { db } from '@/cms/lib/db'
import { HttpError, json, route } from '@/cms/lib/http'
import { storeUpload } from '@/cms/lib/media'
import { rateLimit } from '@/cms/lib/rate-limit'
import { mediaSelect } from '@/cms/components/media/types'
import { replaceMediaReferences } from '@/cms/components/media/service'
import { readMediaUpload } from '@/cms/components/media/validation'

export const POST = route<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const { user } = await requirePermission('media:edit')
  await requirePermission('media:upload')
  if (!(await rateLimit(`upload:${user.id}`, 60, 60)).ok) throw new HttpError(429, 'Too many uploads. Try again in a minute.')
  const old = await db.media.findUnique({ where: { id: (await params).id }, select: mediaSelect })
  if (!old) throw new HttpError(404, 'File not found')
  const { file, replaceEverywhere } = await readMediaUpload(req)
  // An image stays an image: posts embed it in <img> and as featured or social image.
  const uploaded = await storeUpload(file, user.id, { imagesOnly: old.mimeType.startsWith('image/') })
  const fresh = await db.media.findUniqueOrThrow({ where: { id: uploaded.id }, select: mediaSelect })
  if (fresh.id === old.id) return json({ media: fresh, updated: 0, occurrences: 0, originalRetained: true })
  await audit(user, { action: 'UPLOAD', entityType: 'MEDIA', entityId: fresh.id, entityTitle: fresh.filename }, req)
  const result = await replaceMediaReferences(old.url, fresh.url, user, req, { replaceEverywhere: replaceEverywhere === '1', original: old, replacement: fresh })
  await audit(user, { action: 'REPLACE', entityType: 'MEDIA', entityId: old.id, entityTitle: old.filename, diff: { oldUrl: old.url, newUrl: fresh.url, replacementId: fresh.id, ...result } }, req)
  const saved = await db.media.findUniqueOrThrow({ where: { id: fresh.id }, select: mediaSelect })
  return json({ media: saved, ...result, originalRetained: true })
})
