import { hashIp } from '@/cms/lib/crypto'
import { clientIp } from '@/cms/lib/http'
import { OAuthError } from '@/cms/lib/oauth/config'
import { exchangeCode, refreshTokens } from '@/cms/lib/oauth/flow'
import { corsPreflight, oauthErrorResponse, oauthGate, oauthJson, readForm } from '@/cms/lib/oauth/http'
import { rateLimit } from '@/cms/lib/rate-limit'

/** POST /api/oauth/token — authorization_code (with PKCE) and refresh_token grants. Public clients only. */
export async function POST(req: Request) {
  const gate = await oauthGate()
  if (gate) return gate
  try {
    if (!(await rateLimit(`oauth-token:${hashIp(clientIp(req)) ?? 'unknown'}`, 60, 60)).ok) throw new OAuthError('slow_down', 'Too many requests. Wait a minute.', 429)
    const form = await readForm(req)
    if (form.get('client_secret')) throw new OAuthError('invalid_client', 'Public clients do not send a client secret')
    const get = (key: string) => form.get(key)
    switch (form.get('grant_type')) {
      case 'authorization_code':
        return oauthJson(await exchangeCode({ code: get('code'), client_id: get('client_id'), redirect_uri: get('redirect_uri'), code_verifier: get('code_verifier'), resource: get('resource') }), 200, true)
      case 'refresh_token':
        return oauthJson(await refreshTokens({ refresh_token: get('refresh_token'), client_id: get('client_id'), scope: get('scope'), resource: get('resource') }), 200, true)
      default:
        throw new OAuthError('unsupported_grant_type', 'Only authorization_code and refresh_token are supported')
    }
  } catch (error) {
    return oauthErrorResponse(error, true)
  }
}
export const OPTIONS = corsPreflight
