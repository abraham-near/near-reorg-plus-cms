import 'server-only'
import { z } from 'zod'
import { apiTokensEnabled } from '@/cms/lib/api-tokens/auth'
import { MAX_ACTIVE_TOKENS, TOKEN_EXPIRY_DAYS, TOKEN_PREFIX, tokenPrefix } from '@/cms/lib/api-tokens/format'
import { audit } from '@/cms/lib/audit'
import { randomToken, sha256 } from '@/cms/lib/crypto'
import { db } from '@/cms/lib/db'
import { apiTokenCreatedEmail, apiTokenRevokedEmail, cmsOrigin, sendEmail } from '@/cms/lib/email'
import { clientIp, HttpError } from '@/cms/lib/http'
import { verifyPassword } from '@/cms/lib/password'
import { can } from '@/cms/lib/permissions'
import { isRateLimited, rateLimit } from '@/cms/lib/rate-limit'
import type { CurrentSession } from '@/cms/lib/session'

const DAY = 24 * 60 * 60 * 1000

export const createTokenSchema = z.object({
  name: z.string().trim().min(1).max(60),
  expiresInDays: z.union(TOKEN_EXPIRY_DAYS.map((days) => z.literal(days)) as [z.ZodLiteral<7>, z.ZodLiteral<30>, z.ZodLiteral<60>, z.ZodLiteral<90>]).default(30),
  currentPassword: z.string().min(1).max(200),
}).strict()

const tokenSelect = {
  id: true, name: true, prefix: true, createdAt: true, createdIp: true, expiresAt: true,
  lastUsedAt: true, lastUsedIp: true, revokedAt: true, revokeReason: true,
} as const

export type ApiTokenRow = {
  id: string; name: string; prefix: string; createdAt: string; createdIp: string | null; expiresAt: string
  lastUsedAt: string | null; lastUsedIp: string | null; revokedAt: string | null; revokeReason: string | null
  status: 'active' | 'expired' | 'revoked'
  user?: { id: string; name: string; email: string }
}

type Row = { id: string; name: string; prefix: string; createdAt: Date; createdIp: string | null; expiresAt: Date; lastUsedAt: Date | null; lastUsedIp: string | null; revokedAt: Date | null; revokeReason: string | null; user?: { id: string; name: string; email: string } }

const serialize = (row: Row, now = Date.now()): ApiTokenRow => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
  expiresAt: row.expiresAt.toISOString(),
  lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
  revokedAt: row.revokedAt?.toISOString() ?? null,
  status: row.revokedAt ? 'revoked' : row.expiresAt.getTime() <= now ? 'expired' : 'active',
})

function assertCanHold(session: CurrentSession) {
  if (!can(session.user.role, 'apitoken:manage')) throw new HttpError(403, 'Your role cannot hold API tokens')
}

