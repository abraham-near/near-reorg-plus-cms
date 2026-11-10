import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CurrentSession } from '@/cms/lib/session'

const auth = vi.hoisted(() => ({ session: null as CurrentSession | null }))
vi.mock('@/cms/lib/session', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/cms/lib/session')>()),
  getSession: vi.fn(async () => auth.session),
}))

import { parseBearer, resolveTokenActor } from '@/cms/lib/api-tokens/auth'
import { BEARER_RE, TOKEN_RE } from '@/cms/lib/api-tokens/format'
import { revokeUserApiTokens } from '@/cms/lib/api-tokens/revoke'
import { requireActor } from '@/cms/lib/auth'
import { randomToken, sha256 } from '@/cms/lib/crypto'
import { db } from '@/cms/lib/db'
import { json, route } from '@/cms/lib/http'
import { PERMISSIONS, TOKEN_CAP, can, canActor } from '@/cms/lib/permissions'
import { proxy } from '@/proxy'
import { hasTestDb } from '../setup'

const token = () => `ncms_${randomToken(32)}`
const origin = 'http://localhost:3000'
function request(method: string, headers: Record<string, string> = {}) {
  return new Request(`${origin}/api/admin/posts`, { method, headers: { host: 'localhost:3000', ...headers } })
}

describe('token capability', () => {
  it('never includes deletes, lock takeover or anything outside the blog', () => {
    for (const permission of ['post:delete', 'media:delete', 'lock:override', 'user:manage', 'apitoken:manage', 'audit:read'] as const) {
      expect(TOKEN_CAP.has(permission), permission).toBe(false)
    }
  })

  it('narrows even an admin', () => {
    const admin = { role: 'ADMIN' as const, via: 'token' as const }
    expect(PERMISSIONS.filter((p) => canActor(admin, p))).toEqual([...TOKEN_CAP].sort((a, b) => PERMISSIONS.indexOf(a) - PERMISSIONS.indexOf(b)))
    expect(canActor({ role: 'ADMIN' }, 'post:delete')).toBe(true)
  })

  it('lets both roles hold tokens', () => {
    expect((['ADMIN', 'PUBLISHER'] as const).filter((role) => can(role, 'apitoken:manage'))).toEqual(['ADMIN', 'PUBLISHER'])
  })
})

describe('bearer parsing', () => {
  it('accepts only our token shape', () => {
    const t = token()
    expect(TOKEN_RE.test(t)).toBe(true)
    expect(parseBearer(request('GET', { authorization: `Bearer ${t}` }))).toBe(t)
    expect(parseBearer(request('GET', { authorization: `Basic ${Buffer.from('review:pw').toString('base64')}` }))).toBeNull()
    expect(parseBearer(request('GET', { authorization: 'Bearer some-cron-secret-value' }))).toBeNull()
    expect(parseBearer(request('GET', { authorization: `Bearer ${t}x` }))).toBeNull()
    expect(BEARER_RE.test(`bearer ${t}`)).toBe(false)
  })
})

describe('route() and API tokens', () => {
  const plain = route(async () => json({ ok: true }))
  const opted = route(async () => json({ ok: true }), { token: true })

  it('refuses tokens on handlers that did not opt in', async () => {
    const res = await plain(request('GET', { authorization: `Bearer ${token()}` }), undefined)
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'API tokens are not accepted on this endpoint' })
  })

  it('skips the same-origin check only for an ncms_ bearer on opted-in handlers', async () => {
    expect((await opted(request('POST', { authorization: `Bearer ${token()}` }), undefined)).status).toBe(200)
    expect((await opted(request('POST'), undefined)).status).toBe(403)
    // Cached Basic credentials (review copies) must not bypass CSRF protection.
    expect((await opted(request('POST', { authorization: `Basic ${Buffer.from('review:pw').toString('base64')}` }), undefined)).status).toBe(403)
    expect((await opted(request('POST', { authorization: 'Bearer cron-secret' }), undefined)).status).toBe(403)
  })
})

describe('proxy and API tokens', () => {
  const call = (path: string, headers: Record<string, string> = {}) => proxy(new NextRequest(`${origin}${path}`, { headers }))
  const bearer = () => ({ authorization: `Bearer ${token()}` })

  it('lets a token reach the admin API but never admin pages', async () => {
    expect((await call('/api/admin/posts', bearer())).status).toBe(200)
    expect((await call('/api/admin/posts')).status).toBe(401)
    const page = await call('/admin/posts', bearer())
    expect(page.status).toBe(307)
    expect(page.headers.get('location')).toContain('/admin/login')
  })

  it('rejects malformed tokens early', async () => {
    expect((await call('/api/admin/posts', { authorization: 'Bearer ncms_short' })).status).toBe(401)
  })
})

