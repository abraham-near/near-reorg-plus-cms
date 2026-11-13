import 'server-only'
import { Prisma } from '@/generated/prisma/client'
import { db } from '@/cms/lib/db'
import { HttpError } from '@/cms/lib/http'
import { canActor } from '@/cms/lib/permissions'
import type { SessionUser } from '@/cms/lib/session'
import { audit, diffFields } from '@/cms/lib/audit'
import { saveRevision } from '@/cms/lib/revisions'
import { revalidatePost } from '@/cms/lib/cache-tags'
import { isValidSlug } from '@/cms/lib/utils'
import { rateLimit } from '@/cms/lib/rate-limit'
import { prepareBody } from './body'
import { postSelect, type AdminPost } from './select'
import { createPostSchema, updatePostSchema, type PostInput } from './schema'
import { assertTokenPostWrite } from './token-rules'
import { notifyTokenPublish } from './token-notify'

const RESTORED_FIELDS = ['title', 'body', 'excerpt', 'featuredImage', 'metaTitle', 'metaDescription', 'metaImage'] as const

export const LOCK_TTL_MS = 90_000
export const activeLock = (post: Pick<AdminPost, 'lockedAt' | 'lockedById'>) => !!post.lockedById && !!post.lockedAt && post.lockedAt.getTime() > Date.now() - LOCK_TTL_MS

// The lock holder is a person plus, when it came through an API token, that token: someone's browser
// and their Claude session are different editors.
export function assertEditable(post: AdminPost, user: SessionUser) {
  if (!activeLock(post)) return
  if (post.lockedById === user.id && (post.lockedByTokenId ?? null) === (user.apiTokenId ?? null)) return
  throw new HttpError(423, post.lockedByTokenId
    ? 'An API token (Claude) holds the lock for up to 90 seconds. Try again shortly.'
    : 'Another editor holds the lock. Take over the lock before saving.')
}

const refuseToken = (user: SessionUser, what: string) => {
  if (user.via === 'token') throw new HttpError(403, `${what} is not available through API tokens`)
}

export function assertPublishing(input: PostInput, user: SessionUser, previous?: AdminPost) {
  if ((input.status === 'PUBLISHED' || previous?.status === 'PUBLISHED' || input.publishedAt) && !canActor(user, 'post:publish')) {
    throw new HttpError(403, 'Publishing permission required')
  }
}

export async function loadPost(id: string, tx: Prisma.TransactionClient = db) {
  const post = await tx.post.findUnique({ where: { id }, select: postSelect })
  if (!post) throw new HttpError(404, 'Post not found')
  return post
}

async function lockRow(tx: Prisma.TransactionClient, id: string) {
  await tx.$queryRaw`SELECT id FROM "Post" WHERE id = ${id} FOR UPDATE`
  return loadPost(id, tx)
}

async function validateTaxonomy(tx: Prisma.TransactionClient, input: PostInput) {
  if (input.categoryIds && await tx.category.count({ where: { id: { in: input.categoryIds } } }) !== input.categoryIds.length) throw new HttpError(400, 'Unknown category')
  if (input.tagIds && await tx.tag.count({ where: { id: { in: input.tagIds } } }) !== input.tagIds.length) throw new HttpError(400, 'Unknown tag')
}

function dates(input: PostInput, previous?: AdminPost) {
  const status = input.status ?? previous?.status ?? 'DRAFT'
  const publishedAt = input.publishedAt !== undefined ? input.publishedAt ? new Date(input.publishedAt) : null : previous?.publishedAt ?? null
  const publish = publishedAt ?? (status === 'PUBLISHED' ? new Date() : null)
  return { status, publishedAt: publish }
}

/**
 * Takes the slug for this post. A slug the person typed must be free (409 otherwise). A slug that
 * only follows the title (autoSlug) takes the next free variant instead: "launch", "launch-2", …
 * Each candidate is checked under an advisory lock, so two saves cannot take the same one.
 */
