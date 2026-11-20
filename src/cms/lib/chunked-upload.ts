import 'server-only'
import { randomBytes } from 'node:crypto'
import { createReadStream, createWriteStream } from 'node:fs'
import { mkdir, readdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import { once } from 'node:events'
import os from 'node:os'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { Prisma } from '@/generated/prisma/client'
import { mediaSelect } from '@/cms/components/media/types'
import { abortStaleUploads, abortUpload, bucketEnabled, completeUpload, createUpload, deleteMedia, headMedia, isNoSuchUpload, listParts, uploadPart } from './bucket'
import { sign, verifySigned } from './crypto'
import { db } from './db'
import { HttpError } from './http'
import { cleanFilename, contentDisposition, POST_VIDEO_MIMES, sniff, videoKind } from './media'

// Videos larger than one request can carry (src/proxy.ts: Next hands a route at most 10 MB of a body behind a proxy; Railway
// also ends a request whose body takes over 5 minutes) go up in parts of 6 MiB, one request each:
//   POST uploads (start) → PUT uploads/part?n=1..N → POST uploads/complete   (POST uploads/abort to give up)
// With a bucket the parts are an S3 multipart upload: the object does not exist until complete, so nothing half-sent is ever
// served. Part 1 is checked by its bytes (sniff) before it is stored, and the type the object is served with is set here.
// Without a bucket (local development) the parts wait in the system temp folder and are joined into public/cms.
// Which upload a request belongs to travels in a signed ticket (crypto.ts sign), bound to the person who started it.

/** 6 MiB: S3 takes parts of 5 MiB or more (the last may be smaller); a part takes about a minute on a slow 4G uplink. */
export const PART_SIZE = 6 * 1024 * 1024
const TICKET_TTL_MS = 2 * 60 * 60 * 1000
/** Uploads left unfinished this long are aborted (well past any ticket). */
const STALE_MS = 24 * 60 * 60 * 1000
const SWEEP_EVERY_MS = 60 * 60 * 1000
const PURPOSE = 'media-upload'

export type UploadTicket = {
  v: 1
  /** object key, cms/<32 hex>.<ext> */
  key: string
  /** the bucket's UploadId, or the local temp folder's id */
  up: string
  uid: string
  ext: string
  mime: string
  size: number
  name: string
  parts: number
  exp: number
  /** the file being replaced */
  rid?: string
}

export const partCount = (size: number) => Math.max(1, Math.ceil(size / PART_SIZE))
/** Bytes part `n` (1-based) must carry: PART_SIZE, the rest for the last one. */
export const partLength = (size: number, n: number) => (n < partCount(size) ? PART_SIZE : size - PART_SIZE * (partCount(size) - 1))

export function issueTicket(ticket: Omit<UploadTicket, 'v' | 'exp'>, now = Date.now()) {
  return sign(Buffer.from(JSON.stringify({ ...ticket, v: 1, exp: now + TICKET_TTL_MS })).toString('base64url'), PURPOSE)
}

/** The ticket, when it is ours, unexpired and belongs to `userId`. */
export function readTicket(value: unknown, userId: string, now = Date.now()): UploadTicket {
  const invalid = new HttpError(400, 'Invalid upload')
  if (typeof value !== 'string' || value.length > 4096) throw invalid
  const payload = verifySigned(value, PURPOSE)
  if (!payload) throw invalid
  let ticket: UploadTicket
  try { ticket = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as UploadTicket } catch { throw invalid }
  if (ticket?.v !== 1 || ticket.uid !== userId) throw invalid
  if (typeof ticket.exp !== 'number' || ticket.exp < now) throw new HttpError(410, 'This upload expired. Upload the file again.')
  return ticket
}

type Store = 'bucket' | 'local'
function store(): Store {
  if (bucketEnabled) return 'bucket'
  if (process.env.NODE_ENV === 'production') throw new HttpError(503, 'Media storage is not configured')
  return 'local'
}

const LOCAL_ID = /^[0-9a-f]{32}$/
const localRoot = () => path.join(os.tmpdir(), 'ncms-uploads')
function localDir(id: string) {
  if (!LOCAL_ID.test(id)) throw new HttpError(400, 'Invalid upload')
  return path.join(localRoot(), id)
}
const publicFile = (key: string) => path.join(process.cwd(), 'public', key)
const gone = () => new HttpError(410, 'This upload is no longer available. Upload the file again.')

/* ── start ── */

export type StartInput = { filename: string; ext: string; size: number; videosOnly?: boolean; replaceId?: string }

export async function startUpload(userId: string, input: StartInput) {
  const kind = videoKind(input.ext.toLowerCase())
  if (!kind) throw new HttpError(415, 'Only MP4, WebM or MOV videos are uploaded in parts')
  let videosOnly = !!input.videosOnly
  if (input.replaceId) {
    const original = await db.media.findUnique({ where: { id: input.replaceId }, select: { mimeType: true } })
    if (!original) throw new HttpError(404, 'File not found')
    // Same rules as the replace route: an image stays an image, an MP4/WebM stays an MP4/WebM.
    if (original.mimeType.startsWith('image/')) throw new HttpError(415, 'Only images are allowed here')
    if (POST_VIDEO_MIMES.has(original.mimeType)) videosOnly = true
  }
  if (videosOnly && !POST_VIDEO_MIMES.has(kind.mime)) throw new HttpError(415, 'Only MP4 or WebM videos are allowed here')
  if (!Number.isSafeInteger(input.size) || input.size < 1) throw new HttpError(400, 'Empty file')
  if (input.size > kind.max) throw new HttpError(413, `File too large (max ${Math.round(kind.max / (1024 * 1024))} MB for ${kind.ext})`)

  const where = store()
  const name = cleanFilename(input.filename)
  const key = `cms/${randomBytes(16).toString('hex')}.${kind.ext}`
  let up: string
  if (where === 'bucket') up = await createUpload(key, kind.mime, contentDisposition(name, true))
  else {
    up = randomBytes(16).toString('hex')
    await mkdir(localDir(up), { recursive: true })
  }
  sweepStaleUploads(where)
  const parts = partCount(input.size)
  const ticket = issueTicket({ key, up, uid: userId, ext: kind.ext, mime: kind.mime, size: input.size, name, parts, ...(input.replaceId ? { rid: input.replaceId } : {}) })
  return { ticket, partSize: PART_SIZE, parts }
}

/* ── parts ── */

/** Reads a part's body, refusing it as soon as it is longer than `expected` (and when it ends shorter). */
export async function readPart(req: Request, expected: number): Promise<Buffer> {
  const mismatch = () => new HttpError(400, 'Part size mismatch')
  if (Number(req.headers.get('content-length') ?? expected) !== expected) throw mismatch()
  const reader = req.body?.getReader()
  if (!reader) throw mismatch()
  const chunks: Uint8Array[] = []
  let length = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    length += value.byteLength
    if (length > expected) { await reader.cancel(); throw mismatch() }
    chunks.push(value)
  }
  if (length !== expected) throw mismatch()
  return Buffer.concat(chunks, length)
}