describe.skipIf(!hasTestDb)('token actor (database)', () => {
  const prefix = `api-token-auth-${randomUUID()}`
  const userId = `${prefix}-user`
  const inactiveId = `${prefix}-inactive`
  const secret = token()
  const inactiveSecret = token()
  let tokenId: string
  const bearer = (t = secret, extra: Record<string, string> = {}) => request('GET', { authorization: `Bearer ${t}`, 'x-real-ip': `10.${Math.floor(Math.random() * 250)}.0.1`, ...extra })

  beforeAll(async () => {
    await db.user.createMany({ data: [
      { id: userId, email: `${prefix}@near.org`, name: 'Token Publisher', passwordHash: 'x', role: 'PUBLISHER', emailVerifiedAt: new Date() },
      { id: inactiveId, email: `${prefix}-e@near.org`, name: 'Deactivated Publisher', passwordHash: 'x', role: 'PUBLISHER', active: false, emailVerifiedAt: new Date() },
    ] })
    tokenId = (await db.apiToken.create({ data: { name: 'test', prefix: secret.slice(0, 12), tokenHash: sha256(secret), userId, expiresAt: new Date(Date.now() + 86_400_000) } })).id
    await db.apiToken.create({ data: { name: 'inactive', prefix: inactiveSecret.slice(0, 12), tokenHash: sha256(inactiveSecret), userId: inactiveId, expiresAt: new Date(Date.now() + 86_400_000) } })
  })
  beforeEach(() => { process.env.CMS_API_TOKENS_ENABLED = 'true'; auth.session = null })
  afterEach(() => { delete process.env.CMS_API_TOKENS_ENABLED })
  afterAll(async () => {
    await db.auditLog.deleteMany({ where: { userId: { in: [userId, inactiveId] } } })
    await db.rateLimit.deleteMany({ where: { key: { startsWith: 'apitoken' } } })
    await db.user.deleteMany({ where: { id: { in: [userId, inactiveId] } } })
  })

  it('resolves the owner, marked as a token actor, and records use', async () => {
    const actor = await resolveTokenActor(bearer())
    expect(actor.user).toMatchObject({ id: userId, role: 'PUBLISHER', via: 'token', apiTokenId: tokenId })
    expect((await db.apiToken.findUniqueOrThrow({ where: { id: tokenId } })).lastUsedAt).not.toBeNull()
  })

  it('is off unless CMS_API_TOKENS_ENABLED=true', async () => {
    delete process.env.CMS_API_TOKENS_ENABLED
    await expect(resolveTokenActor(bearer())).rejects.toMatchObject({ status: 403 })
    process.env.CMS_API_TOKENS_ENABLED = 'false'
    await expect(resolveTokenActor(bearer())).rejects.toMatchObject({ status: 403 })
  })

  it('applies the token cap and refuses cookie + token together', async () => {
    await expect(requireActor(bearer(), 'post:write')).resolves.toMatchObject({ user: { via: 'token' } })
    await expect(requireActor(bearer(), 'post:delete')).rejects.toMatchObject({ status: 403, message: 'Not available through API tokens' })
    await expect(requireActor(bearer(secret, { cookie: 'near_cms=abc' }), 'post:write')).rejects.toMatchObject({ status: 400 })
  })

  it('refuses unknown, expired, revoked and deactivated-owner tokens', async () => {
    await expect(resolveTokenActor(bearer(token()))).rejects.toMatchObject({ status: 401 })
    await expect(resolveTokenActor(bearer(inactiveSecret))).rejects.toMatchObject({ status: 401 })
    await db.apiToken.update({ where: { id: tokenId }, data: { expiresAt: new Date(Date.now() - 1000) } })
    await expect(resolveTokenActor(bearer())).rejects.toMatchObject({ status: 401 })
    await db.apiToken.update({ where: { id: tokenId }, data: { expiresAt: new Date(Date.now() + 86_400_000) } })
    expect((await revokeUserApiTokens(userId, 'USER')).count).toBe(1)
    await expect(resolveTokenActor(bearer())).rejects.toMatchObject({ status: 401 })
    const rejected = await db.auditLog.findMany({ where: { userId, action: 'API_TOKEN_REJECTED' } })
    expect(rejected.length).toBeGreaterThanOrEqual(2)
    await db.apiToken.update({ where: { id: tokenId }, data: { revokedAt: null, revokeReason: null } })
  })

  it('blocks an IP after repeated bad tokens', async () => {
    const ip = { 'x-real-ip': '192.0.2.77' }
    for (let i = 0; i < 20; i++) await expect(resolveTokenActor(request('GET', { authorization: `Bearer ${token()}`, ...ip }))).rejects.toMatchObject({ status: 401 })
    await expect(resolveTokenActor(request('GET', { authorization: `Bearer ${secret}`, ...ip }))).rejects.toMatchObject({ status: 429 })
  })

  it('revokes tokens when the role changes', async () => {
    const { updateUser } = await import('@/cms/lib/people/users')
    const admin = { id: `${prefix}-admin`, email: `${prefix}-admin@near.org`, name: 'Admin', role: 'ADMIN' as const }
    await db.user.create({ data: { ...admin, passwordHash: 'x' } })
    try {
      await updateUser(admin, userId, { role: 'ADMIN' }, request('PATCH', { origin }))
      expect(await db.apiToken.findUniqueOrThrow({ where: { id: tokenId } })).toMatchObject({ revokeReason: 'ROLE_CHANGE' })
      expect(await db.auditLog.count({ where: { action: 'API_TOKENS_REVOKED', entityId: userId } })).toBe(1)
    } finally {
      await db.auditLog.deleteMany({ where: { userId: admin.id } })
      await db.user.delete({ where: { id: admin.id } })
    }
  })
})
