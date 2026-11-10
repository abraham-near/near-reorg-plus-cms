import type { Prisma } from '@/generated/prisma/client'
import { db } from '@/cms/lib/db'
import { requireActor } from '@/cms/lib/auth'
import { HttpError, json, parseJson, route } from '@/cms/lib/http'
import { createPostSchema, listSchema } from '@/cms/lib/posts/schema'
import { postSelect } from '@/cms/lib/posts/select'
import { createPost } from '@/cms/lib/posts/service'

export const GET = route(async (req) => {
  await requireActor(req, 'content:read')
  const parsed = listSchema.safeParse(Object.fromEntries(new URL(req.url).searchParams))
  if (!parsed.success) throw new HttpError(400, 'Invalid filters')
  const { page, limit, q, status, categoryId, tagId, scheduled } = parsed.data
  const where: Prisma.PostWhereInput = {
    ...(q ? { OR: [{ title: { contains: q, mode: 'insensitive' } }, { slug: { contains: q, mode: 'insensitive' } }] } : {}),
    ...(status ? { status } : {}),
    ...(categoryId ? { categories: { some: { categoryId } } } : {}),
    ...(tagId ? { tags: { some: { id: tagId } } } : {}),
    ...(scheduled === 'true' ? { status: 'PUBLISHED', publishedAt: { gt: new Date() } } : {}),
  }
  const [posts, total] = await Promise.all([
    db.post.findMany({ where, select: postSelect, orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }], take: limit, skip: (page - 1) * limit }),
    db.post.count({ where }),
  ])
  return json({ posts, total, page, limit })
}, { token: true })

export const POST = route(async (req) => {
  const { user } = await requireActor(req, 'post:write')
  const input = await parseJson(req, createPostSchema, 2_000_000)
  return json(await createPost(input, user, req), 201)
}, { token: true })
