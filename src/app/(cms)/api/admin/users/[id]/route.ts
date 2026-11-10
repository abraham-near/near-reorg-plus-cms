import { requirePermission } from '@/cms/lib/auth'
import { json, parseJson, route } from '@/cms/lib/http'
import { deleteUser, emptyBodySchema, updateUser, updateUserSchema } from '@/cms/lib/people/users'

type Context = { params: Promise<{ id: string }> }

export const PATCH = route<Context>(async (req, ctx) => {
  const { user } = await requirePermission('user:manage')
  const body = await parseJson(req, updateUserSchema, 5_000)
  const { id } = await ctx.params
  return json(await updateUser(user, id, body, req))
})

export const DELETE = route<Context>(async (req, ctx) => {
  const { user } = await requirePermission('user:manage')
  await parseJson(req, emptyBodySchema, 1_000)
  const { id } = await ctx.params
  await deleteUser(user, id, req)
  return json({ ok: true })
})
