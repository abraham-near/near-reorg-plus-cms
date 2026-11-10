import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CurrentSession } from '@/cms/lib/session'

const mocks = vi.hoisted(() => ({ session: null as CurrentSession | null, sendEmail: vi.fn(async () => ({ ok: true as const })) }))
vi.mock('@/cms/lib/session', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/cms/lib/session')>()), getSession: vi.fn(async () => mocks.session) }))
vi.mock('@/cms/lib/email', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/cms/lib/email')>()), sendEmail: mocks.sendEmail }))

import { DELETE as revokeAll, GET as list, POST as create } from '@/app/(cms)/api/admin/tokens/route'
import { DELETE as revoke } from '@/app/(cms)/api/admin/tokens/[id]/route'
import { GET as whoami } from '@/app/(cms)/api/admin/whoami/route'
import { TOKEN_RE } from '@/cms/lib/api-tokens/format'
import { sha256 } from '@/cms/lib/crypto'
import { db } from '@/cms/lib/db'
import { hashPassword } from '@/cms/lib/password'
import { hasTestDb } from '../setup'

describe.skipIf(!hasTestDb)('API token management (database)', () => {
  const prefix = `api-token-manage-${randomUUID()}`
  const password = 'publisher-password-1234'
  const people = {
    publisher: { id: `${prefix}-pub`, email: `${prefix}-pub@near.org`, name: 'Pub', role: 'PUBLISHER' as const },
    other: { id: `${prefix}-ot`, email: `${prefix}-ot@near.org`, name: 'Other', role: 'PUBLISHER' as const },
    admin: { id: `${prefix}-adm`, email: `${prefix}-adm@near.org`, name: 'Adm', role: 'ADMIN' as const },
  }
  const as = (who: keyof typeof people) => { mocks.session = { id: `${prefix}-session`, user: people[who] } }
  const req = (method: string, path: string, body?: unknown, headers: Record<string, string> = {}) => new Request(`http://localhost:3000${path}`, {
    method,
    headers: { host: 'localhost:3000', origin: 'http://localhost:3000', 'content-type': 'application/json', ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  const ctx = (id: string) => ({ params: Promise.resolve({ id }) })
  const mint = (name = 'claude-laptop') => create(req('POST', '/api/admin/tokens', { name, expiresInDays: 30, currentPassword: password }), undefined)

  beforeAll(async () => {
    const passwordHash = await hashPassword(password)
    for (const person of Object.values(people)) await db.user.create({ data: { ...person, passwordHash, emailVerifiedAt: new Date() } })
  })
  beforeEach(async () => {
    process.env.CMS_API_TOKENS_ENABLED = 'true'
    mocks.sendEmail.mockClear()
    await db.rateLimit.deleteMany({ where: { key: { startsWith: 'apitoken' } } })
    as('publisher')
  })
  afterAll(async () => {
    delete process.env.CMS_API_TOKENS_ENABLED
    const ids = Object.values(people).map((p) => p.id)
    await db.auditLog.deleteMany({ where: { userId: { in: ids } } })
    await db.user.deleteMany({ where: { id: { in: ids } } })
  })

  it('shows the token once, stores only its hash and emails the owner', async () => {
    const res = await mint()
    expect(res.status).toBe(201)
    const created = await res.json()
    expect(created.token).toMatch(TOKEN_RE)
    const row = await db.apiToken.findUniqueOrThrow({ where: { id: created.id } })
    expect(row.tokenHash).toBe(sha256(created.token))
    expect(JSON.stringify(row)).not.toContain(created.token)
    expect(row.prefix).toBe(created.token.slice(0, 12))
    expect(mocks.sendEmail).toHaveBeenCalledWith(people.publisher.email, expect.any(String), expect.not.stringContaining(created.token))
    const audit = await db.auditLog.findFirstOrThrow({ where: { entityId: created.id, action: 'API_TOKEN_CREATE' } })
    expect(JSON.stringify(audit)).not.toContain(created.token)
    const listed = await (await list(req('GET', '/api/admin/tokens'), undefined)).json()
    expect(JSON.stringify(listed)).not.toContain(created.token)
    expect(JSON.stringify(listed)).not.toContain(row.tokenHash)
  })

  it('needs the current password, a short expiry and the switch on', async () => {
    expect((await create(req('POST', '/api/admin/tokens', { name: 'x', expiresInDays: 30, currentPassword: 'wrong' }), undefined)).status).toBe(400)
    expect((await create(req('POST', '/api/admin/tokens', { name: 'x', expiresInDays: 365, currentPassword: password }), undefined)).status).toBe(400)
    delete process.env.CMS_API_TOKENS_ENABLED
    expect((await mint()).status).toBe(403)
  })

  it('caps active tokens at five', async () => {
    await db.apiToken.deleteMany({ where: { userId: people.publisher.id } })
    for (let i = 0; i < 5; i++) expect((await mint(`t${i}`)).status).toBe(201)
    expect((await mint('sixth')).status).toBe(409)
    expect((await revokeAll(req('DELETE', '/api/admin/tokens', {}), undefined)).status).toBe(200)
    expect(await db.apiToken.count({ where: { userId: people.publisher.id, revokedAt: null } })).toBe(0)
    expect((await mint('after')).status).toBe(201)
  })

  it('never lets a token manage tokens', async () => {
    const { token } = await (await mint('self')).json()
    mocks.session = null
    const bearer = { authorization: `Bearer ${token}` }
    expect((await list(req('GET', '/api/admin/tokens', undefined, bearer), undefined)).status).toBe(401)
    expect((await create(req('POST', '/api/admin/tokens', { name: 'x', expiresInDays: 7, currentPassword: password }, bearer), undefined)).status).toBe(401)
    expect((await whoami(req('GET', '/api/admin/whoami', undefined, bearer), undefined)).status).toBe(200)
  })

  it('lets the owner or an admin revoke, and tells the owner when an admin does', async () => {
    const { id, token } = await (await mint('to-revoke')).json()
    as('other')
    expect((await revoke(req('DELETE', `/api/admin/tokens/${id}`, {}), ctx(id))).status).toBe(404)
    as('admin')
    mocks.sendEmail.mockClear()
    expect((await revoke(req('DELETE', `/api/admin/tokens/${id}`, {}), ctx(id))).status).toBe(200)
    expect(await db.apiToken.findUniqueOrThrow({ where: { id } })).toMatchObject({ revokeReason: 'ADMIN', revokedById: people.admin.id })
    expect(mocks.sendEmail).toHaveBeenCalledWith(people.publisher.email, expect.any(String), expect.any(String))
    mocks.session = null
    expect((await whoami(req('GET', '/api/admin/whoami', undefined, { authorization: `Bearer ${token}` }), undefined)).status).toBe(401)
    // Listing only ever shows the caller's own tokens, whatever the query says.
    as('admin')
    const all = await (await list(req('GET', '/api/admin/tokens?scope=all'), undefined)).json()
    expect(all.tokens.some((t: { id: string }) => t.id === id)).toBe(false)
    as('other')
    const others = await (await list(req('GET', '/api/admin/tokens?scope=all'), undefined)).json()
    expect(others.tokens.some((t: { id: string }) => t.id === id)).toBe(false)
  })
})
