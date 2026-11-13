import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ getSession: vi.fn(), safeFetch: vi.fn() }))
vi.mock('@/cms/lib/session', async (original) => ({ ...(await original<object>()), getSession: mocks.getSession }))
vi.mock('@/cms/lib/safe-fetch', async (original) => ({ ...(await original<object>()), safeFetch: mocks.safeFetch }))
// Route handlers run outside Next here: connection() (wait for the request) has nothing to wait for.
vi.mock('next/server', async (original) => ({ ...(await original<object>()), connection: async () => {} }))

const CLIENT_ID = 'https://claude.ai/oauth/mcp-oauth-client-metadata'
const REDIRECT = 'https://claude.ai/api/mcp/auth_callback'
const ORIGIN = 'http://localhost:3000'

describe.skipIf(!process.env.TEST_DATABASE_URL)('OAuth flow for Claude connectors (database)', async () => {
  process.env.CMS_MCP_ENABLED = 'true'
  process.env.CMS_ORIGIN = ORIGIN
  const { db } = await import('@/cms/lib/db')
  const { hashPassword } = await import('@/cms/lib/password')
  const { GET: authorize } = await import('@/app/(cms)/api/oauth/authorize/route')
  const { POST: token } = await import('@/app/(cms)/api/oauth/token/route')
  const { POST: revoke } = await import('@/app/(cms)/api/oauth/revoke/route')
  const { POST: consent } = await import('@/app/(cms)/api/oauth/consent/route')
  const { GET: asMetadata } = await import('@/app/(cms)/.well-known/oauth-authorization-server/route')
  const { GET: prMetadata } = await import('@/app/(cms)/.well-known/oauth-protected-resource/api/mcp/route')
  const { GET: whoami } = await import('@/app/(cms)/api/admin/whoami/route')
  const { approveAuthorization, revokeUserOAuthGrants } = await import('@/cms/lib/oauth/flow')
  const { resolveOAuthActor } = await import('@/cms/lib/oauth/actor')
  const { hmac } = await import('@/cms/lib/crypto')

  const prefix = `oauth-${randomUUID()}`
  let user: { id: string; email: string; name: string; role: 'PUBLISHER' }

  beforeAll(async () => {
    user = await db.user.create({ data: { email: `${prefix}@near.org`, name: 'Connector', role: 'PUBLISHER', passwordHash: await hashPassword('test-password-123') }, select: { id: true, email: true, name: true, role: true } }) as typeof user
  })
  afterAll(async () => {
    await db.user.delete({ where: { id: user.id } })
    await db.oAuthClient.deleteMany({ where: { clientId: CLIENT_ID } })
  })
  beforeEach(async () => {
    // Every test request comes from the same (unknown) address: start each test with a clean failure count.
    await db.rateLimit.deleteMany({ where: { key: { startsWith: 'oauth-' } } })
    mocks.safeFetch.mockReset()
    mocks.safeFetch.mockResolvedValue({ status: 200, headers: { 'cache-control': 'max-age=600' }, url: new URL(CLIENT_ID), body: Buffer.from(JSON.stringify({ client_id: CLIENT_ID, client_name: 'Claude', redirect_uris: [REDIRECT], token_endpoint_auth_method: 'none' })) })
    mocks.getSession.mockResolvedValue({ id: `${prefix}-session`, user })
  })

  const pkce = () => { const verifier = randomBytes(32).toString('base64url'); return { verifier, challenge: createHash('sha256').update(verifier).digest('base64url') } }
  const authorizeUrl = (over: Record<string, string> = {}, challenge = pkce().challenge) => `${ORIGIN}/api/oauth/authorize?${new URLSearchParams({
    response_type: 'code', client_id: CLIENT_ID, redirect_uri: REDIRECT, state: 'st4te', code_challenge: challenge, code_challenge_method: 'S256', resource: `${ORIGIN}/api/mcp`, ...over,
  })}`
  const form = (fields: Record<string, string>) => new Request(`${ORIGIN}/api/oauth/token`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(fields).toString() })
  const req = () => new Request(`${ORIGIN}/api/oauth/consent`, { method: 'POST' })

  /** authorize → consent (approve) → code. */
  async function connect(scopes = ['cms:write', 'media:write', 'cms:publish']) {
    const { verifier, challenge } = pkce()
    const res = await authorize(new Request(authorizeUrl({}, challenge)))
    expect(res.status).toBe(303)
    const location = new URL(res.headers.get('location')!)
    expect(location.pathname).toBe('/admin/oauth/consent')
    const requestId = location.searchParams.get('req')!
    const back = new URL(await approveAuthorization(requestId, user, scopes, req()))
    expect(back.origin + back.pathname).toBe(REDIRECT)
    expect(back.searchParams.get('state')).toBe('st4te')
    expect(back.searchParams.get('iss')).toBe(ORIGIN)
    return { code: back.searchParams.get('code')!, verifier }
  }
  const exchange = (code: string, verifier: string, over: Record<string, string> = {}) =>
    token(form({ grant_type: 'authorization_code', code, code_verifier: verifier, client_id: CLIENT_ID, redirect_uri: REDIRECT, resource: `${ORIGIN}/api/mcp`, ...over }))
  const bearer = (t: string) => new Request(`${ORIGIN}/api/mcp`, { method: 'POST', headers: { authorization: `Bearer ${t}` } })

  it('publishes metadata Claude needs: exact resource, S256, public clients, CIMD', async () => {
    expect(await (await prMetadata()).json()).toMatchObject({ resource: `${ORIGIN}/api/mcp`, authorization_servers: [ORIGIN] })
    const as = await (await asMetadata()).json()
    expect(as).toMatchObject({ issuer: ORIGIN, code_challenge_methods_supported: ['S256'], token_endpoint_auth_methods_supported: ['none'], client_id_metadata_document_supported: true })
    expect(as).not.toHaveProperty('registration_endpoint')
  })

  it('connects: code → tokens → an actor with the granted scopes, limited like an API token', async () => {
    const { code, verifier } = await connect(['cms:write'])
    const res = await exchange(code, verifier)
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('no-store')
    const tokens = await res.json()
    expect(tokens).toMatchObject({ token_type: 'Bearer', expires_in: 3600, scope: 'cms:read cms:write' })
    expect(tokens.access_token).toMatch(/^ncma_/)
    const actor = await resolveOAuthActor(bearer(tokens.access_token))
    expect(actor.user).toMatchObject({ id: user.id, via: 'token', authKind: 'oauth', scopes: ['cms:read', 'cms:write'] })
    // The OAuth token never works on /api/admin (only personal ncms_ tokens do).
    mocks.getSession.mockResolvedValue(null)
    expect((await whoami(new Request(`${ORIGIN}/api/admin/whoami`, { headers: { authorization: `Bearer ${tokens.access_token}` } }), {})).status).toBe(401)
  })

  it('refuses wrong PKCE verifiers, other clients or redirects, and codes used twice (which ends the connection)', async () => {
    const { code, verifier } = await connect()
    for (const over of [{ code_verifier: pkce().verifier }, { client_id: 'https://claude.ai/other' }, { redirect_uri: 'http://localhost:1/callback' }] as Record<string, string>[]) {
      const res = await exchange(code, verifier, over)
      expect(res.status, JSON.stringify(over)).toBe(400)
      expect((await res.json()).error).toBe('invalid_grant')
    }
    const first = await (await exchange(code, verifier)).json()
    expect((await exchange(code, verifier)).status).toBe(400)
    await expect(resolveOAuthActor(bearer(first.access_token))).rejects.toMatchObject({ status: 401, error: 'invalid_token' })
  })

  it('rotates refresh tokens; a quick double refresh is tolerated, a late reuse ends the connection', async () => {
    const { code, verifier } = await connect()
    const first = await (await exchange(code, verifier)).json()
    const refresh = (t: string) => token(form({ grant_type: 'refresh_token', refresh_token: t, client_id: CLIENT_ID }))
    const second = await (await refresh(first.refresh_token)).json()
    expect(second.access_token).not.toBe(first.access_token)
    // Within the grace window: refused, but the connection survives.
    expect((await refresh(first.refresh_token)).status).toBe(400)
    await expect(resolveOAuthActor(bearer(second.access_token))).resolves.toBeTruthy()
    // Later: the old token was stolen → connection revoked.
    await db.oAuthToken.updateMany({ where: { tokenHash: createHash('sha256').update(first.refresh_token).digest('hex') }, data: { usedAt: new Date(Date.now() - 5 * 60_000) } })
    expect((await refresh(first.refresh_token)).status).toBe(400)
    await expect(resolveOAuthActor(bearer(second.access_token))).rejects.toMatchObject({ status: 401 })
    // A refresh can never widen the scopes.
    const again = await connect(['cms:write'])
    const t = await (await exchange(again.code, again.verifier)).json()
    expect((await (await token(form({ grant_type: 'refresh_token', refresh_token: t.refresh_token, client_id: CLIENT_ID, scope: 'cms:read cms:publish' }))).json()).error).toBe('invalid_scope')
  })

  it('checks the audience, expiry and the person on every request', async () => {
    const { code, verifier } = await connect()
    const t = await (await exchange(code, verifier)).json()
    const grant = await db.oAuthGrant.findFirstOrThrow({ where: { userId: user.id, revokedAt: null }, orderBy: { createdAt: 'desc' } })
    await db.oAuthGrant.update({ where: { id: grant.id }, data: { resource: 'https://other.example/api/mcp' } })
    await expect(resolveOAuthActor(bearer(t.access_token))).rejects.toMatchObject({ status: 401 })
    await db.oAuthGrant.update({ where: { id: grant.id }, data: { resource: `${ORIGIN}/api/mcp` } })
    await expect(resolveOAuthActor(bearer(t.access_token))).resolves.toBeTruthy()
    await db.oAuthToken.updateMany({ where: { grantId: grant.id, kind: 'ACCESS' }, data: { expiresAt: new Date(Date.now() - 1000) } })
    await expect(resolveOAuthActor(bearer(t.access_token))).rejects.toMatchObject({ status: 401 })
    await expect(resolveOAuthActor(bearer(t.refresh_token))).rejects.toMatchObject({ status: 401 })
    await expect(resolveOAuthActor(bearer('ncms_' + 'a'.repeat(43)))).rejects.toMatchObject({ status: 401 })
  })

  it('ends connections on revocation (RFC 7009) and with the person\'s other credentials', async () => {
    const a = await connect(); const ta = await (await exchange(a.code, a.verifier)).json()
    const r = await revoke(new Request(`${ORIGIN}/api/oauth/revoke`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: `token=${ta.refresh_token}` }))
    expect(r.status).toBe(200)
    await expect(resolveOAuthActor(bearer(ta.access_token))).rejects.toMatchObject({ status: 401 })
    const b = await connect(); const tb = await (await exchange(b.code, b.verifier)).json()
    await revokeUserOAuthGrants(user.id, 'PASSWORD_RESET')
    await expect(resolveOAuthActor(bearer(tb.access_token))).rejects.toMatchObject({ status: 401 })
    // A deactivated person's tokens stop working at once.
    const c = await connect(); const tc = await (await exchange(c.code, c.verifier)).json()
    await db.user.update({ where: { id: user.id }, data: { active: false } })
    await expect(resolveOAuthActor(bearer(tc.access_token))).rejects.toMatchObject({ status: 401 })
    await db.user.update({ where: { id: user.id }, data: { active: true } })
  })

  it('refuses unknown clients, foreign redirects, plain PKCE and other resources before anyone signs in', async () => {
    mocks.safeFetch.mockResolvedValueOnce({ status: 200, headers: {}, url: new URL('https://evil.test'), body: Buffer.from('{}') })
    expect((await authorize(new Request(authorizeUrl({ client_id: 'https://evil.test/client' })))).status).toBe(400)
    expect(mocks.safeFetch).not.toHaveBeenCalledWith('https://evil.test/client', expect.anything())
    expect((await authorize(new Request(authorizeUrl({ redirect_uri: 'https://evil.test/cb' })))).status).toBe(400)
    for (const over of [{ code_challenge_method: 'plain' }, { resource: 'https://other.example/api/mcp' }, { response_type: 'token' }] as Record<string, string>[]) {
      const res = await authorize(new Request(authorizeUrl(over)))
      expect(res.status, JSON.stringify(over)).toBe(303)
      expect(new URL(res.headers.get('location')!).searchParams.get('error')).toBeTruthy()
    }
  })

  it('lists your connections and lets only you (or an admin) end them', async () => {
    const { listOwnConnections, revokeConnection } = await import('@/cms/lib/people/oauth-grants')
    const { code, verifier } = await connect()
    const t = await (await exchange(code, verifier)).json()
    const mine = (await listOwnConnections(user.id)).find((c) => c.status === 'active')!
    expect(mine).toMatchObject({ clientName: 'Claude', status: 'active' })
    const stranger = { id: 'someone-else', user: { id: 'someone-else', email: 'x@near.org', name: 'X', role: 'PUBLISHER' as const } }
    await expect(revokeConnection(stranger, mine.id, req())).rejects.toMatchObject({ status: 404 })
    await revokeConnection({ id: 's', user }, mine.id, req())
    await expect(resolveOAuthActor(bearer(t.access_token))).rejects.toMatchObject({ status: 401 })
  })

  it('takes the answer only from the session that saw the consent page, once', async () => {
    const res = await authorize(new Request(authorizeUrl()))
    const requestId = new URL(res.headers.get('location')!).searchParams.get('req')!
    const answer = (body: Record<string, unknown>) => consent(new Request(`${ORIGIN}/api/oauth/consent`, { method: 'POST', headers: { origin: ORIGIN, host: 'localhost:3000', 'content-type': 'application/json' }, body: JSON.stringify(body) }), {})
    const csrf = hmac(`${prefix}-session:${requestId}`, 'oauth-consent')
    expect((await answer({ req: requestId, csrf: 'x'.repeat(43), approve: true, scopes: [] })).status).toBe(403)
    const ok = await answer({ req: requestId, csrf, approve: true, scopes: ['cms:write'] })
    expect(ok.status).toBe(200)
    expect((await ok.json()).redirectTo).toContain('code=')
    expect((await answer({ req: requestId, csrf, approve: true, scopes: [] })).status).toBe(400)
  })
})
