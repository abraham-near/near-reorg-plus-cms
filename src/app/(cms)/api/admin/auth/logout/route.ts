import { audit } from '@/cms/lib/audit'
import { json, route } from '@/cms/lib/http'
import { destroyCurrentSession, getSession } from '@/cms/lib/session'

export const POST = route(async (req) => {
  const session = await getSession()
  await destroyCurrentSession()
  if (session) await audit(session.user, { action: 'LOGOUT', entityType: 'AUTH', entityId: session.user.id }, req)
  return json({ ok: true })
})
