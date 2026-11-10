import { z } from 'zod'
import { requirePermission } from '@/cms/lib/auth'
import { json, parseJson, route } from '@/cms/lib/http'
import { revokeApiToken } from '@/cms/lib/people/api-tokens'

type Context = { params: Promise<{ id: string }> }

export const DELETE = route<Context>(async (req, ctx) => {
  const session = await requirePermission('admin:access')
  await parseJson(req, z.object({}).strict(), 256)
  return json(await revokeApiToken(session, (await ctx.params).id, req))
})
