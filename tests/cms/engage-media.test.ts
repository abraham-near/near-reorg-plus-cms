import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { randomUUID } from 'node:crypto'
import { db } from '@/cms/lib/db'
import type { Role } from '@/generated/prisma/client'
import { can, type Permission } from '@/cms/lib/permissions'
import { HttpError } from '@/cms/lib/http'
import { replaceExactUrl, isCmsMediaUrl } from '@/cms/components/media/reference-values'
import { mediaPatchSchema, readMediaUpload } from '@/cms/components/media/validation'

const state = vi.hoisted(() => ({ role: 'ADMIN' as Role, userId: '', signedIn: true, deleteObject: vi.fn() }))
vi.mock('@/cms/lib/bucket', () => ({ bucketEnabled: true, deleteMedia: state.deleteObject }))
vi.mock('@/cms/lib/cache-tags', () => ({ revalidatePost: vi.fn() }))
vi.mock('@/cms/lib/auth', () => {
  const requirePermission = async (permission: Permission) => {
    if (!state.signedIn) throw new HttpError(401, 'Not signed in')
    if (!can(state.role, permission)) throw new HttpError(403, 'Not allowed')
    return { user: { id: state.userId, email: 'engage-test@near.org', role: state.role } }
  }
  return { requirePermission, requireActor: (_req: Request, permission: Permission) => requirePermission(permission), canActor: (user: { role: Role }, permission: Permission) => can(user.role, permission) }
})

import { DELETE, GET, PATCH } from '@/app/(cms)/api/admin/media/[id]/route'
import { DELETE as BULK_DELETE } from '@/app/(cms)/api/admin/media/bulk/route'
import { POST as UPLOAD } from '@/app/(cms)/api/admin/media/route'
import { POST as REPLACE } from '@/app/(cms)/api/admin/media/[id]/replace/route'
import { findMediaReferences, removeMedia, replaceMediaReferences } from '@/cms/components/media/service'

const id = `engage-${randomUUID()}`
const oldUrl = `/cms/${id}.png`
const newUrl = `/cms/${id}-replacement.png`
const actor = { id: '', email: 'engage-test@near.org' }
const req = (method: string, body?: unknown) => new Request('http://localhost:3055/api/admin/media/test', { method, headers: { host: 'localhost:3055', origin: 'http://localhost:3055', 'content-type': 'application/json' }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) })

describe('engage media whole-URL matching', () => {
  it('replaces nested URL values and HTML attributes without replacing keys or URL prefixes', () => {
    const input = { [oldUrl]: 'key', a: oldUrl, nested: [{ html: `<img src="${oldUrl}"><a href='${oldUrl}'>Download</a>` }], suffix: `${oldUrl}.backup`, query: `${oldUrl}?v=1`, absolute: `https://elsewhere.org${oldUrl}` }
    const result = replaceExactUrl(input, oldUrl, newUrl)
    expect(result.count).toBe(3)
    expect(result.value).toEqual({ ...input, a: newUrl, nested: [{ html: `<img src="${newUrl}"><a href='${newUrl}'>Download</a>` }] })
  })
  it('only accepts local CMS file targets', () => {
    expect(isCmsMediaUrl(oldUrl)).toBe(true)
    for (const url of ['//evil.org/a', '/cms/../secrets', '/cms/x.svg?redirect=evil', 'javascript:alert(1)', 'https://near.org/cms/x.png']) expect(isCmsMediaUrl(url)).toBe(false)
  })
  it('finds srcset candidates and unquoted attributes without rewriting external URL queries', () => {
    const html = `<img src=${oldUrl} srcset="${oldUrl}, /cms/other.png 2x,${oldUrl} 3x"><a href="https://outside.test/?asset=${oldUrl}">External</a>`
    const result = replaceExactUrl(html, oldUrl, newUrl)
    expect(result.count).toBe(3)
    expect(result.value).toBe(`<img src=${newUrl} srcset="${newUrl}, /cms/other.png 2x,${newUrl} 3x"><a href="https://outside.test/?asset=${oldUrl}">External</a>`)
    expect(replaceExactUrl(`https://outside.test/?asset=${oldUrl}`, oldUrl, newUrl).count).toBe(0)
    expect(replaceExactUrl(`<img src=" ${oldUrl} ">`, oldUrl, newUrl)).toEqual({ value: `<img src=" ${newUrl} ">`, count: 1 })
  })
  it('cleans filenames and rejects unknown fields', () => {
    expect(mediaPatchSchema.parse({ filename: '../../test.png' }).filename).toBe('test.png')
    expect(mediaPatchSchema.safeParse({ slug: 'download' }).success).toBe(false)
    expect(mediaPatchSchema.safeParse({ unknown: true }).success).toBe(false)
  })
  it('caps uploads before parsing and rejects ambiguous multipart fields', async () => {
    await expect(readMediaUpload(new Request('http://localhost/upload', { method: 'POST', headers: { 'content-length': '300000000' }, body: 'x' }))).rejects.toMatchObject({ status: 413 })
    const body = new FormData()
    body.set('file', new File(['%PDF-1.4'], 'file.pdf'))
    body.append('replaceEverywhere', '0')
    body.append('replaceEverywhere', '1')
    await expect(readMediaUpload(new Request('http://localhost/upload', { method: 'POST', body }))).rejects.toMatchObject({ status: 400 })
  })
})

