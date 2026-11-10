import { z } from 'zod'
import { audit } from '@/cms/lib/audit'
import { randomToken, sha256 } from '@/cms/lib/crypto'
import { db } from '@/cms/lib/db'
import { cmsOrigin, resetEmail, sendEmail } from '@/cms/lib/email'
import { isAllowedEmail, normalizeEmail } from '@/cms/lib/email-domain'
import { HttpError, clientIp, json, parseJson, route } from '@/cms/lib/http'
import { rateLimit } from '@/cms/lib/rate-limit'
import { notifyAdminResetRequested } from '@/cms/lib/security-alerts'

const Body = z.object({ email: z.string().max(320) })
const TTL_MS = 60 * 60 * 1000

// Always answers the same way so it cannot be used to discover accounts.
export const POST = route(async (req) => {
  const email = normalizeEmail((await parseJson(req, Body, 5_000)).email)
  const [byIp, byEmail] = await Promise.all([
    rateLimit(`forgot:ip:${clientIp(req) ?? 'unknown'}`, 10, 60 * 60),
    rateLimit(`forgot:email:${email}`, 3, 60 * 60),
  ])
  if (!byIp.ok) throw new HttpError(429, 'Too many requests. Try again later.')

  if (byEmail.ok && isAllowedEmail(email)) {
    const user = await db.user.findUnique({ where: { email }, select: { id: true, name: true, email: true, active: true, role: true } })
    if (user?.active) {
      const token = randomToken()
      await db.$transaction([
        db.passwordResetToken.deleteMany({ where: { userId: user.id } }),
        db.passwordResetToken.create({ data: { tokenHash: sha256(token), userId: user.id, expiresAt: new Date(Date.now() + TTL_MS) } }),
      ])
      await sendEmail(user.email, 'Reset your NEAR CMS password', resetEmail(user.name, `${cmsOrigin()}/admin/reset-password/${token}`))
      await audit(user, { action: 'PASSWORD_RESET_REQUESTED', entityType: 'AUTH', entityId: user.id }, req)
      if (user.role === 'ADMIN') await notifyAdminResetRequested(user, clientIp(req))
    }
  }
  return json({ ok: true })
})
