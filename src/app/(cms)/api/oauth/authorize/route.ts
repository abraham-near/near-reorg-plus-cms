import { hashIp } from '@/cms/lib/crypto'
import { clientIp } from '@/cms/lib/http'
import { escapeHtml } from '@/cms/lib/sanitize'
import { issuer, OAuthError } from '@/cms/lib/oauth/config'
import { startAuthorization } from '@/cms/lib/oauth/flow'
import { oauthGate } from '@/cms/lib/oauth/http'
import { rateLimit } from '@/cms/lib/rate-limit'

/**
 * GET /api/oauth/authorize — where Claude sends the person when they click Connect. The request is
 * checked and stored, and the person goes on to sign in and approve (/admin/oauth/consent). Problems
 * with the client or its redirect address are shown here, never redirected to an unverified place.
 */
export async function GET(req: Request) {
  const gate = await oauthGate()
  if (gate) return gate
  const page = (message: string, status = 400) => new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Cannot connect · NEAR CMS</title></head><body style="font-family:system-ui;max-width:32rem;margin:4rem auto;padding:0 1rem"><h1 style="font-size:1.25rem">This connection cannot continue</h1><p>${escapeHtml(message)}</p><p>Go back to Claude and try Connect again.</p></body></html>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-frame-options': 'DENY', 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'" } },
  )
  if (!(await rateLimit(`oauth-authorize:${hashIp(clientIp(req)) ?? 'unknown'}`, 30, 60)).ok) return page('Too many attempts. Wait a minute.', 429)
  const q = new URL(req.url).searchParams
  try {
    const result = await startAuthorization({
      response_type: q.get('response_type'), client_id: q.get('client_id'), redirect_uri: q.get('redirect_uri'), state: q.get('state'),
      code_challenge: q.get('code_challenge'), code_challenge_method: q.get('code_challenge_method'), scope: q.get('scope'), resource: q.get('resource'),
    })
    const to = 'redirect' in result ? result.redirect : `${issuer()}/admin/oauth/consent?req=${encodeURIComponent(result.requestId)}`
    return new Response(null, { status: 303, headers: { location: to, 'cache-control': 'no-store' } })
  } catch (error) {
    if (error instanceof OAuthError) return page(error.message)
    console.error('[cms] OAuth authorize failed', error)
    return page('Something went wrong. Try again.', 500)
  }
}
