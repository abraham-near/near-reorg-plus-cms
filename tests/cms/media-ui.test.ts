import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpError } from '@/cms/lib/http'
import { can, type Permission } from '@/cms/lib/permissions'
import type { Role } from '@/generated/prisma/client'
import { sniff } from '@/cms/lib/media'
import { extractCmsUrls } from '@/cms/components/media/reference-values'
import {
  acceptAttribute, checkUpload, findUploadKind, formatBytes, tileMeta, tooLargeMessage, UPLOAD_KINDS, uploadErrorMessage, uploadLimitLines,
} from '@/cms/components/media/upload-limits'

const state = vi.hoisted(() => ({ role: 'PUBLISHER' as Role, signedIn: true }))
vi.mock('@/cms/lib/auth', () => {
  const requirePermission = async (permission: Permission) => {
    if (!state.signedIn) throw new HttpError(401, 'Not signed in')
    if (!can(state.role, permission)) throw new HttpError(403, 'Not allowed')
    return { user: { id: 'u1', email: 'media-ui@near.org', role: state.role } }
  }
  return { requirePermission, requireActor: (_req: Request, permission: Permission) => requirePermission(permission) }
})

import { GET as USAGE } from '@/app/(cms)/api/admin/media/usage/route'

const MB = 1024 * 1024
const pad = (b: Buffer) => Buffer.concat([b, Buffer.alloc(32)])
const ftyp = (brand: string) => pad(Buffer.concat([Buffer.alloc(4), Buffer.from(`ftyp${brand}`)]))
const riff = (form: string) => pad(Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from(form)]))
const zip = pad(Buffer.from([0x50, 0x4b, 0x03, 0x04]))

// One sample per kind the server accepts, so the browser table cannot drift from src/cms/lib/media.ts.
const SAMPLES: Record<string, Buffer> = {
  jpg: pad(Buffer.from([0xff, 0xd8, 0xff, 0xe0])),
  png: pad(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  gif: pad(Buffer.from('GIF89a')),
  webp: riff('WEBP'),
  avif: ftyp('avif'),
  svg: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
  mp4: ftyp('isom'),
  webm: pad(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])),
  mov: ftyp('qt  '),
  mp3: pad(Buffer.from('ID3')),
  m4a: ftyp('M4A '),
  wav: riff('WAVE'),
  ogg: pad(Buffer.from('OggS')),
  pdf: pad(Buffer.from('%PDF-1.7')),
  docx: zip, xlsx: zip, pptx: zip, zip,
  csv: Buffer.from('a,b\n1,2\n'),
  woff: pad(Buffer.from('wOFF')),
  woff2: pad(Buffer.from('wOF2')),
}

