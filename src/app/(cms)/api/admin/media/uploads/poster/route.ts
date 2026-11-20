import { requirePermission } from '@/cms/lib/auth'
import { readPoster, readTicket } from '@/cms/lib/chunked-upload'
import { db } from '@/cms/lib/db'
import { HttpError, json, route } from '@/cms/lib/http'
import { storeUpload } from '@/cms/lib/media'
import { setVideoPoster } from '@/cms/components/media/service'

/**
 * PUT /api/admin/media/uploads/poster (header X-Upload-Ticket; body: a JPEG/PNG/WebP frame the browser took from the video):
 * after complete, the video's poster. Stored like an imported image (decoded and re-encoded to WebP, nothing else kept).
 */
export const PUT = route(async (req) => {
  const { user } = await requirePermission('media:upload')
  const ticket = readTicket(req.headers.get('x-upload-ticket'), user.id)
  const video = await db.media.findUnique({ where: { key: ticket.key }, select: { id: true } })
  if (!video) throw new HttpError(409, 'Finish the video upload first')
  const frame = await readPoster(req)
  const name = `${ticket.name.replace(/\.[^.]+$/, '') || 'video'} poster.png`
  const poster = await storeUpload(new File([new Uint8Array(frame)], name), user.id, { imagesOnly: true, strict: true })
  return json(await setVideoPoster(video.id, poster.url))
})
