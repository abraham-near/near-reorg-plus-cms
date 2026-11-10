import { z } from 'zod'
import { safeUrl, stripTags } from '@/cms/lib/sanitize'

const plain = (max: number) => z.string().max(max).transform(stripTags)
const nullableText = (max: number) => plain(max).nullable().optional()
const url = z.string().max(2048).refine((v) => v === '' || safeUrl(v) !== null, 'Unsafe URL').transform((v) => v ? safeUrl(v)! : null).nullable().optional()
const date = z.iso.datetime({ offset: true }).nullable().optional()
const ids = z.array(z.string().min(1).max(100)).max(100).refine((v) => new Set(v).size === v.length, 'Duplicate IDs').optional()

export const postFields = {
  title: plain(500).pipe(z.string().trim().min(1)),
  slug: z.string().min(1).max(200),
  body: z.string().max(1_500_000).optional(),
  excerpt: nullableText(10_000),
  featuredImage: url,
  metaTitle: nullableText(500),
  metaDescription: nullableText(5000),
  metaImage: url,
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  visibility: z.enum(['PUBLIC', 'UNLISTED']).optional(),
  publishedAt: date,
  categoryIds: ids,
  tagIds: ids,
}
export const createPostSchema = z.object(postFields).strict()
export const updatePostSchema = createPostSchema.partial().extend({
  expectedUpdatedAt: z.iso.datetime({ offset: true }).optional(),
}).strict().refine((v) => Object.keys(v).some((k) => k !== 'expectedUpdatedAt'), 'No changes supplied')
export type PostInput = z.infer<typeof updatePostSchema>
export const bulkSchema = z.object({
  ids: z.array(z.string().min(1).max(100)).min(1).max(100).refine((v) => new Set(v).size === v.length, 'Duplicate IDs'),
  action: z.enum(['publish', 'unpublish', 'archive', 'delete']),
}).strict()
export const lockSchema = z.object({ override: z.boolean().optional() }).strict()
export const emptySchema = z.object({}).strict()
export const restoreSchema = z.object({ revisionId: z.string().min(1).max(100), expectedUpdatedAt: z.iso.datetime({ offset: true }).optional() }).strict()
export const listSchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().max(200).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  categoryId: z.string().max(100).optional(),
  tagId: z.string().max(100).optional(),
  scheduled: z.enum(['true', 'false']).optional(),
})
