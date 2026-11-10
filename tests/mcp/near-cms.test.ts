import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadConfig, parseUrl } from '@/cms/mcp/config'
import { createServer } from '@/cms/mcp/server'
import { clearTokenCache, readToken } from '@/cms/mcp/token'
import { defaultUploadDir, prepareUpload } from '@/cms/mcp/uploads'

const TOKEN = `ncms_${'A1b2C3d4E5'.repeat(4)}abc`
const ENV = { NEAR_CMS_URL: 'http://localhost:3000' }
const calls: { method: string; url: string; init: RequestInit }[] = []
type Responder = (method: string, url: URL, body: unknown) => { status?: number; json: unknown }
let respond: Responder

function stubFetch() {
  calls.length = 0
  vi.stubGlobal('fetch', vi.fn(async (input: URL, init: RequestInit) => {
    const url = new URL(String(input))
    calls.push({ method: init.method ?? 'GET', url: url.pathname + url.search, init })
    const body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body
    const r = respond(init.method ?? 'GET', url, body)
    return new Response(JSON.stringify(r.json), { status: r.status ?? 200 })
  }))
}

async function connect(env: Record<string, string | undefined> = ENV) {
  const server = createServer({ env, getToken: async () => TOKEN })
  const client = new Client({ name: 't', version: '0' })
  const [a, b] = InMemoryTransport.createLinkedPair()
  await Promise.all([server.connect(a), client.connect(b)])
  const call = async (name: string, args: Record<string, unknown> = {}) => {
    const r = await client.callTool({ name, arguments: args })
    return { isError: !!r.isError, text: (r.content as { text: string }[])[0].text }
  }
  return { client, call }
}

const post = (over: Record<string, unknown> = {}) => ({
  id: 'p1', slug: 's', title: 'T', status: 'DRAFT', visibility: 'PUBLIC', publishedAt: null,
  updatedAt: '2026-01-01T00:00:00.000Z', body: '<p>old</p>',
  ...over,
})

beforeEach(() => { stubFetch() })
afterEach(() => { vi.unstubAllGlobals(); clearTokenCache() })

describe('tool list', () => {
  it('exposes the expected tools and nothing that deletes, restores or bulk-edits', async () => {
    const { client } = await connect()
    const names = (await client.listTools()).tools.map((t) => t.name)
    expect([...names].sort()).toEqual(['whoami', 'list_posts', 'get_post', 'create_draft', 'update_post', 'publish_post', 'schedule_post', 'unpublish_post', 'upload_media', 'update_media', 'list_media', 'list_tags', 'list_categories', 'create_tag', 'create_category', 'list_upload_files', 'open_upload_folder', 'import_docx'].sort())
    expect(names.filter((n) => /delete|remove|restore|bulk|replace|revoke|banner|preview|duplicate/.test(n))).toEqual([])
    const tools = (await client.listTools()).tools
    expect(tools.find((t) => t.name === 'unpublish_post')?.annotations?.destructiveHint).toBe(true)
    expect(tools.find((t) => t.name === 'get_post')?.annotations?.readOnlyHint).toBe(true)
  })

  it('sends instructions, onboarding prompts and the guide to the client', async () => {
    const { client } = await connect()
    const instructions = client.getInstructions() ?? ''
    expect(instructions).toMatch(/Call whoami once/)
    expect(instructions).toMatch(/Wait for a clear yes/)
    expect(instructions).toMatch(/cannot delete anything/)
    expect(instructions).toMatch(/never reach the CMS tools/)
    expect(instructions).toMatch(/open_upload_folder/)
    expect(client.getServerVersion()?.title).toBe('NEAR CMS')
    expect(instructions).not.toMatch(/banner|teamNotes|near\.org/i)

    const prompts = (await client.listPrompts()).prompts
    expect(prompts.map((p) => p.name)).toEqual(['onboarding', 'draft_from_word', 'ready_to_publish'])
    const word = await client.getPrompt({ name: 'draft_from_word', arguments: { file: 'launch.docx' } })
    expect((word.messages[0].content as { text: string }).text).toContain('"launch.docx"')
    const onboarding = await client.getPrompt({ name: 'onboarding' })
    expect((onboarding.messages[0].content as { text: string }).text).toMatch(/Run whoami/)

    const guide = await client.readResource({ uri: 'near-cms://guide' })
    expect((guide.contents[0] as { text: string }).text).toBe(instructions)
    expect(calls).toHaveLength(0)
  })

  it('returns isError from every tool when config is invalid', async () => {
    const { call } = await connect({ NEAR_CMS_URL: 'http://evil.com' })
    const r = await call('whoami')
    expect(r.isError).toBe(true)
    expect(r.text).toMatch(/https/)
    expect(calls).toHaveLength(0)
  })
})