/** Mints a token for the signed-in user. Returns the secret once; only its hash is stored. */
export async function createApiToken(session: CurrentSession, input: z.infer<typeof createTokenSchema>, req: Request) {
  assertCanHold(session)
  if (!apiTokensEnabled()) throw new HttpError(403, 'API tokens are not enabled on this environment yet')
  const uid = session.user.id
  if (!(await rateLimit(`apitoken:create:${uid}`, 10, 60 * 60)).ok) throw new HttpError(429, 'Too many tokens created. Try again later.')
  const passwordKey = `apitoken:password:${uid}`
  if (await isRateLimited(passwordKey, 5)) throw new HttpError(429, 'Too many wrong passwords. Try again in 15 minutes.')
  // Asking for the password again means a stolen session cookie cannot mint a long-lived token.
  const user = await db.user.findUnique({ where: { id: uid }, select: { passwordHash: true, active: true } })
  if (!user?.active || !(await verifyPassword(input.currentPassword, user.passwordHash))) {
    await rateLimit(passwordKey, 5, 15 * 60)
    throw new HttpError(400, 'Current password is incorrect')
  }

  const token = `${TOKEN_PREFIX}${randomToken(32)}`
  const ip = clientIp(req)
  const row = await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`apitoken:${uid}`}, 0))`
    const active = await tx.apiToken.count({ where: { userId: uid, revokedAt: null, expiresAt: { gt: new Date() } } })
    if (active >= MAX_ACTIVE_TOKENS) throw new HttpError(409, `You already have ${MAX_ACTIVE_TOKENS} active tokens. Revoke one first.`)
    return tx.apiToken.create({
      data: { name: input.name, prefix: tokenPrefix(token), tokenHash: sha256(token), userId: uid, createdIp: ip, expiresAt: new Date(Date.now() + input.expiresInDays * DAY) },
      select: tokenSelect,
    })
  })
  await audit(session.user, { action: 'API_TOKEN_CREATE', entityType: 'API_TOKEN', entityId: row.id, entityTitle: row.name, diff: { prefix: row.prefix, expiresAt: row.expiresAt.toISOString() } }, req)
  await sendEmail(session.user.email, 'A new API token was created for your CMS account', apiTokenCreatedEmail(session.user.name, row.name, ip, row.expiresAt, `${cmsOrigin()}/admin/settings`))
    .catch((error) => console.error('[cms] token notice failed', row.id, error))
  return { token, ...serialize(row) }
}

export async function listOwnApiTokens(session: CurrentSession) {
  const rows = await db.apiToken.findMany({ where: { userId: session.user.id }, select: tokenSelect, orderBy: { createdAt: 'desc' }, take: 50 })
  return rows.map((row) => serialize(row))
}

export async function listAllApiTokens(session: CurrentSession) {
  if (!can(session.user.role, 'user:manage')) throw new HttpError(403, 'Not allowed')
  const rows = await db.apiToken.findMany({
    select: { ...tokenSelect, user: { select: { id: true, name: true, email: true } } },
    orderBy: [{ revokedAt: { sort: 'desc', nulls: 'first' } }, { createdAt: 'desc' }],
    take: 200,
  })
  return rows.map((row) => serialize(row))
}

/** The owner can revoke their own token; an admin (user:manage) can revoke anyone's. */
export async function revokeApiToken(session: CurrentSession, id: string, req: Request) {
  const row = await db.apiToken.findUnique({ where: { id }, select: { id: true, name: true, prefix: true, userId: true, revokedAt: true, user: { select: { name: true, email: true } } } })
  const own = row?.userId === session.user.id
  if (!row || (!own && !can(session.user.role, 'user:manage'))) throw new HttpError(404, 'Token not found')
  if (row.revokedAt) return { ok: true, alreadyRevoked: true }
  await db.apiToken.update({ where: { id }, data: { revokedAt: new Date(), revokedById: session.user.id, revokeReason: own ? 'USER' : 'ADMIN' } })
  await audit(session.user, { action: 'API_TOKEN_REVOKE', entityType: 'API_TOKEN', entityId: id, entityTitle: row.name, diff: { prefix: row.prefix, owner: row.user.email } }, req)
  if (!own) {
    await sendEmail(row.user.email, 'Your CMS API token was revoked', apiTokenRevokedEmail(row.user.name, row.name, session.user.name, `${cmsOrigin()}/admin/settings`))
      .catch((error) => console.error('[cms] token notice failed', id, error))
  }
  return { ok: true, alreadyRevoked: false }
}

export async function revokeAllOwnApiTokens(session: CurrentSession, req: Request) {
  const { count } = await db.apiToken.updateMany({ where: { userId: session.user.id, revokedAt: null }, data: { revokedAt: new Date(), revokedById: session.user.id, revokeReason: 'USER' } })
  await audit(session.user, { action: 'API_TOKENS_REVOKED', entityType: 'USER', entityId: session.user.id, diff: { count, reason: 'USER' } }, req)
  return { ok: true, revoked: count }
}
