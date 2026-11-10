import { requireActor, requirePermission } from '@/cms/lib/auth'
import { json, parseJson, route } from '@/cms/lib/http'
import { emptySchema, updatePostSchema } from '@/cms/lib/posts/schema'
import type { PostContext } from '@/cms/lib/posts/select'
import { deletePost, loadPost, updatePost } from '@/cms/lib/posts/service'

export const GET = route<PostContext>(async (req, ctx) => {
  await requireActor(req, 'content:read')
  return json(await loadPost((await ctx.params).id))
}, { token: true })

export const PATCH = route<PostContext>(async (req, ctx) => {
  const { user } = await requireActor(req, 'post:write')
  const input = await parseJson(req, updatePostSchema, 2_000_000)
  return json(await updatePost((await ctx.params).id, input, user, req))
}, { token: true })
export const PUT = PATCH

export const DELETE = route<PostContext>(async (req, ctx) => {
  const { user } = await requirePermission('post:delete')
  await parseJson(req, emptySchema, 1024)
  await deletePost((await ctx.params).id, user, req)
  return json({ success: true })
})
