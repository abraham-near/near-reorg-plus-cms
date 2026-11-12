import 'server-only'
import { Prisma } from '@/generated/prisma/client'
import { readFile, unlink } from 'node:fs/promises'
import path from 'node:path'
import { bucketEnabled, deleteMedia, getMediaObject } from '@/cms/lib/bucket'
import { contentDisposition, optimizeImage, webpName, writeObject } from '@/cms/lib/media'
import { db } from '@/cms/lib/db'
import { HttpError } from '@/cms/lib/http'
import { audit } from '@/cms/lib/audit'
import type { SessionUser } from '@/cms/lib/session'
import { saveRevision } from '@/cms/lib/revisions'
import { revalidatePost } from '@/cms/lib/cache-tags'
import { extractCmsUrls, isCmsMediaUrl, replaceExactUrl } from './reference-values'
import { mediaSelect, type MediaReference } from './types'
import { postSelect } from '@/cms/lib/posts/select'

type ReferenceRecord = MediaReference & { snapshot: Prisma.InputJsonObject; changes: Record<string, Prisma.JsonValue> }
type Actor = Pick<SessionUser, 'id' | 'email'>
type Store = Prisma.TransactionClient


// Posts are the only content that holds media URLs.
const REFERENCE_FIELDS = ['body', 'featuredImage', 'metaImage', 'excerpt'] as const satisfies readonly (keyof typeof postSelect)[]

async function scanReferences(store: Store, oldUrl: string, newUrl = oldUrl): Promise<ReferenceRecord[]> {
  const found: ReferenceRecord[] = []
  function collect(type: ReferenceRecord['entityType'], row: object, fields: readonly string[], title: string, routePath: string | null = null, status?: string) {
    const snapshot = JSON.parse(JSON.stringify(row)) as Prisma.InputJsonObject
    const record = row as Record<string, unknown>
    const changes: Record<string, Prisma.JsonValue> = {}
    let occurrences = 0
    for (const field of fields) {
      const result = replaceExactUrl((record[field] ?? null) as Prisma.JsonValue, oldUrl, newUrl)
      if (result.count) { changes[field] = result.value; occurrences += result.count }
    }
    if (occurrences) found.push({ entityType: type, id: String(record.id ?? record.key), title, path: routePath, fields: Object.keys(changes), occurrences, ...(status ? { status } : {}), snapshot, changes })
  }
  // Read in batches; retain snapshots only for records that actually reference the file.
  for (let skip = 0; ; skip += 100) {
    const rows = await store.post.findMany({ select: postSelect, orderBy: { id: 'asc' }, skip, take: 100 })
    for (const r of rows) collect('POST', r, REFERENCE_FIELDS, r.title, `/admin/posts/${r.id}/edit`, r.status)
    if (rows.length < 100) break
  }
  return found
}

export async function findMediaReferences(url: string): Promise<MediaReference[]> {
  const records = await scanReferences(db, url)
  return records.map(({ entityType, id, title, path, fields, occurrences, status }) => ({ entityType, id, title, path, fields, occurrences, ...(status ? { status } : {}) }))
}

/**
 * How many posts use each CMS media URL, in one pass over the posts (only the fields that can hold
 * media are read). Same matching rules as findMediaReferences.
 */
export async function mediaUsageByUrl(): Promise<Map<string, number>> {
  const usage = new Map<string, number>()
  for (let skip = 0; ; skip += 200) {
    const rows = await db.post.findMany({ select: { id: true, body: true, featuredImage: true, metaImage: true, excerpt: true }, orderBy: { id: 'asc' }, skip, take: 200 })
    for (const row of rows) {
      const urls = extractCmsUrls(REFERENCE_FIELDS.map((field) => row[field] ?? null))
      for (const url of urls) usage.set(url, (usage.get(url) ?? 0) + 1)
    }
    if (rows.length < 200) break
  }
  return usage
}

export async function replaceMediaReferences(oldUrl: string, newUrl: string, user: Actor, req?: Request, options?: {
  replaceEverywhere: boolean
  original: { id: string; updatedAt: Date; alt: string | null }
  replacement: { id: string; updatedAt: Date; alt: string | null }
}) {
  if (!isCmsMediaUrl(oldUrl) || !isCmsMediaUrl(newUrl)) throw new HttpError(400, 'Invalid media URL')
  if (oldUrl === newUrl) return { updated: 0, occurrences: 0 }
  const records = await db.$transaction(async (tx) => {
    // Carry the alt text over and change the content references in the same transaction.
    if (options) {
      const { original, replacement } = options
      const released = await tx.media.updateMany({
        where: { id: original.id, url: oldUrl, updatedAt: original.updatedAt },
        data: { updatedAt: new Date() },
      })
      if (released.count !== 1) throw new HttpError(409, 'File details changed during replacement. Please retry.')
      const assigned = await tx.media.updateMany({
        where: { id: replacement.id, url: newUrl, updatedAt: replacement.updatedAt },
        data: { alt: replacement.alt || original.alt, updatedAt: new Date() },
      })
      if (assigned.count !== 1) throw new HttpError(409, 'File details changed during replacement. Please retry.')
    }
    const refs = options?.replaceEverywhere === false ? [] : await scanReferences(tx, oldUrl, newUrl)
    for (const ref of refs) {
      await saveRevision(ref.entityType, ref.id, ref.snapshot, user.id, 'Before media replacement', tx)
      const data = ref.changes
      const version = new Date(String(ref.snapshot.updatedAt))
      const where = { id: ref.id, updatedAt: version }
      const count = (await tx.post.updateMany({ where, data: data as Prisma.PostUpdateManyMutationInput })).count
      if (count !== 1) throw new HttpError(409, 'Content changed during replacement. Please retry.')
    }
    return refs
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 60_000 }).catch((error: unknown) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2034', 'P2002'].includes(error.code)) throw new HttpError(409, 'Content or file details changed during replacement. Please retry.')
    throw error
  })
  for (const ref of records) {
    await audit(user, { action: 'REPLACE_MEDIA', entityType: ref.entityType, entityId: ref.id, entityTitle: ref.title, diff: { oldUrl, newUrl, fields: ref.fields, occurrences: ref.occurrences } }, req)
    revalidatePost(String(ref.snapshot.slug))
  }
  return { updated: records.length, occurrences: records.reduce((sum, r) => sum + r.occurrences, 0) }
}