/** A poster frame: one small image, read with a cap (src/proxy.ts passes 10 MB; a 1280 px frame is a few hundred KB). */
export const POSTER_MAX = 4 * 1024 * 1024

export async function readPoster(req: Request): Promise<Buffer> {
  const tooLarge = () => new HttpError(413, 'Poster too large')
  if (Number(req.headers.get('content-length') ?? 0) > POSTER_MAX) throw tooLarge()
  const reader = req.body?.getReader()
  if (!reader) throw new HttpError(400, 'No poster')
  const chunks: Uint8Array[] = []
  let length = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    length += value.byteLength
    if (length > POSTER_MAX) { await reader.cancel(); throw tooLarge() }
    chunks.push(value)
  }
  if (!length) throw new HttpError(400, 'No poster')
  return Buffer.concat(chunks, length)
}

export async function putPart(ticket: UploadTicket, n: number, body: Buffer) {
  if (!Number.isInteger(n) || n < 1 || n > ticket.parts) throw new HttpError(400, 'Invalid part number')
  if (body.length !== partLength(ticket.size, n)) throw new HttpError(400, 'Part size mismatch')
  // The first bytes say what the file really is: a page, a photo or anything else renamed .mp4 never reaches storage.
  if (n === 1) {
    const found = sniff(body, ticket.name)
    if (found?.ext !== ticket.ext) {
      await cancelUpload(ticket)
      // An MP4 named .mov (or the other way round) is a real video: say what it is, so renaming it is enough.
      if (found && videoKind(found.ext)) throw new HttpError(415, `This file is a${found.ext === 'mp4' ? 'n' : ''} ${found.ext.toUpperCase()} video, not ${ticket.ext.toUpperCase()}. Rename it to .${found.ext} and upload it again.`)
      throw new HttpError(415, 'Unsupported or unrecognized file type')
    }
  }
  if (store() === 'bucket') {
    try { await uploadPart(ticket.key, ticket.up, n, body) } catch (error) {
      if (isNoSuchUpload(error)) throw gone()
      throw error
    }
    return
  }
  const dir = localDir(ticket.up)
  // Only into a folder start made (and complete or abort has not removed): never recreated here.
  if (!(await stat(dir).catch(() => null))?.isDirectory()) throw gone()
  const tmp = path.join(dir, `${n}.${randomBytes(6).toString('hex')}.tmp`)
  await writeFile(tmp, body)
  await rename(tmp, path.join(dir, String(n)))
}

