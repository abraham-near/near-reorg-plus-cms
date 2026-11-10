import { requireActor } from '@/cms/lib/auth'
import { json, parseJson, route } from '@/cms/lib/http'
import { createTaxonomy, listTaxonomy, taxonomyCreateSchema } from '@/cms/lib/posts/taxonomy'

export const GET = route(async (req) => {
  await requireActor(req, 'content:read')
  return json(await listTaxonomy('category'))
}, { token: true })

export const POST = route(async (req) => {
  const { user } = await requireActor(req, 'taxonomy:manage')
  const input = await parseJson(req, taxonomyCreateSchema, 4096)
  return json(await createTaxonomy('category', input, user, req), 201)
}, { token: true })
