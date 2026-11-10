import 'server-only'
import { db } from './db'
import {
  accountUnderAttackEmail, adminResetRequestedEmail, cmsOrigin, newSignInEmail, passwordChangedEmail, sendEmail, signInSpikeEmail,
} from './email'
import { LOGIN_LIMITS } from './login-guard'
import { rateLimit } from './rate-limit'

type Person = { id: string; email: string; name: string }

const HOUR = 60 * 60
const DAY = 24 * HOUR

/** True the first time in each window; later calls in the same window are dropped. */
const firstInWindow = async (key: string, windowSeconds: number) => (await rateLimit(`notify:${key}`, 1, windowSeconds)).ok

/** Alerts must never break the request that triggered them. */
async function quietly(label: string, send: () => Promise<unknown>) {
  try {
    await send()
  } catch (error) {
    console.error('[cms] security alert failed', label, error)
  }
}

const activeAdminEmails = async () =>
  (await db.user.findMany({ where: { role: 'ADMIN', active: true }, select: { email: true } })).map((u) => u.email)

/** Many failed sign-ins on one real account. At most one email a day per account. */
export const notifyAccountUnderAttack = (user: Person, failures: number) =>
  quietly('account-under-attack', async () => {
    if (failures < LOGIN_LIMITS.perEmail.notifyAt || !(await firstInWindow(`attack:${user.id}`, DAY))) return
    await sendEmail(user.email, 'Failed sign-in attempts on your NEAR CMS account',
      accountUnderAttackEmail(user.name, failures, `${cmsOrigin()}/admin/forgot-password`))
  })

/** Sent after every completed password reset. */
export const notifyPasswordChanged = (user: Omit<Person, 'id'>, ip: string | null) =>
  quietly('password-changed', () =>
    sendEmail(user.email, 'Your NEAR CMS password was changed', passwordChangedEmail(user.name, ip, new Date())))

/**
 * A sign-in from an IP the account has never signed in from. Call before writing the LOGIN audit
 * row. Skipped on the very first sign-in, when every IP is new.
 */
export const notifyNewSignInLocation = (user: Person, ip: string | null, userAgent: string | null) =>
  quietly('new-sign-in', async () => {
    if (!ip) return
    const [seenHere, signedInBefore] = await Promise.all([
      db.auditLog.findFirst({ where: { action: 'LOGIN', userId: user.id, ip }, select: { id: true } }),
      db.auditLog.findFirst({ where: { action: 'LOGIN', userId: user.id }, select: { id: true } }),
    ])
    if (seenHere || !signedInBefore) return
    await sendEmail(user.email, 'New sign-in to your NEAR CMS account', newSignInEmail(user.name, ip, userAgent, new Date()))
  })

/** A reset was requested for an ADMIN account. Every admin hears about it, once an hour per account. */
export const notifyAdminResetRequested = (target: Person, ip: string | null) =>
  quietly('admin-reset', async () => {
    if (!(await firstInWindow(`admin-reset:${target.id}`, HOUR))) return
    const to = await activeAdminEmails()
    if (to.length) {
      await sendEmail(to, `Password reset requested for admin ${target.email}`,
        adminResetRequestedEmail(target.email, ip, new Date(), `${cmsOrigin()}/admin/audit-log`))
    }
  })

/** Failed sign-ins across the site passed the hourly threshold. At most one email an hour. */
export const notifySignInSpike = (failures: number) =>
  quietly('sign-in-spike', async () => {
    const { limit, windowSeconds } = LOGIN_LIMITS.sitewide
    if (failures <= limit || !(await firstInWindow('sign-in-spike', HOUR))) return
    const to = await activeAdminEmails()
    if (to.length) {
      await sendEmail(to, 'Unusual number of failed sign-ins on the NEAR CMS',
        signInSpikeEmail(limit, windowSeconds / 60, `${cmsOrigin()}/admin/audit-log`))
    }
  })
