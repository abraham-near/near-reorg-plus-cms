import 'server-only'
import { Prisma } from '@/generated/prisma/client'
import { z } from 'zod'
import { cleanText } from '@/cms/lib/sanitize'
import { db } from '@/cms/lib/db'
import { audit, diffFields } from '@/cms/lib/audit'
import { revalidateCategories, revalidatePost } from '@/cms/lib/cache-tags'
import { HttpError } from '@/cms/lib/http'
import type { SessionUser } from '@/cms/lib/session'
import { fallbackSlug, isValidSlug, slugify } from '@/cms/lib/utils'

export type TaxonomyKind = 'category' | 'tag'

export const taxonomySelect = {
  id: true,
  name: true,
  slug: true,
  _count: { select: { posts: true } },
} as const

export type TaxonomyItem = Prisma.CategoryGetPayload<{ select: typeof taxonomySelect }>

const nameSchema = z.string().max(160).transform((v) => cleanText(v, { singleLine: true })).pipe(z.string().trim().min(1))
const slugSchema = z.string().trim().max(120).refine(isValidSlug, 'Use lowercase letters, numbers and single hyphens')

export const taxonomyCreateSchema = z.object({
  name: nameSchema,
  slug: slugSchema.optional(),
}).strict()

export const taxonomyUpdateSchema = taxonomyCreateSchema.partial().refine(
  (value) => value.name !== undefined || value.slug !== undefined,
  'Provide a name or slug',
)

function mapTaxonomyError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') throw new HttpError(409, 'A name or slug already exists')
    if (error.code === 'P2025') throw new HttpError(404, 'Not found')
  }
  throw error
}

export async function listTaxonomy(kind: TaxonomyKind) {
  const args = { select: taxonomySelect, orderBy: { name: 'asc' as const } }
  return kind === 'category' ? db.category.findMany(args) : db.tag.findMany(args)
}

export async function getTaxonomy(kind: TaxonomyKind, id: string) {
  const args = { where: { id }, select: taxonomySelect }
  const item = kind === 'category' ? await db.category.findUnique(args) : await db.tag.findUnique(args)
  if (!item) throw new HttpError(404, 'Not found')
  return item
}

export async function createTaxonomy(
  kind: TaxonomyKind,
  input: z.infer<typeof taxonomyCreateSchema>,
  user: Pick<SessionUser, 'id' | 'email'>,
  req: Request,
) {
  const slug = input.slug ?? (slugify(input.name) || fallbackSlug(kind))
  if (!isValidSlug(slug)) throw new HttpError(400, 'Provide a slug using lowercase letters, numbers and hyphens')
  try {
    const args = { data: { name: input.name, slug }, select: taxonomySelect }
    const item = kind === 'category' ? await db.category.create(args) : await db.tag.create(args)
    await audit(user, { action: 'CREATE', entityType: kind.toUpperCase(), entityId: item.id, entityTitle: item.name }, req)
    revalidateCategories()
    return item
  } catch (error) {
    mapTaxonomyError(error)
  }
}

export async function updateTaxonomy(
  kind: TaxonomyKind,
  id: string,
  input: z.infer<typeof taxonomyUpdateSchema>,
  user: Pick<SessionUser, 'id' | 'email'>,
  req: Request,
) {
  try {
    const result = await db.$transaction(async (tx) => {
      const args = { where: { id }, select: taxonomySelect }
      const before = kind === 'category' ? await tx.category.findUnique(args) : await tx.tag.findUnique(args)
      if (!before) throw new HttpError(404, 'Not found')
      const posts = await tx.post.findMany({
        where: kind === 'category' ? { categories: { some: { categoryId: id } } } : { tags: { some: { id } } },
        select: { slug: true },
      })
      const update = { ...args, data: input }
      const item = kind === 'category' ? await tx.category.update(update) : await tx.tag.update(update)
      return { before, item, posts }
    })
    await audit(user, {
      action: 'UPDATE', entityType: kind.toUpperCase(), entityId: id, entityTitle: result.item.name,
      diff: diffFields(result.before, result.item),
    }, req)
    revalidateCategories()
    for (const post of result.posts) revalidatePost(post.slug)
    return result.item
  } catch (error) {
    mapTaxonomyError(error)
  }
}

export async function deleteTaxonomy(
  kind: TaxonomyKind,
  id: string,
  user: Pick<SessionUser, 'id' | 'email'>,
  req: Request,
) {
  try {
    const result = await db.$transaction(async (tx) => {
      const args = { where: { id }, select: taxonomySelect }
      const before = kind === 'category' ? await tx.category.findUnique(args) : await tx.tag.findUnique(args)
      if (!before) throw new HttpError(404, 'Not found')
      const posts = await tx.post.findMany({
        where: kind === 'category' ? { categories: { some: { categoryId: id } } } : { tags: { some: { id } } },
        select: { slug: true },
      })
      if (kind === 'category') await tx.category.delete({ where: { id }, select: { id: true } })
      else await tx.tag.delete({ where: { id }, select: { id: true } })
      return { before, posts }
    })
    await audit(user, {
      action: 'DELETE', entityType: kind.toUpperCase(), entityId: id, entityTitle: result.before.name,
      diff: { removed: result.before },
    }, req)
    revalidateCategories()
    for (const post of result.posts) revalidatePost(post.slug)
    return { success: true }
  } catch (error) {
    mapTaxonomyError(error)
  }
}
