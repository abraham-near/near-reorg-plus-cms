import { requirePermission } from '@/cms/lib/auth'
import { json, parseJson, route } from '@/cms/lib/http'
import { inviteSchema, inviteUser } from '@/cms/lib/people/users'

export const POST = route(async (req) => {
  const { user } = await requirePermission('user:manage')
  const body = await parseJson(req, inviteSchema, 5_000)
  return json(await inviteUser(user, body, req), 201)
})
