import { randomUUID } from 'node:crypto'
import type { Prisma, Role } from '@/generated/prisma/client'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { SESSION_COOKIE, revokeUserSessions, type CurrentSession } from '@/cms/lib/session'

const auth = vi.hoisted(() => ({ session: null as CurrentSession | null }))
vi.mock('@/cms/lib/session', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/cms/lib/session')>()
  return {
    ...original,
    getSession: vi.fn(async () => auth.session),
    revokeUserSessions: vi.fn(original.revokeUserSessions),
  }
})

import { GET as getProfile, PATCH as patchProfile } from '@/app/(cms)/api/admin/profile/route'
import { POST as changePassword } from '@/app/(cms)/api/admin/profile/password/route'
import { GET as getSessions, DELETE as revokeOthers } from '@/app/(cms)/api/admin/sessions/route'
import { DELETE as revokeSession } from '@/app/(cms)/api/admin/sessions/[id]/route'
import { db } from '@/cms/lib/db'
import { hashPassword, verifyPassword } from '@/cms/lib/password'
import { changeProfilePassword } from '@/cms/lib/people/profile'

const prefix = `people-profile-${randomUUID()}`
const userId = `${prefix}-user`
const foreignUserId = `${prefix}-foreign`
const currentId = `${prefix}-current`
const otherId = `${prefix}-other`
const foreignSessionId = `${prefix}-foreign-session`
const currentPassword = 'current-password-1234'
const newPassword = 'replacement-password-1234'
let passwordHash: string

