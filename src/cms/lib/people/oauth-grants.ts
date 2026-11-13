import 'server-only'
import { audit } from '@/cms/lib/audit'
import { db } from '@/cms/lib/db'
import { HttpError } from '@/cms/lib/http'
import { can } from '@/cms/lib/permissions'
import type { CurrentSession } from '@/cms/lib/session'

// Settings › Claude › Connected apps: the Claude connections (OAuth grants) a person has made, and
// ending them. Only with a session: a connection cannot list or end connections itself.

export type ConnectedApp = {
  id: string; clientName: string; scopes: string[]; createdAt: string; expiresAt: string
  lastUsedAt: string | null; status: 'active' | 'expired' | 'revoked'; revokeReason: string | null
}

export async function listOwnConnections(userId: string): Promise<ConnectedApp[]> {
  const rows = await db.oAuthGrant.findMany({
    where: { userId, OR: [{ revokedAt: null }, { revokedAt: { gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }] },
    orderBy: [{ revokedAt: { sort: 'desc', nulls: 'first' } }, { createdAt: 'desc' }],
    take: 30,
  })
  const now = Date.now()
  return rows.map((g) => ({
    id: g.id, clientName: g.clientName, scopes: g.scopes, createdAt: g.createdAt.toISOString(), expiresAt: g.expiresAt.toISOString(),
    lastUsedAt: g.lastUsedAt?.toISOString() ?? null, revokeReason: g.revokeReason,
    status: g.revokedAt ? 'revoked' : g.expiresAt.getTime() <= now ? 'expired' : 'active',
  }))
}

/** Ends one connection: the owner's own, or anyone's for an admin (user:manage). */
export async function revokeConnection(session: CurrentSession, id: string, req: Request) {
  const grant = await db.oAuthGrant.findUnique({ where: { id }, select: { id: true, userId: true, clientName: true, revokedAt: true } })
  const own = grant?.userId === session.user.id
  if (!grant || (!own && !can(session.user.role, 'user:manage'))) throw new HttpError(404, 'Connection not found')
  if (grant.revokedAt) return { ok: true, alreadyRevoked: true }
  await db.oAuthGrant.update({ where: { id }, data: { revokedAt: new Date(), revokedById: session.user.id, revokeReason: own ? 'USER' : 'ADMIN' } })
  await audit(session.user, { action: 'OAUTH_GRANT_REVOKED', entityType: 'OAUTH_GRANT', entityId: id, entityTitle: grant.clientName, diff: { reason: own ? 'USER' : 'ADMIN' } }, req)
  return { ok: true, alreadyRevoked: false }
}
