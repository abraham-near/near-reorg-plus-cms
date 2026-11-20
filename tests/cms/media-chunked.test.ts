import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/cms/lib/db'
import { HttpError } from '@/cms/lib/http'
import { hashPassword } from '@/cms/lib/password'
import { can, type Permission } from '@/cms/lib/permissions'
import type { Role } from '@/generated/prisma/client'

// Videos sent in parts (src/cms/lib/chunked-upload.ts) against an in-memory bucket that behaves like S3 multipart:
// nothing exists until complete, parts can be listed, a finished or aborted upload is gone.
const state = vi.hoisted(() => ({ role: 'ADMIN' as Role, userId: 'chunk-user', email: 'chunk-test@near.org' }))
const fake = vi.hoisted(() => ({ uploads: new Map<string, { key: string; parts: Map<number, Buffer> }>(), objects: new Map<string, Buffer>(), n: 0 }))
vi.mock('@/cms/lib/auth', () => {
  const requirePermission = async (permission: Permission) => {
    if (!can(state.role, permission)) throw new HttpError(403, 'Not allowed')
    return { user: { id: state.userId, email: state.email, role: state.role } }
  }
  return { requirePermission, requireActor: (_req: Request, permission: Permission) => requirePermission(permission) }
})
vi.mock('@/cms/lib/cache-tags', () => ({ revalidatePost: vi.fn() }))
vi.mock('@/cms/lib/bucket', () => {
  const noSuchUpload = () => Object.assign(new Error('The specified upload does not exist'), { name: 'NoSuchUpload' })
  const upload = (id: string) => { const u = fake.uploads.get(id); if (!u) throw noSuchUpload(); return u }
  return {
    bucketEnabled: true,
    putMedia: vi.fn(), deleteMedia: vi.fn(), getMediaObject: vi.fn(), presignMedia: vi.fn(),
    createUpload: async (key: string) => { const id = `up-${++fake.n}`; fake.uploads.set(id, { key, parts: new Map() }); return id },
    uploadPart: async (_key: string, id: string, n: number, body: Buffer) => { upload(id).parts.set(n, Buffer.from(body)) },
    listParts: async (_key: string, id: string) => [...upload(id).parts].map(([n, b]) => ({ PartNumber: n, ETag: `"e${n}"`, Size: b.length })),
    completeUpload: async (key: string, id: string, parts: { PartNumber: number }[]) => {
      const u = upload(id)
      fake.objects.set(key, Buffer.concat(parts.map((p) => u.parts.get(p.PartNumber)!)))
      fake.uploads.delete(id)
    },
    abortUpload: async (_key: string, id: string) => { if (!fake.uploads.delete(id)) throw noSuchUpload() },
    headMedia: async (key: string) => fake.objects.get(key)?.length ?? null,
    abortStaleUploads: vi.fn(async () => 0),
    isNoSuchUpload: (error: unknown) => (error as Error | undefined)?.name === 'NoSuchUpload',
  }
})

import { issueTicket, PART_SIZE, partCount, partLength, readTicket } from '@/cms/lib/chunked-upload'
import { POST as START } from '@/app/(cms)/api/admin/media/uploads/route'
import { PUT as PART } from '@/app/(cms)/api/admin/media/uploads/part/route'
import { POST as COMPLETE } from '@/app/(cms)/api/admin/media/uploads/complete/route'
import { POST as ABORT } from '@/app/(cms)/api/admin/media/uploads/abort/route'
import { PUT as POSTER } from '@/app/(cms)/api/admin/media/uploads/poster/route'
import { PATCH as PATCH_MEDIA } from '@/app/(cms)/api/admin/media/[id]/route'
import { removeMedia } from '@/cms/components/media/service'

const MB = 1024 * 1024
const ORIGIN = 'http://localhost:3055'
const headers = { host: 'localhost:3055', origin: ORIGIN }
const post = (path: string, body: unknown, extra: Record<string, string> = {}) =>
  new Request(`${ORIGIN}${path}`, { method: 'POST', headers: { ...headers, 'content-type': 'application/json', ...extra }, body: JSON.stringify(body) })
