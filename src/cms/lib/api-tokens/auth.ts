import 'server-only'
import { audit } from '@/cms/lib/audit'
import { hashIp, sha256 } from '@/cms/lib/crypto'
import { db } from '@/cms/lib/db'
import { clientIp, HttpError, userAgent } from '@/cms/lib/http'
import { can } from '@/cms/lib/permissions'
import { isRateLimited, rateLimit } from '@/cms/lib/rate-limit'
import type { CurrentSession } from '@/cms/lib/session'
import { BEARER_RE } from './format'

const FAILS_PER_MINUTE = 20 // bad tokens from one IP before it is blocked for the minute
const REQUESTS_PER_MINUTE = 120 // per token
const TOUCH_MS = 60_000 // refresh lastUsed* at most once a minute

/** Off unless CMS_API_TOKENS_ENABLED=true. */
export const apiTokensEnabled = () => process.env.CMS_API_TOKENS_ENABLED === 'true'

/** The token in an `Authorization: Bearer ncms_…` header, or null. Basic auth and other bearers are ignored. */
export function parseBearer(req: Request): string | null {
  const header = req.headers.get('authorization')
  if (!header || header.length > 2048) return null
  return BEARER_RE.exec(header)?.[1] ?? null
}

async function fail(ip: string | null): Promise<never> {
  await rateLimit(`apitoken-fail:${hashIp(ip) ?? 'unknown'}`, FAILS_PER_MINUTE, 60)
  throw new HttpError(401, 'Invalid or expired API token')
}

/**
 * The person behind a bearer token, shaped like a session so services work unchanged. Role and
 * active status are read on every request, so a demotion or deactivation applies immediately.
 */
export async function resolveTokenActor(req: Request): Promise<CurrentSession> {
  if (!apiTokensEnabled()) throw new HttpError(403, 'API tokens are disabled on this environment')
  const ip = clientIp(req)
  if (await isRateLimited(`apitoken-fail:${hashIp(ip) ?? 'unknown'}`, FAILS_PER_MINUTE)) throw new HttpError(429, 'Too many invalid tokens. Try again in a minute.')
  const token = parseBearer(req)
  if (!token) return fail(ip)
  const row = await db.apiToken.findUnique({
    where: { tokenHash: sha256(token) },
    select: {
      id: true, name: true, prefix: true, expiresAt: true, revokedAt: true, lastUsedAt: true,
      user: { select: { id: true, email: true, name: true, role: true, active: true } },
    },
  })
  if (!row) return fail(ip)
  const now = Date.now()
  if (row.revokedAt || row.expiresAt.getTime() <= now || !row.user.active || !can(row.user.role, 'apitoken:manage')) {
    // A real token being refused is worth knowing about: it may have leaked.
    await audit(row.user, { action: 'API_TOKEN_REJECTED', entityType: 'API_TOKEN', entityId: row.id, entityTitle: row.name, diff: { prefix: row.prefix, reason: row.revokedAt ? 'revoked' : row.expiresAt.getTime() <= now ? 'expired' : 'user' } }, req)
    return fail(ip)
  }
  if (!(await rateLimit(`apitoken:${row.id}`, REQUESTS_PER_MINUTE, 60)).ok) throw new HttpError(429, 'Too many requests for this token. Try again in a minute.')
  if (!row.lastUsedAt || now - row.lastUsedAt.getTime() > TOUCH_MS) {
    await db.apiToken.update({ where: { id: row.id }, data: { lastUsedAt: new Date(now), lastUsedIp: ip, lastUsedAgent: userAgent(req) } }).catch(() => {})
  }
  const { id, email, name, role } = row.user
  return { id: row.id, user: { id, email, name, role, via: 'token', apiTokenId: row.id } }
}
