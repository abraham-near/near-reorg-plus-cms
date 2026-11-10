import { requirePermission } from '@/cms/lib/auth'
import { HttpError, json, route } from '@/cms/lib/http'
import { listUsers, usersQuerySchema } from '@/cms/lib/people/users'

export const GET = route(async (req) => {
  await requirePermission('user:manage')
  const query = usersQuerySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams))
  if (!query.success) throw new HttpError(400, 'Invalid users filters')
  return json(await listUsers(query.data))
})