const put = (n: number | string, ticket: string, body: Buffer) =>
  new Request(`${ORIGIN}/api/admin/media/uploads/part?n=${n}`, { method: 'PUT', headers: { ...headers, 'x-upload-ticket': ticket }, body: new Uint8Array(body) })

/** An MP4 of `size` bytes: a real ftyp box, then filler. */
const mp4 = (size: number) => { const b = Buffer.alloc(size, 7); Buffer.from([0, 0, 0, 0x18]).copy(b); Buffer.from('ftypisom').copy(b, 4); return b }
const slice = (file: Buffer, n: number) => file.subarray((n - 1) * PART_SIZE, Math.min(file.length, n * PART_SIZE))

async function start(body: Record<string, unknown>) {
  const res = await START(post('/api/admin/media/uploads', body), undefined)
  return { res, data: await res.json() as { ticket: string; partSize: number; parts: number; error?: string } }
}
async function sendAll(ticket: string, file: Buffer, parts: number) {
  for (let n = 1; n <= parts; n++) expect((await PART(put(n, ticket, slice(file, n)), undefined)).status).toBe(200)
}

beforeEach(() => { state.role = 'ADMIN'; state.userId = 'chunk-user' })

describe('parts and tickets', () => {
  it('splits a size into 6 MiB parts, the rest last', () => {
    expect(PART_SIZE).toBe(6 * MB)
    expect(partCount(1)).toBe(1)
    expect(partLength(1, 1)).toBe(1)
    expect(partCount(2 * PART_SIZE)).toBe(2)
    expect(partLength(2 * PART_SIZE, 2)).toBe(PART_SIZE)
    expect(partCount(2 * PART_SIZE + 5)).toBe(3)
    expect(partLength(2 * PART_SIZE + 5, 3)).toBe(5)
    expect(partCount(100 * MB)).toBe(17)
  })
  it('a ticket only works for the person it was made for, unchanged and before it expires', () => {
    const now = Date.now()
    const ticket = issueTicket({ key: 'cms/a.mp4', up: 'u', uid: 'me', ext: 'mp4', mime: 'video/mp4', size: 10, name: 'a.mp4', parts: 1 }, now)
    expect(readTicket(ticket, 'me', now).key).toBe('cms/a.mp4')
    expect(() => readTicket(ticket, 'someone-else', now)).toThrow(expect.objectContaining({ status: 400 }))
    const [payload, signature] = ticket.split('.')
    const forged = `${Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload, 'base64url').toString()), size: 999 })).toString('base64url')}.${signature}`
    expect(() => readTicket(forged, 'me', now)).toThrow(expect.objectContaining({ status: 400 }))
    expect(() => readTicket(ticket, 'me', now + 3 * 60 * 60 * 1000)).toThrow(expect.objectContaining({ status: 410 }))
    expect(() => readTicket(undefined, 'me', now)).toThrow(expect.objectContaining({ status: 400 }))
  })
})

