import type { Prisma } from '@/generated/prisma/client'
import { audit } from '@/cms/lib/audit'
import { requireActor } from '@/cms/lib/auth'
import { db } from '@/cms/lib/db'
import { HttpError, json, route } from '@/cms/lib/http'
import { storeUpload } from '@/cms/lib/media'
import { mediaSelect } from '@/cms/components/media/types'
import { mediaUsageByUrl } from '@/cms/components/media/service'
import { readMediaUpload } from '@/cms/components/media/validation'
import { rateLimit } from '@/cms/lib/rate-limit'

const PAGE_SIZE = 24

/** GET /api/admin/media?page=1&q=&type=image|video|other&unused=1 (unused: files no post references) */
export const GET = route(async (req) => {
  await requireActor(req, 'content:read')
  const params = new URL(req.url).searchParams
  const page = Math.max(1, Math.min(10_000, Math.floor(Number(params.get('page')) || 1)))
  const q = params.get('q')?.trim().slice(0, 100)
  const type = params.get('type')
  const usedUrls = params.get('unused') === '1' ? [...(await mediaUsageByUrl()).keys()] : null
  const where: Prisma.MediaWhereInput = {
    ...(usedUrls ? { url: { notIn: usedUrls } } : {}),
    ...(q ? { OR: [{ filename: { contains: q, mode: 'insensitive' } }, { alt: { contains: q, mode: 'insensitive' } }] } : {}),
    ...(type === 'image' ? { mimeType: { startsWith: 'image/' } } : {}),
    ...(type === 'video' ? { mimeType: { startsWith: 'video/' } } : {}),
    ...(type === 'other' ? { NOT: [{ mimeType: { startsWith: 'image/' } }, { mimeType: { startsWith: 'video/' } }] } : {}),
  }
  const [items, total] = await Promise.all([
    db.media.findMany({ where, select: mediaSelect, orderBy: { createdAt: 'desc' }, take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE }),
    db.media.count({ where }),
  ])
  return json({ items, total, page, pageSize: PAGE_SIZE })
}, { token: true })

/** POST /api/admin/media (multipart, field "file"; optional "alt", "imagesOnly=1") */
export const POST = route(async (req) => {
  const { user } = await requireActor(req, 'media:upload')
  if (!(await rateLimit(`upload:${user.id}`, 60, 60)).ok) throw new HttpError(429, 'Too many uploads. Try again in a minute.')
  const { file, alt, imagesOnly } = await readMediaUpload(req)
  // Uploads are public at once; through a token only images, so a leaked token cannot host documents.
  const media = await storeUpload(file, user.id, { imagesOnly: imagesOnly === '1' || user.via === 'token' })
  const saved = await db.media.update({
    where: { id: media.id },
    data: alt && !media.alt ? { alt } : {},
    select: mediaSelect,
  })
  await audit(user, { action: 'UPLOAD', entityType: 'MEDIA', entityId: saved.id, entityTitle: saved.filename }, req)
  return json(saved, 201)
}, { token: true })
