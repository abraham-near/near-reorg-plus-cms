import { z } from 'zod'
import { requirePermission } from '@/cms/lib/auth'
import { json, parseJson, route } from '@/cms/lib/http'
import { revokeConnection } from '@/cms/lib/people/oauth-grants'

type Context = { params: Promise<{ id: string }> }

/** DELETE /api/admin/oauth-grants/:id — end a Claude connection (your own; admins: anyone's). Session only. */
export const DELETE = route<Context>(async (req, ctx) => {
  const session = await requirePermission('admin:access')
  await parseJson(req, z.object({}).strict(), 256)
  return json(await revokeConnection(session, (await ctx.params).id, req))
})
