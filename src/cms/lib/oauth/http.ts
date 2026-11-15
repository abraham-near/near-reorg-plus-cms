import 'server-only'
import { connection } from 'next/server'
import { HttpError } from '@/cms/lib/http'
import { mcpEnabled, OAuthError } from './config'

// Responses of the OAuth endpoints: never cached, errors in the RFC 6749 shape, and a plain 404
// for everything while the connector is turned off (CMS_MCP_ENABLED).

const NO_STORE = { 'cache-control': 'no-store', pragma: 'no-cache' }
/** Metadata and token endpoints hold no cookies: browser-based tools (MCP Inspector) may read them. */
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type, mcp-protocol-version' }

export const oauthJson = (data: unknown, status = 200, cors = false) =>
  Response.json(data, { status, headers: { ...NO_STORE, ...(cors ? CORS : {}) } })

export function oauthErrorResponse(error: unknown, cors = false): Response {
  if (error instanceof OAuthError) return oauthJson({ error: error.code, error_description: error.message }, error.code === 'invalid_client' ? 401 : error.status, cors)
  if (error instanceof HttpError) return oauthJson({ error: error.status === 429 ? 'slow_down' : 'invalid_request', error_description: error.message }, error.status, cors)
  console.error('[cms] OAuth endpoint failed', error)
  return oauthJson({ error: 'server_error', error_description: 'Something went wrong. Try again.' }, 500, cors)
}

/** Waits for the request (so env is read at runtime, not at build) and 404s while the feature is off. */
export async function oauthGate(): Promise<Response | null> {
  await connection()
  return mcpEnabled() ? null : new Response('Not found', { status: 404, headers: NO_STORE })
}

export const corsPreflight = () => new Response(null, { status: 204, headers: { ...CORS, 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-max-age': '600' } })

/** application/x-www-form-urlencoded bodies (the token and revocation endpoints), capped. */
export async function readForm(req: Request, maxBytes = 8 * 1024): Promise<URLSearchParams> {
  if (!/^application\/x-www-form-urlencoded\b/i.test(req.headers.get('content-type') ?? '')) throw new OAuthError('invalid_request', 'Send the request as application/x-www-form-urlencoded')
  const text = await req.text()
  if (text.length > maxBytes) throw new OAuthError('invalid_request', 'Request too large')
  return new URLSearchParams(text)
}
