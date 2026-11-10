import { requirePermission } from '@/cms/lib/auth'
import { json, parseJson, route } from '@/cms/lib/http'
import { getProfile, profileSchema, updateProfile } from '@/cms/lib/people/profile'

export const GET = route(async () => {
  const session = await requirePermission('admin:access')
  return json(await getProfile(session.user.id))
})

export const PATCH = route(async (req) => {
  const session = await requirePermission('admin:access')
  const { name } = await parseJson(req, profileSchema, 2_000)
  return json(await updateProfile(session, name, req))
})
