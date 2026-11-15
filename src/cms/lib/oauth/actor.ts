import 'server-only'
import { hashIp, sha256 } from '@/cms/lib/crypto'
import { db } from '@/cms/lib/db'
import { clientIp, userAgent } from '@/cms/lib/http'
import { can } from '@/cms/lib/permissions'
import { isRateLimited, rateLimit } from '@/cms/lib/rate-limit'
import type { CurrentSession } from '@/cms/lib/session'
import { ACCESS_PREFIX, mcpResource, protectedResourceMetadataUrl, SCOPES } from './config'

const FAILS_PER_MINUTE = 20 // bad tokens from one IP before it is blocked for the minute
const REQUESTS_PER_MINUTE = 120 // per connection
const TOUCH_MS = 60_000

/** Why /api/mcp refused a request: always answered with 401 + WWW-Authenticate so Claude (re)connects. */
export class McpAuthError extends Error {
  constructor(public status: 401 | 429, public error?: 'invalid_token', message = 'Sign in to the NEAR CMS from Claude (Connectors) to continue') { super(message) }
}

/** The WWW-Authenticate header pointing clients to the protected resource metadata (RFC 9728). */
export function challengeHeader(error?: string) {
  return `Bearer resource_metadata="${protectedResourceMetadataUrl()}", scope="${SCOPES.join(' ')}"${error ? `, error="${error}"` : ''}`
}

const BEARER = new RegExp(`^Bearer (${ACCESS_PREFIX}[A-Za-z0-9_-]{43})$`)

/**
 * The person behind an OAuth access token, shaped like a session (via 'token', so every rule for
 * Claude applies: TOKEN_CAP, token-rules, locks, notifications), with the grant's scopes. Checked on
 * every request: token not expired, connection not revoked or expired, issued for this MCP endpoint
 * (audience), person still active and allowed to connect Claude.
 */
export async function resolveOAuthActor(req: Request): Promise<CurrentSession> {
  const ip = clientIp(req)
  const failKey = `oauth-fail:${hashIp(ip) ?? 'unknown'}`
  if (await isRateLimited(failKey, FAILS_PER_MINUTE)) throw new McpAuthError(429, undefined, 'Too many invalid tokens. Try again in a minute.')
  const header = req.headers.get('authorization')
  if (!header) throw new McpAuthError(401)
  const token = header.length <= 512 ? BEARER.exec(header)?.[1] : undefined
  const fail = async (): Promise<never> => {
    await rateLimit(failKey, FAILS_PER_MINUTE, 60)
    throw new McpAuthError(401, 'invalid_token', 'The connection expired or was revoked. Reconnect the NEAR CMS in Claude (Connectors).')
  }
  if (!token) return fail()
  const row = await db.oAuthToken.findUnique({
    where: { tokenHash: sha256(token) },
    select: {
      kind: true, expiresAt: true,
      grant: { select: { id: true, scopes: true, resource: true, expiresAt: true, revokedAt: true, lastUsedAt: true, user: { select: { id: true, email: true, name: true, role: true, active: true } } } },
    },
  })
  const now = Date.now()
  if (!row || row.kind !== 'ACCESS' || row.expiresAt.getTime() <= now) return fail()
  const { grant } = row
  if (grant.revokedAt || grant.expiresAt.getTime() <= now || grant.resource !== mcpResource() || !grant.user.active || !can(grant.user.role, 'apitoken:manage')) return fail()
  if (!(await rateLimit(`oauth:${grant.id}`, REQUESTS_PER_MINUTE, 60)).ok) throw new McpAuthError(429, undefined, 'Too many requests. Try again in a minute.')
  if (!grant.lastUsedAt || now - grant.lastUsedAt.getTime() > TOUCH_MS) {
    await db.oAuthGrant.update({ where: { id: grant.id }, data: { lastUsedAt: new Date(now), lastUsedIp: ip, lastUsedAgent: userAgent(req) } }).catch(() => {})
  }
  const { id, email, name, role } = grant.user
  return { id: grant.id, user: { id, email, name, role, via: 'token', apiTokenId: grant.id, authKind: 'oauth', scopes: grant.scopes } }
}
