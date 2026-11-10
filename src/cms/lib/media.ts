import 'server-only'
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import DOMPurify from 'isomorphic-dompurify'
import { bucketEnabled, putMedia } from './bucket'
import { db } from './db'
import { HttpError } from './http'

// Media uploads for the CMS. Files land in the S3-compatible bucket (or public/cms in development
// without one), named by content hash (`cms/<sha1-16>.<ext>`, served by src/app/(cms)/cms/[...path]). The
// type is decided by the file's bytes, never by the browser's Content-Type or the extension alone.

const MB = 1024 * 1024

type Kind = { ext: string; mime: string; max: number; image?: boolean; inline: boolean }

const KINDS: Record<string, Kind> = {
  jpg: { ext: 'jpg', mime: 'image/jpeg', max: 15 * MB, image: true, inline: true },
  png: { ext: 'png', mime: 'image/png', max: 15 * MB, image: true, inline: true },
  gif: { ext: 'gif', mime: 'image/gif', max: 15 * MB, image: true, inline: true },
  webp: { ext: 'webp', mime: 'image/webp', max: 15 * MB, image: true, inline: true },
  avif: { ext: 'avif', mime: 'image/avif', max: 15 * MB, image: true, inline: true },
  svg: { ext: 'svg', mime: 'image/svg+xml', max: 2 * MB, image: true, inline: true },
  mp4: { ext: 'mp4', mime: 'video/mp4', max: 200 * MB, inline: true },
  webm: { ext: 'webm', mime: 'video/webm', max: 200 * MB, inline: true },
  mov: { ext: 'mov', mime: 'video/quicktime', max: 200 * MB, inline: true },
  mp3: { ext: 'mp3', mime: 'audio/mpeg', max: 50 * MB, inline: true },
  m4a: { ext: 'm4a', mime: 'audio/mp4', max: 50 * MB, inline: true },
  wav: { ext: 'wav', mime: 'audio/wav', max: 50 * MB, inline: true },
  ogg: { ext: 'ogg', mime: 'audio/ogg', max: 50 * MB, inline: true },
  pdf: { ext: 'pdf', mime: 'application/pdf', max: 50 * MB, inline: true },
  zip: { ext: 'zip', mime: 'application/zip', max: 100 * MB, inline: false },
  docx: { ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', max: 50 * MB, inline: false },
  pptx: { ext: 'pptx', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', max: 100 * MB, inline: false },
  xlsx: { ext: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', max: 50 * MB, inline: false },
  csv: { ext: 'csv', mime: 'text/csv', max: 20 * MB, inline: false },
  woff: { ext: 'woff', mime: 'font/woff', max: 5 * MB, inline: true },
  woff2: { ext: 'woff2', mime: 'font/woff2', max: 5 * MB, inline: true },
}

export const MAX_UPLOAD_BYTES = 200 * MB

const startsWith = (b: Buffer, sig: number[], offset = 0) => sig.every((v, i) => b[offset + i] === v)
const ascii = (b: Buffer, start: number, end: number) => b.subarray(start, end).toString('latin1')

/** Detects the real file type from its first bytes; the extension only disambiguates containers. */
export function sniff(buf: Buffer, filename: string): Kind | null {
  const ext = path.extname(filename).slice(1).toLowerCase().replace('jpeg', 'jpg')
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return KINDS.jpg
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return KINDS.png
  if (ascii(buf, 0, 6) === 'GIF87a' || ascii(buf, 0, 6) === 'GIF89a') return KINDS.gif
  if (ascii(buf, 0, 4) === 'RIFF' && ascii(buf, 8, 12) === 'WEBP') return KINDS.webp
  if (ascii(buf, 0, 4) === 'RIFF' && ascii(buf, 8, 12) === 'WAVE') return KINDS.wav
  if (ascii(buf, 0, 5) === '%PDF-') return KINDS.pdf
  if (ascii(buf, 0, 4) === 'OggS') return KINDS.ogg
  if (startsWith(buf, [0x1a, 0x45, 0xdf, 0xa3])) return KINDS.webm
  if (ascii(buf, 0, 4) === 'wOFF') return KINDS.woff
  if (ascii(buf, 0, 4) === 'wOF2') return KINDS.woff2
  if (ascii(buf, 0, 3) === 'ID3' || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0)) return KINDS.mp3
  if (ascii(buf, 4, 8) === 'ftyp') {
    const brand = ascii(buf, 8, 12)
    if (brand === 'avif' || brand === 'avis') return KINDS.avif
    if (brand === 'qt  ') return KINDS.mov
    if (brand.startsWith('M4A')) return KINDS.m4a
    return KINDS.mp4
  }
  // Office documents are zip containers; trust the extension only among zip-based kinds.
  if (startsWith(buf, [0x50, 0x4b, 0x03, 0x04])) return ['docx', 'pptx', 'xlsx'].includes(ext) ? KINDS[ext] : KINDS.zip
  // Text formats: SVG and CSV have no magic number, so check the content looks right.
  const head = buf.subarray(0, 1024).toString('utf8').replace(/^\uFEFF/, '').trimStart()
  if (ext === 'svg' && /^(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>]*>\s*)?<svg[\s>]/i.test(head)) return KINDS.svg
  if (ext === 'csv' && !head.includes('\0') && !/^<|^%PDF/.test(head)) return KINDS.csv
  return null
}

/** Removes scripts, event handlers, foreignObject and external references from an SVG. */
export function sanitizeSvg(svg: string): string {
  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['script', 'foreignObject', 'iframe', 'use'],
    FORBID_ATTR: ['href', 'xlink:href'],
  })
}

