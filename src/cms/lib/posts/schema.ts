import { z } from 'zod'
import { cleanText, safeUrl } from '@/cms/lib/sanitize'

// Stored as typed (see cleanText): never HTML, rendered as text everywhere.
const line = (max: number) => z.string().max(max).transform((v) => cleanText(v, { singleLine: true }))
const nullableText = (max: number, singleLine = false) => z.string().max(max).transform((v) => cleanText(v, { singleLine })).nullable().optional()
const url = z.string().max(2048).refine((v) => v === '' || (safeUrl(v) !== null && !/[\s"'<>`]/.test(v)), 'Unsafe URL').transform((v) => v ? safeUrl(v)! : null).nullable().optional()
const date = z.iso.datetime({ offset: true }).nullable().optional()
const ids = z.array(z.string().min(1).max(100)).max(100).refine((v) => new Set(v).size === v.length, 'Duplicate IDs').optional()

export const postFields = {
  title: line(500).pipe(z.string().trim().min(1)),
  slug: z.string().min(1).max(200),
  /** The slug follows the title: if it is taken, the server picks the next free one (-2, -3…). */
  autoSlug: z.boolean().optional(),
  body: z.string().max(1_500_000).optional(),
  excerpt: nullableText(10_000),
  featuredImage: url,
  metaTitle: nullableText(500, true),
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
