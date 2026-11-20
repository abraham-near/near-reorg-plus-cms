import { audit } from '@/cms/lib/audit'
import { requirePermission } from '@/cms/lib/auth'
import { db } from '@/cms/lib/db'
import { HttpError, json, route } from '@/cms/lib/http'
import { POST_VIDEO_MIMES, storeUpload } from '@/cms/lib/media'
import { rateLimit } from '@/cms/lib/rate-limit'
import { mediaSelect } from '@/cms/components/media/types'
import { finishReplace } from '@/cms/components/media/service'
import { readMediaUpload } from '@/cms/components/media/validation'

export const POST = route<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const { user } = await requirePermission('media:edit')
  await requirePermission('media:upload')
  if (!(await rateLimit(`upload:${user.id}`, 60, 60)).ok) throw new HttpError(429, 'Too many uploads. Try again in a minute.')
  const old = await db.media.findUnique({ where: { id: (await params).id }, select: mediaSelect })
  if (!old) throw new HttpError(404, 'File not found')
  const { file, replaceEverywhere } = await readMediaUpload(req)
  // An image stays an image: posts embed it in <img> and as featured or social image. An MP4/WebM
  // stays an MP4/WebM: a video post may play it (Post.video), so nothing else may take its place.
  const uploaded = await storeUpload(file, user.id, { imagesOnly: old.mimeType.startsWith('image/'), videosOnly: POST_VIDEO_MIMES.has(old.mimeType) })
  const fresh = await db.media.findUniqueOrThrow({ where: { id: uploaded.id }, select: mediaSelect })
  if (fresh.id === old.id) return json({ media: fresh, updated: 0, occurrences: 0, originalRetained: true })
  await audit(user, { action: 'UPLOAD', entityType: 'MEDIA', entityId: fresh.id, entityTitle: fresh.filename }, req)
  return json(await finishReplace(old, fresh, user, req, replaceEverywhere === '1'))
})
