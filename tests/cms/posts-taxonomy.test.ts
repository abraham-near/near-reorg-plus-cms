import { randomUUID } from 'node:crypto'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/cms/lib/db'
import { revalidateCategories, revalidatePost } from '@/cms/lib/cache-tags'
import {
  createTaxonomy, deleteTaxonomy, getTaxonomy, listTaxonomy, taxonomyCreateSchema,
  taxonomyUpdateSchema, updateTaxonomy,
} from '@/cms/lib/posts/taxonomy'

vi.mock('@/cms/lib/cache-tags', () => ({ revalidateCategories: vi.fn(), revalidatePost: vi.fn() }))

describe('taxonomy input schemas', () => {
  it('trims names and accepts explicit slugs', () => {
    expect(taxonomyCreateSchema.parse({ name: ' NEAR ', slug: 'near' })).toEqual({ name: 'NEAR', slug: 'near' })
  })
  it('rejects empty updates and undeclared fields', () => {
    expect(taxonomyUpdateSchema.safeParse({}).success).toBe(false)
    expect(taxonomyCreateSchema.safeParse({ name: 'NEAR', legacyId: 'override' }).success).toBe(false)
  })
})

describe.skipIf(!process.env.TEST_DATABASE_URL)('taxonomy database writes', () => {
  const prefix = `taxonomy-${randomUUID()}`
  const user = { id: prefix, email: 'taxonomy-test@near.org' }
  const req = new Request('http://localhost/api/admin/categories', { headers: { 'x-real-ip': '127.0.0.1' } })

  beforeEach(() => vi.clearAllMocks())
  afterAll(async () => {
    await db.post.deleteMany({ where: { slug: { startsWith: prefix } } })
    await db.category.deleteMany({ where: { name: { startsWith: prefix } } })
    await db.tag.deleteMany({ where: { name: { startsWith: prefix } } })
    await db.auditLog.deleteMany({ where: { userId: prefix } })
  })

  it.each(['category', 'tag'] as const)('creates, updates and deletes a %s with audits and post cache invalidation', async (kind) => {
    const name = `${prefix}-${kind}`
    const item = await createTaxonomy(kind, { name }, user, req)
    expect(item).toMatchObject({ name, slug: name, _count: { posts: 0 } })
    expect(Object.keys(item).sort()).toEqual(['_count', 'id', 'name', 'slug'])
    expect(await listTaxonomy(kind)).toContainEqual(item)
    const post = await db.post.create({
      data: {
        title: name, slug: `${prefix}-post-${kind}`,
        ...(kind === 'category' ? { categories: { create: { categoryId: item.id, position: 0 } } } : { tags: { connect: { id: item.id } } }),
      },
      select: { id: true, slug: true },
    })
    expect((await getTaxonomy(kind, item.id))._count.posts).toBe(1)
    const updated = await updateTaxonomy(kind, item.id, { name: `${name}-renamed` }, user, req)
    expect(updated.slug).toBe(item.slug)
    expect(updated._count.posts).toBe(1)
    expect(revalidatePost).toHaveBeenCalledWith(post.slug)
    const changedSlug = `${name}-new`
    expect((await updateTaxonomy(kind, item.id, { slug: changedSlug }, user, req)).slug).toBe(changedSlug)
    vi.clearAllMocks()
    expect(await deleteTaxonomy(kind, item.id, user, req)).toEqual({ success: true })
    expect(revalidateCategories).toHaveBeenCalledOnce()
    expect(revalidatePost).toHaveBeenCalledWith(post.slug)
    expect(await db.post.findUnique({ where: { id: post.id }, select: { categories: true, tags: { select: { id: true } } } })).toEqual({ categories: [], tags: [] })
    await expect(getTaxonomy(kind, item.id)).rejects.toMatchObject({ status: 404 })
    const entries = await db.auditLog.findMany({ where: { entityId: item.id }, select: { action: true, entityType: true, diff: true } })
    expect(entries.map((entry) => entry.action).sort()).toEqual(['CREATE', 'DELETE', 'UPDATE', 'UPDATE'])
    expect(entries.every((entry) => entry.entityType === kind.toUpperCase())).toBe(true)
    expect(entries.find((entry) => entry.action === 'UPDATE')?.diff).toBeTruthy()
  })

  it.each(['category', 'tag'] as const)('returns friendly conflicts and missing-resource errors for %s', async (kind) => {
    const name = `${prefix}-${kind}-conflict`
    await createTaxonomy(kind, { name }, user, req)
    await expect(createTaxonomy(kind, { name }, user, req)).rejects.toMatchObject({ status: 409 })
    await expect(updateTaxonomy(kind, `${prefix}-missing`, { name: 'Missing' }, user, req)).rejects.toMatchObject({ status: 404 })
    await expect(deleteTaxonomy(kind, `${prefix}-missing`, user, req)).rejects.toMatchObject({ status: 404 })
  })

  it('requires an explicit slug when the name cannot produce one', async () => {
    await expect(createTaxonomy('tag', { name: '日本語' }, user, req)).rejects.toMatchObject({ status: 400 })
  })
})
