import { randomUUID } from 'node:crypto'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { hasTestDb } from '../setup'
import { db } from '@/cms/lib/db'
import { sha256 } from '@/cms/lib/crypto'
import { sendEmail } from '@/cms/lib/email'
import { hashPassword } from '@/cms/lib/password'
import { purgeAuditNoise } from '@/cms/lib/audit'
import { cooldownSeconds, LOGIN_LIMITS } from '@/cms/lib/login-guard'
import { POST as LOGIN } from '@/app/(cms)/api/admin/auth/login/route'
import { POST as FORGOT } from '@/app/(cms)/api/admin/auth/forgot-password/route'
import { POST as RESET } from '@/app/(cms)/api/admin/auth/reset-password/route'

vi.mock('@/cms/lib/session', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/cms/lib/session')>()
  return { ...original, createSession: vi.fn(async () => undefined), revokeUserSessions: vi.fn(async () => undefined) }
})
vi.mock('@/cms/lib/email', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/cms/lib/email')>()
  return { ...original, sendEmail: vi.fn(async () => ({ ok: true as const })) }
})

const origin = 'http://localhost:3055'
const post = (path: string, body: unknown, ip: string) => new Request(`${origin}/api/admin/auth/${path}`, {
  method: 'POST',
  headers: { host: 'localhost:3055', origin, 'content-type': 'application/json', 'x-real-ip': ip, 'user-agent': 'vitest' },
  body: JSON.stringify(body),
})
const PASSWORD = 'correct horse battery'
const OWNER_IP = '198.51.100.10'
const ATTACKER_IP = '203.0.113.66'

const sentTo = () => vi.mocked(sendEmail).mock.calls.map(([to, subject]) => ({ to, subject: String(subject) }))
// Counters are written and compared with the database clock (see lib/cms/rate-limit.ts), so the
// helpers below use now() as well.
/** Ends any wait in progress, as if the cooldown had run out. */
const endWaits = () => db.$executeRaw`UPDATE "RateLimit" SET "resetAt" = now() - interval '1 second' WHERE "key" LIKE 'login:wait%'`
const setCounter = (key: string, count: number, seconds = 900) => db.$executeRaw`
  INSERT INTO "RateLimit" ("key", "count", "resetAt") VALUES (${key}, ${count}, now() + make_interval(secs => ${seconds}))
  ON CONFLICT ("key") DO UPDATE SET "count" = ${count}, "resetAt" = now() + make_interval(secs => ${seconds})`

describe('cooldown schedule', () => {
  it('doubles from 1 second and stops at 30', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 20].map(cooldownSeconds)).toEqual([1, 2, 4, 8, 16, 30, 30, 30])
  })
})

