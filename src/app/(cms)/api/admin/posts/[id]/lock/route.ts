import { Prisma } from '@/generated/prisma/client'
import { db } from '@/cms/lib/db'
import { canActor, requireActor } from '@/cms/lib/auth'
import { audit } from '@/cms/lib/audit'
import { HttpError, json, parseJson, route } from '@/cms/lib/http'
import { emptySchema, lockSchema } from '@/cms/lib/posts/schema'
import type { PostContext } from '@/cms/lib/posts/select'
import { activeLock, LOCK_TTL_MS } from '@/cms/lib/posts/service'
import type { SessionUser } from '@/cms/lib/session'

const select = { lockedAt: true, lockedById: true, lockedByTokenId: true } as const
type Lock = { lockedById: string | null; lockedByTokenId: string | null }
// A person's browser and their API token (Claude) are different lock holders.
const mine = (post: Lock, user: SessionUser) => post.lockedById === user.id && (post.lockedByTokenId ?? null) === (user.apiTokenId ?? null)
async function read(id: string) {
  const post = await db.post.findUnique({ where: { id }, select })
  if (!post) throw new HttpError(404, 'Post not found')
  return post
}

export const GET = route<PostContext>(async (req, ctx) => {
  const { user } = await requireActor(req, 'content:read')
  const post = await read((await ctx.params).id)
  return json({ ...post, active: activeLock(post), lockedByMe: activeLock(post) && mine(post, user), viaToken: !!post.lockedByTokenId })
}, { token: true })

export const POST = route<PostContext>(async (req, ctx) => {
  const { user } = await requireActor(req, 'post:write')
  const { override } = await parseJson(req, lockSchema, 1024)
  if (override && !canActor(user, 'lock:override')) throw new HttpError(403, 'Not allowed')
  const { id } = await ctx.params
  const previous = await read(id)
  const lockedAt = new Date()
  const tokenId = user.apiTokenId ?? null
  const condition = override ? Prisma.empty : Prisma.sql`AND ("lockedById" IS NULL OR ("lockedById" = ${user.id} AND "lockedByTokenId" IS NOT DISTINCT FROM ${tokenId}) OR "lockedAt" IS NULL OR "lockedAt" <= ${new Date(Date.now() - LOCK_TTL_MS).toISOString()}::timestamp)`
  // A heartbeat must not alter the content version or last-edited timestamp.
  // ISO text keeps Prisma's UTC timestamp columns independent of the database time zone.
  const result = await db.$executeRaw`UPDATE "Post" SET "lockedAt" = ${lockedAt.toISOString()}::timestamp, "lockedById" = ${user.id}, "lockedByTokenId" = ${tokenId} WHERE id = ${id} ${condition}`
  if (!result) throw new HttpError(423, previous.lockedByTokenId ? 'An API token (Claude) holds this lock for up to 90 seconds' : 'Another editor holds this lock')
  if (!activeLock(previous) || !mine(previous, user)) await audit(user, { action: override ? 'LOCK_OVERRIDE' : 'LOCK', entityType: 'POST', entityId: id }, req)
  return json({ acquired: true, lockedAt, lockedById: user.id })
}, { token: true })

export const DELETE = route<PostContext>(async (req, ctx) => {
  const { user } = await requireActor(req, 'post:write')
  await parseJson(req, emptySchema, 1024)
  const { id } = await ctx.params
  const previous = await read(id)
  const override = previous.lockedById !== null && !mine(previous, user)
  if (override && !canActor(user, 'lock:override')) throw new HttpError(403, 'Not allowed')
  const result = await db.$executeRaw`UPDATE "Post" SET "lockedAt" = NULL, "lockedById" = NULL, "lockedByTokenId" = NULL WHERE id = ${id} AND "lockedById" IS NOT DISTINCT FROM ${previous.lockedById} AND "lockedByTokenId" IS NOT DISTINCT FROM ${previous.lockedByTokenId} AND "lockedAt" IS NOT DISTINCT FROM ${previous.lockedAt?.toISOString() ?? null}::timestamp`
  if (!result) throw new HttpError(409, 'Lock changed. Try again.')
  await audit(user, { action: override ? 'LOCK_OVERRIDE' : 'UNLOCK', entityType: 'POST', entityId: id }, req)
  return json({ released: true })
}, { token: true })
