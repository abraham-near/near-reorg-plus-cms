import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { connection } from 'next/server'
import { challengeHeader, McpAuthError, resolveOAuthActor } from '@/cms/lib/oauth/actor'
import { issuer, mcpEnabled } from '@/cms/lib/oauth/config'
import { createInProcessApi } from '@/cms/mcp/remote/dispatch'
import { createRemoteServer } from '@/cms/mcp/remote/server'

// The NEAR CMS as a remote MCP server: the "custom connector" people add in Claude (Desktop, Cowork,
// claude.ai). Stateless Streamable HTTP: every POST carries an OAuth access token (issued by this CMS
// for exactly this URL), and a fresh server is built for that request and that person.

const NO_STORE = { 'cache-control': 'no-store' }
const MAX_BODY = 2 * 1024 * 1024

function unauthorized(error: McpAuthError) {
  return Response.json(
    { error: error.error ?? 'unauthorized', error_description: error.message },
    { status: error.status, headers: { ...NO_STORE, ...(error.status === 401 ? { 'www-authenticate': challengeHeader(error.error) } : { 'retry-after': '60' }) } },
  )
}

export async function POST(req: Request) {
  await connection()
  if (!mcpEnabled()) return new Response('Not found', { status: 404 })
  const expected = new URL(issuer())
  // Only under the CMS's own address (the resource the tokens are bound to), and never from a web page
  // on another origin (DNS rebinding, cross-site requests).
  if (req.headers.get('host') !== expected.host) return new Response('Misdirected request', { status: 421, headers: NO_STORE })
  const origin = req.headers.get('origin')
  if (origin && origin !== expected.origin) return new Response('Forbidden', { status: 403, headers: NO_STORE })
  if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY) return new Response('Request too large', { status: 413, headers: NO_STORE })

  let actor
  try { actor = await resolveOAuthActor(req) } catch (error) {
    if (error instanceof McpAuthError) return unauthorized(error)
    throw error
  }
  const server = createRemoteServer(actor, createInProcessApi(actor, req))
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
  try {
    await server.connect(transport)
    const res = await transport.handleRequest(req)
    const headers = new Headers(res.headers)
    headers.set('cache-control', 'no-store')
    return new Response(res.body ? await res.text() : null, { status: res.status, headers })
  } finally {
    await server.close().catch(() => {})
  }
}

/** Stateless: no server-to-client stream and no sessions to end. */
export async function GET() {
  await connection()
  return new Response(mcpEnabled() ? 'Method not allowed' : 'Not found', { status: mcpEnabled() ? 405 : 404, headers: { allow: 'POST' } })
}
export const DELETE = GET
