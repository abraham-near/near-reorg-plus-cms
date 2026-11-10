import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CurrentSession } from '@/cms/lib/session'

const mocks = vi.hoisted(() => ({ session: null as CurrentSession | null, sendEmail: vi.fn(async () => ({ ok: true as const })) }))
vi.mock('@/cms/lib/session', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/cms/lib/session')>()), getSession: vi.fn(async () => mocks.session) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }))
vi.mock('@/cms/lib/email', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/cms/lib/email')>()), sendEmail: mocks.sendEmail }))

import { GET as listPosts, POST as createPost } from '@/app/(cms)/api/admin/posts/route'
import { DELETE as deletePost, GET as getPost, PATCH as patchPost } from '@/app/(cms)/api/admin/posts/[id]/route'
import { DELETE as unlock, POST as lock } from '@/app/(cms)/api/admin/posts/[id]/lock/route'
import { POST as bulk } from '@/app/(cms)/api/admin/posts/bulk/route'
import { POST as restore } from '@/app/(cms)/api/admin/posts/[id]/revisions/route'
import { POST as createCategory } from '@/app/(cms)/api/admin/categories/route'
import { DELETE as deleteCategory, PATCH as patchCategory } from '@/app/(cms)/api/admin/categories/[id]/route'
import { POST as upload } from '@/app/(cms)/api/admin/media/route'
import { DELETE as deleteMedia, PATCH as patchMedia } from '@/app/(cms)/api/admin/media/[id]/route'
import { GET as whoami } from '@/app/(cms)/api/admin/whoami/route'
import { GET as users } from '@/app/(cms)/api/admin/users/route'
import { randomToken, sha256 } from '@/cms/lib/crypto'
import { db } from '@/cms/lib/db'
import { assertTokenPostWrite } from '@/cms/lib/posts/token-rules'
import { hasTestDb } from '../setup'

const HOUR = 60 * 60 * 1000
const at = (offset: number) => new Date(Date.now() + offset)

describe('post rules for tokens', () => {
  const body = '<p>Hello</p>'
  const live = { status: 'PUBLISHED' as const, slug: 'a', publishedAt: at(-HOUR), body }
  const scheduled = { ...live, publishedAt: at(2 * HOUR) }
  const draft = { status: 'DRAFT' as const, slug: 'a', publishedAt: null, body }
  const archived = { ...draft, status: 'ARCHIVED' as const }

  it('publishes now and edits drafts, scheduled and live posts', () => {
    expect(() => assertTokenPostWrite({ status: 'PUBLISHED' }, draft)).not.toThrow()
    expect(() => assertTokenPostWrite({ title: 'New', body: '<p>Edited</p>' }, live)).not.toThrow()
    expect(() => assertTokenPostWrite({ publishedAt: at(3 * HOUR).toISOString() }, scheduled)).not.toThrow()
    expect(() => assertTokenPostWrite({ status: 'DRAFT' }, live)).not.toThrow()
    expect(() => assertTokenPostWrite({ title: 'ok', slug: 'b', visibility: 'UNLISTED' }, draft)).not.toThrow()
    expect(() => assertTokenPostWrite({ title: 'New', slug: 'n' }, undefined)).not.toThrow()
  })

  it('keeps the URL and visibility of a published post', () => {
    for (const previous of [live, scheduled]) {
      expect(() => assertTokenPostWrite({ slug: 'b' }, previous)).toThrow(/URL/)
      expect(() => assertTokenPostWrite({ slug: 'a', title: 'Same slug' }, previous)).not.toThrow()
      expect(() => assertTokenPostWrite({ visibility: 'UNLISTED' }, previous)).toThrow(/visibility/)
    }
  })

  it('never empties a body', () => {
    expect(() => assertTokenPostWrite({ body: '<p> &nbsp;</p>' }, live)).toThrow(/empty body/)
    expect(() => assertTokenPostWrite({ body: '' }, draft)).toThrow(/empty body/)
    expect(() => assertTokenPostWrite({ body: '<p><img src="/x.png" alt="x"></p>' }, live)).not.toThrow()
    expect(() => assertTokenPostWrite({ body: '<p>x</p>' }, { ...draft, body: '' })).not.toThrow()
  })

  it('only moves an archived post out of the archive', () => {
    expect(() => assertTokenPostWrite({ status: 'DRAFT' }, archived)).not.toThrow()
    expect(() => assertTokenPostWrite({ status: 'PUBLISHED', publishedAt: new Date().toISOString() }, archived)).not.toThrow()
    expect(() => assertTokenPostWrite({ title: 'ok' }, archived)).toThrow(/archived/)
    expect(() => assertTokenPostWrite({ status: 'PUBLISHED', title: 'ok' }, archived)).toThrow(/archived/)
  })
})

describe.skipIf(!hasTestDb)('API token routes (database)', () => {
  const prefix = `api-token-rules-${randomUUID()}`
  const userId = `${prefix}-user`
  const secret = `ncms_${randomToken(32)}`
  let tokenId: string
  let n = 0
  const slug = () => `${prefix}-${++n}`
  const ctx = (id: string) => ({ params: Promise.resolve({ id }) })
  const req = (method: string, path: string, body?: unknown) => new Request(`http://localhost:3000${path}`, {
    method,
    headers: { host: 'localhost:3000', authorization: `Bearer ${secret}`, 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  const post = (overrides = {}) => db.post.create({ data: { title: 'Fixture', slug: slug(), body: '<p>x</p>', authorId: userId, ...overrides } })
  const body = async (res: Response) => ({ status: res.status, json: await res.json() })

  beforeAll(async () => {
    process.env.CMS_API_TOKENS_ENABLED = 'true'
    await db.user.create({ data: { id: userId, email: `${prefix}@near.org`, name: 'Claude Owner', passwordHash: 'x', role: 'ADMIN', emailVerifiedAt: new Date() } })
    tokenId = (await db.apiToken.create({ data: { name: 'rules', prefix: secret.slice(0, 12), tokenHash: sha256(secret), userId, expiresAt: at(24 * HOUR) } })).id
  })
  beforeEach(() => { mocks.session = null; mocks.sendEmail.mockClear() })
  afterAll(async () => {
    delete process.env.CMS_API_TOKENS_ENABLED
    await db.revision.deleteMany({ where: { authorId: userId } })
    await db.post.deleteMany({ where: { slug: { startsWith: prefix } } })
    await db.category.deleteMany({ where: { slug: { startsWith: prefix } } })
    await db.media.deleteMany({ where: { uploadedById: userId } })
    await db.auditLog.deleteMany({ where: { userId } })
    await db.rateLimit.deleteMany({ where: { key: { startsWith: 'apitoken' } } })
    await db.user.delete({ where: { id: userId } })
  })

  it('reports who is calling, narrowed to the token cap even for an admin', async () => {
    const { status, json } = await body(await whoami(req('GET', '/api/admin/whoami'), undefined))
    expect(status).toBe(200)
    expect(json.token).toMatchObject({ name: 'rules' })
    expect(json.capabilities).not.toContain('post:delete')
    expect(json.capabilities).not.toContain('user:manage')
  })

  it('no longer returns team notes', async () => {
    expect((await body(await whoami(req('GET', '/api/admin/whoami'), undefined))).json).not.toHaveProperty('teamNotes')
  })

  it('refuses tokens on routes outside its scope', async () => {
    expect((await users(req('GET', '/api/admin/users'), undefined)).status).toBe(401)
  })

  it('creates drafts and records the token on the audit row', async () => {
    const res = await createPost(req('POST', '/api/admin/posts', { title: 'Claude draft', slug: slug(), body: '<p>Hi</p><script>x</script>' }), undefined)
    expect(res.status).toBe(201)
    const created = await res.json()
    expect(created.status).toBe('DRAFT')
    expect(created.body).toBe('<p>Hi</p>')
    expect(await db.auditLog.findFirst({ where: { entityId: created.id, action: 'CREATE' } })).toMatchObject({ apiTokenId: tokenId })
    expect((await listPosts(req('GET', '/api/admin/posts?q=Claude'), undefined)).status).toBe(200)
  })

  it('publishes now and schedules, emailing the owner each time', async () => {
    const created = await createPost(req('POST', '/api/admin/posts', { title: 'Now', slug: slug(), status: 'PUBLISHED', body: '<p>x</p>' }), undefined)
    expect(created.status).toBe(201)
    const now = await created.json()
    expect(await db.auditLog.count({ where: { entityId: now.id, action: 'POST_PUBLISHED_VIA_TOKEN' } })).toBe(1)
    expect(mocks.sendEmail).toHaveBeenCalledTimes(1)

    const draft = await post()
    expect((await patchPost(req('PATCH', `/api/admin/posts/${draft.id}`, { title: 'No version' }), ctx(draft.id))).status).toBe(400)
    const soon = await patchPost(req('PATCH', `/api/admin/posts/${draft.id}`, { status: 'PUBLISHED', publishedAt: at(10 * 60_000).toISOString(), expectedUpdatedAt: draft.updatedAt.toISOString() }), ctx(draft.id))
    expect(soon.status).toBe(200)
    const scheduled = await soon.json()
    expect(await db.auditLog.count({ where: { entityId: draft.id, action: 'POST_SCHEDULED_VIA_TOKEN' } })).toBe(1)
    // Moving the time of a scheduled post is a new schedule.
    const moved = await patchPost(req('PATCH', `/api/admin/posts/${draft.id}`, { publishedAt: at(2 * HOUR).toISOString(), expectedUpdatedAt: scheduled.updatedAt }), ctx(draft.id))
    expect(moved.status).toBe(200)
    expect(await db.auditLog.count({ where: { entityId: draft.id, action: 'POST_SCHEDULED_VIA_TOKEN' } })).toBe(2)
    expect(mocks.sendEmail).toHaveBeenCalledTimes(3)
  })

  it('edits a live post, keeping a revision, but never deletes or restores it', async () => {
    const live = await post({ status: 'PUBLISHED', publishedAt: at(-HOUR) })
    const version = live.updatedAt.toISOString()
    const edited = await patchPost(req('PATCH', `/api/admin/posts/${live.id}`, { title: 'Edited live', expectedUpdatedAt: version }), ctx(live.id))
    expect(edited.status).toBe(200)
    const after = await edited.json()
    expect(after).toMatchObject({ title: 'Edited live', status: 'PUBLISHED', slug: live.slug })
    expect(await db.revision.count({ where: { entityType: 'POST', entityId: live.id } })).toBe(1)
    // Edits to a post that was already live are audited, not emailed.
    expect(mocks.sendEmail).not.toHaveBeenCalled()
    expect((await patchPost(req('PATCH', `/api/admin/posts/${live.id}`, { slug: slug(), expectedUpdatedAt: after.updatedAt }), ctx(live.id))).status).toBe(403)
    expect((await patchPost(req('PATCH', `/api/admin/posts/${live.id}`, { visibility: 'UNLISTED', expectedUpdatedAt: after.updatedAt }), ctx(live.id))).status).toBe(403)
    expect((await deletePost(req('DELETE', `/api/admin/posts/${live.id}`, {}), ctx(live.id))).status).toBe(401)
    expect((await restore(req('POST', `/api/admin/posts/${live.id}/revisions`, { revisionId: 'x' }), ctx(live.id))).status).toBe(401)
    expect((await bulk(req('POST', '/api/admin/posts/bulk', { ids: [live.id], action: 'delete' }), undefined)).status).toBe(403)
    expect((await bulk(req('POST', '/api/admin/posts/bulk', { ids: [live.id], action: 'publish' }), undefined)).status).toBe(403)
    expect(await db.post.findUnique({ where: { id: live.id } })).not.toBeNull()
    expect((await patchPost(req('PATCH', `/api/admin/posts/${live.id}`, { status: 'DRAFT', expectedUpdatedAt: after.updatedAt }), ctx(live.id))).status).toBe(200)
    const other = await post({ status: 'PUBLISHED', publishedAt: at(-HOUR) })
    expect((await bulk(req('POST', '/api/admin/posts/bulk', { ids: [other.id], action: 'archive' }), undefined)).status).toBe(200)
  })

  it('keeps browser and token locks apart', async () => {
    const draft = await post({ lockedById: userId, lockedAt: new Date() })
    // The owner's browser holds the lock: their token is a different editor.
    expect((await lock(req('POST', `/api/admin/posts/${draft.id}/lock`, {}), ctx(draft.id))).status).toBe(423)
    expect((await lock(req('POST', `/api/admin/posts/${draft.id}/lock`, { override: true }), ctx(draft.id))).status).toBe(403)
    const fresh = await getPost(req('GET', `/api/admin/posts/${draft.id}`), ctx(draft.id))
    expect((await patchPost(req('PATCH', `/api/admin/posts/${draft.id}`, { title: 'x', expectedUpdatedAt: (await fresh.json()).updatedAt }), ctx(draft.id))).status).toBe(423)
    await db.post.update({ where: { id: draft.id }, data: { lockedById: null, lockedAt: null } })
    expect((await lock(req('POST', `/api/admin/posts/${draft.id}/lock`, {}), ctx(draft.id))).status).toBe(200)
    expect(await db.post.findUniqueOrThrow({ where: { id: draft.id } })).toMatchObject({ lockedById: userId, lockedByTokenId: tokenId })
    expect((await unlock(req('DELETE', `/api/admin/posts/${draft.id}/lock`, {}), ctx(draft.id))).status).toBe(200)
  })

  it('edits scheduled posts and only moves archived ones out of the archive', async () => {
    const scheduled = await post({ status: 'PUBLISHED', publishedAt: at(3 * HOUR) })
    const edited = await patchPost(req('PATCH', `/api/admin/posts/${scheduled.id}`, { title: 'Edit', expectedUpdatedAt: scheduled.updatedAt.toISOString() }), ctx(scheduled.id))
    expect(edited.status).toBe(200)
    expect((await patchPost(req('PATCH', `/api/admin/posts/${scheduled.id}`, { slug: slug(), expectedUpdatedAt: (await edited.json()).updatedAt }), ctx(scheduled.id))).status).toBe(403)
    const archived = await post({ status: 'ARCHIVED' })
    expect((await patchPost(req('PATCH', `/api/admin/posts/${archived.id}`, { title: 'Edit', expectedUpdatedAt: archived.updatedAt.toISOString() }), ctx(archived.id))).status).toBe(403)
    expect((await patchPost(req('PATCH', `/api/admin/posts/${archived.id}`, { status: 'DRAFT', expectedUpdatedAt: archived.updatedAt.toISOString() }), ctx(archived.id))).status).toBe(200)
  })

  it('creates categories but does not rename or delete them', async () => {
    const res = await createCategory(req('POST', '/api/admin/categories', { name: `${prefix} cat`, slug: slug() }), undefined)
    expect(res.status).toBe(201)
    const { id } = await res.json()
    expect((await patchCategory(req('PATCH', `/api/admin/categories/${id}`, { name: 'Renamed' }), ctx(id))).status).toBe(401)
    expect((await deleteCategory(req('DELETE', `/api/admin/categories/${id}`), ctx(id))).status).toBe(401)
  })

  it('uploads images only and edits only alt text and filename', async () => {
    const form = (name: string, type: string, bytes: BlobPart) => {
      const data = new FormData()
      data.append('file', new File([bytes], name, { type }))
      return new Request('http://localhost:3000/api/admin/media', { method: 'POST', headers: { host: 'localhost:3000', authorization: `Bearer ${secret}` }, body: data })
    }
    const pdf = await upload(form('doc.pdf', 'application/pdf', '%PDF-1.4\n%test\n'), undefined)
    expect(pdf.status).toBe(415)
    const png = new Uint8Array(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'))
    const image = await upload(form('pixel.png', 'image/png', png), undefined)
    expect(image.status).toBe(201)
    const { id } = await image.json()
    expect((await patchMedia(req('PATCH', `/api/admin/media/${id}`, { alt: 'A pixel' }), ctx(id))).status).toBe(200)
    expect((await patchMedia(req('PATCH', `/api/admin/media/${id}`, { filename: 'pixel-renamed.png' }), ctx(id))).status).toBe(200)
    expect((await patchMedia(req('PATCH', `/api/admin/media/${id}`, { url: '/cms/other.png' }), ctx(id))).status).toBe(400)
    expect((await deleteMedia(req('DELETE', `/api/admin/media/${id}`, {}), ctx(id))).status).toBe(401)

    // Alt text never changes the file's URL, so it can be fixed on an image a live post uses.
    const { url } = await db.media.findUniqueOrThrow({ where: { id } })
    await post({ status: 'PUBLISHED', publishedAt: at(-HOUR), body: `<p><img src="${url}" alt=""></p>` })
    expect((await patchMedia(req('PATCH', `/api/admin/media/${id}`, { alt: 'Live use' }), ctx(id))).status).toBe(200)
    expect((await db.media.findUniqueOrThrow({ where: { id } })).alt).toBe('Live use')
  })
})
