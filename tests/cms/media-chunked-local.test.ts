import { randomUUID } from 'node:crypto'
import { readFile, readdir, rm, stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it, vi } from 'vitest'
import { db } from '@/cms/lib/db'
import { HttpError } from '@/cms/lib/http'
import { can, type Permission } from '@/cms/lib/permissions'

// Videos sent in parts without a bucket (local development): the parts wait in the system temp folder and are joined
// into public/cms, which the dev server serves. No bucket variables are set in tests.
const state = vi.hoisted(() => ({ userId: `chunk-local-${Math.random().toString(36).slice(2)}` }))
vi.mock('@/cms/lib/auth', () => {
  const requirePermission = async (permission: Permission) => {
    if (!can('ADMIN', permission)) throw new HttpError(403, 'Not allowed')
    return { user: { id: state.userId, email: 'chunk-local@near.org', role: 'ADMIN' } }
  }
  return { requirePermission, requireActor: (_req: Request, permission: Permission) => requirePermission(permission) }
})
vi.mock('@/cms/lib/cache-tags', () => ({ revalidatePost: vi.fn() }))

import { bucketEnabled } from '@/cms/lib/bucket'
import { PART_SIZE, readTicket } from '@/cms/lib/chunked-upload'
import { POST as START } from '@/app/(cms)/api/admin/media/uploads/route'
import { PUT as PART } from '@/app/(cms)/api/admin/media/uploads/part/route'
import { POST as COMPLETE } from '@/app/(cms)/api/admin/media/uploads/complete/route'
import { POST as ABORT } from '@/app/(cms)/api/admin/media/uploads/abort/route'

const ORIGIN = 'http://localhost:3055'
const headers = { host: 'localhost:3055', origin: ORIGIN }
const post = (p: string, body: unknown) => new Request(`${ORIGIN}${p}`, { method: 'POST', headers: { ...headers, 'content-type': 'application/json' }, body: JSON.stringify(body) })
const put = (n: number, ticket: string, body: Buffer) => new Request(`${ORIGIN}/api/admin/media/uploads/part?n=${n}`, { method: 'PUT', headers: { ...headers, 'x-upload-ticket': ticket }, body: new Uint8Array(body) })
const webm = (size: number) => { const b = Buffer.alloc(size, 3); Buffer.from([0x1a, 0x45, 0xdf, 0xa3]).copy(b); return b }
const tempDir = (ticket: string) => path.join(os.tmpdir(), 'ncms-uploads', readTicket(ticket, state.userId).up)

describe.skipIf(!process.env.TEST_DATABASE_URL || bucketEnabled)('video parts without a bucket (database)', () => {
  const written: string[] = []
  afterAll(async () => {
    for (const key of written) await rm(path.join(process.cwd(), 'public', key), { force: true })
    await db.media.deleteMany({ where: { key: { in: written } } })
    await db.auditLog.deleteMany({ where: { userId: state.userId } })
  })

  it('joins the parts into public/cms and clears the temp folder', async () => {
    const file = webm(PART_SIZE + 2048)
    const started = await START(post('/api/admin/media/uploads', { filename: 'clip.webm', ext: 'webm', size: file.length, videosOnly: true }), undefined)
    expect(started.status).toBe(201)
    const { ticket, parts } = await started.json()
    expect(parts).toBe(2)
    expect((await PART(put(2, ticket, file.subarray(PART_SIZE)), undefined)).status).toBe(200)
    expect((await PART(put(1, ticket, file.subarray(0, PART_SIZE)), undefined)).status).toBe(200)
    // a part sent twice (a retry) just takes its place
    expect((await PART(put(1, ticket, file.subarray(0, PART_SIZE)), undefined)).status).toBe(200)
    const dir = tempDir(ticket)
    const res = await COMPLETE(post('/api/admin/media/uploads/complete', { ticket }), undefined)
    expect(res.status).toBe(201)
    const media = await res.json()
    written.push(media.key)
    expect(media).toMatchObject({ mimeType: 'video/webm', size: file.length })
    expect((await readFile(path.join(process.cwd(), 'public', media.key))).equals(file)).toBe(true)
    expect(await stat(dir).catch(() => null)).toBeNull()
    expect((await readdir(path.join(process.cwd(), 'public', 'cms'))).some((name) => name.endsWith('.upload'))).toBe(false)
    // repeated: the same row, nothing joined again
    const again = await COMPLETE(post('/api/admin/media/uploads/complete', { ticket }), undefined)
    expect((await again.json()).id).toBe(media.id)
  })

  it('after abort a part is refused and no folder comes back', async () => {
    const started = await START(post('/api/admin/media/uploads', { filename: `${randomUUID()}.webm`, ext: 'webm', size: 64 }), undefined)
    const { ticket } = await started.json()
    expect((await ABORT(post('/api/admin/media/uploads/abort', { ticket }), undefined)).status).toBe(200)
    expect((await PART(put(1, ticket, webm(64)), undefined)).status).toBe(410)
    expect(await stat(tempDir(ticket)).catch(() => null)).toBeNull()
    expect((await COMPLETE(post('/api/admin/media/uploads/complete', { ticket }), undefined)).status).toBe(410)
  })
})
