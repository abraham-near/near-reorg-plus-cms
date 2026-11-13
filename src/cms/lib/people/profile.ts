import 'server-only'
import { Prisma } from '@/generated/prisma/client'
import { z } from 'zod'
import { revokeUserApiTokens } from '@/cms/lib/api-tokens/revoke'
import { revokeUserOAuthGrants } from '@/cms/lib/oauth/flow'
import { audit, diffFields } from '@/cms/lib/audit'
import { db } from '@/cms/lib/db'
import { HttpError } from '@/cms/lib/http'
import { hashPassword, passwordSchema, verifyPassword } from '@/cms/lib/password'
import { rateLimit } from '@/cms/lib/rate-limit'
import { revokeUserSessions, type CurrentSession } from '@/cms/lib/session'

export const profileSelect = { id: true, name: true, email: true, role: true } as const

export const profileSchema = z.object({ name: z.string().trim().min(1).max(100) }).strict()
export const profilePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: passwordSchema,
}).strict()

export async function getProfile(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: profileSelect })
  if (!user) throw new HttpError(404, 'Profile not found')
  return user
}

export async function updateProfile(session: CurrentSession, name: string, req: Request) {
  const before = await getProfile(session.user.id)
  const user = await db.user.update({
    where: { id: session.user.id },
    data: { name },
    select: profileSelect,
  })
  await audit(session.user, {
    action: 'UPDATE',
    entityType: 'USER',
    entityId: user.id,
    entityTitle: user.email,
    diff: diffFields({ name: before.name }, { name: user.name }),
  }, req)
  return user
}

export async function changeProfilePassword(
  session: CurrentSession,
  input: z.infer<typeof profilePasswordSchema>,
  req: Request,
) {
  if (!(await rateLimit(`profile:password:${session.user.id}`, 5, 15 * 60)).ok) {
    throw new HttpError(429, 'Too many password attempts. Try again in 15 minutes.')
  }
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true, active: true },
  })
  if (!user?.active) throw new HttpError(401, 'Not signed in')
  if (!(await verifyPassword(input.currentPassword, user.passwordHash))) {
    await audit(session.user, {
      action: 'PASSWORD_CHANGE_FAILED', entityType: 'AUTH', entityId: session.user.id,
    }, req)
    throw new HttpError(400, 'Current password is incorrect')
  }

  const passwordHash = await hashPassword(input.newPassword)
  const now = new Date()
  let revoked: { count: number }
  let tokensRevoked = 0
  try {
    // The conditional update and revocation commit together; a stale request rolls both back.
    const result = await db.$transaction([
      db.user.update({
        where: {
          id: session.user.id,
          active: true,
          passwordHash: user.passwordHash,
          sessions: { some: {
            id: session.id,
            expiresAt: { gt: now },
            createdAt: { gt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) },
          } },
        },
        data: { passwordHash, passwordChangedAt: now },
        select: { id: true },
      }),
      revokeUserSessions(session.user.id, session.id),
      revokeUserApiTokens(session.user.id, 'PASSWORD_CHANGE'),
      revokeUserOAuthGrants(session.user.id, 'PASSWORD_CHANGE'),
    ])
    revoked = result[1]
    tokensRevoked = result[2].count
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new HttpError(409, 'Your credentials or session changed. Sign in and try again.')
    }
    throw error
  }
  await audit(session.user, {
    action: 'PASSWORD_CHANGE', entityType: 'AUTH', entityId: session.user.id,
    diff: { passwordChanged: true, revokedSessions: revoked.count, revokedApiTokens: tokensRevoked },
  }, req)
  return { ok: true, revokedSessions: revoked.count }
}