function request(method: string, path: string, body?: unknown, origin = 'http://localhost:3000') {
  return new Request(`http://localhost:3000${path}`, {
    method,
    headers: { host: 'localhost:3000', origin, 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}

const endpoints = [
  { name: 'GET profile', call: () => getProfile(request('GET', '/api/admin/profile'), undefined) },
  { name: 'PATCH profile', call: () => patchProfile(request('PATCH', '/api/admin/profile', { name: 'New name' }), undefined) },
  { name: 'POST password', call: () => changePassword(request('POST', '/api/admin/profile/password', { currentPassword, newPassword }), undefined) },
  { name: 'GET sessions', call: () => getSessions(request('GET', '/api/admin/sessions'), undefined) },
  { name: 'DELETE other sessions', call: () => revokeOthers(request('DELETE', '/api/admin/sessions'), undefined) },
  { name: 'DELETE session', call: () => revokeSession(request('DELETE', `/api/admin/sessions/${otherId}`), { params: Promise.resolve({ id: otherId }) }) },
]

describe('profile endpoint authentication', () => {
  beforeEach(() => { auth.session = null })

  it.each(endpoints)('rejects anonymous $name', async ({ call }) => {
    const response = await call()
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Not signed in' })
  })

  it.each([
    { name: 'PATCH profile', call: () => patchProfile(request('PATCH', '/api/admin/profile', { name: 'Name' }, 'https://attacker.example'), undefined) },
    { name: 'POST password', call: () => changePassword(request('POST', '/api/admin/profile/password', { currentPassword, newPassword }, 'https://attacker.example'), undefined) },
    { name: 'DELETE other sessions', call: () => revokeOthers(request('DELETE', '/api/admin/sessions', {}, 'https://attacker.example'), undefined) },
    { name: 'DELETE session', call: () => revokeSession(request('DELETE', `/api/admin/sessions/${otherId}`, {}, 'https://attacker.example'), { params: Promise.resolve({ id: otherId }) }) },
  ])('blocks cross-site $name', async ({ call }) => {
    const response = await call()
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'Cross-site request blocked' })
  })
})

describe.skipIf(!process.env.TEST_DATABASE_URL)('profile and sessions database security', () => {
  async function cleanup() {
    await db.auditLog.deleteMany({ where: { userId: { in: [userId, foreignUserId] } } })
    await db.rateLimit.deleteMany({ where: { key: `profile:password:${userId}` } })
    await db.user.deleteMany({ where: { id: { in: [userId, foreignUserId] } } })
  }

  beforeAll(async () => {
    passwordHash = await hashPassword(currentPassword)
  })

  beforeEach(async () => {
    await cleanup()
    await db.user.createMany({ data: [
      { id: userId, email: `${prefix}@near.org`, name: 'Profile test', passwordHash, role: 'ADMIN' },
      { id: foreignUserId, email: `${prefix}-foreign@near.org`, name: 'Other user', passwordHash, role: 'PUBLISHER' },
    ] })
    await db.session.createMany({ data: [
      { id: currentId, userId, tokenHash: `${prefix}-token-1`, expiresAt: new Date(Date.now() + 60 * 60 * 1000), ip: '127.0.0.1', userAgent: 'Profile test browser' },
      { id: otherId, userId, tokenHash: `${prefix}-token-2`, expiresAt: new Date(Date.now() + 60 * 60 * 1000), ip: '127.0.0.2', userAgent: 'Other browser' },
      { id: `${prefix}-expired`, userId, tokenHash: `${prefix}-token-3`, expiresAt: new Date(Date.now() - 60 * 1000) },
      { id: `${prefix}-absolute-expired`, userId, tokenHash: `${prefix}-token-4`, expiresAt: new Date(Date.now() + 60 * 60 * 1000), createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
      { id: foreignSessionId, userId: foreignUserId, tokenHash: `${prefix}-token-5`, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    ] })
    auth.session = { id: currentId, user: { id: userId, email: `${prefix}@near.org`, name: 'Profile test', role: 'ADMIN' } }
  })

  afterAll(async () => {
    await cleanup()
    auth.session = null
  })

  for (const role of ['ADMIN', 'PUBLISHER'] satisfies Role[]) {
    it.each(endpoints)(`allows ${role} to manage their own $name`, async ({ call }) => {
      auth.session!.user.role = role
      await db.user.update({ where: { id: userId }, data: { role } })
      const response = await call()
      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toContain('no-store')
    })
  }

  it('returns only public profile fields', async () => {
    const response = await getProfile(request('GET', '/api/admin/profile'), undefined)
    expect(await response.json()).toEqual(auth.session!.user)
  })

  it('updates only the current name and audits its diff', async () => {
    const response = await patchProfile(request('PATCH', '/api/admin/profile', { name: '  Updated name  ' }), undefined)
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ id: userId, name: 'Updated name' })
    const entry = await db.auditLog.findFirst({ where: { userId, action: 'UPDATE' }, select: { diff: true } })
    expect(entry?.diff).toEqual({ name: { from: 'Profile test', to: 'Updated name' } })
  })

  it.each([
    { name: '' },
    { name: '   ' },
    { name: 'N'.repeat(101) },
    { name: 'Name', role: 'ADMIN' },
    { name: 'Name', userId: foreignUserId },
    { currentPassword, newPassword },
  ])('rejects invalid or additional profile fields %j', async (body) => {
    const response = await patchProfile(request('PATCH', '/api/admin/profile', body), undefined)
    expect(response.status).toBe(400)
  })

  it('limits profile body size', async () => {
    const response = await patchProfile(request('PATCH', '/api/admin/profile', { name: 'N'.repeat(2_000) }), undefined)
    expect(response.status).toBe(413)
  })

  it('changes the password, revokes all other sessions, and never audits credentials', async () => {
    const response = await changePassword(request('POST', '/api/admin/profile/password', { currentPassword, newPassword }), undefined)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true, revokedSessions: 3 })
    const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { passwordHash: true } })
    expect(await verifyPassword(newPassword, user.passwordHash)).toBe(true)
    expect(await verifyPassword(currentPassword, user.passwordHash)).toBe(false)
    expect(await db.session.findMany({ where: { userId }, select: { id: true } })).toEqual([{ id: currentId }])
    expect(await db.session.count({ where: { userId: foreignUserId } })).toBe(1)
    const audit = await db.auditLog.findFirstOrThrow({ where: { userId, action: 'PASSWORD_CHANGE' }, select: { diff: true } })
    expect(audit.diff).toEqual({ passwordChanged: true, revokedSessions: 3, revokedApiTokens: 0 })
    expect(JSON.stringify(audit)).not.toMatch(/current-password|replacement-password|passwordHash|tokenHash/)
  })

  it('rejects an incorrect current password and leaves sessions and credentials intact', async () => {
    const response = await changePassword(request('POST', '/api/admin/profile/password', { currentPassword: 'incorrect-password', newPassword }), undefined)
    expect(response.status).toBe(400)
    expect(await db.session.count({ where: { userId } })).toBe(4)
    expect((await db.user.findUniqueOrThrow({ where: { id: userId }, select: { passwordHash: true } })).passwordHash).toBe(passwordHash)
    expect(await db.auditLog.count({ where: { userId, action: 'PASSWORD_CHANGE_FAILED' } })).toBe(1)
  })

  it.each(['short', 'x'.repeat(201)])('applies the shared new password policy', async (value) => {
    const response = await changePassword(request('POST', '/api/admin/profile/password', { currentPassword, newPassword: value }), undefined)
    expect(response.status).toBe(400)
    expect(await db.session.count({ where: { userId } })).toBe(4)
  })

  it('rejects additional password fields and oversized bodies', async () => {
    const additional = await changePassword(request('POST', '/api/admin/profile/password', { currentPassword, newPassword, userId: foreignUserId }), undefined)
    expect(additional.status).toBe(400)
    const oversized = await changePassword(request('POST', '/api/admin/profile/password', { currentPassword: 'x'.repeat(5_000), newPassword }), undefined)
    expect(oversized.status).toBe(413)
    expect(await db.session.count({ where: { userId } })).toBe(4)
  })

  it('rolls back the password if session revocation fails', async () => {
    vi.mocked(revokeUserSessions).mockImplementationOnce(() =>
      db.session.delete({ where: { id: `${prefix}-missing-session` } }) as unknown as Prisma.PrismaPromise<Prisma.BatchPayload>,
    )
    const response = await changePassword(request('POST', '/api/admin/profile/password', { currentPassword, newPassword }), undefined)
    expect(response.status).toBe(409)
    expect((await db.user.findUniqueOrThrow({ where: { id: userId }, select: { passwordHash: true } })).passwordHash).toBe(passwordHash)
    expect(await db.session.count({ where: { userId } })).toBe(4)
    expect(await db.auditLog.count({ where: { userId, action: 'PASSWORD_CHANGE' } })).toBe(0)
  })

  it('rate limits current-password guesses', async () => {
    await db.rateLimit.create({ data: { key: `profile:password:${userId}`, count: 5, resetAt: new Date(Date.now() + 60_000) } })
    const response = await changePassword(request('POST', '/api/admin/profile/password', { currentPassword, newPassword }), undefined)
    expect(response.status).toBe(429)
    expect(await db.session.count({ where: { userId } })).toBe(4)
  })

  it('does not overwrite a password changed by a concurrent request', async () => {
    const responses = await Promise.all([
      changePassword(request('POST', '/api/admin/profile/password', { currentPassword, newPassword }), undefined),
      changePassword(request('POST', '/api/admin/profile/password', { currentPassword, newPassword: 'another-replacement-1234' }), undefined),
    ])
    // One wins; the other is refused either way: 409 when both read the old hash, 400 when it reads after the
    // winner committed (its current password is no longer valid). It never overwrites the winner.
    const statuses = responses.map((response) => response.status).sort()
    expect([[200, 400], [200, 409]]).toContainEqual(statuses)
    expect(await db.auditLog.count({ where: { userId, action: 'PASSWORD_CHANGE' } })).toBe(1)
    expect(await db.session.findMany({ where: { userId }, select: { id: true } })).toEqual([{ id: currentId }])
  })

  it('keeps only the winning session when different sessions change the password concurrently', async () => {
    const sessions = [auth.session!, { ...auth.session!, id: otherId }]
    const results = await Promise.allSettled(sessions.map((session, index) => changeProfilePassword(
      session,
      { currentPassword, newPassword: `${newPassword}-${index}` },
      request('POST', '/api/admin/profile/password'),
    )))
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1)
    const winner = results.findIndex((result) => result.status === 'fulfilled')
    const loser = results.find((result) => result.status === 'rejected')
    expect(loser).toMatchObject({ status: 'rejected', reason: { status: 409 } })
    expect(await db.session.findMany({ where: { userId }, select: { id: true } })).toEqual([{ id: sessions[winner].id }])
    const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { passwordHash: true } })
    expect(await verifyPassword(`${newPassword}-${winner}`, user.passwordHash)).toBe(true)
    expect(await db.auditLog.count({ where: { userId, action: 'PASSWORD_CHANGE' } })).toBe(1)
  })

  it.each(['revoked', 'expired', 'absolute-expired'])('rejects a password update from a session %s after authentication', async (state) => {
    if (state === 'revoked') await db.session.delete({ where: { id: currentId } })
    if (state === 'expired') await db.session.update({ where: { id: currentId }, data: { expiresAt: new Date(Date.now() - 60_000) } })
    if (state === 'absolute-expired') await db.session.update({ where: { id: currentId }, data: { createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1_000) } })
    const response = await changePassword(request('POST', '/api/admin/profile/password', { currentPassword, newPassword }), undefined)
    expect(response.status).toBe(409)
    expect((await db.user.findUniqueOrThrow({ where: { id: userId }, select: { passwordHash: true } })).passwordHash).toBe(passwordHash)
    expect(await db.session.count({ where: { id: otherId } })).toBe(1)
    expect(await db.auditLog.count({ where: { userId, action: 'PASSWORD_CHANGE' } })).toBe(0)
  })

  it('lists only active owned session metadata and marks the current session', async () => {
    const response = await getSessions(request('GET', '/api/admin/sessions'), undefined)
    const body = await response.json()
    expect(body.sessions).toHaveLength(2)
    expect(body.sessions.find((session: { id: string }) => session.id === currentId)).toMatchObject({ current: true, ip: '127.0.0.1', userAgent: 'Profile test browser' })
    expect(body.sessions.find((session: { id: string }) => session.id === otherId)).toMatchObject({ current: false })
    for (const session of body.sessions) {
      expect(Object.keys(session).sort()).toEqual(['createdAt', 'current', 'id', 'ip', 'lastSeenAt', 'userAgent'])
    }
    expect(JSON.stringify(body)).not.toContain('token')
  })

  it('prevents revoking another account session', async () => {
    const response = await revokeSession(request('DELETE', `/api/admin/sessions/${foreignSessionId}`), { params: Promise.resolve({ id: foreignSessionId }) })
    expect(response.status).toBe(404)
    expect(await db.session.count({ where: { id: foreignSessionId } })).toBe(1)
  })

  it('revokes the current session when explicitly requested', async () => {
    const response = await revokeSession(request('DELETE', `/api/admin/sessions/${currentId}`), { params: Promise.resolve({ id: currentId }) })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true, current: true })
    expect(response.headers.get('set-cookie')).toContain(`${SESSION_COOKIE}=;`)
    expect(await db.session.count({ where: { id: currentId } })).toBe(0)
    expect(await db.auditLog.count({ where: { userId, action: 'SESSION_REVOKE', entityId: currentId } })).toBe(1)
  })

  it('revokes other sessions while preserving the current and foreign sessions', async () => {
    const response = await revokeOthers(request('DELETE', '/api/admin/sessions'), undefined)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true, revokedSessions: 3 })
    expect(await db.session.findMany({ where: { userId }, select: { id: true } })).toEqual([{ id: currentId }])
    expect(await db.session.count({ where: { id: foreignSessionId } })).toBe(1)
    expect(await db.auditLog.count({ where: { userId, action: 'SESSIONS_REVOKE' } })).toBe(1)
  })

  it('rejects mutation bodies that try to change the session owner', async () => {
    const response = await revokeOthers(request('DELETE', '/api/admin/sessions', { userId: foreignUserId }), undefined)
    expect(response.status).toBe(400)
    expect(await db.session.count({ where: { userId: foreignUserId } })).toBe(1)
  })
})
