import 'server-only'
import { cookies } from 'next/headers'
import { cache } from 'react'
import type { Role } from '@/generated/prisma/client'
import { randomToken, sha256 } from './crypto'
import { db } from './db'
import type { Via } from './permissions'

// `__Host-` pins the cookie to this exact host over HTTPS with Path=/ (no Domain), so a sibling
// subdomain cannot set or read it. Plain HTTP in local dev cannot use the prefix.
const SECURE = process.env.NODE_ENV === 'production'
export const SESSION_COOKIE = SECURE ? '__Host-near_cms' : 'near_cms'

const IDLE_MS = 12 * 60 * 60 * 1000 // signed out after 12 h without activity
const ABSOLUTE_MS = 14 * 24 * 60 * 60 * 1000 // and after 14 days regardless
const TOUCH_MS = 5 * 60 * 1000 // refresh lastSeenAt at most every 5 min

/** `via` and `apiTokenId` are set only when the request came through an API token (lib/cms/api-tokens). */
export type SessionUser = { id: string; email: string; name: string; role: Role; via?: Via; apiTokenId?: string | null }
export type CurrentSession = { id: string; user: SessionUser }

export async function createSession(userId: string, meta: { ip: string | null; userAgent: string | null }) {
  const token = randomToken()
  const now = Date.now()
  await db.session.create({
    data: {
      tokenHash: sha256(token),
      userId,
      expiresAt: new Date(now + IDLE_MS),
      ip: meta.ip,
      userAgent: meta.userAgent,
    },
  })
  ;(await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: SECURE,
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(ABSOLUTE_MS / 1000),
  })
}

/** Current session for this request, or null. Expired, revoked or deactivated sessions count as none. */
export const getSession = cache(async (): Promise<CurrentSession | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token || token.length > 100) return null
  const session = await db.session.findUnique({
    where: { tokenHash: sha256(token) },
    select: {
      id: true,
      expiresAt: true,
      createdAt: true,
      lastSeenAt: true,
      user: { select: { id: true, email: true, name: true, role: true, active: true } },
    },
  })
  const now = Date.now()
  if (!session) return null
  if (!session.user.active || session.expiresAt.getTime() < now || session.createdAt.getTime() + ABSOLUTE_MS < now) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {})
    return null
  }
  if (now - session.lastSeenAt.getTime() > TOUCH_MS) {
    const expiresAt = new Date(Math.min(now + IDLE_MS, session.createdAt.getTime() + ABSOLUTE_MS))
    await db.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date(now), expiresAt } }).catch(() => {})
  }
  const { id, email, name, role } = session.user
  return { id: session.id, user: { id, email, name, role } }
})

export async function destroyCurrentSession() {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (token) await db.session.deleteMany({ where: { tokenHash: sha256(token) } })
  jar.delete(SESSION_COOKIE)
}

/** Sign a user out everywhere (password change, role change, deactivation), optionally keeping one session. */
export const revokeUserSessions = (userId: string, exceptSessionId?: string) =>
  db.session.deleteMany({ where: { userId, ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}) } })

export const purgeExpiredSessions = () => db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } })
