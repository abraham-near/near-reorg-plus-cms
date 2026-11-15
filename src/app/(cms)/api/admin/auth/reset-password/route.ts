import { z } from 'zod'
import { revokeUserApiTokens } from '@/cms/lib/api-tokens/revoke'
import { revokeUserOAuthGrants } from '@/cms/lib/oauth/flow'
import { audit } from '@/cms/lib/audit'
import { sha256 } from '@/cms/lib/crypto'
import { db } from '@/cms/lib/db'
import { HttpError, clientIp, json, parseJson, route } from '@/cms/lib/http'
import { hashPassword, passwordSchema } from '@/cms/lib/password'
import { rateLimit } from '@/cms/lib/rate-limit'
import { notifyPasswordChanged } from '@/cms/lib/security-alerts'
import { revokeUserSessions } from '@/cms/lib/session'

const Body = z.object({ token: z.string().min(20).max(100), password: passwordSchema })

export const POST = route(async (req) => {
  if (!(await rateLimit(`reset:ip:${clientIp(req) ?? 'unknown'}`, 20, 60 * 60)).ok) {
    throw new HttpError(429, 'Too many attempts. Try again later.')
  }
  const { token, password } = await parseJson(req, Body, 5_000)
  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash: sha256(token) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true, user: { select: { id: true, email: true, name: true, active: true, emailVerifiedAt: true } } },
  })
  if (!record || record.usedAt || record.expiresAt < new Date() || !record.user.active) {
    throw new HttpError(400, 'This reset link is invalid or has expired')
  }
  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data: {
        passwordHash: await hashPassword(password), passwordChangedAt: new Date(), failedLogins: 0, lockedUntil: null,
        // The reset link arrived by email, which confirms the address too.
        emailVerifiedAt: record.user.emailVerifiedAt ?? new Date(),
      },
    }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ])
  await revokeUserSessions(record.userId)
  const tokens = await revokeUserApiTokens(record.userId, 'PASSWORD_RESET')
  // Claude connections too: whoever reset the password must reconnect Claude.
  await revokeUserOAuthGrants(record.userId, 'PASSWORD_RESET')
  await audit({ id: record.user.id, email: record.user.email }, { action: 'PASSWORD_RESET', entityType: 'AUTH', entityId: record.userId, diff: { revokedApiTokens: tokens.count } }, req)
  await notifyPasswordChanged(record.user, clientIp(req))
  return json({ ok: true })
})
