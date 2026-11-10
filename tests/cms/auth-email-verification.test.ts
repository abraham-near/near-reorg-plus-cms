import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hasTestDb } from '../setup'
import { db } from '@/cms/lib/db'
import { sha256 } from '@/cms/lib/crypto'
import { sendEmail } from '@/cms/lib/email'
import { createSession } from '@/cms/lib/session'
import { hashPassword } from '@/cms/lib/password'
import { POST as LOGIN } from '@/app/(cms)/api/admin/auth/login/route'
import { POST as VERIFY } from '@/app/(cms)/api/admin/auth/verify-email/route'
import { POST as ACCEPT } from '@/app/(cms)/api/admin/auth/accept-invite/route'
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
const post = (path: string, body: unknown) => new Request(`${origin}/api/admin/auth/${path}`, {
  method: 'POST', headers: { host: 'localhost:3055', origin, 'content-type': 'application/json' }, body: JSON.stringify(body),
})
const PASSWORD = 'correct horse battery'
const linkToken = () => String(vi.mocked(sendEmail).mock.calls.at(-1)?.[2]).match(/verify-email\/([^"\s<]+)/)?.[1]

describe.skipIf(!hasTestDb)('email confirmation', () => {
  const prefix = `verify-${randomUUID().slice(0, 8)}`
  const email = `${prefix}@near.foundation`
  let userId: string
  let passwordHash: string

  beforeEach(async () => {
    vi.clearAllMocks()
    passwordHash ??= await hashPassword(PASSWORD)
    userId = (await db.user.create({ data: { email, name: 'New Admin', role: 'ADMIN', passwordHash }, select: { id: true } })).id
  })
  afterEach(async () => {
    await db.auditLog.deleteMany({ where: { OR: [{ userId }, { entityTitle: { startsWith: prefix } }] } })
    await db.rateLimit.deleteMany({ where: { OR: [{ key: { contains: prefix } }, { key: { contains: userId } }, { key: { startsWith: 'login:' } }, { key: { startsWith: 'verify:ip:' } }, { key: { startsWith: 'invite:ip:' } }, { key: { startsWith: 'reset:ip:' } }] } })
    await db.invitation.deleteMany({ where: { email: { startsWith: prefix } } })
    await db.user.deleteMany({ where: { email: { startsWith: prefix } } })
  })

  it('refuses sign-in for an unconfirmed account and emails a hashed single-use link', async () => {
    const response = await LOGIN(post('login', { email, password: PASSWORD }), undefined)
    // Same answer as a wrong password, so it never confirms the password to whoever typed it.
    expect(response.status).toBe(401)
    expect((await response.json()).error).toBe('Invalid email or password')
    expect(createSession).not.toHaveBeenCalled()
    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect(vi.mocked(sendEmail).mock.calls[0][0]).toBe(email)
    const token = linkToken()!
    const stored = await db.emailVerificationToken.findFirstOrThrow({ where: { userId } })
    expect(stored.tokenHash).toBe(sha256(token))
    expect(stored.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(24 * 60 * 60 * 1000)
  })

  it('sends nothing for a wrong password', async () => {
    expect((await LOGIN(post('login', { email, password: 'wrong password!!' }), undefined)).status).toBe(401)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('confirms once, then allows sign-in', async () => {
    await LOGIN(post('login', { email, password: PASSWORD }), undefined)
    const token = linkToken()!
    expect((await VERIFY(post('verify-email', { token }), undefined)).status).toBe(200)
    expect((await db.user.findUniqueOrThrow({ where: { id: userId } })).emailVerifiedAt).toBeInstanceOf(Date)
    expect((await VERIFY(post('verify-email', { token }), undefined)).status).toBe(400)
    expect((await LOGIN(post('login', { email, password: PASSWORD }), undefined)).status).toBe(200)
    expect(createSession).toHaveBeenCalledTimes(1)
  })

  it('invalidates the previous link when a new one is sent, and caps emails at 3 per hour', async () => {
    await LOGIN(post('login', { email, password: PASSWORD }), undefined)
    const first = linkToken()!
    for (let i = 0; i < 3; i++) await LOGIN(post('login', { email, password: PASSWORD }), undefined)
    expect(sendEmail).toHaveBeenCalledTimes(3)
    expect((await VERIFY(post('verify-email', { token: first }), undefined)).status).toBe(400)
    expect((await VERIFY(post('verify-email', { token: linkToken()! }), undefined)).status).toBe(200)
  })

  it('rejects expired links', async () => {
    const token = `expired-${randomUUID()}`
    await db.emailVerificationToken.create({ data: { userId, tokenHash: sha256(token), expiresAt: new Date(Date.now() - 1000) } })
    expect((await VERIFY(post('verify-email', { token }), undefined)).status).toBe(400)
    expect((await db.user.findUniqueOrThrow({ where: { id: userId } })).emailVerifiedAt).toBeNull()
  })

  it('treats an accepted invitation as a confirmed address', async () => {
    const token = `invite-${randomUUID()}`
    const invited = `${prefix}-invited@near.org`
    await db.invitation.create({ data: { email: invited, name: 'Invited', tokenHash: sha256(token), expiresAt: new Date(Date.now() + 60_000) } })
    expect((await ACCEPT(post('accept-invite', { token, password: PASSWORD }), undefined)).status).toBe(200)
    expect((await db.user.findUniqueOrThrow({ where: { email: invited } })).emailVerifiedAt).toBeInstanceOf(Date)
  })

  it('treats a completed password reset as a confirmed address', async () => {
    const token = `reset-${randomUUID()}`
    await db.passwordResetToken.create({ data: { userId, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 60_000) } })
    expect((await RESET(post('reset-password', { token, password: PASSWORD }), undefined)).status).toBe(200)
    expect((await db.user.findUniqueOrThrow({ where: { id: userId } })).emailVerifiedAt).toBeInstanceOf(Date)
  })
})
