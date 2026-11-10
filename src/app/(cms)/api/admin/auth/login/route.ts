import { z } from 'zod'
import { audit, auditUnknownLoginFailure } from '@/cms/lib/audit'
import { db } from '@/cms/lib/db'
import { isAllowedEmail, normalizeEmail } from '@/cms/lib/email-domain'
import { HttpError, clientIp, json, parseJson, route, userAgent } from '@/cms/lib/http'
import { clearLoginFailures, loginAllowed, recordLoginFailure } from '@/cms/lib/login-guard'
import { dummyPasswordHash, verifyPassword } from '@/cms/lib/password'
import { notifyAccountUnderAttack, notifyNewSignInLocation, notifySignInSpike } from '@/cms/lib/security-alerts'
import { createSession } from '@/cms/lib/session'
import { sendVerificationEmail } from '@/cms/lib/email-verification'

const Body = z.object({ email: z.string().max(320), password: z.string().max(200) })

// One answer for every failure (no such account, address outside the allowed domains, wrong
// password, unconfirmed address), so the form never tells anyone which accounts exist.
const INVALID = 'Invalid email or password'
const TOO_MANY = 'Too many attempts. Wait a moment and try again.'

export const POST = route(async (req) => {
  const { email: rawEmail, password } = await parseJson(req, Body, 10_000)
  const email = normalizeEmail(rawEmail)
  const ip = clientIp(req)

  if (!(await loginAllowed(email, ip))) throw new HttpError(429, TOO_MANY)

  const user = isAllowedEmail(email)
    ? await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, passwordHash: true, active: true, emailVerifiedAt: true },
    })
    : null
  // Every path pays for one bcrypt comparison, so timing does not tell real accounts apart.
  const passwordOk = await verifyPassword(password, user?.active ? user.passwordHash : await dummyPasswordHash())

  if (!user?.active || !passwordOk) {
    const counts = await recordLoginFailure(email, ip)
    if (user) {
      await db.user.update({ where: { id: user.id }, data: { failedLogins: { increment: 1 } } })
      await audit({ id: user.id, email: user.email }, { action: 'LOGIN_FAILED', entityType: 'AUTH', entityId: user.id, entityTitle: email }, req)
      if (user.active) await notifyAccountUnderAttack(user, counts.emailFailures)
    } else {
      await auditUnknownLoginFailure(email, req)
    }
    await notifySignInSpike(counts.sitewideFailures)
    throw new HttpError(401, INVALID)
  }

  if (!user.emailVerifiedAt) {
    // Right password, unconfirmed address: email a confirmation link. The answer stays the same
    // as a wrong password, so it does not confirm the password to whoever typed it.
    await db.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } })
    await sendVerificationEmail(user)
    await audit({ id: user.id, email: user.email }, { action: 'LOGIN_UNVERIFIED', entityType: 'AUTH', entityId: user.id, entityTitle: email }, req)
    throw new HttpError(401, INVALID)
  }

  await clearLoginFailures(email, ip)
  await db.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() } })
  await createSession(user.id, { ip, userAgent: userAgent(req) })
  await notifyNewSignInLocation(user, ip, userAgent(req))
  await audit({ id: user.id, email: user.email }, { action: 'LOGIN', entityType: 'AUTH', entityId: user.id, entityTitle: email }, req)
  return json({ ok: true })
})