export async function removeMedia(id: string, force: boolean, user: Actor, req?: Request) {
  const media = await db.media.findUnique({ where: { id }, select: mediaSelect })
  if (!media) throw new HttpError(404, 'File not found')
  const references = await findMediaReferences(media.url)
  if (references.length && !force) throw new HttpError(409, 'This file is still in use. Replace its references before deleting, or explicitly force deletion.', { references })
  if (!isCmsMediaUrl(media.url) || media.key !== media.url.slice(1)) throw new HttpError(409, 'Invalid storage key')
  // Remove bytes first: a storage failure must leave the database record available for retry.
  // The kept original goes with it (only a key of ours: cms/<hash>.<ext>).
  const keys = [media.key, ...(media.originalKey && /^cms\/[0-9a-f]{16}\.[a-z0-9]+$/.test(media.originalKey) && media.originalKey !== media.key ? [media.originalKey] : [])]
  try {
    for (const key of keys) {
      if (bucketEnabled) await deleteMedia(key)
      else if (process.env.NODE_ENV !== 'production') {
        await unlink(path.join(process.cwd(), 'public', key)).catch((error: NodeJS.ErrnoException) => { if (error.code !== 'ENOENT') throw error })
      } else throw new Error('Media storage is not configured')
    }
  } catch (error) {
    console.error('[cms] media storage deletion failed', error)
    throw new HttpError(503, 'Storage deletion failed. The file record was kept; retry later.')
  }
  await db.media.delete({ where: { id } })
  await audit(user, { action: force ? 'FORCE_DELETE' : 'DELETE', entityType: 'MEDIA', entityId: id, entityTitle: media.filename, diff: { url: media.url, references: references.length } }, req)
  return { id, references: references.length }
}

/* ── optimizing files uploaded before uploads were optimized ── */

const OPTIMIZABLE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
/** Images never looked at by the optimizer: no kept original and no recorded size. */
const unoptimized = { originalKey: null, width: null, mimeType: { in: OPTIMIZABLE_MIME } } satisfies Prisma.MediaWhereInput
const OUR_KEY = /^cms\/([0-9a-f]{16})\.([a-z0-9]+)$/

export const countUnoptimizedMedia = () => db.media.count({ where: unoptimized })

async function readObject(key: string) {
  if (bucketEnabled) return getMediaObject(key)
  if (process.env.NODE_ENV === 'production') throw new Error('Media storage is not configured')
  return readFile(path.join(process.cwd(), 'public', key))
}

/**
 * Optimizes up to `limit` older images the way new uploads are (optimizeImage): writes the WebP, points
 * every post at it (with revisions, as Replace does), then turns the row into the WebP and keeps its old
 * file as the original. A file that is better left as it is (animated, already small) just gets its size recorded.
 */
export async function optimizeStoredMedia(user: Actor, req?: Request, limit = 4) {
  const rows = await db.media.findMany({ where: unoptimized, select: mediaSelect, orderBy: { createdAt: 'asc' }, take: limit })
  const result = { optimized: 0, kept: 0, failed: [] as { id: string; filename: string; error: string }[], savedBytes: 0 }
  for (const row of rows) {
    try {
      const match = OUR_KEY.exec(row.key)
      if (!match || row.url !== `/${row.key}`) throw new Error('Unexpected storage key')
      const buf = await readObject(row.key)
      const opt = await optimizeImage(buf, match[2])
      const webpKey = `cms/${match[1]}.webp`
      if (!opt.converted || webpKey === row.key || (await db.media.findUnique({ where: { key: webpKey }, select: { id: true } }))) {
        await db.media.update({ where: { id: row.id }, data: { width: opt.width ?? 0, height: opt.height ?? 0 } })
        result.kept++
        continue
      }
      const name = webpName(row.filename)
      await writeObject(webpKey, opt.buf, 'image/webp', contentDisposition(name, true))
      // Posts first: if that fails the row is untouched and its file still serves every post.
      await replaceMediaReferences(row.url, `/${webpKey}`, user, req)
      await db.media.update({
        where: { id: row.id },
        data: {
          key: webpKey, url: `/${webpKey}`, filename: name, mimeType: 'image/webp', size: opt.buf.length, width: opt.width, height: opt.height,
          originalKey: row.key, originalMimeType: row.mimeType, originalSize: row.size,
        },
      })
      await audit(user, { action: 'OPTIMIZE', entityType: 'MEDIA', entityId: row.id, entityTitle: name, diff: { oldUrl: row.url, newUrl: `/${webpKey}`, before: row.size, after: opt.buf.length } }, req)
      result.optimized++
      result.savedBytes += Math.max(0, row.size - opt.buf.length)
    } catch (error) {
      console.error('[cms] optimizing media failed', row.id, error)
      result.failed.push({ id: row.id, filename: row.filename, error: error instanceof HttpError ? error.message : 'Could not optimize this file' })
    }
  }
  return { ...result, remaining: await countUnoptimizedMedia() }
}
