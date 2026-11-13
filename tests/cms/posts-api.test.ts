import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Role } from '@/generated/prisma/client'
import { db } from '@/cms/lib/db'
import { GET as list, POST as create } from '@/app/(cms)/api/admin/posts/route'
import { GET as get, PATCH as patch, PUT as put, DELETE as remove } from '@/app/(cms)/api/admin/posts/[id]/route'
import { GET as revisions, POST as restore } from '@/app/(cms)/api/admin/posts/[id]/revisions/route'
import { GET as getLock, POST as lock, DELETE as unlock } from '@/app/(cms)/api/admin/posts/[id]/lock/route'
import { POST as bulk } from '@/app/(cms)/api/admin/posts/bulk/route'
import { hashPassword } from '@/cms/lib/password'
import { createPostSchema } from '@/cms/lib/posts/schema'

const mocks = vi.hoisted(() => ({ getSession: vi.fn(), revalidatePost: vi.fn() }))
vi.mock('@/cms/lib/session', () => ({ getSession: mocks.getSession }))
vi.mock('@/cms/lib/cache-tags', () => ({ revalidatePost: mocks.revalidatePost }))

const prefix = `posts-test-${randomUUID()}`
const ctx = (id: string) => ({ params: Promise.resolve({ id }) })
function request(method: string, body?: unknown, path = '/api/admin/posts') {
  return new Request(`http://localhost${path}`, { method, headers: { host: 'localhost', origin: 'http://localhost', 'content-type': 'application/json' }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) })
}
type Handler = (req: Request, context: ReturnType<typeof ctx>) => Promise<Response>

