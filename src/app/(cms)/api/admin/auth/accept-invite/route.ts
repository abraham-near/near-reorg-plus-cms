import { z } from 'zod'
import { audit } from '@/cms/lib/audit'
import { sha256 } from '@/cms/lib/crypto'
import { db } from '@/cms/lib/db'
import { isAllowedEmail } from '@/cms/lib/email-domain'
import { HttpError, clientIp, json, parseJson, route, userAgent } from '@/cms/lib/http'
import { hashPassword, passwordSchema } from '@/cms/lib/password'
import { rateLimit } from '@/cms/lib/rate-limit'
import { createSession } from '@/cms/lib/session'

const Body = z.object({ token: z.string().min(20).max(100), password: passwordSchema })

export const POST = route(async (req) => {
  const ip = clientIp(req)
  if (!(await rateLimit(`invite:ip:${ip ?? 'unknown'}`, 20, 60 * 60)).ok) throw new HttpError(429, 'Too many attempts. Try again later.')
  const { token, password } = await parseJson(req, Body, 5_000)

  const invite = await db.invitation.findUnique({ where: { tokenHash: sha256(token) } })
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) throw new HttpError(400, 'This invitation is invalid or has expired')
  if (!isAllowedEmail(invite.email)) throw new HttpError(403, 'Only NEAR email addresses can hold an account')
  if (await db.user.findUnique({ where: { email: invite.email }, select: { id: true } })) {
    throw new HttpError(409, 'An account with this email already exists')
  }

  const passwordHash = await hashPassword(password)
  const user = await db.$transaction(async (tx) => {
    await tx.invitation.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } })
    return tx.user.create({
      // The token arrived by email, so accepting it confirms the address.
      data: { email: invite.email, name: invite.name, role: invite.role, passwordHash, emailVerifiedAt: new Date() },
      select: { id: true, email: true },
    })
  })
  await createSession(user.id, { ip, userAgent: userAgent(req) })
  await audit(user, { action: 'INVITE_ACCEPTED', entityType: 'USER', entityId: user.id, entityTitle: user.email }, req)
  return json({ ok: true })
})
