import { randomUUID } from 'node:crypto'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ revalidatePost: vi.fn() }))
vi.mock('@/cms/lib/cache-tags', () => ({ revalidatePost: mocks.revalidatePost, revalidateCategories: vi.fn() }))
vi.mock('next/server', async (original) => ({ ...(await original<object>()), connection: async () => {} }))

const ORIGIN = 'http://localhost:3000'

// The remote connector end to end: an MCP client talks HTTP to /api/mcp with an OAuth access token,
// and the tools run against the real database through the in-process API.
describe.skipIf(!process.env.TEST_DATABASE_URL)('remote MCP over HTTP (database)', async () => {
  process.env.CMS_MCP_ENABLED = 'true'
  process.env.CMS_ORIGIN = ORIGIN
  const { db } = await import('@/cms/lib/db')
  const { sha256, randomToken } = await import('@/cms/lib/crypto')
  const { hashPassword } = await import('@/cms/lib/password')
  const { POST, GET } = await import('@/app/(cms)/api/mcp/route')

  const prefix = `remote-${randomUUID()}`
  let userId: string
  beforeAll(async () => {
    userId = (await db.user.create({ data: { email: `${prefix}@near.org`, name: 'Remote', role: 'PUBLISHER', passwordHash: await hashPassword('test-password-123') } })).id
  })
  afterAll(async () => {
    await db.post.deleteMany({ where: { authorId: userId } })
    await db.user.delete({ where: { id: userId } })
  })

  /** A connection with these scopes and its access token, as if the person had just approved it. */
  async function connection(scopes: string[]) {
    const grant = await db.oAuthGrant.create({ data: { userId, clientId: 'https://claude.ai/test', clientName: 'Claude', scopes, resource: `${ORIGIN}/api/mcp`, expiresAt: new Date(Date.now() + 86_400_000) } })
    const token = `ncma_${randomToken()}`
    await db.oAuthToken.create({ data: { grantId: grant.id, kind: 'ACCESS', tokenHash: sha256(token), expiresAt: new Date(Date.now() + 3_600_000) } })
    return { grant, token }
  }

  const call = (headers: Record<string, string>, body: unknown) => POST(new Request(`${ORIGIN}/api/mcp`, {
    method: 'POST', headers: { host: 'localhost:3000', 'content-type': 'application/json', accept: 'application/json, text/event-stream', ...headers }, body: JSON.stringify(body),
  }))

  async function client(token: string) {
    const transport = new StreamableHTTPClientTransport(new URL(`${ORIGIN}/api/mcp`), {
      fetch: async (url, init) => POST(new Request(url, { ...init, headers: { ...Object.fromEntries(new Headers(init?.headers)), host: 'localhost:3000', authorization: `Bearer ${token}` } })),
    })
    const c = new Client({ name: 'test', version: '1.0.0' })
    await c.connect(transport)
    const run = async (name: string, args: Record<string, unknown> = {}) => {
      const r = await c.callTool({ name, arguments: args }) as { isError?: boolean; content: { text: string }[] }
      return { isError: !!r.isError, text: r.content.map((x) => x.text).join('\n') }
    }
    return { c, run }
  }

  it('asks unauthenticated clients to sign in (401 + resource metadata), and refuses other hosts and origins', async () => {
    const init = { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } } }
    const res = await call({}, init)
    expect(res.status).toBe(401)
    expect(res.headers.get('www-authenticate')).toBe(`Bearer resource_metadata="${ORIGIN}/.well-known/oauth-protected-resource/api/mcp", scope="cms:read cms:write media:write cms:publish"`)
    const bad = await call({ authorization: `Bearer ncma_${'x'.repeat(43)}` }, init)
    expect(bad.status).toBe(401)
    expect(bad.headers.get('www-authenticate')).toContain('error="invalid_token"')
    // Personal API tokens are for the local MCP only.
    expect((await call({ authorization: `Bearer ncms_${'x'.repeat(43)}` }, init)).status).toBe(401)
    const { token } = await connection(['cms:read'])
    expect((await POST(new Request(`${ORIGIN}/api/mcp`, { method: 'POST', headers: { host: 'evil.test', authorization: `Bearer ${token}` }, body: '{}' }))).status).toBe(421)
    expect((await call({ authorization: `Bearer ${token}`, origin: 'https://evil.test' }, init)).status).toBe(403)
    expect((await GET()).status).toBe(405)
  })

  it('offers only the tools the connection allows, and never local or destructive-admin ones', async () => {
    const readOnly = await client((await connection(['cms:read'])).token)
    expect((await readOnly.c.listTools()).tools.map((t) => t.name).sort()).toEqual(['get_post', 'list_categories', 'list_media', 'list_posts', 'list_tags', 'whoami'])
    const writer = await client((await connection(['cms:read', 'cms:write', 'media:write'])).token)
    const names = (await writer.c.listTools()).tools.map((t) => t.name)
    expect(names).toEqual(expect.arrayContaining(['create_draft', 'update_post', 'import_google_doc', 'update_media']))
    expect(names).not.toEqual(expect.arrayContaining(['publish_post']))
    for (const local of ['upload_media', 'import_docx', 'list_upload_files', 'open_upload_folder']) expect(names).not.toContain(local)
  })

  it('drafts, then publishes only the version the person reviewed, recording the connection', async () => {
    const { grant, token } = await connection(['cms:read', 'cms:write', 'cms:publish'])
    const { run } = await client(token)
    const who = await run('whoami')
    expect(who.text).toContain('"clientName": "Claude"')
    const draft = await run('create_draft', { title: `${prefix} Post`, html: '<p>Hello</p>' })
    expect(draft.isError).toBe(false)
    const post = JSON.parse(draft.text.split('\n').slice(1).join('\n'))
    expect(post.status).toBe('DRAFT')

    const stale = await run('publish_post', { id: post.id, title: post.title, expectedUpdatedAt: '2020-01-01T00:00:00.000Z' })
    expect(stale.text).toMatch(/changed after the person reviewed/)
    const published = await run('publish_post', { id: post.id, title: post.title, expectedUpdatedAt: post.updatedAt })
    expect(published.isError).toBe(false)
    const row = await db.post.findUniqueOrThrow({ where: { id: post.id } })
    expect(row.status).toBe('PUBLISHED')
    const audit = await db.auditLog.findFirst({ where: { entityId: post.id, action: 'PUBLISH' } })
    expect(audit?.apiTokenId).toBe(grant.id)

    // Live posts change only through update_live_post (Claude asks the person first).
    expect((await run('update_post', { id: post.id, title: 'Other' })).text).toMatch(/update_live_post/)
    expect((await run('update_live_post', { id: post.id, html: '<p>Hello again</p>', changeSummary: 'Second paragraph' })).isError).toBe(false)
  })

  it('stops working as soon as the connection is revoked', async () => {
    const { grant, token } = await connection(['cms:read'])
    const { run } = await client(token)
    expect((await run('whoami')).isError).toBe(false)
    await db.oAuthGrant.update({ where: { id: grant.id }, data: { revokedAt: new Date(), revokeReason: 'USER' } })
    await expect(run('whoami')).rejects.toThrow()
  })
})
