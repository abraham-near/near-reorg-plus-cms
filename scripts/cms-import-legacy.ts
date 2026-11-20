// Copies the posts of the previous CMS (near-org-website-primary's database, opened READ-ONLY) into this CMS:
// posts, their categories, and every media file (copied from the old site into this CMS's bucket under the
// same key, so `/cms/<key>` URLs keep working). Users are never read or written.
//
// Dry run (default): reads, converts and validates everything, downloads nothing into the bucket and writes
// nothing to the database. It leaves a JSON report. `--apply` writes, after a typed confirmation.
//
//   TZ=UTC npm run cms:import-legacy -- --target-host <host:port> --expect-bucket <bucket> \
//     [--delete-test-posts id,id] [--delete-test-media id,id] [--keep-existing-posts id,id] \
//     [--report <file.json>] [--apply]
//
// Environment (required, never read from .env): DATABASE_URL (this CMS), SOURCE_DATABASE_URL (old CMS),
// SOURCE_MEDIA_ORIGIN (e.g. https://near.org), BUCKET, ENDPOINT, REGION, ACCESS_KEY_ID, SECRET_ACCESS_KEY,
// optional BUCKET_FORCE_PATH_STYLE.
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { HeadObjectCommand, PutObjectCommand, DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { PrismaPg } from '@prisma/adapter-pg'
import DOMPurify from 'isomorphic-dompurify'
import pg from 'pg'
import sharp from 'sharp'
import { PrismaClient } from '../src/generated/prisma/client'
import { blocksToHtml, cleanField, ConvertError, convertBody, findForeignImages, type ConvertResult, type LegacyBlock } from './legacy-import/convert'

// ---------------------------------------------------------------------------------------------------------
// Arguments and environment

const argv = process.argv.slice(2)
const flag = (name: string) => argv.includes(`--${name}`)
const arg = (name: string) => { const i = argv.indexOf(`--${name}`); return i > -1 ? argv[i + 1] : undefined }
const list = (name: string) => (arg(name) ?? '').split(',').map((s) => s.trim()).filter(Boolean)

const APPLY = flag('apply')
const TARGET_HOST = arg('target-host')
const EXPECT_BUCKET = arg('expect-bucket')
const DELETE_POSTS = list('delete-test-posts')
const DELETE_MEDIA = list('delete-test-media')
const KEEP_POSTS = list('keep-existing-posts')
const REPORT = arg('report') ?? `legacy-import-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
const CONCURRENCY = 4
/** The previous CMS's bucket: the copy must never write into it. */
const OLD_BUCKET = 'collected-satchel-ntp-tq'

function fail(message: string): never {
  console.error(`\n✖ ${message}`)
  process.exit(1)
}

const env = (name: string) => process.env[name]?.trim() || fail(`Missing environment variable ${name}`)
const DATABASE_URL = env('DATABASE_URL')
const SOURCE_DATABASE_URL = env('SOURCE_DATABASE_URL')
const SOURCE_MEDIA_ORIGIN = env('SOURCE_MEDIA_ORIGIN').replace(/\/+$/, '')
const BUCKET = env('BUCKET')
const ENDPOINT = env('ENDPOINT')
const REGION = process.env.REGION?.trim() || 'auto'
const ACCESS_KEY_ID = env('ACCESS_KEY_ID')
const SECRET_ACCESS_KEY = env('SECRET_ACCESS_KEY')

if (process.env.TZ !== 'UTC') fail('Run with TZ=UTC (both databases store UTC in "timestamp without time zone")')
if (!TARGET_HOST) fail('--target-host <host:port> is required (the host of DATABASE_URL, to confirm where this writes)')
if (!EXPECT_BUCKET) fail('--expect-bucket <name> is required (the bucket this writes to)')

const hostOf = (url: string) => { const u = new URL(url); return `${u.hostname}:${u.port || '5432'}` }
if (hostOf(DATABASE_URL) !== TARGET_HOST) fail(`--target-host ${TARGET_HOST} does not match DATABASE_URL (${hostOf(DATABASE_URL)})`)
if (hostOf(DATABASE_URL) === hostOf(SOURCE_DATABASE_URL) && new URL(DATABASE_URL).pathname === new URL(SOURCE_DATABASE_URL).pathname) fail('DATABASE_URL and SOURCE_DATABASE_URL are the same database')
if (BUCKET !== EXPECT_BUCKET) fail(`--expect-bucket ${EXPECT_BUCKET} does not match BUCKET (${BUCKET})`)
if (BUCKET === OLD_BUCKET || ENDPOINT.includes(OLD_BUCKET)) fail('BUCKET is the previous CMS\'s bucket: refusing to write into it')

// ---------------------------------------------------------------------------------------------------------
// Connections. Source: read-only session, timestamps read as UTC. Target: Prisma (adapter-pg writes UTC).

const source = new pg.Client({
  connectionString: SOURCE_DATABASE_URL,
  options: '-c default_transaction_read_only=on',
  types: { getTypeParser: ((oid: number, format?: 'text' | 'binary') => oid === 1114 ? (s: string) => new Date(`${s.replace(' ', 'T')}Z`) : pg.types.getTypeParser(oid, format)) as typeof pg.types.getTypeParser },
})
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: DATABASE_URL }) })

/** Created only with --apply: a dry run cannot write to the bucket. */
let s3: S3Client | null = null
function bucket(): S3Client {
  if (!APPLY) throw new Error('Bucket writes are not allowed in a dry run')
  s3 ??= new S3Client({
    endpoint: ENDPOINT,
    region: REGION,
    credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY },
    forcePathStyle: process.env.BUCKET_FORCE_PATH_STYLE === 'true',
  })
  return s3
}

// Same as src/cms/lib/media.ts (that module imports server-only and the app's database client).
function contentDisposition(filename: string, inline: boolean) {
  const ascii = filename.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '')
  return `${inline ? 'inline' : 'attachment'}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`
}
function sanitizeSvg(svg: string): string {
  return DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true }, FORBID_TAGS: ['script', 'foreignObject', 'iframe', 'use'], FORBID_ATTR: ['href', 'xlink:href'] })
}
const INLINE_MIME = /^(image|video|audio)\/|^application\/pdf$/

async function putObject(key: string, body: Buffer, mimeType: string, filename: string) {
  await bucket().send(new PutObjectCommand({
    Bucket: BUCKET, Key: key, Body: body, ContentType: mimeType,
    ContentDisposition: contentDisposition(filename, INLINE_MIME.test(mimeType)),
    CacheControl: 'public, max-age=31536000, immutable',
  }))
}
async function objectSize(key: string): Promise<number | null> {
  try {
    return (await bucket().send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))).ContentLength ?? null
  } catch (error) {
    if ((error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404) return null
    throw error
  }
}

// ---------------------------------------------------------------------------------------------------------
// Downloads

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function withRetry<T>(what: string, fn: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try { return await fn() } catch (error) {
      const retryable = error instanceof RetryableError
      if (!retryable || attempt >= 4) throw error
      await sleep(1000 * 2 ** attempt)
      console.warn(`  retry ${attempt} ${what}: ${(error as Error).message}`)
    }
  }
}
class RetryableError extends Error {}

async function readBody(res: Response, max: number): Promise<Buffer> {
  const declared = Number(res.headers.get('content-length') ?? 0)
  if (declared > max) throw new Error(`too large (${declared} bytes)`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length > max) throw new Error(`too large (${buf.length} bytes)`)
  return buf
}

/** A file of the old site: its /cms/<key> URL redirects to a presigned URL of the old bucket. */
async function downloadSourceMedia(url: string, max: number): Promise<Buffer> {
  return withRetry(url, async () => {
    const first = await fetch(`${SOURCE_MEDIA_ORIGIN}${url}`, { redirect: 'manual', signal: AbortSignal.timeout(120_000) })
    let res = first
    if (first.status >= 300 && first.status < 400) {
      const location = new URL(first.headers.get('location') ?? '', SOURCE_MEDIA_ORIGIN)
      if (location.protocol !== 'https:' || !location.hostname.endsWith('.storageapi.dev')) throw new Error(`unexpected redirect to ${location.hostname}`)
      res = await fetch(location, { redirect: 'error', signal: AbortSignal.timeout(120_000) })
    }
    if (res.status === 429 || res.status >= 500) throw new RetryableError(`HTTP ${res.status}`)
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`)
    return readBody(res, max)
  })
}

