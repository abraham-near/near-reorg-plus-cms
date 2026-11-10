import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Role } from '@/generated/prisma/client'
import { db } from '@/cms/lib/db'
import { sha256 } from '@/cms/lib/crypto'
import { getSession, revokeUserSessions, type SessionUser } from '@/cms/lib/session'
import { sendEmail } from '@/cms/lib/email'
import { assertAccountChange, deleteUser, updateUser } from '@/cms/lib/people/users'
import { GET } from '@/app/(cms)/api/admin/users/route'
import { PATCH, DELETE } from '@/app/(cms)/api/admin/users/[id]/route'
import { POST } from '@/app/(cms)/api/admin/users/invite/route'
import { DELETE as REVOKE } from '@/app/(cms)/api/admin/users/invitations/[id]/route'

vi.mock('@/cms/lib/session', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/cms/lib/session')>()
  return { ...original, getSession: vi.fn(), revokeUserSessions: vi.fn(original.revokeUserSessions) }
})
vi.mock('@/cms/lib/email', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/cms/lib/email')>()
  return { ...original, sendEmail: vi.fn(async () => ({ ok: true as const })) }
})

const origin = 'http://localhost:3054'
function request(path: string, method = 'GET', body?: unknown) {
  return new Request(`${origin}/api/admin/${path}`, {
    method, headers: { host: 'localhost:3054', origin, 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}
const context = (id = 'target') => ({ params: Promise.resolve({ id }) })
const actor: SessionUser = { id: 'actor', email: 'actor@near.org', name: 'Actor', role: 'ADMIN' }
function signIn(user: SessionUser | null) {
  vi.mocked(getSession).mockResolvedValue(user ? { id: 'current-session', user } : null)
}
const endpoints = [
  { name: 'GET users', call: () => GET(request('users'), undefined) },
  { name: 'POST invite', call: () => POST(request('users/invite', 'POST', { name: 'Invitee', email: 'person@near.org' }), undefined) },
  { name: 'PATCH user', call: () => PATCH(request('users/target', 'PATCH', { name: 'Renamed' }), context()) },
  { name: 'DELETE user', call: () => DELETE(request('users/target', 'DELETE', {}), context()) },
  { name: 'DELETE invitation', call: () => REVOKE(request('users/invitations/target', 'DELETE', {}), context()) },
]

describe('people users authorization and request validation', () => {
  beforeEach(() => vi.clearAllMocks())
  for (const endpoint of endpoints) {
    it.each([null, 'PUBLISHER'] as const)(`${endpoint.name} rejects %s`, async (role) => {
      signIn(role ? { ...actor, role } : null)
      const response = await endpoint.call()
      expect(response.status).toBe(role ? 403 : 401)
    })
  }
  it.each(['a@gmail.com', 'a@near.org.evil.com', 'a@sub.near.org'])('rejects invite domain %s server-side', async (email) => {
    signIn(actor)
    const response = await POST(request('users/invite', 'POST', { name: 'Person', email }), undefined)
    expect(response.status).toBe(400)
    expect(sendEmail).not.toHaveBeenCalled()
  })
  it('rejects password or email edits through user management', async () => {
    signIn(actor)
    for (const body of [{ password: 'another-password' }, { email: 'replacement@near.org' }]) {
      expect((await PATCH(request('users/target', 'PATCH', body), context())).status).toBe(400)
    }
  })
  it('caps request bodies and validates list queries', async () => {
    signIn(actor)
    expect((await POST(request('users/invite', 'POST', { name: 'x'.repeat(6_000) }), undefined)).status).toBe(413)
    expect((await GET(request('users?page=-1'), undefined)).status).toBe(400)
  })
  it('blocks a cross-site mutation before touching data', async () => {
    signIn(actor)
    const req = request('users/target', 'DELETE')
    req.headers.set('origin', 'https://attacker.example')
    expect((await DELETE(req, context())).status).toBe(403)
  })
})

describe('last administrator invariants', () => {
  it.each([null, { role: 'PUBLISHER' as Role, active: true }, { role: 'ADMIN' as Role, active: false }])('prevents self-removal: %j', (next) => {
    expect(() => assertAccountChange('self', { id: 'self', role: 'ADMIN', active: true }, next, 2)).toThrow('own account')
  })
  it.each([null, { role: 'PUBLISHER' as Role, active: true }, { role: 'ADMIN' as Role, active: false }])('preserves the last active admin: %j', (next) => {
    expect(() => assertAccountChange('actor', { id: 'last', role: 'ADMIN', active: true }, next, 1)).toThrow('last active administrator')
  })
  it('permits a name-only edit and removal of an inactive admin', () => {
    expect(() => assertAccountChange('self', { id: 'self', role: 'ADMIN', active: true }, { role: 'ADMIN', active: true }, 1)).not.toThrow()
    expect(() => assertAccountChange('actor', { id: 'inactive', role: 'ADMIN', active: false }, null, 1)).not.toThrow()
  })
})

describe.skipIf(!process.env.TEST_DATABASE_URL)('people users database integration', () => {
  let prefix: string
  let admin: SessionUser
  let target: SessionUser
  const userIds: string[] = []
  const postIds: string[] = []
  beforeEach(async () => {
    vi.clearAllMocks()
    prefix = `people-${randomUUID()}`
    admin = await db.user.create({ data: { email: `${prefix}-admin@near.org`, name: 'Admin', role: 'ADMIN', passwordHash: 'test-only-hash' }, select: { id: true, email: true, name: true, role: true } })
    target = await db.user.create({ data: { email: `${prefix}-target@near.org`, name: 'Target', role: 'PUBLISHER', passwordHash: 'test-only-hash' }, select: { id: true, email: true, name: true, role: true } })
    userIds.push(admin.id, target.id)
    signIn(admin)
  })
  afterEach(async () => {
    await db.post.deleteMany({ where: { id: { in: postIds.splice(0) } } })
    await db.auditLog.deleteMany({ where: { OR: [{ userId: { in: userIds } }, { entityTitle: { startsWith: prefix } }] } })
    await db.rateLimit.deleteMany({ where: { OR: [{ key: { contains: prefix } }, ...userIds.map((id) => ({ key: `people:invite:actor:${id}` }))] } })
    await db.invitation.deleteMany({ where: { email: { startsWith: prefix } } })
    await db.user.deleteMany({ where: { id: { in: userIds.splice(0) } } })
  })

  it('ADMIN can list safe paginated user and invitation metadata', async () => {
    const response = await GET(request(`users?q=${prefix}`), undefined)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.total).toBe(2)
    expect(data.users).toHaveLength(2)
    expect(JSON.stringify(data)).not.toMatch(/passwordHash|tokenHash|failedLogins|lockedUntil/)
    expect(response.headers.get('cache-control')).toContain('no-store')
  })

  it('clamps out-of-range user and invitation pages independently, including empty results', async () => {
    await db.invitation.createMany({ data: Array.from({ length: 26 }, (_, index) => ({
      email: `${prefix}-page-${index}@near.org`, name: 'Invitee', tokenHash: sha256(randomUUID()),
      expiresAt: new Date(Date.now() + 60_000),
    })) })
    const response = await GET(request(`users?q=${prefix}&page=10000&invitePage=10000`), undefined)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.total).toBe(2)
    expect(body.query.page).toBe(1)
    expect(body.users).toHaveLength(2)
    expect(body.invitationTotal).toBeGreaterThanOrEqual(26)
    expect(body.query.invitePage).toBe(Math.ceil(body.invitationTotal / body.pageSize))
    expect(body.invitations.length).toBeGreaterThan(0)
    expect(body.invitations.length).toBeLessThanOrEqual(body.pageSize)

    const empty = await GET(request(`users?q=${prefix}-missing&page=10000`), undefined)
    expect(await empty.json()).toMatchObject({ total: 0, users: [], query: { page: 1 } })
  })

  it('ADMIN invites a PUBLISHER, hashes the token, expires in 48h, and revokes earlier pending invitations', async () => {
    const body = { name: '<New Person>', email: `${prefix}-invite@near.org`, role: 'PUBLISHER' }
    const before = Date.now()
    const response = await POST(request('users/invite', 'POST', body), undefined)
    expect(response.status).toBe(201)
    const result = await response.json()
    const html = vi.mocked(sendEmail).mock.calls[0][2]
    expect(html).toContain('&lt;New Person&gt;')
    const token = html.match(/accept-invite\/([^"\s<]+)/)?.[1]
    expect(token).toBeTruthy()
    const stored = await db.invitation.findUniqueOrThrow({ where: { id: result.invitation.id } })
    expect(stored.tokenHash).toBe(sha256(token!))
    expect(JSON.stringify(stored)).not.toContain(token!)
    expect(JSON.stringify(result)).not.toMatch(/tokenHash|accept-invite/)
    expect(stored.expiresAt.getTime() - before).toBeGreaterThanOrEqual(48 * 60 * 60 * 1000)
    expect(stored.expiresAt.getTime() - before).toBeLessThan(48 * 60 * 60 * 1000 + 5000)
    expect((await POST(request('users/invite', 'POST', body), undefined)).status).toBe(201)
    expect(await db.invitation.findUnique({ where: { id: stored.id } })).toBeNull()
    expect(await db.invitation.count({ where: { email: body.email, acceptedAt: null } })).toBe(1)
    const pending = await db.invitation.findFirstOrThrow({ where: { email: body.email } })
    expect((await REVOKE(request(`users/invitations/${pending.id}`, 'DELETE', {}), context(pending.id))).status).toBe(200)
    expect(await db.invitation.count({ where: { email: body.email } })).toBe(0)
  })

  it('rejects invitations for existing accounts', async () => {
    expect((await POST(request('users/invite', 'POST', { email: target.email, name: 'Existing' }), undefined)).status).toBe(409)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('revokes all sessions on role change and deactivation and audits the diffs', async () => {
    await db.session.create({ data: { userId: target.id, tokenHash: sha256(randomUUID()), expiresAt: new Date(Date.now() + 60_000) } })
    const response = await PATCH(request(`users/${target.id}`, 'PATCH', { role: 'ADMIN' }), context(target.id))
    expect(response.status).toBe(200)
    expect(revokeUserSessions).toHaveBeenCalledWith(target.id)
    expect(await db.session.count({ where: { userId: target.id } })).toBe(0)
    const change = await db.auditLog.findFirstOrThrow({ where: { entityId: target.id, action: 'ROLE_CHANGE' } })
    expect(change.diff).toMatchObject({ role: { from: 'PUBLISHER', to: 'ADMIN' } })
    await db.session.create({ data: { userId: target.id, tokenHash: sha256(randomUUID()), expiresAt: new Date(Date.now() + 60_000) } })
    expect((await PATCH(request(`users/${target.id}`, 'PATCH', { active: false }), context(target.id))).status).toBe(200)
    expect(await db.session.count({ where: { userId: target.id } })).toBe(0)
    expect(await db.auditLog.count({ where: { entityId: target.id, action: 'DEACTIVATE' } })).toBe(1)
  })

  it('rejects self-demotion, deactivation and deletion in real handlers', async () => {
    for (const body of [{ role: 'PUBLISHER' }, { active: false }]) {
      expect((await PATCH(request(`users/${admin.id}`, 'PATCH', body), context(admin.id))).status).toBe(400)
    }
    expect((await DELETE(request(`users/${admin.id}`, 'DELETE', {}), context(admin.id))).status).toBe(400)
  })

  it.each(['role', 'deactivate', 'delete'] as const)('serializes concurrent admin %s removals and rechecks the acting account', async (operation) => {
    await db.user.update({ where: { id: target.id }, data: { role: 'ADMIN' } })
    const anotherAdmin = { ...target, role: 'ADMIN' as const }
    const remove = (user: SessionUser, id: string) => operation === 'delete'
      ? deleteUser(user, id, request('users', 'DELETE'))
      : updateUser(user, id, operation === 'role' ? { role: 'PUBLISHER' } : { active: false }, request('users', 'PATCH'))
    const results = await Promise.allSettled([
      remove(admin, target.id),
      remove(anotherAdmin, admin.id),
    ])
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect(results.find((result) => result.status === 'rejected')).toMatchObject({ reason: { status: 403 } })
    expect(await db.user.count({ where: { id: { in: [admin.id, target.id] }, active: true, role: 'ADMIN' } })).toBe(1)
  })

  it('does not revoke sessions for a name-only or unchanged role update', async () => {
    const session = await db.session.create({ data: { userId: target.id, tokenHash: sha256(randomUUID()), expiresAt: new Date(Date.now() + 60_000) } })
    const response = await PATCH(request(`users/${target.id}`, 'PATCH', { name: 'Renamed', role: 'PUBLISHER' }), context(target.id))
    expect(response.status).toBe(200)
    expect(revokeUserSessions).not.toHaveBeenCalled()
    expect(await db.session.count({ where: { id: session.id } })).toBe(1)
    expect(await db.auditLog.findFirst({ where: { entityId: target.id, action: 'UPDATE' }, select: { diff: true } })).toEqual({ diff: { name: { from: 'Target', to: 'Renamed' } } })
  })

  it('normalizes invite emails and serializes simultaneous re-invitations', async () => {
    const email = `${prefix}-concurrent@near.org`
    const body = { name: 'Invitee', email: ` ${email.toUpperCase()} `, role: 'ADMIN' }
    const responses = await Promise.all([
      POST(request('users/invite', 'POST', body), undefined),
      POST(request('users/invite', 'POST', body), undefined),
    ])
    expect(responses.map((response) => response.status)).toEqual([201, 201])
    const invitations = await db.invitation.findMany({ where: { email }, select: { id: true, role: true } })
    expect(invitations).toHaveLength(1)
    expect(invitations[0].role).toBe('ADMIN')
    expect(vi.mocked(sendEmail).mock.calls.every(([to]) => to === email)).toBe(true)
    expect(await db.auditLog.count({ where: { entityTitle: email, action: 'INVITE_REVOKE' } })).toBe(1)
  })

  it.each(['rejected', 'unconfigured'] as const)('reports %s email delivery without losing the saved invitation', async (mode) => {
    if (mode === 'rejected') vi.mocked(sendEmail).mockRejectedValueOnce(new Error('Provider network failure'))
    else vi.mocked(sendEmail).mockResolvedValueOnce({ ok: false })
    const email = `${prefix}-delivery@near.org`
    const response = await POST(request('users/invite', 'POST', { name: 'Invitee', email }), undefined)
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.emailSent).toBe(false)
    expect(await db.invitation.count({ where: { id: body.invitation.id, email } })).toBe(1)
    expect(await db.auditLog.count({ where: { entityId: body.invitation.id, action: 'INVITE_EMAIL_NOT_SENT' } })).toBe(1)
    expect(JSON.stringify(body)).not.toMatch(/tokenHash|Provider network failure|accept-invite/)
  })

  it('lists only pending invitations and refuses revocation of accepted invitations', async () => {
    const now = new Date()
    const invitations = await Promise.all([
      db.invitation.create({ data: { email: `${prefix}-pending@near.org`, name: 'Pending', tokenHash: sha256(randomUUID()), expiresAt: new Date(Date.now() + 60_000) }, select: { id: true } }),
      db.invitation.create({ data: { email: `${prefix}-expired@near.org`, name: 'Expired', tokenHash: sha256(randomUUID()), expiresAt: new Date(Date.now() - 60_000) }, select: { id: true } }),
      db.invitation.create({ data: { email: `${prefix}-accepted@near.org`, name: 'Accepted', tokenHash: sha256(randomUUID()), expiresAt: new Date(Date.now() + 60_000), acceptedAt: now }, select: { id: true } }),
    ])
    const response = await GET(request('users'), undefined)
    const body = await response.json()
    expect(body.invitations.map((item: { id: string }) => item.id)).toContain(invitations[0].id)
    expect(body.invitations.map((item: { id: string }) => item.id)).not.toContain(invitations[1].id)
    expect(body.invitations.map((item: { id: string }) => item.id)).not.toContain(invitations[2].id)
    expect((await REVOKE(request(`users/invitations/${invitations[2].id}`, 'DELETE', {}), context(invitations[2].id))).status).toBe(409)
    expect(await db.invitation.count({ where: { id: invitations[2].id } })).toBe(1)
  })

  it('ADMIN deletes an account while retaining authored content', async () => {
    const post = await db.post.create({ data: { slug: prefix, title: 'Keep this post', authorId: target.id, lastEditedById: target.id }, select: { id: true } })
    postIds.push(post.id)
    await db.session.create({ data: { userId: target.id, tokenHash: sha256(randomUUID()), expiresAt: new Date(Date.now() + 60_000) } })
    expect((await DELETE(request(`users/${target.id}`, 'DELETE', {}), context(target.id))).status).toBe(200)
    expect(revokeUserSessions).toHaveBeenCalledWith(target.id)
    expect(await db.post.findUnique({ where: { id: post.id }, select: { authorId: true, lastEditedById: true } })).toEqual({ authorId: null, lastEditedById: null })
    expect(await db.session.count({ where: { userId: target.id } })).toBe(0)
    expect(await db.auditLog.count({ where: { entityId: target.id, action: 'DELETE' } })).toBe(1)
  })

  it('refuses an already demoted or inactive actor inside the transaction', async () => {
    await db.user.update({ where: { id: admin.id }, data: { active: false } })
    await expect(deleteUser(admin, target.id, request('users', 'DELETE'))).rejects.toMatchObject({ status: 403 })
    expect(await db.user.count({ where: { id: target.id } })).toBe(1)
  })
})
