import { requirePermission } from '@/cms/lib/auth'
import { HttpError, json, route } from '@/cms/lib/http'
import { rateLimit } from '@/cms/lib/rate-limit'
import { countUnoptimizedMedia, optimizeStoredMedia } from '@/cms/components/media/service'

/** GET /api/admin/media/optimize → { remaining }: images uploaded before uploads were optimized. */
export const GET = route(async () => {
  await requirePermission('media:edit')
  return json({ remaining: await countUnoptimizedMedia() })
})

/**
 * POST /api/admin/media/optimize → optimizes a few of them (WebP, max 2000 px, original kept) and points posts
 * at the new files. Call again while `remaining` drops; the media page does this from its banner.
 */
export const POST = route(async (req) => {
  const { user } = await requirePermission('media:edit')
  await requirePermission('media:upload')
  if (!(await rateLimit(`optimize:${user.id}`, 120, 60)).ok) throw new HttpError(429, 'Too many requests. Try again in a minute.')
  return json(await optimizeStoredMedia(user, req))
})