/** An image hosted by Google (old Google Docs exports). Redirects only within googleusercontent.com. */
async function downloadGoogleImage(url: string): Promise<Buffer | null> {
  return withRetry(url.slice(0, 60), async () => {
    let target = new URL(url)
    for (let hop = 0; hop < 3; hop++) {
      if (target.protocol !== 'https:' || !target.hostname.endsWith('.googleusercontent.com')) throw new Error(`unexpected host ${target.hostname}`)
      const res = await fetch(target, { redirect: 'manual', signal: AbortSignal.timeout(60_000) })
      if (res.status >= 300 && res.status < 400) { target = new URL(res.headers.get('location') ?? '', target); continue }
      if (res.status === 404 || res.status === 403 || res.status === 410) return null
      if (res.status === 429 || res.status >= 500) throw new RetryableError(`HTTP ${res.status}`)
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`)
      return readBody(res, 20 * 1024 * 1024)
    }
    throw new Error('too many redirects')
  })
}

const imageKind = (b: Buffer) =>
  b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff ? 'jpg'
    : b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ? 'png'
      : /^GIF8[79]a/.test(b.subarray(0, 6).toString('latin1')) ? 'gif'
        : b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP' ? 'webp'
          : null

type Derived = { key: string; url: string; filename: string; buf: Buffer; width: number; height: number }

/** Like storeStrictImage (src/cms/lib/media.ts): decoded and re-encoded to WebP, keyed by the hash of the original. */
async function toWebp(buf: Buffer, name: string): Promise<Derived | null> {
  if (!imageKind(buf)) return null
  const hash = createHash('sha1').update(buf).digest('hex').slice(0, 16)
  try {
    const out = await sharp(buf, { failOn: 'warning', limitInputPixels: 40_000_000, animated: false })
      .rotate().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80, effort: 5, smartSubsample: true }).toBuffer({ resolveWithObject: true })
    const key = `cms/${hash}.webp`
    return { key, url: `/${key}`, filename: `${name}.webp`, buf: out.data, width: out.info.width, height: out.info.height }
  } catch {
    return null
  }
}

async function pool<T>(items: T[], size: number, fn: (item: T, i: number) => Promise<void>) {
  let next = 0
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) { const i = next++; await fn(items[i], i) }
  }))
}

// ---------------------------------------------------------------------------------------------------------

type SourcePost = {
  id: string; slug: string; title: string; blocks: LegacyBlock[]; excerpt: string | null; featuredImage: string | null
  seoTitle: string | null; metaTitle: string | null; metaDescription: string | null; metaImage: string | null
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'; visibility: 'PUBLIC' | 'NOINDEX' | string; passwordHash: string | null
  publishedAt: Date | null; createdAt: Date; updatedAt: Date
}
type SourceMedia = { id: string; key: string; url: string; filename: string; mimeType: string; size: number; width: number | null; height: number | null; alt: string | null; createdAt: Date }

async function main() {
  const report: Record<string, unknown> = { mode: APPLY ? 'apply' : 'dry-run', target: TARGET_HOST, bucket: BUCKET, startedAt: new Date().toISOString() }
  const save = () => writeFileSync(REPORT, JSON.stringify(report, null, 1))

  await source.connect()
  const ro = (await source.query('show default_transaction_read_only')).rows[0].default_transaction_read_only
  if (ro !== 'on') fail('The source connection is not read-only')

  // --- target checks
  const migrations = await db.$queryRaw<{ migration_name: string }[]>`select migration_name from _prisma_migrations where finished_at is not null`
  if (!migrations.some((m) => m.migration_name.endsWith('_story_fields'))) fail('The target database is missing migrations (run npm run db:deploy first)')

  // --- read the source
  console.log('Reading the previous CMS…')
  const posts = (await source.query<SourcePost>(`select id, slug, title, blocks, excerpt, "featuredImage", "seoTitle", "metaTitle", "metaDescription", "metaImage", status::text, visibility::text, "passwordHash", "publishedAt", "createdAt", "updatedAt" from "Post" order by "createdAt"`)).rows
  const categories = (await source.query<{ id: string; name: string; slug: string }>(`select id, name, slug from "Category"`)).rows
  const links = (await source.query<{ postId: string; categoryId: string; position: number }>(`select "postId", "categoryId", position from "PostCategory"`)).rows
  const media = (await source.query<SourceMedia>(`select id, key, url, filename, "mimeType", size, width, height, alt, "createdAt" from "Media" order by "createdAt"`)).rows
  await source.end()
  console.log(`  ${posts.length} posts, ${categories.length} categories, ${links.length} post-category links, ${media.length} media files`)

  for (const m of media) if (m.url !== `/${m.key}` || !/^cms\/[\w.-]+$/.test(m.key)) fail(`Unexpected media key/url: ${m.key} ${m.url}`)

  // --- what the target already has
  const sourceIds = new Set(posts.map((p) => p.id))
  const targetPosts = await db.post.findMany({ select: { id: true, slug: true, updatedAt: true } })
  const foreign = targetPosts.filter((p) => !sourceIds.has(p.id))
  const unexpected = foreign.filter((p) => !DELETE_POSTS.includes(p.id) && !KEEP_POSTS.includes(p.id))
  if (unexpected.length) fail(`The target has ${unexpected.length} post(s) that do not come from the previous CMS: ${unexpected.map((p) => `${p.id} (${p.slug})`).join(', ')}. List them in --delete-test-posts or --keep-existing-posts.`)
  for (const id of DELETE_POSTS) if (!foreign.some((p) => p.id === id)) fail(`--delete-test-posts: ${id} is not a target post outside the import`)
  const kept = foreign.filter((p) => KEEP_POSTS.includes(p.id))
  const collisions = posts.filter((p) => kept.some((k) => k.slug === p.slug))
  if (collisions.length) fail(`Slug collision with posts kept in the target: ${collisions.map((p) => p.slug).join(', ')}`)
  const sourceMediaIds = new Set(media.map((m) => m.id))
  const testMedia = DELETE_MEDIA.length ? await db.media.findMany({ where: { id: { in: DELETE_MEDIA } } }) : []
  for (const id of DELETE_MEDIA) {
    if (!testMedia.some((m) => m.id === id)) fail(`--delete-test-media: ${id} does not exist in the target`)
    if (sourceMediaIds.has(id)) fail(`--delete-test-media: ${id} is a media file of the previous CMS`)
  }

  // --- convert every body (pure); foreign images first
  console.log('Converting posts…')
  const slugs = new Set(posts.map((p) => p.slug))
  const rawHtml = new Map<string, string>()
  const conversionErrors: string[] = []
  const blockNotes = new Map<string, string[]>()
  for (const p of posts) {
    const notes: string[] = []
    try { rawHtml.set(p.id, blocksToHtml(p.blocks, notes)) } catch (error) {
      if (error instanceof ConvertError) conversionErrors.push(`${p.slug}: ${error.message}`)
      else throw error
    }
    blockNotes.set(p.id, notes)
  }
  if (conversionErrors.length) { report.conversionErrors = conversionErrors; save(); fail(`${conversionErrors.length} post(s) could not be converted (see ${REPORT})`) }

  const foreignSrcs = [...new Set([...rawHtml.values()].flatMap(findForeignImages))]
  console.log(`  ${foreignSrcs.length} inline/Google images to copy`)
  const imageMap = new Map<string, string | null>()
  const derived = new Map<string, Derived>()
  const imageProblems: string[] = []
  await pool(foreignSrcs, CONCURRENCY, async (src) => {
    const label = src.startsWith('data:') ? `${src.slice(0, 40)}…` : src
    try {
      let buf: Buffer | null
      if (src.startsWith('data:')) {
        const m = src.match(/^data:image\/[\w.+-]+;base64,([\s\S]+)$/)
        buf = m ? Buffer.from(m[1].replace(/\s+/g, ''), 'base64') : null
      } else {
        buf = await downloadGoogleImage(src)
        if (!buf) { imageProblems.push(`Google image no longer available (kept as is): ${label}`); return }
      }
      const out = buf && await toWebp(buf, 'imported-image')
      if (!out) {
        if (src.startsWith('data:')) { imageMap.set(src, null); imageProblems.push(`Inline image could not be read (removed): ${label}`) }
        else imageProblems.push(`Google image could not be read (kept as is): ${label}`)
        return
      }
      derived.set(out.key, out)
      imageMap.set(src, out.url)
    } catch (error) {
      imageProblems.push(`${label}: ${(error as Error).message} (kept as is)`)
    }
  })

  const converted = new Map<string, ConvertResult>()
  for (const p of posts) {
    try { converted.set(p.id, convertBody(rawHtml.get(p.id)!, { slugs, images: imageMap })) } catch (error) {
      if (error instanceof ConvertError) conversionErrors.push(`${p.slug}: ${error.message}`)
      else throw error
    }
  }
  if (conversionErrors.length) { report.conversionErrors = conversionErrors; save(); fail(`${conversionErrors.length} post(s) could not be converted (see ${REPORT})`) }

  // every /cms/ file a post uses must exist in the source media (or be one of the copied images)
  const mediaKeys = new Set([...media.map((m) => m.url), ...[...derived.values()].map((d) => d.url)])
  const referenced = new Set<string>()
  const missing: string[] = []
  for (const p of posts) {
    const html = converted.get(p.id)!.html
    const urls = [...html.matchAll(/(?:src|href)="(\/cms\/[^"?#]+)/g)].map((m) => m[1])
    for (const u of [p.featuredImage, p.metaImage, ...urls]) {
      if (!u?.startsWith('/cms/')) continue
      referenced.add(u)
      if (!mediaKeys.has(u)) missing.push(`${p.slug}: ${u}`)
    }
  }
  if (missing.length) { report.missingMedia = missing; save(); fail(`${missing.length} /cms/ reference(s) without a media file (see ${REPORT})`) }

  // --- posts as they will be written
  const rows = posts.map((p) => {
    const c = converted.get(p.id)!
    const metaTitle = cleanField(p.metaTitle ?? p.seoTitle, { max: 500 })
    return {
      id: p.id,
      slug: p.slug,
      title: cleanField(p.title, { max: 500 }) ?? p.slug,
      body: c.html,
      excerpt: cleanField(p.excerpt, { singleLine: false, max: 10_000 }),
      featuredImage: p.featuredImage,
      metaTitle,
      metaDescription: cleanField(p.metaDescription, { singleLine: false, max: 5000 }),
      metaImage: p.metaImage,
      status: p.passwordHash ? 'DRAFT' as const : p.status,
      visibility: p.visibility === 'PUBLIC' ? 'PUBLIC' as const : 'UNLISTED' as const,
      publishedAt: p.publishedAt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }
  })
  const usedCategoryIds = new Set(links.map((l) => l.categoryId))
  const usedCategories = categories.filter((c) => usedCategoryIds.has(c.id))

  report.counts = { posts: posts.length, categories: usedCategories.length, unusedCategoriesSkipped: categories.length - usedCategories.length, postCategoryLinks: links.length, media: media.length, copiedImages: derived.size }
  report.adjusted = {
    passwordProtectedToDraft: posts.filter((p) => p.passwordHash).map((p) => p.slug),
    noindexToUnlisted: posts.filter((p) => p.visibility !== 'PUBLIC').map((p) => p.slug),
    titleOrTextCleaned: posts.filter((p) => cleanField(p.title, { max: 500 }) !== p.title).map((p) => ({ slug: p.slug, before: p.title, after: cleanField(p.title, { max: 500 }) })),
    metaTitleDiffersFromSeoTitle: posts.filter((p) => p.metaTitle && p.seoTitle && p.metaTitle !== p.seoTitle).map((p) => ({ slug: p.slug, kept: p.metaTitle, dropped: p.seoTitle })),
    slugsNotMatchingNewRules: posts.filter((p) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)).map((p) => p.slug),
  }
  report.images = { problems: imageProblems }
  report.posts = posts.map((p) => {
    const c = converted.get(p.id)!
    const wordDiff = c.wordsBefore ? Math.abs(c.wordsAfter - c.wordsBefore) / c.wordsBefore : 0
    return { slug: p.slug, rawBlocks: c.rawBlocks, words: [c.wordsBefore, c.wordsAfter], images: [c.imagesBefore, c.imagesAfter], flagged: (wordDiff > 0.03 && c.wordsBefore > 20) || c.imagesAfter < c.imagesBefore, notes: [...blockNotes.get(p.id)!, ...c.notes] }
  })
  const postReport = report.posts as { slug: string; rawBlocks: number; flagged: boolean }[]
  const summary = {
    posts: posts.length,
    categories: usedCategories.length,
    media: media.length,
    copiedImages: derived.size,
    imageProblems: imageProblems.length,
    postsWithRawHtmlBlocks: postReport.filter((p) => p.rawBlocks).map((p) => `${p.slug} (${p.rawBlocks})`),
    postsFlagged: postReport.filter((p) => p.flagged).map((p) => p.slug),
    deleteTestPosts: DELETE_POSTS,
    deleteTestMedia: DELETE_MEDIA,
    keptTargetPosts: KEEP_POSTS,
  }
  report.summary = summary
  save()
  console.log('\nSummary:', JSON.stringify(summary, null, 1))
  console.log(`Report: ${REPORT}`)

  if (!APPLY) {
    // the old site must serve the files: try a few
    for (const m of media.filter((m) => m.size < 2_000_000).slice(0, 5)) {
      const buf = await downloadSourceMedia(m.url, m.size + 1)
      if (buf.length !== m.size) fail(`Size mismatch for ${m.url}: ${buf.length} != ${m.size}`)
    }
    console.log('\nDry run: nothing was written. Re-run with --apply to write.')
    return
  }

  // --- confirmation
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await new Promise<string>((resolve) => rl.question(`\nThis writes to ${TARGET_HOST} and bucket ${BUCKET}. Type the target host to continue: `, resolve))
  rl.close()
  if (answer.trim() !== TARGET_HOST) fail('Not confirmed')

  // 1. test content
  if (DELETE_POSTS.length) {
    await db.$transaction([
      db.revision.deleteMany({ where: { entityType: 'POST', entityId: { in: DELETE_POSTS } } }),
      db.post.deleteMany({ where: { id: { in: DELETE_POSTS } } }),
    ])
    console.log(`Deleted ${DELETE_POSTS.length} test post(s)`)
  }
  for (const m of testMedia) {
    for (const key of [m.key, m.originalKey].filter((k): k is string => !!k)) await bucket().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
    await db.media.delete({ where: { id: m.id } })
  }
  if (testMedia.length) console.log(`Deleted ${testMedia.length} test media file(s)`)

  // 2. media
  console.log('Copying media…')
  const existingMedia = new Map((await db.media.findMany({ select: { id: true, key: true, size: true } })).map((m) => [m.key, m]))
  const mediaFailures: string[] = []
  const mediaConflicts: string[] = []
  let copied = 0, skipped = 0
  await pool(media, CONCURRENCY, async (m, i) => {
    try {
      const existing = existingMedia.get(m.key)
      if (existing && existing.id !== m.id) { mediaConflicts.push(`${m.key}: already in the target as ${existing.id} (left as is)`); return }
      const isSvg = m.mimeType === 'image/svg+xml'
      const present = await objectSize(m.key)
      let size = m.size
      if (present !== null && (present === m.size || (isSvg && existing && present === existing.size))) { skipped++; size = present }
      else {
        let buf = await downloadSourceMedia(m.url, m.size + 1)
        if (buf.length !== m.size) throw new Error(`size ${buf.length} != ${m.size}`)
        if (isSvg) buf = Buffer.from(sanitizeSvg(buf.toString('utf8')))
        await putObject(m.key, buf, m.mimeType, m.filename)
        size = buf.length
        copied++
      }
      const data = { key: m.key, url: m.url, filename: m.filename, mimeType: m.mimeType, size, width: m.width, height: m.height, alt: m.alt, createdAt: m.createdAt }
      if (existing) await db.media.update({ where: { id: m.id }, data: { size } })
      else await db.media.create({ data: { id: m.id, ...data } })
      if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${media.length}`)
    } catch (error) {
      mediaFailures.push(`${m.url}: ${(error as Error).message}`)
    }
  })
  for (const d of derived.values()) {
    try {
      if (existingMedia.has(d.key)) continue
      if ((await objectSize(d.key)) !== d.buf.length) await putObject(d.key, d.buf, 'image/webp', d.filename)
      await db.media.create({ data: { key: d.key, url: d.url, filename: d.filename, mimeType: 'image/webp', size: d.buf.length, width: d.width, height: d.height } })
      copied++
    } catch (error) {
      mediaFailures.push(`${d.url}: ${(error as Error).message}`)
    }
  }
  report.media = { copied, alreadyThere: skipped, failures: mediaFailures, conflicts: mediaConflicts }
  save()
  console.log(`  copied ${copied}, already there ${skipped}, failed ${mediaFailures.length}`)
  const failedReferenced = mediaFailures.filter((f) => referenced.has(f.split(':')[0]))
  if (failedReferenced.length) fail(`${failedReferenced.length} media file(s) used by posts failed; posts were NOT written. Re-run to retry (see ${REPORT})`)

  // 3. categories (only the ones posts use), mapped by slug
  const categoryMap = new Map<string, string>()
  for (const c of usedCategories) {
    const name = cleanField(c.name, { max: 200 }) ?? c.slug
    const existing = await db.category.findUnique({ where: { slug: c.slug } })
    if (existing) { categoryMap.set(c.id, existing.id); continue }
    const idTaken = await db.category.findUnique({ where: { id: c.id } })
    const created = await db.category.create({ data: { ...(idTaken ? {} : { id: c.id }), name, slug: c.slug } })
    categoryMap.set(c.id, created.id)
  }
  console.log(`Categories: ${categoryMap.size}`)

  // 4. posts, 10 per transaction; never overwrite a post edited after an earlier import
  const linksByPost = new Map<string, { categoryId: string; position: number }[]>()
  for (const l of links) linksByPost.set(l.postId, [...(linksByPost.get(l.postId) ?? []), l])
  const targetById = new Map(targetPosts.map((p) => [p.id, p]))
  const editedRevisions = new Set((await db.revision.findMany({ where: { entityType: 'POST', entityId: { in: [...sourceIds] }, authorId: { not: null } }, select: { entityId: true } })).map((r) => r.entityId))
  const editedSkipped: string[] = []
  let written = 0
  for (let i = 0; i < rows.length; i += 10) {
    const batch = rows.slice(i, i + 10).filter((row) => {
      const existing = targetById.get(row.id)
      const edited = existing && (existing.updatedAt.getTime() > row.updatedAt.getTime() || editedRevisions.has(row.id))
      if (edited) editedSkipped.push(row.slug)
      return !edited
    })
    await db.$transaction(async (tx) => {
      for (const row of batch) {
        const { id, ...data } = row
        await tx.post.upsert({ where: { id }, create: { id, ...data, takeaways: [] }, update: data })
        await tx.postCategory.deleteMany({ where: { postId: id } })
        const cats = (linksByPost.get(id) ?? []).map((l) => ({ postId: id, categoryId: categoryMap.get(l.categoryId)!, position: l.position })).filter((l) => l.categoryId)
        if (cats.length) await tx.postCategory.createMany({ data: cats, skipDuplicates: true })
      }
    }, { timeout: 60_000 })
    written += batch.length
    console.log(`  posts ${Math.min(i + 10, rows.length)}/${rows.length}`)
  }

  await db.auditLog.create({ data: { action: 'IMPORT', entityType: 'POST', entityTitle: 'Posts imported from the previous CMS', diff: { posts: written, skippedEditedAfterImport: editedSkipped.length, categories: categoryMap.size, mediaCopied: copied, mediaFailures: mediaFailures.length } } })
  report.written = { posts: written, skippedEditedAfterImport: editedSkipped, categories: categoryMap.size }
  report.finishedAt = new Date().toISOString()
  save()
  console.log(`\nDone: ${written} posts, ${categoryMap.size} categories, ${copied} media copied. Report: ${REPORT}`)
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1 })
  .finally(async () => { await db.$disconnect(); await source.end().catch(() => {}) })