describe('config', () => {
  it('rejects unsafe urls', () => {
    for (const u of ['http://evil.com', 'https://x.com/admin', 'https://u:p@x.com', 'https://x.com/?a=1', 'https://x.com/#h', 'ftp://x.com']) expect(() => parseUrl(u), u).toThrow()
  })
  it('accepts safe urls and normalizes', () => {
    expect(parseUrl('http://localhost:3000/')).toEqual({ origin: 'http://localhost:3000', host: 'localhost:3000' })
    expect(parseUrl('https://x.up.railway.app').origin).toBe('https://x.up.railway.app')
    expect(parseUrl('http://127.0.0.1:3000').host).toBe('127.0.0.1:3000')
    expect(parseUrl('http://[::1]:3000').origin).toBe('http://[::1]:3000')
  })
  it('defaults to localhost', () => {
    expect(loadConfig({})).toMatchObject({ ok: true, origin: 'http://localhost:3000', uploadDir: defaultUploadDir() })
  })
})

describe('token reader', () => {
  let dir: string
  beforeEach(async () => { dir = await mkdtemp(path.join(tmpdir(), 'ncms-')) })
  afterEach(async () => { await rm(dir, { recursive: true, force: true }) })
  const opts = () => ({ configDir: dir, keychain: async () => null })

  it('reads a 600 file and caches', async () => {
    await writeFile(path.join(dir, 'localhost_3000.token'), `${TOKEN}\n`, { mode: 0o600 })
    expect(await readToken('localhost:3000', opts())).toBe(TOKEN)
    expect(await readToken('localhost:3000', { configDir: '/nonexistent', keychain: async () => null })).toBe(TOKEN)
  })
  it('prefers the keychain', async () => {
    expect(await readToken('h', { configDir: dir, keychain: async () => TOKEN })).toBe(TOKEN)
  })
  it('refuses mode 644 without leaking the token', async () => {
    const f = path.join(dir, 'h.token')
    await writeFile(f, TOKEN, { mode: 0o644 })
    const err = await readToken('h', opts()).catch((e: Error) => e)
    expect((err as Error).message).toMatch(/permissions/)
    expect((err as Error).message).not.toContain(TOKEN)
  })
  it('refuses symlinks', async () => {
    const real = path.join(dir, 'real')
    await writeFile(real, TOKEN, { mode: 0o600 })
    await symlink(real, path.join(dir, 'h.token'))
    const err = await readToken('h', opts()).catch((e: Error) => e)
    expect((err as Error).message).toMatch(/symlink/)
    expect((err as Error).message).not.toContain(TOKEN)
  })
  it('rejects malformed tokens without echoing them', async () => {
    const bad = 'ncms_secret-but-short'
    const err = await readToken('h', { configDir: dir, keychain: async () => bad }).catch((e: Error) => e)
    expect((err as Error).message).toMatch(/malformed/)
    expect((err as Error).message).not.toContain(bad)
  })
})

