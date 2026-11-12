import { requirePermission } from '@/cms/lib/auth'
import { db } from '@/cms/lib/db'
import { HttpError, json, route } from '@/cms/lib/http'
import { mediaUsageByUrl } from '@/cms/components/media/service'

const MAX_IDS = 100

/**
 * GET /api/admin/media/usage?ids=a,b,c → { usage: { [id]: postCount } }
 * How many posts use each file, for the media grid ("In 2 posts" / "Not used yet"). Read-only.
 */
export const GET = route(async (req) => {
  await requirePermission('content:read')
  const raw = new URL(req.url).searchParams.get('ids') ?? ''
  const ids = [...new Set(raw.split(',').map((id) => id.trim()).filter(Boolean))]
  if (ids.length > MAX_IDS || ids.some((id) => id.length > 100)) throw new HttpError(400, `Ask for at most ${MAX_IDS} files`)
  if (!ids.length) return json({ usage: {} })
  const [media, usage] = await Promise.all([
    db.media.findMany({ where: { id: { in: ids } }, select: { id: true, url: true } }),
    mediaUsageByUrl(),
  ])
  return json({ usage: Object.fromEntries(media.map((item) => [item.id, usage.get(item.url) ?? 0])) })
})