// These execute the real route wrappers, permission helpers, sanitizer and transactions against an isolated database.
describe.skipIf(!process.env.TEST_DATABASE_URL)('posts API database integration', () => {
  const users = new Map<Role, { id: string; email: string; name: string; role: Role }>()
  let counter = 0
  const slug = () => `${prefix}-${++counter}`
  let categoryIds: string[] = []
  let tagId: string
  const asRole = (role: Role | null) => mocks.getSession.mockResolvedValue(role ? { id: 'test-session', user: users.get(role) } : null)
  async function fixture(overrides = {}) {
    return db.post.create({ data: { title: 'Fixture', slug: slug(), body: '<p>Before</p>', authorId: users.get('ADMIN')!.id, ...overrides } })
  }
  beforeAll(async () => {
    const passwordHash = await hashPassword('test-password-123')
    for (const role of ['ADMIN', 'PUBLISHER'] as const) {
      const row = await db.user.create({ data: { email: `${prefix}-${role}@near.org`, name: role, role, passwordHash }, select: { id: true, email: true, name: true, role: true } })
      users.set(role, row)
    }
    for (const n of [1, 2]) categoryIds.push((await db.category.create({ data: { name: `${prefix}-${n}`, slug: `${prefix}-${n}` } })).id)
    tagId = (await db.tag.create({ data: { name: prefix, slug: prefix } })).id
  })
  beforeEach(() => {
    vi.clearAllMocks()
    asRole('ADMIN')
  })
  afterAll(async () => {
    const posts = await db.post.findMany({ where: { slug: { startsWith: prefix } }, select: { id: true } })
    await db.revision.deleteMany({ where: { entityId: { in: posts.map((p) => p.id) } } })
    await db.auditLog.deleteMany({ where: { userId: { in: [...users.values()].map((u) => u.id) } } })
    await db.post.deleteMany({ where: { slug: { startsWith: prefix } } })
    await db.category.deleteMany({ where: { id: { in: categoryIds } } })
    await db.tag.deleteMany({ where: { id: tagId } })
    await db.user.deleteMany({ where: { id: { in: [...users.values()].map((u) => u.id) } } })
    categoryIds = []
  })

  const endpoints: [string, Handler, string, (id: string) => unknown, 'read' | 'write' | 'delete' | 'override'][] = [
    ['list', list, 'GET', () => undefined, 'read'],
    ['get', get, 'GET', () => undefined, 'read'],
    ['create', create, 'POST', () => ({ title: 'Created', slug: slug() }), 'write'],
    ['create published', create, 'POST', () => ({ title: 'Published', slug: slug(), status: 'PUBLISHED' }), 'write'],
    ['create scheduled', create, 'POST', () => ({ title: 'Scheduled', slug: slug(), status: 'PUBLISHED', publishedAt: '2035-01-01T12:00:00Z' }), 'write'],
    ['patch', patch, 'PATCH', () => ({ title: 'Updated' }), 'write'],
    ['publish', patch, 'PATCH', () => ({ status: 'PUBLISHED' }), 'write'],
    ['schedule', patch, 'PATCH', () => ({ status: 'PUBLISHED', publishedAt: '2035-01-01T12:00:00Z' }), 'write'],
    ['put', put, 'PUT', () => ({ title: 'Updated' }), 'write'],
    ['delete', remove, 'DELETE', () => ({}), 'delete'],
    ['revisions', revisions, 'GET', () => undefined, 'read'],
    ['restore', restore, 'POST', () => ({ revisionId: 'missing' }), 'write'],
    ['lock read', getLock, 'GET', () => undefined, 'read'],
    ['lock acquire', lock, 'POST', () => ({}), 'write'],
    ['lock release', unlock, 'DELETE', () => ({}), 'write'],
    ['lock override', lock, 'POST', () => ({ override: true }), 'override'],
    ['bulk publish', bulk, 'POST', (id) => ({ ids: [id], action: 'publish' }), 'write'],
    ['bulk unpublish', bulk, 'POST', (id) => ({ ids: [id], action: 'unpublish' }), 'write'],
    ['bulk archive', bulk, 'POST', (id) => ({ ids: [id], action: 'archive' }), 'write'],
    ['bulk delete', bulk, 'POST', (id) => ({ ids: [id], action: 'delete' }), 'delete'],
  ]
  for (const role of [null, 'PUBLISHER', 'ADMIN'] as const) {
    it.each(endpoints)(`${role ?? 'anonymous'} authorization: %s`, async (name, handler, method, body, permission) => {
      const post = await fixture()
      asRole(role)
      const response = await handler(request(method, body(post.id)), ctx(post.id))
      // PUBLISHER runs the blog (read, write, publish, delete); only ADMIN takes over another editor's lock.
      const allowed = role === 'ADMIN' || role === 'PUBLISHER' && permission !== 'override'
      expect(response.status).toBe(!role ? 401 : !allowed ? 403 : name === 'restore' ? 404 : name.startsWith('create') ? 201 : 200)
    })
  }

  it('sanitizes creation, strips secrets and rejects unknown columns and unsafe URLs', async () => {
    const html = '<p onclick="alert(1)">Start</p><script>alert(1)</script><img src="javascript:alert(1)">'
    const response = await create(request('POST', { title: 'Safe', slug: slug(), body: html, status: 'PUBLISHED', visibility: 'UNLISTED', categoryIds, tagIds: [tagId] }), ctx(''))
    const post = await response.json()
    expect(response.status).toBe(201)
    expect(post.categories.map((c: { categoryId: string }) => c.categoryId)).toEqual(categoryIds)
    expect(JSON.stringify(post)).not.toMatch(/passwordHash|tokenHash/)
    expect(post.body).toContain('Start')
    expect(post.body).not.toMatch(/onclick|script|javascript/)
    for (const response of [await get(request('GET'), ctx(post.id)), await list(request('GET'), ctx(''))]) {
      expect(await response.text()).not.toMatch(/passwordHash|tokenHash/)
    }
    const evil = '<p onclick="x()">Good<script>alert(1)</script><a href="javascript:alert(1)">link</a></p><iframe src="https://evil.test"></iframe>'
    const update = await patch(request('PATCH', { body: evil }), ctx(post.id))
    const clean = await update.json()
    expect(update.status).toBe(200)
    expect(clean.body).toContain('Good')
    expect(clean.body).not.toMatch(/onclick|script|evil\.test/)
    for (const data of [{ featuredImage: 'javascript:x' }, { metaImage: 'javascript:x' }, { authorId: users.get('PUBLISHER')!.id }, { blocks: [] }, { passwordHash: 'plaintext' }, { visibility: 'PASSWORD' }, { body: { html: '<p>x</p>' } }]) {
      expect((await patch(request('PATCH', data), ctx(post.id))).status).toBe(400)
    }
    const revision = await db.revision.findFirstOrThrow({ where: { entityId: post.id } })
    expect(JSON.stringify(revision.snapshot)).not.toMatch(/passwordHash|tokenHash/)
  })

  it('keeps ordered taxonomy and revalidates both slugs when a published slug changes', async () => {
    const post = await fixture({ status: 'PUBLISHED', publishedAt: new Date() })
    const newSlug = slug()
    const response = await patch(request('PATCH', { slug: newSlug, body: '<p>After</p>', categoryIds: [...categoryIds].reverse(), tagIds: [tagId] }), ctx(post.id))
    expect(response.status).toBe(200)
    const saved = await response.json()
    expect(saved.body).toBe('<p>After</p>')
    expect(saved.categories.map((c: { categoryId: string }) => c.categoryId)).toEqual([...categoryIds].reverse())
    expect(mocks.revalidatePost).toHaveBeenCalledWith(newSlug, post.slug)
  })

  it('restores a revision through normal validation and snapshots', async () => {
    const post = await fixture({ status: 'PUBLISHED', categories: { create: { categoryId: categoryIds[0], position: 0 } } })
    const newSlug = slug()
    const response = await patch(request('PATCH', { title: 'New title', slug: newSlug }), ctx(post.id))
    expect(response.status).toBe(200)
    const revision = await db.revision.findFirstOrThrow({ where: { entityId: post.id } })
    const restored = await restore(request('POST', { revisionId: revision.id }), ctx(post.id))
    expect(restored.status).toBe(200)
    // Content comes back; the URL and publication stay as they are now.
    expect(await restored.json()).toMatchObject({ title: post.title, slug: newSlug, status: 'PUBLISHED' })
    expect(await db.revision.count({ where: { entityId: post.id } })).toBe(2)
  })

  it('accepts unchanged uppercase legacy slugs, validates new slugs and enforces uniqueness', async () => {
    const old = await fixture({ slug: `${prefix}-Legacy` })
    expect((await patch(request('PATCH', { title: 'Legacy', slug: old.slug }), ctx(old.id))).status).toBe(200)
    expect((await patch(request('PATCH', { slug: 'New-UPPERCASE' }), ctx(old.id))).status).toBe(400)
    const other = await fixture()
    expect((await patch(request('PATCH', { slug: other.slug }), ctx(old.id))).status).toBe(409)
  })

  it('enforces lock TTL and override, including bulk and saves', async () => {
    const post = await fixture({ lockedById: users.get('ADMIN')!.id, lockedAt: new Date() })
    asRole('PUBLISHER')
    expect((await lock(request('POST', {}), ctx(post.id))).status).toBe(423)
    expect((await patch(request('PATCH', { title: 'Lost write' }), ctx(post.id))).status).toBe(423)
    expect((await bulk(request('POST', { ids: [post.id], action: 'publish' }), ctx(''))).status).toBe(423)
    expect((await unlock(request('DELETE', {}), ctx(post.id))).status).toBe(403)
    await db.post.update({ where: { id: post.id }, data: { lockedAt: new Date(Date.now() - 91_000) } })
    expect((await lock(request('POST', {}), ctx(post.id))).status).toBe(200)
    asRole('ADMIN')
    expect((await lock(request('POST', { override: true }), ctx(post.id))).status).toBe(200)
    expect(await db.post.findUnique({ where: { id: post.id }, select: { lockedById: true } })).toEqual({ lockedById: users.get('ADMIN')!.id })
  })

  it('heartbeats store UTC, preserve the content version and release the same lock', async () => {
    const post = await fixture()
    const before = Date.now()
    expect((await lock(request('POST', {}), ctx(post.id))).status).toBe(200)
    const locked = await db.post.findUniqueOrThrow({ where: { id: post.id } })
    expect(locked.lockedAt!.getTime()).toBeGreaterThanOrEqual(before)
    expect(locked.lockedAt!.getTime()).toBeLessThanOrEqual(Date.now())
    expect(locked.updatedAt).toEqual(post.updatedAt)
    expect((await lock(request('POST', {}), ctx(post.id))).status).toBe(200)
    expect((await unlock(request('DELETE', {}), ctx(post.id))).status).toBe(200)
    expect(await db.post.findUnique({ where: { id: post.id }, select: { lockedAt: true, lockedById: true, updatedAt: true } })).toEqual({ lockedAt: null, lockedById: null, updatedAt: post.updatedAt })
  })

  it('rejects stale concurrent saves and stale revision restores', async () => {
    const post = await fixture()
    const expectedUpdatedAt = post.updatedAt.toISOString()
    const responses = await Promise.all([
      patch(request('PATCH', { title: 'First writer', expectedUpdatedAt }), ctx(post.id)),
      patch(request('PATCH', { title: 'Second writer', expectedUpdatedAt }), ctx(post.id)),
    ])
    expect(responses.map((r) => r.status).sort()).toEqual([200, 409])
    const revision = await db.revision.findFirstOrThrow({ where: { entityId: post.id } })
    expect((await restore(request('POST', { revisionId: revision.id, expectedUpdatedAt }), ctx(post.id))).status).toBe(409)
    expect(await db.revision.count({ where: { entityId: post.id } })).toBe(1)
  })

  it('serializes competing slug claims without creating duplicate posts', async () => {
    const sharedSlug = slug()
    const responses = await Promise.all([
      create(request('POST', { title: 'One', slug: sharedSlug }), ctx('')),
      create(request('POST', { title: 'Two', slug: sharedSlug }), ctx('')),
    ])
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409])
    expect(await db.post.count({ where: { slug: sharedSlug } })).toBe(1)
  })

  it('gives a URL that follows the title the next free variant, and only before the post was ever public', async () => {
    const base = slug()
    const first = await (await create(request('POST', { title: 'Same', slug: base, autoSlug: true }), ctx(''))).json()
    const [second, third] = await Promise.all([
      create(request('POST', { title: 'Same', slug: base, autoSlug: true }), ctx('')),
      create(request('POST', { title: 'Same', slug: base, autoSlug: true }), ctx('')),
    ])
    expect([second.status, third.status]).toEqual([201, 201])
    const slugs = [first.slug, (await second.json()).slug, (await third.json()).slug].sort()
    expect(slugs).toEqual([base, `${base}-2`, `${base}-3`])
    // A typed slug that is taken is still an error.
    expect((await create(request('POST', { title: 'Same', slug: base }), ctx(''))).status).toBe(409)
    // A published post never moves to another URL on its own.
    const live = await fixture({ status: 'PUBLISHED', publishedAt: new Date(Date.now() - 1000) })
    expect((await patch(request('PATCH', { slug: base, autoSlug: true }), ctx(live.id))).status).toBe(409)
  })

  it('names the invalid fields in validation errors (never their values)', async () => {
    const post = await fixture()
    const response = await patch(request('PATCH', { metaImage: 'javascript:alert(1)', bogus: 1 }), ctx(post.id))
    expect(response.status).toBe(400)
    const { error } = await response.json()
    expect(error).toMatch(/^Validation failed: /)
    expect(error).toContain('bogus')
    expect(error).not.toContain('javascript')
  })

  it('rejects removed fields: passwords, end dates and non-HTML bodies', async () => {
    const post = await fixture()
    for (const data of [{ visibility: 'PASSWORD' }, { visibility: 'NOINDEX' }, { password: 'strong-password-123' }, { unpublishAt: '2035-01-01T12:00:00Z' }, { seoTitle: 'x' }, { theme: 'Green' }]) {
      expect((await patch(request('PATCH', data), ctx(post.id))).status).toBe(400)
    }
  })

  it('bulk validates all IDs, audits every change and revalidates', async () => {
    const post = await fixture()
    expect((await bulk(request('POST', { ids: [post.id, 'missing'], action: 'publish' }), ctx(''))).status).toBe(404)
    expect((await db.post.findUniqueOrThrow({ where: { id: post.id } })).status).toBe('DRAFT')
    expect((await bulk(request('POST', { ids: [post.id], action: 'publish' }), ctx(''))).status).toBe(200)
    expect(await db.auditLog.count({ where: { entityId: post.id, action: 'PUBLISH' } })).toBe(1)
    expect(mocks.revalidatePost).toHaveBeenCalledWith(post.slug, post.slug)
  })

  it('rejects cross-origin writes and oversized requests', async () => {
    const badOrigin = new Request('http://localhost/api/admin/posts', { method: 'POST', headers: { host: 'localhost', origin: 'https://evil.test' }, body: '{}' })
    expect((await create(badOrigin, ctx(''))).status).toBe(403)
    const large = request('POST', { title: 'x'.repeat(2_000_001) })
    expect((await create(large, ctx(''))).status).toBe(413)
  })
})

