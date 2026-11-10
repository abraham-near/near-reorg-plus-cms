import { requirePermission } from '@/cms/lib/auth'
import { json, parseJson, route } from '@/cms/lib/http'
import { emptyBodySchema, revokeInvitation } from '@/cms/lib/people/users'

export const DELETE = route<{ params: Promise<{ id: string }> }>(async (req, ctx) => {
  const { user } = await requirePermission('user:manage')
  await parseJson(req, emptyBodySchema, 1_000)
  const { id } = await ctx.params
  await revokeInvitation(user, id, req)
  return json({ ok: true })
})
