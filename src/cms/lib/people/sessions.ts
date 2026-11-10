import 'server-only'
import { audit } from '@/cms/lib/audit'
import { db } from '@/cms/lib/db'
import { HttpError } from '@/cms/lib/http'
import { revokeUserSessions, type CurrentSession } from '@/cms/lib/session'

export type ProfileSession = {
  id: string
  createdAt: string
  lastSeenAt: string
  ip: string | null
  userAgent: string | null
  current: boolean
}

export async function listProfileSessions(session: CurrentSession): Promise<ProfileSession[]> {
  const now = new Date()
  const sessions = await db.session.findMany({
    where: {
      userId: session.user.id,
      expiresAt: { gt: now },
      createdAt: { gt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) },
    },
    select: { id: true, createdAt: true, lastSeenAt: true, ip: true, userAgent: true },
    orderBy: { lastSeenAt: 'desc' },
  })
  return sessions.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
    lastSeenAt: item.lastSeenAt.toISOString(),
    current: item.id === session.id,
  }))
}

export async function revokeProfileSession(session: CurrentSession, id: string, req: Request) {
  const deleted = await db.session.deleteMany({ where: { id, userId: session.user.id } })
  if (!deleted.count) throw new HttpError(404, 'Session not found')
  await audit(session.user, {
    action: 'SESSION_REVOKE', entityType: 'SESSION', entityId: id,
    diff: { revoked: true, current: id === session.id },
  }, req)
  return { ok: true, current: id === session.id }
}

export async function revokeOtherProfileSessions(session: CurrentSession, req: Request) {
  const deleted = await revokeUserSessions(session.user.id, session.id)
  await audit(session.user, {
    action: 'SESSIONS_REVOKE', entityType: 'USER', entityId: session.user.id,
    diff: { revokedSessions: deleted.count, currentSessionPreserved: true },
  }, req)
  return { ok: true, revokedSessions: deleted.count }
}
