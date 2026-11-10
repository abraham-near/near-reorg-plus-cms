import { requireActor, requirePermission } from '@/cms/lib/auth'
import { json, parseJson, route } from '@/cms/lib/http'
import { listRevisions } from '@/cms/lib/revisions'
import { restoreSchema } from '@/cms/lib/posts/schema'
import type { PostContext } from '@/cms/lib/posts/select'
import { loadPost, restorePost } from '@/cms/lib/posts/service'

export const GET = route<PostContext>(async (req, ctx) => {
  await requireActor(req, 'content:read')
  const { id } = await ctx.params
  await loadPost(id)
  return json({ revisions: await listRevisions('POST', id) })
}, { token: true })
export const POST = route<PostContext>(async (req, ctx) => {
  const { user } = await requirePermission('post:write')
  const { revisionId, expectedUpdatedAt } = await parseJson(req, restoreSchema, 2048)
  return json(await restorePost((await ctx.params).id, revisionId, user, req, expectedUpdatedAt))
})
