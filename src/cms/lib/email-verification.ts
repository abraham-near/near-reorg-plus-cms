import 'server-only'
import { randomToken, sha256 } from './crypto'
import { db } from './db'
import { cmsOrigin, sendEmail, verifyEmail } from './email'
import { rateLimit } from './rate-limit'

const TTL_MS = 24 * 60 * 60 * 1000

/**
 * Emails a fresh single-use confirmation link and invalidates earlier ones. Called only after the
 * password was verified, so it cannot be used to spam an address. Capped at 3 emails per hour.
 */
export async function sendVerificationEmail(user: { id: string; email: string; name: string }) {
  if (!(await rateLimit(`verify:send:${user.id}`, 3, 60 * 60)).ok) return { ok: false as const, limited: true }
  const token = randomToken()
  await db.$transaction([
    db.emailVerificationToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
    db.emailVerificationToken.create({ data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + TTL_MS) } }),
  ])
  try {
    const delivery = await sendEmail(user.email, 'Confirm your NEAR CMS email', verifyEmail(user.name, `${cmsOrigin()}/admin/verify-email/${token}`))
    return { ok: delivery.ok, limited: false }
  } catch {
    return { ok: false as const, limited: false }
  }
}

/** Looks up a link without consuming it (for rendering the confirmation page). */
export async function findVerificationToken(token: string) {
  if (token.length > 100) return null
  const record = await db.emailVerificationToken.findUnique({
    where: { tokenHash: sha256(token) },
    select: { id: true, expiresAt: true, usedAt: true, user: { select: { id: true, email: true, name: true, active: true, emailVerifiedAt: true } } },
  })
  if (!record || record.usedAt || record.expiresAt < new Date() || !record.user.active) return null
  return record
}

/** Consumes the link and marks the address as confirmed. Returns the user, or null when invalid. */
export async function confirmEmail(token: string) {
  const record = await findVerificationToken(token)
  if (!record) return null
  const now = new Date()
  // Conditional update: two concurrent clicks cannot both consume the token.
  const used = await db.emailVerificationToken.updateMany({ where: { id: record.id, usedAt: null }, data: { usedAt: now } })
  if (!used.count) return null
  await db.user.update({ where: { id: record.user.id }, data: { emailVerifiedAt: record.user.emailVerifiedAt ?? now } })
  return record.user
}