describe('engage media route authorization', () => {
  beforeEach(() => { state.role = 'PUBLISHER'; state.signedIn = true })
  it('PUBLISHER cannot delete or bulk delete media', async () => {
    expect((await DELETE(req('DELETE'), { params: Promise.resolve({ id: 'missing' }) })).status).toBe(403)
    expect((await BULK_DELETE(req('DELETE', { ids: ['missing'] }), {})).status).toBe(403)
  })
  it('requires a session for uploads, replacements and edits', async () => {
    state.signedIn = false
    expect((await UPLOAD(req('POST'), {})).status).toBe(401)
    expect((await REPLACE(req('POST'), { params: Promise.resolve({ id: 'missing' }) })).status).toBe(401)
    expect((await PATCH(req('PATCH', { filename: 'new.png' }), { params: Promise.resolve({ id: 'missing' }) })).status).toBe(401)
  })
  it('requires a signed-in session for reads', async () => {
    state.signedIn = false
    expect((await GET(req('GET'), { params: Promise.resolve({ id: 'missing' }) })).status).toBe(401)
  })
  it('rejects cross-site mutations before accessing data', async () => {
    expect((await PATCH(new Request('http://localhost:3055/api/admin/media/id', { method: 'PATCH', headers: { host: 'localhost:3055', origin: 'https://evil.org' }, body: '{}' }), { params: Promise.resolve({ id: 'missing' }) })).status).toBe(403)
  })
})

describe.skipIf(!process.env.TEST_DATABASE_URL)('engage media database behavior', () => {
  beforeAll(async () => {
    const user = await db.user.create({ data: { email: `${id}@near.org`, name: 'Engage media tests', role: 'ADMIN', passwordHash: 'test-only' }, select: { id: true } })
    state.userId = user.id
    actor.id = user.id
    await db.media.create({ data: { id, key: oldUrl.slice(1), url: oldUrl, filename: 'original.png', mimeType: 'image/png', size: 12 } })
    await db.post.create({ data: { id, title: id, slug: id, body: `<p><img src="${oldUrl}"><a href="${oldUrl}">Download</a></p>`, featuredImage: oldUrl, metaImage: oldUrl } })
  })
  beforeEach(() => { state.role = 'ADMIN'; state.signedIn = true; state.deleteObject.mockReset() })
  afterAll(async () => {
    await db.$transaction([
      db.post.deleteMany({ where: { id } }),
      db.media.deleteMany({ where: { id: { startsWith: id } } }), db.revision.deleteMany({ where: { entityId: id } }),
      db.auditLog.deleteMany({ where: { userId: actor.id } }), db.user.deleteMany({ where: { id: actor.id } }),
    ])
  })
  it('lists where a file is used and refuses deletion while referenced', async () => {
    const references = await findMediaReferences(oldUrl)
    expect(references.filter((r) => r.id === id)).toEqual([expect.objectContaining({ entityType: 'POST', fields: ['body', 'featuredImage', 'metaImage'], occurrences: 4 })])
    const response = await DELETE(req('DELETE'), { params: Promise.resolve({ id }) })
    expect(response.status).toBe(409)
    expect(state.deleteObject).not.toHaveBeenCalled()
    expect(await db.media.count({ where: { id } })).toBe(1)
  })
  it('replaces all current content references, preserving prior snapshots and auditing each record', async () => {
    const result = await replaceMediaReferences(oldUrl, newUrl, actor)
    expect(result.updated).toBe(1)
    expect(result.occurrences).toBe(4)
    expect(await findMediaReferences(oldUrl)).toEqual([])
    expect((await findMediaReferences(newUrl)).filter((r) => r.id === id)).toHaveLength(1)
    const post = await db.post.findUniqueOrThrow({ where: { id } })
    expect(post).toMatchObject({ featuredImage: newUrl, metaImage: newUrl, body: `<p><img src="${newUrl}"><a href="${newUrl}">Download</a></p>` })
    const revisions = await db.revision.findMany({ where: { entityId: id }, select: { snapshot: true } })
    expect(revisions).toHaveLength(1)
    expect(revisions.every((r) => JSON.stringify(r.snapshot).includes(oldUrl))).toBe(true)
    expect(await db.auditLog.count({ where: { entityId: id, action: 'REPLACE_MEDIA' } })).toBe(1)
  })
  it('atomically transfers the alt text and refuses stale file versions', async () => {
    const original = await db.media.findUniqueOrThrow({ where: { id } })
    const replacement = await db.media.create({ data: { id: `${id}-replacement`, key: newUrl.slice(1), url: newUrl, filename: 'replacement.png', mimeType: 'image/png', size: 12 } })
    await expect(replaceMediaReferences(oldUrl, newUrl, actor, undefined, {
      replaceEverywhere: false, original: { ...original, updatedAt: new Date(0) }, replacement,
    })).rejects.toMatchObject({ status: 409 })
    expect((await db.media.findUniqueOrThrow({ where: { id: replacement.id } })).alt).toBeNull()
    const withAlt = await db.media.update({ where: { id }, data: { alt: 'Original description' } })
    expect(await replaceMediaReferences(oldUrl, newUrl, actor, undefined, { replaceEverywhere: false, original: withAlt, replacement })).toEqual({ updated: 0, occurrences: 0 })
    expect(await db.media.findUniqueOrThrow({ where: { id: replacement.id } })).toMatchObject({ alt: 'Original description' })
  })
  it('keeps the media row if bucket deletion fails; a later retry removes it', async () => {
    state.deleteObject.mockRejectedValueOnce(new Error('Test bucket unavailable'))
    await expect(removeMedia(id, false, actor)).rejects.toMatchObject({ status: 503 })
    expect(await db.media.count({ where: { id } })).toBe(1)
    await removeMedia(id, false, actor)
    expect(await db.media.count({ where: { id } })).toBe(0)
  })
})