/* ── complete ── */

type MediaRow = Prisma.MediaGetPayload<{ select: typeof mediaSelect }>

/**
 * Joins the parts into the stored file and records it. Safe to repeat: a second call (a retry after a dropped response, or
 * two at once) returns the row the first one created, with `created: false`. A replacement is checked again here: the
 * original may have been deleted since the upload started.
 */
/** What the browser read from the video while sending it (shown on its tile; never trusted for anything else). */
export type VideoFacts = { alt?: string | null; width?: number; height?: number; duration?: number }

export async function finishUpload(ticket: UploadTicket, userId: string, facts: VideoFacts = {}): Promise<{ media: MediaRow; created: boolean; original: MediaRow | null }> {
  let original: MediaRow | null = null
  if (ticket.rid) {
    original = await db.media.findUnique({ where: { id: ticket.rid }, select: mediaSelect })
    if (!original) {
      const done = await db.media.findUnique({ where: { key: ticket.key }, select: { id: true } })
      if (!done) await discardUpload(ticket)
      throw new HttpError(404, 'The file being replaced was deleted')
    }
  }
  const existing = await db.media.findUnique({ where: { key: ticket.key }, select: mediaSelect })
  if (existing) return { media: existing, created: false, original }
  try { await assemble(ticket) } catch (error) {
    // Another complete for the same upload (a retry while the first was still joining it) got there first.
    if (error instanceof HttpError && error.status === 410) {
      const row = await db.media.findUnique({ where: { key: ticket.key }, select: mediaSelect })
      if (row) return { media: row, created: false, original }
    }
    throw error
  }
  try {
    const media = await db.media.create({
      data: {
        key: ticket.key, url: `/${ticket.key}`, filename: ticket.name, mimeType: ticket.mime, size: ticket.size, alt: facts.alt?.trim() || null, uploadedById: userId,
        width: facts.width ?? null, height: facts.height ?? null, duration: facts.duration ?? null,
      },
      select: mediaSelect,
    })
    return { media, created: true, original }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { media: await db.media.findUniqueOrThrow({ where: { key: ticket.key }, select: mediaSelect }), created: false, original }
    }
    throw error
  }
}

const missingParts = () => new HttpError(400, 'Some parts of the file are missing. Upload it again.')