describe('starting and sending parts', () => {
  it('refuses API tokens: Claude uploads images only', async () => {
    const res = await START(post('/api/admin/media/uploads', { filename: 'a.mp4', ext: 'mp4', size: 10 }, { authorization: `Bearer ncms_${'a'.repeat(43)}` }), undefined)
    expect(res.status).toBe(401)
  })
  it('refuses what is not a video, MOV where only MP4/WebM play, and more than 100 MB', async () => {
    expect((await start({ filename: 'a.jpg', ext: 'jpg', size: 10 })).res.status).toBe(415)
    expect((await start({ filename: 'a.mov', ext: 'mov', size: 10, videosOnly: true })).res.status).toBe(415)
    expect((await start({ filename: 'a.mp4', ext: 'mp4', size: 100 * MB + 1 })).res.status).toBe(413)
    expect((await start({ filename: 'a.mp4', ext: 'mp4', size: 100 * MB })).data.parts).toBe(17)
    expect((await start({ filename: 'a.mov', ext: 'mov', size: 10 })).res.status).toBe(201)
  })
  it('a page renamed .mp4 is refused at part 1, and nothing is kept', async () => {
    const { data } = await start({ filename: 'evil.mp4', ext: 'mp4', size: 64 })
    const html = Buffer.alloc(64, 32)
    Buffer.from('<!doctype html><script>alert(1)</script>').copy(html)
    const before = fake.uploads.size
    const res = await PART(put(1, data.ticket, html), undefined)
    expect(res.status).toBe(415)
    expect(fake.uploads.size).toBe(before - 1)
    expect((await PART(put(1, data.ticket, mp4(64)), undefined)).status).toBe(410)
  })
  it('each part must be exactly its size, numbered within the upload, from the person who started it', async () => {
    const file = mp4(PART_SIZE + 100)
    const { data } = await start({ filename: 'a.mp4', ext: 'mp4', size: file.length })
    expect((await PART(put(1, data.ticket, slice(file, 1).subarray(1)), undefined)).status).toBe(400)
    expect((await PART(put(2, data.ticket, Buffer.alloc(101)), undefined)).status).toBe(400)
    expect((await PART(put(3, data.ticket, Buffer.alloc(1)), undefined)).status).toBe(400)
    expect((await PART(put('1.5', data.ticket, slice(file, 1)), undefined)).status).toBe(400)
    state.userId = 'someone-else'
    expect((await PART(put(1, data.ticket, slice(file, 1)), undefined)).status).toBe(400)
  })
  it('an MP4 named .mov is refused with what it really is', async () => {
    const { data } = await start({ filename: 'clip.mov', ext: 'mov', size: 64 })
    const res = await PART(put(1, data.ticket, mp4(64)), undefined)
    expect(res.status).toBe(415)
    expect((await res.json()).error).toBe('This file is an MP4 video, not MOV. Rename it to .mp4 and upload it again.')
  })
  it('abort drops the parts sent so far', async () => {
    const { data } = await start({ filename: 'a.mp4', ext: 'mp4', size: 64 })
    await sendAll(data.ticket, mp4(64), 1)
    expect((await ABORT(post('/api/admin/media/uploads/abort', { ticket: data.ticket }), undefined)).status).toBe(200)
    expect((await PART(put(1, data.ticket, mp4(64)), undefined)).status).toBe(410)
  })
})

