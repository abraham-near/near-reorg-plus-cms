import { requirePermission } from '@/cms/lib/auth'
import { json, route } from '@/cms/lib/http'
import { listOwnConnections } from '@/cms/lib/people/oauth-grants'

/** GET /api/admin/oauth-grants — your Claude connections (session only). */
export const GET = route(async () => {
  const session = await requirePermission('admin:access')
  return json({ connections: await listOwnConnections(session.user.id) })
})
