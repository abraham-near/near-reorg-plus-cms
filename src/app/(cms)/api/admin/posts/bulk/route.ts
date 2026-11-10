import { canActor, requireActor } from '@/cms/lib/auth'
import { HttpError, json, parseJson, route } from '@/cms/lib/http'
import { bulkSchema } from '@/cms/lib/posts/schema'
import { bulkPosts } from '@/cms/lib/posts/service'

export const POST = route(async (req) => {
  const { user } = await requireActor(req, 'post:write')
  const { ids, action } = await parseJson(req, bulkSchema, 20_000)
  const needed = action === 'delete' ? 'post:delete' : action === 'publish' || action === 'unpublish' ? 'post:publish' : null
  if (needed && !canActor(user, needed)) throw new HttpError(403, user.via === 'token' ? 'Not available through API tokens' : 'Not allowed')
  return json(await bulkPosts(ids, action, user, req))
}, { token: true })