describe.skipIf(!process.env.TEST_DATABASE_URL)('completing (database)', () => {
  const prefix = `chunk-test-${randomUUID().slice(0, 8)}`
  let realUser = ''
  beforeAll(async () => {
    realUser = (await db.user.create({ data: { email: `${prefix}@near.org`, name: 'Chunk', role: 'ADMIN', passwordHash: await hashPassword('test-password-123') }, select: { id: true } })).id
  })
  beforeEach(() => { state.userId = realUser; state.email = `${prefix}@near.org` })
  const keys: string[] = []
  afterAll(async () => {
    await db.revision.deleteMany({ where: { authorId: realUser } }).catch(() => undefined)
    await db.post.deleteMany({ where: { slug: { startsWith: prefix } } })
    await db.media.deleteMany({ where: { OR: [{ key: { in: keys } }, { url: { startsWith: `/cms/${prefix}` } }] } })
    await db.auditLog.deleteMany({ where: { userEmail: `${prefix}@near.org` } })
    await db.user.deleteMany({ where: { id: realUser } })
  })

  it('stores the whole file once, records it and its upload, and can be repeated safely', async () => {
    const file = mp4(2 * PART_SIZE + 333)
    const { data } = await start({ filename: 'Launch talk.mp4', ext: 'mp4', size: file.length })
    expect(data.parts).toBe(3)
    // Not there until complete.
    await sendAll(data.ticket, file, 2)
    const early = await COMPLETE(post('/api/admin/media/uploads/complete', { ticket: data.ticket }), undefined)
    expect(early.status).toBe(400)
    await sendAll(data.ticket, file, 3)
    const res = await COMPLETE(post('/api/admin/media/uploads/complete', { ticket: data.ticket, alt: 'The launch talk' }), undefined)
    expect(res.status).toBe(201)
    const media = await res.json()
    keys.push(media.key)
    expect(media).toMatchObject({ filename: 'Launch talk.mp4', mimeType: 'video/mp4', size: file.length, alt: 'The launch talk' })
    expect(media.url).toMatch(/^\/cms\/[0-9a-f]{32}\.mp4$/)
    expect(fake.objects.get(media.key)?.equals(file)).toBe(true)
    const again = await COMPLETE(post('/api/admin/media/uploads/complete', { ticket: data.ticket }), undefined)
    expect(again.status).toBe(200)
    expect((await again.json()).id).toBe(media.id)
    expect(await db.auditLog.count({ where: { action: 'UPLOAD', entityId: media.id } })).toBe(1)
  })

  it('a replacement puts the new video in every post that used the old one', async () => {
    const oldUrl = `/cms/${prefix}-old.mp4`
    await db.media.create({ data: { key: oldUrl.slice(1), url: oldUrl, filename: 'old.mp4', mimeType: 'video/mp4', size: 10, alt: 'Old alt' } })
    const p = await db.post.create({ data: { slug: `${prefix}-p`, title: 'Talk', video: oldUrl }, select: { id: true } })
    const original = await db.media.findUniqueOrThrow({ where: { url: oldUrl } })
    const file = mp4(500)
    // MP4/WebM stays MP4/WebM, even when the picker did not say so.
    expect((await start({ filename: 'b.mov', ext: 'mov', size: 10, replaceId: original.id })).res.status).toBe(415)
    const { data } = await start({ filename: 'new.mp4', ext: 'mp4', size: file.length, replaceId: original.id })
    await sendAll(data.ticket, file, 1)
    const res = await COMPLETE(post('/api/admin/media/uploads/complete', { ticket: data.ticket, replaceEverywhere: true }), undefined)
    expect(res.status).toBe(200)
    const result = await res.json()
    keys.push(result.media.key)
    expect(result).toMatchObject({ updated: 1, originalRetained: true, media: { alt: 'Old alt' } })
    expect((await db.post.findUniqueOrThrow({ where: { id: p.id } })).video).toBe(result.media.url)
  })

  it('a complete that finds the upload already joined by another one records the file instead of failing', async () => {
    const file = mp4(300)
    const { data } = await start({ filename: 'race.mp4', ext: 'mp4', size: file.length })
    await sendAll(data.ticket, file, 1)
    // The first complete joined it in the bucket but has not recorded it yet.
    const ticket = readTicket(data.ticket, state.userId)
    const parts = fake.uploads.get(ticket.up)!.parts
    fake.objects.set(ticket.key, Buffer.concat([...parts.values()]))
    fake.uploads.delete(ticket.up)
    const res = await COMPLETE(post('/api/admin/media/uploads/complete', { ticket: data.ticket }), undefined)
    expect(res.status).toBe(201)
    keys.push((await res.json()).key)
  })

  it('a repeated complete of a replacement still moves the posts (the first one failed after storing the file)', async () => {
    const oldUrl = `/cms/${prefix}-retry.mp4`
    const original = await db.media.create({ data: { key: oldUrl.slice(1), url: oldUrl, filename: 'retry.mp4', mimeType: 'video/mp4', size: 10 } })
    const p = await db.post.create({ data: { slug: `${prefix}-retry`, title: 'Talk', video: oldUrl }, select: { id: true } })
    const { data } = await start({ filename: 'new.mp4', ext: 'mp4', size: 400, replaceId: original.id })
    await sendAll(data.ticket, mp4(400), 1)
    // As if the first complete stored the row and then failed before moving the posts.
    const ticket = readTicket(data.ticket, state.userId)
    const parts = fake.uploads.get(ticket.up)!.parts
    fake.objects.set(ticket.key, Buffer.concat([...parts.values()]))
    fake.uploads.delete(ticket.up)
    await db.media.create({ data: { key: ticket.key, url: `/${ticket.key}`, filename: 'new.mp4', mimeType: 'video/mp4', size: 400 } })
    keys.push(ticket.key)
    const res = await COMPLETE(post('/api/admin/media/uploads/complete', { ticket: data.ticket }), undefined)
    expect(res.status).toBe(200)
    expect((await res.json()).updated).toBe(1)
    expect((await db.post.findUniqueOrThrow({ where: { id: p.id } })).video).toBe(`/${ticket.key}`)
  })

  it('a replacement whose original was deleted meanwhile is dropped', async () => {
    const oldUrl = `/cms/${prefix}-gone.mp4`
    const original = await db.media.create({ data: { key: oldUrl.slice(1), url: oldUrl, filename: 'gone.mp4', mimeType: 'video/mp4', size: 10 } })
    const { data } = await start({ filename: 'new.mp4', ext: 'mp4', size: 64, replaceId: original.id })
    await sendAll(data.ticket, mp4(64), 1)
    await db.media.delete({ where: { id: original.id } })
    const res = await COMPLETE(post('/api/admin/media/uploads/complete', { ticket: data.ticket }), undefined)
    expect(res.status).toBe(404)
    expect((await PART(put(1, data.ticket, mp4(64)), undefined)).status).toBe(410)
  })

  it('keeps what the browser read (size, length) and a poster frame, stored as a re-encoded image', async () => {
    const file = mp4(256)
    const { data } = await start({ filename: 'Keynote.mp4', ext: 'mp4', size: file.length })
    await sendAll(data.ticket, file, 1)
    const frame = await sharp({ create: { width: 64, height: 36, channels: 3, background: '#3a6' } }).jpeg().toBuffer()
    const putPoster = (ticket: string) => POSTER(new Request(`${ORIGIN}/api/admin/media/uploads/poster`, { method: 'PUT', headers: { ...headers, 'x-upload-ticket': ticket }, body: new Uint8Array(frame) }), undefined)
    // not before the video is stored
    expect((await putPoster(data.ticket)).status).toBe(409)
    const res = await COMPLETE(post('/api/admin/media/uploads/complete', { ticket: data.ticket, width: 1920, height: 1080, duration: 42.4 }), undefined)
    const video = await res.json()
    keys.push(video.key)
    expect(video).toMatchObject({ width: 1920, height: 1080, duration: 42, posterUrl: null })
    const framed = await putPoster(data.ticket)
    expect(framed.status).toBe(200)
    const withPoster = await framed.json()
    expect(withPoster.posterUrl).toMatch(/^\/cms\/[0-9a-f]{16}\.webp$/)
    const poster = await db.media.findUniqueOrThrow({ where: { url: withPoster.posterUrl } })
    keys.push(poster.key)
    expect(poster).toMatchObject({ mimeType: 'image/webp', filename: 'Keynote poster.webp', width: 64, height: 36 })
    // not an image: refused
    const html = await POSTER(new Request(`${ORIGIN}/api/admin/media/uploads/poster`, { method: 'PUT', headers: { ...headers, 'x-upload-ticket': data.ticket }, body: new TextEncoder().encode('<html></html>') }), undefined)
    expect(html.status).toBe(415)

    // A poster chosen later: only an image of the library, on a video; deleting the image takes it away.
    const patch = (id: string, body: unknown) => PATCH_MEDIA(new Request(`${ORIGIN}/api/admin/media/${id}`, { method: 'PATCH', headers: { ...headers, 'content-type': 'application/json' }, body: JSON.stringify(body) }), { params: Promise.resolve({ id }) })
    expect((await patch(video.id, { posterUrl: video.url })).status).toBe(400)
    expect((await patch(video.id, { posterUrl: '/cms/missing.webp' })).status).toBe(400)
    expect((await patch(poster.id, { posterUrl: poster.url })).status).toBe(400)
    expect((await (await patch(video.id, { posterUrl: null })).json()).posterUrl).toBeNull()
    expect((await (await patch(video.id, { posterUrl: poster.url })).json()).posterUrl).toBe(poster.url)
    await removeMedia(poster.id, true, { id: state.userId, email: state.email })
    expect((await db.media.findUniqueOrThrow({ where: { id: video.id } })).posterUrl).toBeNull()
  })

  it('an image cannot be replaced by a video', async () => {
    const url = `/cms/${prefix}-img.png`
    const image = await db.media.create({ data: { key: url.slice(1), url, filename: 'a.png', mimeType: 'image/png', size: 10 } })
    expect((await start({ filename: 'a.mp4', ext: 'mp4', size: 64, replaceId: image.id })).res.status).toBe(415)
  })
})
