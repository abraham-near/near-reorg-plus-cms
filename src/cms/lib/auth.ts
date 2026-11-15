import 'server-only'
import { redirect } from 'next/navigation'
import { parseBearer, resolveTokenActor } from './api-tokens/auth'
import { HttpError } from './http'
import { can, canActor, type Permission } from './permissions'
import { getSession, type CurrentSession } from './session'

export { can, canActor } from './permissions'

const SESSION_COOKIE_NAMES = ['__Host-near_cms', 'near_cms']
export { getSession } from './session'

/** For admin pages: redirect to login without a session, and to the dashboard without the permission. */
export async function requirePagePermission(permission: Permission = 'admin:access'): Promise<CurrentSession> {
  const session = await getSession()
  if (!session) redirect('/admin/login')
  if (!can(session.user.role, permission)) redirect('/admin/dashboard?denied=1')
  return session
}

/** For route handlers: 401 without a session, 403 without the permission. */
export async function requirePermission(permission: Permission = 'admin:access'): Promise<CurrentSession> {
  const session = await getSession()
  if (!session) throw new HttpError(401, 'Not signed in')
  if (!can(session.user.role, permission)) throw new HttpError(403, 'Not allowed')
  return session
}

// The remote MCP endpoint (/api/mcp) authenticates the OAuth token itself, then calls the same
// /api/admin handlers in process with a Request it built. It attaches the actor to that Request
// object here: nothing sent over HTTP can create an entry, and the token never reaches /api/admin.
const boundActors = new WeakMap<Request, CurrentSession>()
export function bindActor(req: Request, actor: CurrentSession) {
  boundActors.set(req, actor)
}

/**
 * For the handlers that accept API tokens (`route(…, { token: true })`): the bearer token if one is
 * sent, otherwise the session cookie. Never both, so it is always clear who is acting.
 */
export async function requireActor(req: Request, permission: Permission = 'admin:access'): Promise<CurrentSession> {
  const bound = boundActors.get(req)
  if (bound) {
    if (!canActor(bound.user, permission)) throw new HttpError(403, 'Not available through this connection')
    return bound
  }
  if (parseBearer(req)) {
    if (req.headers.get('cookie')?.split(';').some((c) => SESSION_COOKIE_NAMES.includes(c.split('=')[0].trim()))) {
      throw new HttpError(400, 'Send either a session cookie or an API token, not both')
    }
    const actor = await resolveTokenActor(req)
    if (!canActor(actor.user, permission)) throw new HttpError(403, 'Not available through API tokens')
    return actor
  }
  return requirePermission(permission)
}
