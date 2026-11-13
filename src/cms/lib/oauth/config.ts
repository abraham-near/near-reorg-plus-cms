import { createHash } from 'node:crypto'
import { safeEqual } from '@/cms/lib/crypto'
import { cmsOrigin } from '@/cms/lib/email'
import { SCOPES } from '@/cms/lib/permissions'

// The CMS as an OAuth 2.1 authorization server for one resource: its remote MCP endpoint. Claude's
// custom connectors use it: the person clicks Connect, signs in to the CMS, approves, and Claude gets
// tokens that only work on /api/mcp. Everything is off unless CMS_MCP_ENABLED=true.

export const mcpEnabled = () => process.env.CMS_MCP_ENABLED === 'true'

/** The issuer and the resource are built from CMS_ORIGIN, never from request headers. */
export const issuer = () => cmsOrigin()
export const mcpResource = () => `${issuer()}/api/mcp`
export const protectedResourceMetadataUrl = () => `${issuer()}/.well-known/oauth-protected-resource/api/mcp`

export const ACCESS_PREFIX = 'ncma_'
export const REFRESH_PREFIX = 'ncmr_'
export const ACCESS_TTL_S = 60 * 60
export const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000
/** A connection lasts at most 90 days (like the longest personal token); then the person connects again. */
export const GRANT_TTL_MS = 90 * 24 * 60 * 60 * 1000
export const CODE_TTL_MS = 2 * 60 * 1000
export const REQUEST_TTL_MS = 10 * 60 * 1000
/** Claude may refresh twice at once (before expiry and after a 401): a reuse this soon is not an attack. */
export const REFRESH_REUSE_GRACE_MS = 60 * 1000

export const TOKEN_RE = /^(ncm[ar]_[A-Za-z0-9_-]{43})$/

export { SCOPES }

/** OAuth errors in the RFC 6749 shape: { error, error_description }. */
export class OAuthError extends Error {
  constructor(public code: string, description: string, public status = 400) { super(description) }
}

/** The space-separated scope parameter → known scopes. Missing means all of them; unknown ones are an error. */
export function parseScopes(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [...SCOPES]
  const requested = [...new Set(raw.trim().split(/\s+/).filter((s) => s !== 'offline_access'))]
  const unknown = requested.filter((s) => !SCOPES.includes(s))
  if (unknown.length) throw new OAuthError('invalid_scope', `Unknown scope: ${unknown.join(' ')}`)
  if (!requested.length) return [...SCOPES]
  if (!requested.includes('cms:read')) requested.unshift('cms:read')
  return SCOPES.filter((s) => requested.includes(s))
}

const CHALLENGE_RE = /^[A-Za-z0-9_-]{43}$/
const VERIFIER_RE = /^[A-Za-z0-9._~-]{43,128}$/
export const isS256Challenge = (challenge: string) => CHALLENGE_RE.test(challenge)

/** PKCE S256 (RFC 7636): base64url(sha256(verifier)) must equal the challenge sent at /authorize. */
export function verifyPkce(verifier: string, challenge: string): boolean {
  if (!VERIFIER_RE.test(verifier) || !CHALLENGE_RE.test(challenge)) return false
  return safeEqual(createHash('sha256').update(verifier).digest('base64url'), challenge)
}

// Where Claude sends people back after consent. Hosted Claude (web, Desktop, Cowork, mobile) uses
// its fixed callback; Claude Code uses a loopback address on a random port (RFC 8252).
const HOSTED_CALLBACKS = ['https://claude.ai/api/mcp/auth_callback', 'https://claude.com/api/mcp/auth_callback']
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

function loopback(uri: string): URL | null {
  try {
    const url = new URL(uri)
    return url.protocol === 'http:' && LOOPBACK_HOSTS.has(url.hostname) && !url.username && !url.password && !url.hash ? url : null
  } catch { return null }
}

/** Whether a redirect URI may ever be used, whatever the client says. */
export function redirectAllowed(uri: string): boolean {
  return HOSTED_CALLBACKS.includes(uri) || !!loopback(uri)
}

/** The requested redirect must be one the client registered: exactly, or the same loopback path on any port. */
export function redirectMatches(requested: string, registered: readonly string[]): boolean {
  if (!redirectAllowed(requested)) return false
  if (registered.includes(requested)) return true
  const req = loopback(requested)
  return !!req && registered.some((r) => {
    const reg = loopback(r)
    return !!reg && reg.hostname === req.hostname && reg.pathname === req.pathname && reg.search === req.search
  })
}
