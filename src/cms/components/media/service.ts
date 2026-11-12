import 'server-only'
import { Prisma } from '@/generated/prisma/client'
import { unlink } from 'node:fs/promises'
import path from 'node:path'
import { bucketEnabled, deleteMedia } from '@/cms/lib/bucket'
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
  try {
    if (bucketEnabled) await deleteMedia(media.key)
    else if (process.env.NODE_ENV !== 'production') {
      await unlink(path.join(process.cwd(), 'public', media.key)).catch((error: NodeJS.ErrnoException) => { if (error.code !== 'ENOENT') throw error })
    } else throw new Error('Media storage is not configured')
  } catch (error) {
    console.error('[cms] media storage deletion failed', error)
    throw new HttpError(503, 'Storage deletion failed. The file record was kept; retry later.')
  }
  await db.media.delete({ where: { id } })
  await audit(user, { action: force ? 'FORCE_DELETE' : 'DELETE', entityType: 'MEDIA', entityId: id, entityTitle: media.filename, diff: { url: media.url, references: references.length } }, req)
  return { id, references: references.length }
}
