import { z } from 'zod'
import { requirePermission } from '@/cms/lib/auth'
import { json, parseJson, route } from '@/cms/lib/http'
import { createApiToken, createTokenSchema, listOwnApiTokens, revokeAllOwnApiTokens } from '@/cms/lib/people/api-tokens'

// Session only: a token can never list, mint or revoke tokens (route() refuses bearer tokens here).

/** GET /api/admin/tokens: the caller's own tokens. */
export const GET = route(async () => {
  const session = await requirePermission('admin:access')
  return json({ tokens: await listOwnApiTokens(session) })
})

export const POST = route(async (req) => {
  const session = await requirePermission('apitoken:manage')
  const input = await parseJson(req, createTokenSchema, 2_000)
  return json(await createApiToken(session, input, req), 201)
})

/** Revokes all of the caller's own tokens. */
export const DELETE = route(async (req) => {
  const session = await requirePermission('admin:access')
  await parseJson(req, z.object({}).strict(), 256)
  return json(await revokeAllOwnApiTokens(session, req))
})