describe('slugs', () => {
  it('cut long titles before trimming, so a slug never ends in a hyphen', async () => {
    const { slugify, isValidSlug, fallbackSlug } = await import('@/cms/lib/utils')
    const long = `${'a'.repeat(119)} b`
    expect(slugify(long)).toBe('a'.repeat(119))
    expect(isValidSlug(slugify(long))).toBe(true)
    expect(slugify('日本語のニュース')).toBe('')
    expect(slugify('🚀 Lanzamiento')).toBe('lanzamiento')
    expect(fallbackSlug()).toMatch(/^post-[a-z0-9]{6}$/)
    expect(isValidSlug(fallbackSlug())).toBe(true)
  })
})

describe('post request validation', () => {
  it('rejects invalid types and unbounded bodies', () => {
    expect(createPostSchema.safeParse({ title: 'Title', slug: 'slug', body: {} }).success).toBe(false)
    expect(createPostSchema.safeParse({ title: 'Title', slug: 'slug', body: 'x'.repeat(1_500_001) }).success).toBe(false)
    expect(createPostSchema.safeParse({ title: 'Title', slug: 'slug', publishedAt: 'tomorrow' }).success).toBe(false)
    expect(createPostSchema.safeParse({ title: 'Title', slug: 'slug', blocks: [] }).success).toBe(false)
    expect(createPostSchema.safeParse({ title: 'Title', slug: 'slug', visibility: 'PASSWORD' }).success).toBe(false)
  })
})
