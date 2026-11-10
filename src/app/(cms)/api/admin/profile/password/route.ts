import { requirePermission } from '@/cms/lib/auth'
import { json, parseJson, route } from '@/cms/lib/http'
import { changeProfilePassword, profilePasswordSchema } from '@/cms/lib/people/profile'

export const POST = route(async (req) => {
  const session = await requirePermission('admin:access')
  const input = await parseJson(req, profilePasswordSchema, 5_000)
  return json(await changeProfilePassword(session, input, req))
})
