import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/cms/lib/db'
import { hashPassword } from '@/cms/lib/password'

const mocks = vi.hoisted(() => ({ getSession: vi.fn(), revalidatePost: vi.fn() }))
vi.mock('@/cms/lib/session', () => ({ getSession: mocks.getSession }))
vi.mock('@/cms/lib/cache-tags', () => ({ revalidatePost: mocks.revalidatePost }))

import { POST as create } from '@/app/(cms)/api/admin/posts/route'
import { PATCH as patch } from '@/app/(cms)/api/admin/posts/[id]/route'
import { POST as restore } from '@/app/(cms)/api/admin/posts/[id]/revisions/route'
import { mediaUsageByUrl, replaceMediaReferences } from '@/cms/components/media/service'
import { storeUpload } from '@/cms/lib/media'

// Video posts against the real API, transactions and media references (TEST_DATABASE_URL).
const prefix = `video-test-${randomUUID().slice(0, 8)}`
const ctx = (id: string) => ({ params: Promise.resolve({ id }) })
const request = (method: string, body?: unknown, path = '/api/admin/posts') =>
  new Request(`http://localhost${path}`, { method, headers: { host: 'localhost', origin: 'http://localhost', 'content-type': 'application/json' }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) })

describe('an upload refused as a video is never stored', () => {
  it('videosOnly turns away an image before anything is written', async () => {
    const jpeg = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...new Array(64).fill(0)])], 'photo.jpg')
    await expect(storeUpload(jpeg, null, { videosOnly: true })).rejects.toMatchObject({ status: 415 })
    const mov = new File([Buffer.concat([Buffer.alloc(4), Buffer.from('ftypqt  '), Buffer.alloc(64)])], 'clip.mov')
    await expect(storeUpload(mov, null, { videosOnly: true })).rejects.toMatchObject({ status: 415 })
  })
})

describe.skipIf(!process.env.TEST_DATABASE_URL)('video posts (database)', () => {
  let user: { id: string; email: string; name: string; role: 'ADMIN' }
  let n = 0
  const slug = () => `${prefix}-${++n}`
  const mp4 = `/cms/${prefix}-a.mp4`
  const mp4b = `/cms/${prefix}-b.mp4`
  const notVideo = `/cms/${prefix}-img.mp4`

  beforeAll(async () => {
    user = await db.user.create({ data: { email: `${prefix}@near.org`, name: 'Video', role: 'ADMIN', passwordHash: await hashPassword('test-password-123') }, select: { id: true, email: true, name: true, role: true } }) as typeof user
    await db.media.createMany({ data: [
      { key: mp4.slice(1), url: mp4, filename: 'a.mp4', mimeType: 'video/mp4', size: 10, uploadedById: user.id },
      { key: mp4b.slice(1), url: mp4b, filename: 'b.mp4', mimeType: 'video/mp4', size: 10, uploadedById: user.id },
      // a row whose URL looks like a video but is not one: only the stored type counts
      { key: notVideo.slice(1), url: notVideo, filename: 'img.mp4', mimeType: 'image/png', size: 10, uploadedById: user.id },
    ] })
  })
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getSession.mockResolvedValue({ id: 'test-session', user })
  })
  afterAll(async () => {
    const posts = await db.post.findMany({ where: { slug: { startsWith: prefix } }, select: { id: true } })
    await db.revision.deleteMany({ where: { entityId: { in: posts.map((p) => p.id) } } })
    await db.auditLog.deleteMany({ where: { userId: user.id } })
    await db.post.deleteMany({ where: { slug: { startsWith: prefix } } })
    await db.media.deleteMany({ where: { url: { startsWith: `/cms/${prefix}` } } })
    await db.user.deleteMany({ where: { id: user.id } })
  })

  it('saves an uploaded MP4 of the library and a normalized link', async () => {
    const file = await create(request('POST', { title: 'Talk', slug: slug(), video: mp4 }), ctx(''))
    expect(file.status).toBe(201)
    expect((await file.json()).video).toBe(mp4)
    const link = await create(request('POST', { title: 'Talk', slug: slug(), video: 'https://youtu.be/dQw4w9WgXcQ?t=30' }), ctx(''))
    expect((await link.json()).video).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=30')
  })

  it('refuses a file that is missing or not a video', async () => {
    for (const video of [`/cms/${prefix}-missing.mp4`, notVideo]) {
      const r = await create(request('POST', { title: 'Talk', slug: slug(), video }), ctx(''))
      expect(r.status).toBe(400)
      expect((await r.json()).error).toMatch(/MP4 or WebM file from the media library/)
    }
    expect((await create(request('POST', { title: 'Talk', slug: slug(), video: 'https://example.com/a.mp4' }), ctx(''))).status).toBe(400)
  })

  it('a post whose file was deleted still saves while its video is unchanged', async () => {
    const gone = `/cms/${prefix}-gone.mp4`
    await db.media.create({ data: { key: gone.slice(1), url: gone, filename: 'gone.mp4', mimeType: 'video/mp4', size: 10 } })
    const post = await (await create(request('POST', { title: 'Talk', slug: slug(), video: gone }), ctx(''))).json()
    await db.media.delete({ where: { url: gone } })
    const r = await patch(request('PATCH', { title: 'Talk, edited', video: gone, expectedUpdatedAt: post.updatedAt }), ctx(post.id))
    expect(r.status).toBe(200)
    expect((await r.json()).video).toBe(gone)
  })

  it('restoring a revision brings the video back (or its absence)', async () => {
    const post = await (await create(request('POST', { title: 'Talk', slug: slug() }), ctx(''))).json()
    const withVideo = await (await patch(request('PATCH', { video: mp4, expectedUpdatedAt: post.updatedAt }), ctx(post.id))).json()
    expect(withVideo.video).toBe(mp4)
    const articleRevision = await db.revision.findFirstOrThrow({ where: { entityId: post.id }, orderBy: { createdAt: 'asc' } })
    const back = await restore(request('POST', { revisionId: articleRevision.id }), ctx(post.id))
    expect(back.status).toBe(200)
    expect((await back.json()).video).toBeNull()
    // a revision saved before video posts existed has no "video" key: the current video stays
    const again = await (await patch(request('PATCH', { video: mp4 }), ctx(post.id))).json()
    const old = await db.revision.create({ data: { entityType: 'POST', entityId: post.id, snapshot: { title: 'Old title', body: '<p>Old</p>' }, authorId: user.id } })
    const kept = await restore(request('POST', { revisionId: old.id, expectedUpdatedAt: again.updatedAt }), ctx(post.id))
    expect(kept.status).toBe(200)
    expect(await kept.json()).toMatchObject({ title: 'Old title', video: mp4 })
  })

  it('the media library counts the video as used, and replacing the file moves the post to the new one', async () => {
    const post = await (await create(request('POST', { title: 'Talk', slug: slug(), video: mp4 }), ctx(''))).json()
    expect((await mediaUsageByUrl()).get(mp4)).toBeGreaterThanOrEqual(1)
    const result = await replaceMediaReferences(mp4, mp4b, { id: user.id, email: user.email })
    expect(result.updated).toBeGreaterThanOrEqual(1)
    expect((await db.post.findUniqueOrThrow({ where: { id: post.id } })).video).toBe(mp4b)
  })
})