async function claimSlug(tx: Prisma.TransactionClient, slug: string, auto: boolean, postId?: string): Promise<string> {
  for (let n = 1; n <= 50; n++) {
    const suffix = n === 1 ? '' : `-${n}`
    const candidate = `${slug.slice(0, 200 - suffix.length).replace(/-+$/, '')}${suffix}`
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${candidate}, 0))`
    const owner = await tx.post.findUnique({ where: { slug: candidate }, select: { id: true } })
    if (!owner || owner.id === postId) return candidate
    if (!auto) break
  }
  throw new HttpError(409, 'That slug is already in use. Choose another URL for this post.')
}

/**
 * Through a token (Claude), at most 10 publish/schedule/unpublish actions per hour per credential: if
 * someone approves too much too fast, or a prompt injection slips through, the damage stays small.
 */
const TOKEN_PUBLISH_PER_HOUR = 10
async function limitTokenPublishing(input: PostInput, user: SessionUser, previous?: AdminPost) {
  const statusChanges = input.status !== undefined && input.status !== (previous?.status ?? 'DRAFT') && (input.status === 'PUBLISHED' || previous?.status === 'PUBLISHED')
  const moves = input.publishedAt !== undefined && (input.status ?? previous?.status) === 'PUBLISHED'
  if (!statusChanges && !moves) return
  const { ok } = await rateLimit(`token-publish:${user.apiTokenId ?? user.id}`, TOKEN_PUBLISH_PER_HOUR, 3600)
  if (!ok) throw new HttpError(429, `Claude can publish, schedule or unpublish at most ${TOKEN_PUBLISH_PER_HOUR} posts an hour. Wait, or do it in the CMS editor.`)
}

async function prepare(tx: Prisma.TransactionClient, input: PostInput, user: SessionUser, previous?: AdminPost) {
  assertPublishing(input, user, previous)
  const when = dates(input, previous)
  if (user.via === 'token') {
    assertTokenPostWrite(input, previous)
    await limitTokenPublishing(input, user, previous)
  }
  if (input.slug !== undefined && input.slug !== previous?.slug && !isValidSlug(input.slug)) throw new HttpError(400, 'Use lowercase words and numbers separated by hyphens')
  // Only a post that has never been public lets its URL follow the title; a published URL never moves on its own.
  const followsTitle = !!input.autoSlug && (!previous || (previous.status === 'DRAFT' && !previous.publishedAt))
  if (input.slug && input.slug !== previous?.slug) input = { ...input, slug: await claimSlug(tx, input.slug, followsTitle, previous?.id) }
  await validateTaxonomy(tx, input)
  const { categoryIds, tagIds, body, expectedUpdatedAt: _expected, autoSlug: _auto, ...fields } = input
  void _expected
  void _auto
  return {
    ...fields,
    ...when,
    ...(body !== undefined || !previous ? { body: prepareBody(body) } : {}),
    lastEditedById: user.id,
    ...(categoryIds !== undefined ? { categories: { ...(previous ? { deleteMany: {} } : {}), create: categoryIds.map((categoryId, position) => ({ categoryId, position })) } } : {}),
    ...(tagIds !== undefined ? { tags: { ...(previous ? { set: [] } : {}), connect: tagIds.map((id) => ({ id })) } } : {}),
  }
}

async function unique<T>(fn: () => Promise<T>): Promise<T> {
  try { return await fn() } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new HttpError(409, 'That slug is already in use')
    throw error
  }
}

export async function createPost(input: ReturnType<typeof createPostSchema.parse>, user: SessionUser, req: Request) {
  const post = await unique(() => db.$transaction(async (tx) => {
    const data = await prepare(tx, input, user)
    return tx.post.create({ data: { ...data, title: input.title, slug: data.slug ?? input.slug, authorId: user.id }, select: postSelect })
  }, { timeout: 20_000 }))
  await audit(user, { action: 'CREATE', entityType: 'POST', entityId: post.id, entityTitle: post.title }, req)
  if (post.status === 'PUBLISHED') await audit(user, { action: 'PUBLISH', entityType: 'POST', entityId: post.id, entityTitle: post.title }, req)
  await notifyTokenPublish(null, post, user, req)
  revalidatePost(post.slug)
  return post
}

async function updateInTransaction(tx: Prisma.TransactionClient, previous: AdminPost, input: PostInput, user: SessionUser, message?: string) {
  assertEditable(previous, user)
  // A token must say which version it read, so it never overwrites an editor's save blindly.
  if (user.via === 'token' && !input.expectedUpdatedAt) throw new HttpError(400, 'expectedUpdatedAt is required for API token writes')
  if (input.expectedUpdatedAt && new Date(input.expectedUpdatedAt).getTime() !== previous.updatedAt.getTime()) throw new HttpError(409, 'Post changed. Reload before saving.')
  const data = await prepare(tx, input, user, previous)
  await saveRevision('POST', previous.id, JSON.parse(JSON.stringify(previous)), user.id, message, tx)
  return tx.post.update({ where: { id: previous.id }, data, select: postSelect })
}

async function afterUpdate(previous: AdminPost, post: AdminPost, user: SessionUser, req: Request, restored = false) {
  await audit(user, { action: restored ? 'RESTORE' : 'UPDATE', entityType: 'POST', entityId: post.id, entityTitle: post.title, diff: diffFields(previous, post, ['updatedAt', 'lockedAt']) }, req)
  if (previous.status !== post.status) await audit(user, { action: post.status === 'PUBLISHED' ? 'PUBLISH' : 'STATUS_CHANGE', entityType: 'POST', entityId: post.id, entityTitle: post.title, diff: { from: previous.status, to: post.status } }, req)
  revalidatePost(post.slug, previous.slug)
  await notifyTokenPublish(previous, post, user, req)
}

export async function updatePost(id: string, input: PostInput, user: SessionUser, req: Request) {
  const result = await unique(() => db.$transaction(async (tx) => {
    const previous = await lockRow(tx, id)
    return { previous, post: await updateInTransaction(tx, previous, input, user) }
  }, { timeout: 20_000 }))
  await afterUpdate(result.previous, result.post, user, req)
  return result.post
}

export async function restorePost(id: string, revisionId: string, user: SessionUser, req: Request, expectedUpdatedAt?: string) {
  refuseToken(user, 'Restoring a revision')
  const result = await unique(() => db.$transaction(async (tx) => {
    const previous = await lockRow(tx, id)
    const revision = await tx.revision.findFirst({ where: { id: revisionId, entityType: 'POST', entityId: id }, select: { snapshot: true } })
    if (!revision || !revision.snapshot || typeof revision.snapshot !== 'object' || Array.isArray(revision.snapshot)) throw new HttpError(404, 'Revision not found')
    const snapshot = revision.snapshot as Record<string, unknown>
    // A revision restores the content. Publication (status, time, visibility) and the URL stay as
    // they are now, so restoring never silently unpublishes, reschedules or moves a post.
    const fields: Record<string, unknown> = {}
    for (const key of RESTORED_FIELDS) if (key in snapshot) fields[key] = snapshot[key]
    const categories = snapshot.categories as AdminPost['categories'] | undefined
    const tags = snapshot.tags as AdminPost['tags'] | undefined
    fields.categoryIds = categories?.map((c) => c.categoryId) ?? []
    fields.tagIds = tags?.map((t) => t.id) ?? []
    const parsed = updatePostSchema.safeParse({ ...fields, expectedUpdatedAt })
    if (!parsed.success) throw new HttpError(400, 'This revision cannot be restored')
    return { previous, post: await updateInTransaction(tx, previous, parsed.data, user, `Restored revision ${revisionId}`) }
  }, { timeout: 20_000 }))
  await afterUpdate(result.previous, result.post, user, req, true)
  return result.post
}

export async function deletePost(id: string, user: SessionUser, req: Request) {
  refuseToken(user, 'Deleting a post')
  const post = await db.$transaction(async (tx) => {
    const previous = await lockRow(tx, id)
    assertEditable(previous, user)
    await tx.post.delete({ where: { id }, select: { id: true } })
    return previous
  })
  await audit(user, { action: 'DELETE', entityType: 'POST', entityId: id, entityTitle: post.title }, req)
  revalidatePost(post.slug)
}

export async function bulkPosts(ids: string[], action: 'publish' | 'unpublish' | 'archive' | 'delete', user: SessionUser, req: Request) {
  if (action === 'publish' || action === 'delete') refuseToken(user, `Bulk ${action}`)
  const results = await db.$transaction(async (tx) => {
    const rows: { previous: AdminPost; post: AdminPost | null }[] = []
    // Consistent row ordering prevents opposing bulk operations from deadlocking.
    const previousRows: AdminPost[] = []
    for (const id of [...ids].sort()) {
      const previous = await lockRow(tx, id)
      assertEditable(previous, user)
      if (action !== 'delete') assertPublishing({ status: action === 'publish' ? 'PUBLISHED' : action === 'archive' ? 'ARCHIVED' : 'DRAFT' }, user, previous)
      previousRows.push(previous)
    }
    for (const previous of previousRows) {
      if (action === 'delete') {
        await tx.post.delete({ where: { id: previous.id }, select: { id: true } })
        rows.push({ previous, post: null })
      } else {
        // The row is locked above, so the version it was read at is the one being changed.
        const input = { status: action === 'publish' ? 'PUBLISHED' : action === 'archive' ? 'ARCHIVED' : 'DRAFT', expectedUpdatedAt: previous.updatedAt.toISOString() } as const
        rows.push({ previous, post: await updateInTransaction(tx, previous, input, user, `Bulk ${action}`) })
      }
    }
    return rows
  }, { timeout: 30_000 })
  for (const { previous, post } of results) {
    if (post) await afterUpdate(previous, post, user, req)
    else {
      await audit(user, { action: 'DELETE', entityType: 'POST', entityId: previous.id, entityTitle: previous.title }, req)
      revalidatePost(previous.slug)
    }
  }
  return { success: true, count: results.length }
}
