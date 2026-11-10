import { requireActor, requirePermission } from '@/cms/lib/auth'
import { json, parseJson, route } from '@/cms/lib/http'
import { deleteTaxonomy, getTaxonomy, taxonomyUpdateSchema, updateTaxonomy } from '@/cms/lib/posts/taxonomy'

type Context = { params: Promise<{ id: string }> }

export const GET = route<Context>(async (req, ctx) => {
  await requireActor(req, 'content:read')
  const { id } = await ctx.params
  return json(await getTaxonomy('category', id))
}, { token: true })

export const PATCH = route<Context>(async (req, ctx) => {
  const { user } = await requirePermission('taxonomy:manage')
  const { id } = await ctx.params
  const input = await parseJson(req, taxonomyUpdateSchema, 4096)
  return json(await updateTaxonomy('category', id, input, user, req))
})

export const DELETE = route<Context>(async (req, ctx) => {
  const { user } = await requirePermission('taxonomy:manage')
  const { id } = await ctx.params
  return json(await deleteTaxonomy('category', id, user, req))
})
