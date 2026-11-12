import { audit, diffFields } from '@/cms/lib/audit'
import { requireActor, requirePermission } from '@/cms/lib/auth'
import { db } from '@/cms/lib/db'
import { HttpError, json, parseJson, route } from '@/cms/lib/http'
import { findMediaReferences, removeMedia } from '@/cms/components/media/service'
import { mediaSelect } from '@/cms/components/media/types'
import { deleteSchema, mediaPatchSchema } from '@/cms/components/media/validation'

type Context = { params: Promise<{ id: string }> }

export const GET = route<Context>(async (req, { params }) => {
  await requireActor(req, 'content:read')
  const { id } = await params
  const media = await db.media.findUnique({ where: { id }, select: { ...mediaSelect, uploadedById: true } })
  if (!media) throw new HttpError(404, 'File not found')
  const { uploadedById, ...file } = media
  const [references, uploadedBy] = await Promise.all([
    findMediaReferences(media.url),
    uploadedById ? db.user.findUnique({ where: { id: uploadedById }, select: { name: true, email: true } }) : null,
  ])
  return json({ ...file, references, uploadedBy })
}, { token: true })

export const PATCH = route<Context>(async (req, { params }) => {
  const { user } = await requireActor(req, 'media:edit')
  const { id } = await params
  const data = await parseJson(req, mediaPatchSchema, 4096)
  const before = await db.media.findUnique({ where: { id }, select: mediaSelect })
  if (!before) throw new HttpError(404, 'File not found')
  // Alt text and filename never change the file's URL, so a token may fix them on live images too.
  const saved = await db.media.update({ where: { id }, data, select: mediaSelect })
  await audit(user, { action: 'UPDATE', entityType: 'MEDIA', entityId: id, entityTitle: saved.filename, diff: diffFields(before, saved) }, req)
  return json(saved)
}, { token: true })

export const DELETE = route<Context>(async (req, { params }) => {
  const { user } = await requirePermission('media:delete')
  const { force } = await parseJson(req, deleteSchema, 1024)
  return json({ success: true, ...await removeMedia((await params).id, force, user, req) })
})
