import { revokeToken } from '@/cms/lib/oauth/flow'
import { corsPreflight, oauthErrorResponse, oauthGate, readForm } from '@/cms/lib/oauth/http'

/** POST /api/oauth/revoke (RFC 7009): ends the connection a token belongs to. Always 200 for unknown tokens. */
export async function POST(req: Request) {
  const gate = await oauthGate()
  if (gate) return gate
  try {
    await revokeToken((await readForm(req)).get('token'))
    return new Response(null, { status: 200, headers: { 'cache-control': 'no-store', 'access-control-allow-origin': '*' } })
  } catch (error) {
    return oauthErrorResponse(error, true)
  }
}
export const OPTIONS = corsPreflight