function contentDisposition(filename: string, inline: boolean) {
  const ascii = filename.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '')
  return `${inline ? 'inline' : 'attachment'}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`
}

/** Strips paths and control characters from a user-supplied filename. */
export const cleanFilename = (name: string) =>
  (path.basename(name || 'file').replace(/[\u0000-\u001f\u007f]/g, '').trim() || 'file').slice(0, 200)

/**
 * Validates and stores an uploaded file, returning its Media row. Uploading the same bytes twice
 * returns the existing row (content-hash keys). Without bucket credentials (local dev) the file is
 * written to public/cms, which app/cms serves in development.
 */
export async function storeUpload(file: File, uploadedById: string | null, opts: { imagesOnly?: boolean } = {}) {
  if (file.size === 0) throw new HttpError(400, 'Empty file')
  if (file.size > MAX_UPLOAD_BYTES) throw new HttpError(413, 'File too large')
  const filename = cleanFilename(file.name)
  let buf: Buffer = Buffer.from(await file.arrayBuffer())
  const kind = sniff(buf, filename)
  if (!kind) throw new HttpError(415, 'Unsupported or unrecognized file type')
  if (opts.imagesOnly && !kind.image) throw new HttpError(415, 'Only images are allowed here')
  if (buf.length > kind.max) throw new HttpError(413, `File too large (max ${Math.round(kind.max / MB)} MB for ${kind.ext})`)
  if (kind.ext === 'svg') buf = Buffer.from(sanitizeSvg(buf.toString('utf8')))

  const name = `${createHash('sha1').update(buf).digest('hex').slice(0, 16)}.${kind.ext}`
  const key = `cms/${name}`
  const url = `/cms/${name}`

  const existing = await db.media.findUnique({ where: { key } })
  if (existing) return existing

  if (bucketEnabled) {
    await putMedia(key, buf, kind.mime, contentDisposition(filename, kind.inline))
  } else if (process.env.NODE_ENV !== 'production') {
    const dir = path.join(process.cwd(), 'public', 'cms')
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, name), buf)
  } else {
    throw new HttpError(503, 'Media storage is not configured')
  }

  return db.media.create({
    data: { key, url, filename, mimeType: kind.mime, size: buf.length, uploadedById },
  })
}