describe('http client', () => {
  it('sends bearer, redirect:error, no cookies', async () => {
    respond = () => ({ json: { user: {} } })
    const { call } = await connect()
    await call('whoami')
    const { init, url } = calls[0]
    expect(url).toBe('/api/admin/whoami')
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${TOKEN}`)
    expect((init.headers as Record<string, string>)['User-Agent']).toBe('near-cms-mcp/1.0')
    expect(init.redirect).toBe('error')
    expect(init.credentials).toBe('omit')
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })
  it('maps 401 and never leaks the token', async () => {
    respond = () => ({ status: 401, json: { error: `bad ${TOKEN}` } })
    const { call } = await connect()
    const r = await call('whoami')
    expect(r.isError).toBe(true)
    expect(r.text).toMatch(/mcp:cms:login/)
    expect(r.text).not.toContain(TOKEN)
  })
})

describe('create_draft', () => {
  it('creates a DRAFT with the HTML as its body and the derived slug', async () => {
    respond = () => ({ status: 201, json: post() })
    const { call } = await connect()
    const r = await call('create_draft', { title: 'Hello World', html: '<p>Hi</p>', metaImage: '/cms/a.png' })
    expect(r.isError).toBe(false)
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual(['POST /api/admin/posts'])
    expect(JSON.parse(calls[0].init.body as string)).toEqual({ title: 'Hello World', slug: 'hello-world', status: 'DRAFT', body: '<p>Hi</p>', metaImage: '/cms/a.png' })
    expect(r.text).toContain('"bodyHtml": "<p>old</p>"')
  })
})

describe('update_post', () => {
  const route: Responder = (m, u) => {
    if (m === 'GET') return { json: post() }
    if (u.pathname.endsWith('/lock')) return { json: {} }
    return { json: post({ title: 'N' }) }
  }
  const LIVE = { status: 'PUBLISHED', publishedAt: '2020-01-01T00:00:00.000Z' }
  it('locks, patches with expectedUpdatedAt, then unlocks; html replaces the body', async () => {
    respond = route
    const { call } = await connect()
    const r = await call('update_post', { id: 'p1', html: '<p>new</p>', title: 'N' })
    expect(r.isError).toBe(false)
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual([
      'GET /api/admin/posts/p1', 'POST /api/admin/posts/p1/lock', 'PATCH /api/admin/posts/p1', 'DELETE /api/admin/posts/p1/lock',
    ])
    const body = JSON.parse(calls[2].init.body as string)
    expect(body.expectedUpdatedAt).toBe('2026-01-01T00:00:00.000Z')
    expect(body).toMatchObject({ title: 'N', body: '<p>new</p>' })
    expect(body).not.toHaveProperty('blocks')
  })
  it('unlocks even when PATCH fails', async () => {
    respond = (m, u, b) => (m === 'PATCH' ? { status: 409, json: { error: 'stale' } } : route(m, u, b))
    const { call } = await connect()
    const r = await call('update_post', { id: 'p1', title: 'N' })
    expect(r.isError).toBe(true)
    expect(r.text).toMatch(/re-read/)
    expect(calls.at(-1)).toMatchObject({ method: 'DELETE', url: '/api/admin/posts/p1/lock' })
  })
  it('edits live and scheduled posts and returns the editor and preview links', async () => {
    for (const state of [LIVE, { status: 'PUBLISHED', publishedAt: '2099-01-01T00:00:00.000Z' }]) {
      calls.length = 0
      respond = (m, u) => (m === 'GET' ? { json: post(state) } : u.pathname.endsWith('/lock') ? { json: {} } : { json: post({ ...state, title: 'N' }) })
      const { call } = await connect()
      const r = await call('update_post', { id: 'p1', title: 'N', slug: 's' })
      expect(r.isError).toBe(false)
      expect(JSON.parse(calls[2].init.body as string)).not.toHaveProperty('slug')
      expect(r.text).toContain('http://localhost:3000/admin/posts/p1/edit')
      expect(r.text).toContain('http://localhost:3000/admin/posts/p1/preview')
      expect(r.text).not.toContain('/blog/')
    }
  })
  it('refuses a new slug on a published post, an empty body and archived posts, before writing', async () => {
    respond = () => ({ json: post(LIVE) })
    let { call } = await connect()
    expect((await call('update_post', { id: 'p1', slug: 'other' })).text).toMatch(/URL \(slug\)/)
    expect((await call('update_post', { id: 'p1', html: '' })).isError).toBe(true)
    respond = () => ({ json: post({ status: 'ARCHIVED' }) });
    ({ call } = await connect())
    expect((await call('update_post', { id: 'p1', title: 'N' })).text).toMatch(/archived/)
    expect(calls.every((c) => c.method === 'GET')).toBe(true)
  })
})

describe('publish_post', () => {
  const route = (state: Record<string, unknown>): Responder => (m, u) =>
    m === 'GET' ? { json: post(state) } : u.pathname.endsWith('/lock') ? { json: {} } : { json: post({ ...state, status: 'PUBLISHED', publishedAt: '2026-01-01T00:00:00.000Z' }) }
  it('publishes a draft now, through the lock', async () => {
    respond = route({})
    const { call } = await connect()
    const r = await call('publish_post', { id: 'p1' })
    expect(r.isError).toBe(false)
    expect(r.text).toContain('http://localhost:3000/admin/posts/p1/edit')
    const patch = calls.find((c) => c.method === 'PATCH')!
    const body = JSON.parse(patch.init.body as string)
    expect(body).toMatchObject({ status: 'PUBLISHED', expectedUpdatedAt: '2026-01-01T00:00:00.000Z' })
    expect(Math.abs(Date.parse(body.publishedAt) - Date.now())).toBeLessThan(60_000)
    expect(calls.map((c) => c.method)).toEqual(['GET', 'POST', 'PATCH', 'DELETE'])
  })
  it('keeps the original date of a post that was live before', async () => {
    respond = route({ status: 'ARCHIVED', publishedAt: '2024-05-01T00:00:00.000Z' })
    const { call } = await connect()
    expect((await call('publish_post', { id: 'p1' })).isError).toBe(false)
    const body = JSON.parse(calls.find((c) => c.method === 'PATCH')!.init.body as string)
    expect(body).not.toHaveProperty('publishedAt')
    expect(body).not.toHaveProperty('unpublishAt')
  })
  it('brings a scheduled post forward to now and says when it is already live', async () => {
    respond = route({ status: 'PUBLISHED', publishedAt: '2099-01-01T00:00:00.000Z' })
    let { call } = await connect()
    expect((await call('publish_post', { id: 'p1' })).isError).toBe(false)
    expect(Date.parse(JSON.parse(calls.find((c) => c.method === 'PATCH')!.init.body as string).publishedAt)).toBeLessThan(Date.now() + 60_000)
    calls.length = 0
    respond = () => ({ json: post({ status: 'PUBLISHED', publishedAt: '2020-01-01T00:00:00.000Z' }) });
    ({ call } = await connect())
    expect((await call('publish_post', { id: 'p1' })).text).toMatch(/already live/)
    expect(calls).toHaveLength(1)
  })
})

describe('schedule_post', () => {
  it('rejects a time in the past, before any request', async () => {
    respond = () => ({ json: post() })
    const { call } = await connect()
    const r = await call('schedule_post', { id: 'p1', publishAt: new Date(Date.now() - 60_000).toISOString() })
    expect(r.isError).toBe(true)
    expect(r.text).toMatch(/publish_post/)
    expect(calls).toHaveLength(0)
  })
  it('rejects timestamps without offset', async () => {
    const { call } = await connect()
    expect((await call('schedule_post', { id: 'p1', publishAt: '2099-01-01T10:00:00' })).isError).toBe(true)
  })
  it('schedules a draft or reschedules a scheduled post via lock, PATCH, unlock', async () => {
    for (const state of [{}, { status: 'PUBLISHED', publishedAt: '2099-01-01T00:00:00.000Z' }]) {
      calls.length = 0
      respond = (m) => ({ json: m === 'GET' ? post(state) : {} })
      const { call } = await connect()
      const at = new Date(Date.now() + 10 * 60_000).toISOString()
      expect((await call('schedule_post', { id: 'p1', publishAt: at })).isError).toBe(false)
      const patch = calls.find((c) => c.method === 'PATCH')!
      expect(JSON.parse(patch.init.body as string)).toMatchObject({ status: 'PUBLISHED', publishedAt: at, expectedUpdatedAt: '2026-01-01T00:00:00.000Z' })
      expect(calls.at(-1)?.method).toBe('DELETE')
    }
  })
  it('does not take a live post off the site to schedule it', async () => {
    respond = () => ({ json: post({ status: 'PUBLISHED', publishedAt: '2020-01-01T00:00:00.000Z' }) })
    const { call } = await connect()
    expect((await call('schedule_post', { id: 'p1', publishAt: new Date(Date.now() + 3_600_000).toISOString() })).text).toMatch(/already live/)
    expect(calls).toHaveLength(1)
  })
})

describe('upload guard', () => {
  let root: string, outside: string
  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'ncms-up-'))
    outside = await mkdtemp(path.join(tmpdir(), 'ncms-out-'))
    await writeFile(path.join(root, 'ok.png'), 'x')
    await writeFile(path.join(root, '.hidden.png'), 'x')
    await writeFile(path.join(root, 'v.svg'), '<svg/>')
    await writeFile(path.join(outside, 'secret.png'), 'x')
    await mkdir(path.join(root, 'sub'))
    await symlink(path.join(outside, 'secret.png'), path.join(root, 'sub', 'link.png'))
    await symlink(outside, path.join(root, 'dir'))
  })
  afterEach(async () => { await rm(root, { recursive: true, force: true }); await rm(outside, { recursive: true, force: true }) })

  it('accepts a normal image', async () => {
    const r = await prepareUpload('ok.png', root)
    expect(r.filename).toBe('ok.png')
    expect(r.blob.type).toBe('image/png')
  })
  it('requires the upload dir', async () => { await expect(prepareUpload('ok.png', null)).rejects.toThrow(/NEAR_CMS_UPLOAD_DIR/) })
  it('rejects traversal, dotfiles, symlink escapes, svg', async () => {
    await expect(prepareUpload('../x.png', root)).rejects.toThrow()
    await expect(prepareUpload(path.join(outside, 'secret.png'), root)).rejects.toThrow(/outside/)
    await expect(prepareUpload('.hidden.png', root)).rejects.toThrow()
    await expect(prepareUpload('sub/link.png', root)).rejects.toThrow()
    await expect(prepareUpload('dir/secret.png', root)).rejects.toThrow(/outside/)
    await expect(prepareUpload('v.svg', root)).rejects.toThrow(/not allowed/)
  })
  it('rejects files over 15 MB', async () => {
    await writeFile(path.join(root, 'big.jpg'), Buffer.alloc(15 * 1024 * 1024 + 1))
    await expect(prepareUpload('big.jpg', root)).rejects.toThrow(/15 MB/)
  })
  it('uploads via multipart with imagesOnly', async () => {
    respond = () => ({ json: { id: 'm1' } })
    const { call } = await connect({ ...ENV, NEAR_CMS_UPLOAD_DIR: root })
    const r = await call('upload_media', { path: 'ok.png', alt: 'a' })
    expect(r.isError).toBe(false)
    const form = calls[0].init.body as FormData
    expect(form.get('imagesOnly')).toBe('1')
    expect((form.get('file') as File).name).toBe('ok.png')
    expect((calls[0].init.headers as Record<string, string>)['Content-Type']).toBeUndefined()
  })
})