async function assemble(ticket: UploadTicket) {
  if (store() === 'bucket') {
    // Already joined (the response to an earlier complete was lost): nothing left to do but record it.
    const size = await headMedia(ticket.key)
    if (size === ticket.size) return
    // Gone from the bucket's uploads: joined meanwhile by an overlapping complete (fine), or aborted (gone).
    const goneUnlessJoined = async () => { if ((await headMedia(ticket.key)) !== ticket.size) throw gone() }
    let parts: Awaited<ReturnType<typeof listParts>>
    try { parts = await listParts(ticket.key, ticket.up) } catch (error) {
      if (isNoSuchUpload(error)) return goneUnlessJoined()
      throw error
    }
    // Every part, each of its exact size, as the bucket lists them (never ETags the browser sent).
    const byNumber = new Map(parts.map((part) => [part.PartNumber, part]))
    const ordered = Array.from({ length: ticket.parts }, (_, i) => byNumber.get(i + 1))
    if (byNumber.size !== ticket.parts || ordered.some((part, i) => !part || part.Size !== partLength(ticket.size, i + 1))) throw missingParts()
    try { await completeUpload(ticket.key, ticket.up, ordered.map((part) => ({ PartNumber: part!.PartNumber, ETag: part!.ETag }))) } catch (error) {
      if (isNoSuchUpload(error)) return goneUnlessJoined()
      throw error
    }
    if ((await headMedia(ticket.key)) !== ticket.size) throw new Error(`Stored size does not match for ${ticket.key}`)
    return
  }

  const target = publicFile(ticket.key)
  const joined = await stat(target).catch(() => null)
  if (joined) {
    if (joined.size === ticket.size) return
    throw new HttpError(409, 'A different file is already stored under this name. Upload it again.')
  }
  const dir = localDir(ticket.up)
  if (!(await stat(dir).catch(() => null))?.isDirectory()) throw gone()
  for (let n = 1; n <= ticket.parts; n++) {
    const part = await stat(path.join(dir, String(n))).catch(() => null)
    if (part?.size !== partLength(ticket.size, n)) throw missingParts()
  }
  await mkdir(path.dirname(target), { recursive: true })
  // Joined next to its final place, then renamed (one rename, never across file systems).
  const tmp = path.join(path.dirname(target), `.${randomBytes(6).toString('hex')}.upload`)
  try {
    const out = createWriteStream(tmp)
    for (let n = 1; n <= ticket.parts; n++) await pipeline(createReadStream(path.join(dir, String(n))), out, { end: false })
    out.end()
    await once(out, 'close')
    await rename(tmp, target)
  } catch (error) {
    await rm(tmp, { force: true })
    throw error
  }
  await rm(dir, { recursive: true, force: true })
}

/* ── abort and cleanup ── */

export async function cancelUpload(ticket: UploadTicket) {
  if (store() === 'bucket') {
    await abortUpload(ticket.key, ticket.up).catch((error: unknown) => { if (!isNoSuchUpload(error)) throw error })
    return
  }
  await rm(localDir(ticket.up), { recursive: true, force: true })
}

/** Drops an upload that will not be recorded: its parts, and the joined file if it was already joined. */
async function discardUpload(ticket: UploadTicket) {
  await cancelUpload(ticket)
  if (store() === 'bucket') {
    if ((await headMedia(ticket.key)) !== null) await deleteMedia(ticket.key)
  } else await rm(publicFile(ticket.key), { force: true })
}

let lastSweep = 0

/** At most once an hour per instance, in the background: aborts uploads abandoned over a day ago. Never fails a request. */
function sweepStaleUploads(where: Store, now = Date.now()) {
  if (now - lastSweep < SWEEP_EVERY_MS) return
  lastSweep = now
  const before = new Date(now - STALE_MS)
  const job = where === 'bucket' ? abortStaleUploads('cms/', before) : sweepLocal(before)
  void job.catch((error: unknown) => console.warn('[cms] sweeping abandoned uploads failed', error))
}

async function sweepLocal(before: Date) {
  const root = localRoot()
  for (const id of await readdir(root).catch(() => [] as string[])) {
    if (!LOCAL_ID.test(id)) continue
    const info = await stat(path.join(root, id)).catch(() => null)
    if (info && info.mtime < before) await rm(path.join(root, id), { recursive: true, force: true })
  }
  return 0
}