describe('browser upload limits', () => {
  it('match the server for every accepted kind', () => {
    expect(UPLOAD_KINDS.map((kind) => kind.ext).sort()).toEqual(Object.keys(SAMPLES).sort())
    for (const kind of UPLOAD_KINDS) {
      const server = sniff(SAMPLES[kind.ext], `file.${kind.ext}`)
      expect(server, kind.ext).not.toBeNull()
      expect(server!.ext).toBe(kind.ext)
      expect(server!.max, kind.ext).toBe(kind.max)
      expect(server!.mime).toBe(kind.mimes[0])
      expect(server!.image === true, kind.ext).toBe(kind.group === 'image')
    }
  })
  it('formats sizes and limits the way the tray shows them', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(284 * 1024)).toBe('284 KB')
    expect(formatBytes(1.44 * MB)).toBe('1.4 MB')
    expect(formatBytes(22 * MB)).toBe('22 MB')
    expect(tooLargeMessage(22 * MB, 15 * MB)).toBe('Too large (22 MB). Max 15 MB.')
  })
  it('refuses obvious mistakes before uploading', () => {
    expect(checkUpload({ name: 'crowd-wide.png', type: 'image/png', size: 22 * MB })).toBe('Too large (22 MB). Max 15 MB.')
    expect(checkUpload({ name: 'logo.svg', type: 'image/svg+xml', size: 3 * MB })).toBe('Too large (3 MB). Max 2 MB.')
    expect(checkUpload({ name: 'setup.exe', type: 'application/x-msdownload', size: 10 })).toBe("This file type (.exe) can't be uploaded.")
    expect(checkUpload({ name: 'deck.pdf', type: 'application/pdf', size: 10 }, { imagesOnly: true })).toBe('Only images can be added here.')
    expect(checkUpload({ name: 'empty.png', type: 'image/png', size: 0 })).toBe('This file is empty.')
    expect(checkUpload({ name: 'photo.JPEG', type: '', size: MB })).toBeNull()
    expect(checkUpload({ name: 'clip', type: 'video/mp4', size: 150 * MB })).toBeNull()
    expect(findUploadKind({ name: 'IMG_1.jpeg' })?.ext).toBe('jpg')
  })
  it('turns server errors into clear sentences', () => {
    expect(uploadErrorMessage(413, 'File too large (max 15 MB for jpg)', { name: 'a.jpg', size: 22 * MB })).toBe('Too large (22 MB). Max 15 MB.')
    expect(uploadErrorMessage(413, 'File too large', { name: 'a.png', size: 300 * MB })).toBe('Too large (300 MB). Max 15 MB.')
    expect(uploadErrorMessage(415, 'Unsupported or unrecognized file type', { name: 'a.png', size: 10 })).toMatch(/can't be uploaded/)
    expect(uploadErrorMessage(429, 'Too many uploads. Try again in a minute.', { name: 'a.png', size: 10 })).toBe('Too many uploads. Try again in a minute.')
  })
  it('describes what can be dropped from the same table', () => {
    expect(uploadLimitLines(true)).toEqual(['JPG, PNG, WebP, GIF, AVIF or SVG · up to 15 MB each (SVG 2 MB)'])
    expect(uploadLimitLines()[1]).toBe('Video up to 200 MB · audio, PDF and Office files up to 50 MB (PPTX, ZIP 100 MB)')
    expect(acceptAttribute(true)).toContain('.jpeg')
    expect(acceptAttribute(true)).not.toContain('.pdf')
  })
  it('picks the tile line: usage, then missing alt text', () => {
    const image = { mimeType: 'image/png', filename: 'a.png', size: 284 * 1024, alt: null }
    expect(tileMeta(image, undefined)).toBe('PNG · 284 KB')
    expect(tileMeta(image, 0)).toBe('Not used yet')
    expect(tileMeta(image, 2)).toBe('Missing alt text')
    expect(tileMeta({ ...image, alt: 'Stage' }, 1)).toBe('In 1 post')
    expect(tileMeta({ ...image, alt: 'Stage' }, 3)).toBe('In 3 posts')
  })
})

describe('extractCmsUrls', () => {
  it('finds whole CMS URLs only, with the same rules as replacement', () => {
    const urls = extractCmsUrls([
      '<p><img src="/cms/aaa.png" srcset="/cms/bbb.webp 2x"><a href="https://x.test/?f=/cms/ccc.png">x</a></p>',
      '/cms/ddd.jpg',
      'see /cms/eee.png.backup and /cms/fff.png?v=2',
      null,
    ])
    expect([...urls].sort()).toEqual(['/cms/aaa.png', '/cms/bbb.webp', '/cms/ddd.jpg'])
  })
})

describe('GET /api/admin/media/usage', () => {
  beforeEach(() => { state.role = 'PUBLISHER'; state.signedIn = true })
  const get = (query: string) => USAGE(new Request(`http://localhost:3055/api/admin/media/usage${query}`, { headers: { host: 'localhost:3055' } }), {})
  it('requires a session', async () => {
    state.signedIn = false
    expect((await get('?ids=a')).status).toBe(401)
  })
  it('answers an empty list without touching the database, and caps the list', async () => {
    const empty = await get('?ids=')
    expect(empty.status).toBe(200)
    expect(await empty.json()).toEqual({ usage: {} })
    expect((await get(`?ids=${Array.from({ length: 101 }, (_, i) => `id${i}`).join(',')}`)).status).toBe(400)
  })
  it('refuses API tokens (browser-only endpoint)', async () => {
    const res = await USAGE(new Request('http://localhost:3055/api/admin/media/usage?ids=a', { headers: { host: 'localhost:3055', authorization: `Bearer ncms_${'a'.repeat(43)}` } }), {})
    expect(res.status).toBe(401)
  })
})