describe.skipIf(!hasTestDb)('sign-in hardening', () => {
  const prefix = `harden-${randomUUID().slice(0, 8)}`
  const email = `${prefix}@near.foundation`
  const adminEmail = `${prefix}-admin@near.foundation`
  let passwordHash: string
  let userId: string

  const login = (body: { email: string; password: string }, ip = OWNER_IP) => LOGIN(post('login', body, ip), undefined)
  const answer = async (response: Response) => ({ status: response.status, error: (await response.json()).error })

  beforeAll(async () => {
    passwordHash = await hashPassword(PASSWORD)
  })
  beforeEach(async () => {
    vi.clearAllMocks()
    await db.rateLimit.deleteMany({ where: { OR: [{ key: { startsWith: 'login:' } }, { key: { startsWith: 'notify:' } }, { key: { startsWith: 'forgot:' } }, { key: { startsWith: 'reset:' } }] } })
    userId = (await db.user.create({ data: { email, name: 'Owner', role: 'PUBLISHER', passwordHash, emailVerifiedAt: new Date() }, select: { id: true } })).id
    await db.user.create({ data: { email: adminEmail, name: 'Admin', role: 'ADMIN', passwordHash, emailVerifiedAt: new Date() } })
  })
  afterEach(async () => {
    await db.auditLog.deleteMany({ where: { OR: [{ entityTitle: { startsWith: prefix } }, { userEmail: { startsWith: prefix } }, { action: 'LOGIN_FAILED_UNKNOWN' }] } })
    await db.passwordResetToken.deleteMany({ where: { user: { email: { startsWith: prefix } } } })
    await db.user.deleteMany({ where: { email: { startsWith: prefix } } })
  })

  it('gives one answer for a wrong password, an unknown address, a foreign domain and an unconfirmed address', async () => {
    await db.user.create({ data: { email: `${prefix}-new@near.foundation`, name: 'New', role: 'PUBLISHER', passwordHash } })
    const cases = [
      { email, password: 'wrong password!!' },
      { email: `${prefix}-nobody@near.foundation`, password: PASSWORD },
      { email: `${prefix}@gmail.com`, password: PASSWORD },
      { email: `${prefix}-new@near.foundation`, password: PASSWORD },
    ]
    for (const [i, body] of cases.entries()) {
      expect(await answer(await login(body, `198.51.100.${100 + i}`))).toEqual({ status: 401, error: 'Invalid email or password' })
    }
    // The unconfirmed address with the right password still gets its confirmation link, by email only.
    expect(sentTo()).toEqual([{ to: `${prefix}-new@near.foundation`, subject: 'Confirm your NEAR CMS email' }])
  })

  it('makes the same pair wait after a failure, and clears the wait on success', async () => {
    expect((await login({ email, password: 'wrong password!!' })).status).toBe(401)
    expect(await answer(await login({ email, password: PASSWORD }))).toEqual({ status: 429, error: 'Too many attempts. Wait a moment and try again.' })
    await endWaits()
    expect((await login({ email, password: PASSWORD })).status).toBe(200)
    expect(await db.rateLimit.count({ where: { key: { contains: `${OWNER_IP}:${email}` } } })).toBe(0)
  })

  it('never locks the owner out because someone else keeps failing on their address', async () => {
    for (let i = 0; i < LOGIN_LIMITS.perPair.limit; i++) {
      await endWaits()
      expect((await login({ email, password: `wrong-${i}` }, ATTACKER_IP)).status).toBe(401)
    }
    await endWaits()
    // The attacker's pair is blocked, even with the right password...
    expect((await login({ email, password: PASSWORD }, ATTACKER_IP)).status).toBe(429)
    // ...while the owner, from their own IP, signs in normally and the account carries no lock.
    expect((await login({ email, password: PASSWORD }, OWNER_IP)).status).toBe(200)
    const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { lockedUntil: true, failedLogins: true } })
    expect(user).toEqual({ lockedUntil: null, failedLogins: 0 })
  }, 20_000) // a dozen bcrypt checks at cost 12: slow on a busy machine

  it('slows down every IP on an address under a distributed attack', async () => {
    await setCounter(`login:fail-email:${email}`, LOGIN_LIMITS.perEmail.slowAfter)
    expect((await login({ email, password: 'wrong password!!' }, '192.0.2.1')).status).toBe(401)
    expect((await login({ email, password: PASSWORD }, '192.0.2.2')).status).toBe(429)
    await endWaits()
    expect((await login({ email, password: PASSWORD }, '192.0.2.2')).status).toBe(200)
  })

  it('emails the owner once a day when their account is under attack', async () => {
    await setCounter(`login:fail-email:${email}`, LOGIN_LIMITS.perEmail.notifyAt - 1)
    await login({ email, password: 'wrong password!!' }, '192.0.2.10')
    await login({ email, password: 'wrong password!!' }, '192.0.2.11')
    expect(sentTo()).toEqual([{ to: email, subject: 'Failed sign-in attempts on your NEAR CMS account' }])
  })

  it('emails the admins once an hour when failures spike across the site', async () => {
    await setCounter('login:fail-all', LOGIN_LIMITS.sitewide.limit, 3600)
    await login({ email: `${prefix}-x@near.foundation`, password: 'nope' }, '192.0.2.20')
    await login({ email: `${prefix}-y@near.foundation`, password: 'nope' }, '192.0.2.21')
    const spikes = sentTo().filter((m) => m.subject.startsWith('Unusual number of failed sign-ins'))
    expect(spikes).toHaveLength(1)
    expect(spikes[0].to).toContain(adminEmail)
    expect(spikes[0].to).not.toContain(email)
  })

  it('emails on a sign-in from a new IP, but not on the first sign-in or a known IP', async () => {
    expect((await login({ email, password: PASSWORD }, OWNER_IP)).status).toBe(200)
    expect((await login({ email, password: PASSWORD }, OWNER_IP)).status).toBe(200)
    expect(sentTo()).toEqual([])
    expect((await login({ email, password: PASSWORD }, '192.0.2.30')).status).toBe(200)
    expect(sentTo()).toEqual([{ to: email, subject: 'New sign-in to your NEAR CMS account' }])
  })

  it('groups failures on unknown addresses into one row per IP per hour, with up to 10 samples', async () => {
    for (let i = 0; i < 12; i++) await login({ email: `${prefix}-guess${i}@near.foundation`, password: 'nope' }, '192.0.2.40')
    await login({ email: `${prefix}@evil.example`, password: 'nope' }, '192.0.2.40')
    const rows = await db.auditLog.findMany({ where: { action: 'LOGIN_FAILED_UNKNOWN', ip: '192.0.2.40' } })
    expect(rows).toHaveLength(1)
    const diff = rows[0].diff as { count: number; emails: string[] }
    expect(diff.count).toBe(13)
    expect(diff.emails).toHaveLength(10)
    expect(diff.emails[0]).toBe(`${prefix}-guess0@near.foundation`)
    // Failures on a real account keep one row each.
    await login({ email, password: 'wrong password!!' }, '192.0.2.41')
    expect(await db.auditLog.count({ where: { action: 'LOGIN_FAILED', entityId: userId } })).toBe(1)
  })

  it('tells every admin when a reset is requested for an admin account', async () => {
    await FORGOT(post('forgot-password', { email: adminEmail }, '192.0.2.50'), undefined)
    await FORGOT(post('forgot-password', { email: adminEmail }, '192.0.2.51'), undefined)
    const alerts = sentTo().filter((m) => m.subject.startsWith('Password reset requested for admin'))
    expect(alerts).toHaveLength(1)
    expect(alerts[0].to).toContain(adminEmail)
    // A non-admin reset only sends the reset link itself.
    vi.clearAllMocks()
    await FORGOT(post('forgot-password', { email }, '192.0.2.52'), undefined)
    expect(sentTo()).toEqual([{ to: email, subject: 'Reset your NEAR CMS password' }])
  })

  it('emails the owner after a completed password reset', async () => {
    const token = `reset-${randomUUID()}`
    await db.passwordResetToken.create({ data: { userId, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 60_000) } })
    expect((await RESET(post('reset-password', { token, password: 'a brand new long password' }, OWNER_IP), undefined)).status).toBe(200)
    expect(sentTo()).toEqual([{ to: email, subject: 'Your NEAR CMS password was changed' }])
  })

  it('purges only old noise from the audit log', async () => {
    const old = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000)
    const recent = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    const row = (action: string, createdAt: Date, diff?: object) =>
      db.auditLog.create({ data: { action, entityType: 'AUTH', entityTitle: `${prefix}-${action}`, createdAt, ...(diff ? { diff } : {}) }, select: { id: true } })
    const keep = await Promise.all([
      row('LOGIN', old), row('PUBLISH', old), row('LOGIN_FAILED', recent),
      row('SCHEDULE_REVALIDATE', old, { count: 2 }),
    ])
    const drop = await Promise.all([
      row('LOGIN_FAILED', old), row('LOGIN_FAILED_UNKNOWN', old, { count: 4, emails: [] }),
      row('SCHEDULE_REVALIDATE', old, { count: 0 }),
    ])
    await purgeAuditNoise()
    const left = new Set((await db.auditLog.findMany({ where: { entityTitle: { startsWith: prefix } }, select: { id: true } })).map((r) => r.id))
    for (const { id } of keep) expect(left.has(id)).toBe(true)
    for (const { id } of drop) expect(left.has(id)).toBe(false)
    await db.auditLog.deleteMany({ where: { id: { in: keep.map((r) => r.id) } } })
  })
})
