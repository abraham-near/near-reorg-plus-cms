import { z } from 'zod'
import { hashIp, randomToken } from '@/cms/lib/crypto'
import { db } from '@/cms/lib/db'
import { clientIp } from '@/cms/lib/http'
import { OAuthError, redirectAllowed } from '@/cms/lib/oauth/config'
import { corsPreflight, oauthErrorResponse, oauthGate, oauthJson } from '@/cms/lib/oauth/http'
import { rateLimit } from '@/cms/lib/rate-limit'

const schema = z.object({
  redirect_uris: z.array(z.string().max(512)).min(1).max(5),
  client_name: z.string().max(100).optional(),
  token_endpoint_auth_method: z.literal('none').optional(),
  grant_types: z.array(z.string().max(50)).max(5).optional(),
  response_types: z.array(z.string().max(50)).max(5).optional(),
}).passthrough()

/**
 * POST /api/oauth/register — Dynamic Client Registration (RFC 7591), only with
 * CMS_OAUTH_DCR_ENABLED=true (MCP Inspector, clients without CIMD). Public clients only, and only
 * redirect addresses the CMS allows anyway (Claude's callback, loopback).
 */
export async function POST(req: Request) {
  const gate = await oauthGate()
  if (gate) return gate
  if (process.env.CMS_OAUTH_DCR_ENABLED !== 'true') return new Response('Not found', { status: 404 })
  try {
    if (!(await rateLimit(`oauth-register:${hashIp(clientIp(req)) ?? 'unknown'}`, 10, 3600)).ok) throw new OAuthError('slow_down', 'Too many registrations. Try later.', 429)
    let body: unknown
    try { body = JSON.parse((await req.text()).slice(0, 16 * 1024)) } catch { throw new OAuthError('invalid_client_metadata', 'Send JSON') }
    const parsed = schema.safeParse(body)
    if (!parsed.success) throw new OAuthError('invalid_client_metadata', 'Invalid client metadata (public clients only)')
    const redirectUris = parsed.data.redirect_uris
    if (!redirectUris.every(redirectAllowed)) throw new OAuthError('invalid_redirect_uri', 'Only Claude\'s callback and loopback addresses are allowed')
    const clientId = `dcr_${randomToken(18)}`
    const name = parsed.data.client_name?.trim() || 'MCP client'
    await db.oAuthClient.create({ data: { clientId, kind: 'DCR', name, redirectUris } })
    return oauthJson({ client_id: clientId, client_name: name, redirect_uris: redirectUris, token_endpoint_auth_method: 'none', grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'] }, 201, true)
  } catch (error) {
    return oauthErrorResponse(error, true)
  }
}
export const OPTIONS = corsPreflight
