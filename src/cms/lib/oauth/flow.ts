import 'server-only'
import { Prisma } from '@/generated/prisma/client'
import { audit } from '@/cms/lib/audit'
import { randomToken, sha256 } from '@/cms/lib/crypto'
import { db } from '@/cms/lib/db'
import { can } from '@/cms/lib/permissions'
import type { SessionUser } from '@/cms/lib/session'
import { resolveClient } from './clients'
import {
  ACCESS_PREFIX, ACCESS_TTL_S, CODE_TTL_MS, GRANT_TTL_MS, isS256Challenge, issuer, mcpResource, OAuthError, parseScopes,
  REFRESH_PREFIX, REFRESH_REUSE_GRACE_MS, REFRESH_TTL_MS, REQUEST_TTL_MS, redirectMatches, verifyPkce,
} from './config'

// The OAuth 2.1 authorization code flow with PKCE, for Claude's connectors:
// /authorize → (sign in) → consent → code → /token → access + refresh tokens → /api/mcp.
// Every secret (request id, code, tokens) is random and stored only as a SHA-256 hash.

type Tx = Prisma.TransactionClient

/** Builds the redirect back to the client, with the issuer (RFC 9207) so it can check who answered. */
export function clientRedirect(redirectUri: string, params: Record<string, string | null | undefined>): string {
  const url = new URL(redirectUri)
  for (const [key, value] of Object.entries(params)) if (value) url.searchParams.set(key, value)
  url.searchParams.set('iss', issuer())
  return url.href
}

export type AuthorizeParams = {
  response_type: string | null; client_id: string | null; redirect_uri: string | null; state: string | null
  code_challenge: string | null; code_challenge_method: string | null; scope: string | null; resource: string | null
}

/**
 * Validates an /authorize request. Errors about the client or its redirect URI are thrown as
 * `redirect: false` (shown on a page: never send a person to an unverified address); the others
 * can go back to the client.
 */
export async function startAuthorization(p: AuthorizeParams): Promise<{ requestId: string } | { redirect: string }> {
  const client = await resolveClient(p.client_id)
  if (!p.redirect_uri || !redirectMatches(p.redirect_uri, client.redirectUris)) throw new OAuthError('invalid_request', 'This redirect address is not registered for the client')
  const back = (error: string, description: string) => ({ redirect: clientRedirect(p.redirect_uri!, { error, error_description: description, state: p.state }) })
  if (p.response_type !== 'code') return back('unsupported_response_type', 'Only response_type=code is supported')
  if (p.code_challenge_method !== 'S256' || !p.code_challenge || !isS256Challenge(p.code_challenge)) return back('invalid_request', 'PKCE with S256 is required')
  if (p.resource && p.resource !== mcpResource()) return back('invalid_target', 'Unknown resource')
  if (p.state && p.state.length > 1024) return back('invalid_request', 'state is too long')
  let scopes: string[]
  try { scopes = parseScopes(p.scope) } catch (error) { return back('invalid_scope', (error as Error).message) }
  const requestId = randomToken()
  await db.oAuthAuthorization.create({
    data: {
      requestHash: sha256(requestId), clientId: client.clientId, redirectUri: p.redirect_uri, state: p.state,
      codeChallenge: p.code_challenge, scopes, resource: mcpResource(), expiresAt: new Date(Date.now() + REQUEST_TTL_MS),
    },
  })
  return { requestId }
}

/** A pending request, for the consent page. null when unknown, expired or already answered. */
export async function pendingAuthorization(requestId: string | null | undefined) {
  if (!requestId || requestId.length > 100) return null
  const row = await db.oAuthAuthorization.findUnique({ where: { requestHash: sha256(requestId) } })
  if (!row || row.expiresAt <= new Date() || row.codeHash || row.usedAt) return null
  const client = await db.oAuthClient.findUnique({ where: { clientId: row.clientId }, select: { name: true } })
  return { ...row, clientName: client?.name ?? new URL(row.redirectUri).hostname }
}

/** The person said yes: a grant for the scopes they kept, and a single-use code for the client. */
export async function approveAuthorization(requestId: string, user: SessionUser, keptScopes: string[], req: Request): Promise<string> {
  const pending = await pendingAuthorization(requestId)
  if (!pending) throw new OAuthError('invalid_request', 'This connection request expired. Start again from Claude.')
  if (!can(user.role, 'apitoken:manage')) throw new OAuthError('access_denied', 'Your role cannot connect Claude')
  const scopes = pending.scopes.filter((s) => s === 'cms:read' || keptScopes.includes(s))
  const code = randomToken()
  const grant = await db.$transaction(async (tx) => {
    const claimed = await tx.oAuthAuthorization.updateMany({
      where: { id: pending.id, codeHash: null, usedAt: null, expiresAt: { gt: new Date() } },
      data: { userId: user.id, codeHash: sha256(code), codeExpiresAt: new Date(Date.now() + CODE_TTL_MS), scopes },
    })
    if (claimed.count !== 1) throw new OAuthError('invalid_request', 'This connection request was already answered')
    const created = await tx.oAuthGrant.create({
      data: { userId: user.id, clientId: pending.clientId, clientName: pending.clientName, scopes, resource: pending.resource, expiresAt: new Date(Date.now() + GRANT_TTL_MS) },
    })
    await tx.oAuthAuthorization.update({ where: { id: pending.id }, data: { grantId: created.id } })
    return created
  })
  await audit(user, { action: 'OAUTH_GRANT_CREATED', entityType: 'OAUTH_GRANT', entityId: grant.id, entityTitle: grant.clientName, diff: { scopes, clientId: grant.clientId } }, req)
  return clientRedirect(pending.redirectUri, { code, state: pending.state })
}

/** The person said no. */
export async function denyAuthorization(requestId: string): Promise<string> {
  const pending = await pendingAuthorization(requestId)
  if (!pending) throw new OAuthError('invalid_request', 'This connection request expired. Start again from Claude.')
  await db.oAuthAuthorization.update({ where: { id: pending.id }, data: { usedAt: new Date() } })
  return clientRedirect(pending.redirectUri, { error: 'access_denied', error_description: 'The person declined', state: pending.state })
}

export type TokenResponse = { access_token: string; token_type: 'Bearer'; expires_in: number; refresh_token: string; scope: string }

async function issuePair(tx: Tx, grant: { id: string; scopes: string[]; expiresAt: Date }): Promise<TokenResponse> {
  const access = `${ACCESS_PREFIX}${randomToken()}`
  const refresh = `${REFRESH_PREFIX}${randomToken()}`
  const now = Date.now()
  await tx.oAuthToken.createMany({
    data: [
      { grantId: grant.id, kind: 'ACCESS', tokenHash: sha256(access), expiresAt: new Date(Math.min(now + ACCESS_TTL_S * 1000, grant.expiresAt.getTime())) },
      { grantId: grant.id, kind: 'REFRESH', tokenHash: sha256(refresh), expiresAt: new Date(Math.min(now + REFRESH_TTL_MS, grant.expiresAt.getTime())) },
    ],
  })
  return { access_token: access, token_type: 'Bearer', expires_in: ACCESS_TTL_S, refresh_token: refresh, scope: grant.scopes.join(' ') }
}

const revokeGrant = (tx: Tx | typeof db, grantId: string, reason: string) =>
  tx.oAuthGrant.updateMany({ where: { id: grantId, revokedAt: null }, data: { revokedAt: new Date(), revokeReason: reason } })

const activeGrant = (g: { revokedAt: Date | null; expiresAt: Date }) => !g.revokedAt && g.expiresAt > new Date()

/** grant_type=authorization_code. */
export async function exchangeCode(p: { code: string | null; client_id: string | null; redirect_uri: string | null; code_verifier: string | null; resource: string | null }): Promise<TokenResponse> {
  if (!p.code || !p.code_verifier || !p.client_id || !p.redirect_uri) throw new OAuthError('invalid_request', 'code, code_verifier, client_id and redirect_uri are required')
  const row = await db.oAuthAuthorization.findUnique({ where: { codeHash: sha256(p.code) } })
  if (!row || !row.grantId) throw new OAuthError('invalid_grant', 'Unknown or expired code')
  // A code used twice means it leaked: the connection it created is cut (RFC 9700).
  if (row.usedAt) { await revokeGrant(db, row.grantId, 'CODE_REUSE'); throw new OAuthError('invalid_grant', 'This code was already used') }
  if (!row.codeExpiresAt || row.codeExpiresAt <= new Date()) throw new OAuthError('invalid_grant', 'Unknown or expired code')
  if (row.clientId !== p.client_id || row.redirectUri !== p.redirect_uri) throw new OAuthError('invalid_grant', 'The code was issued to another client or redirect')
  if (p.resource && p.resource !== row.resource) throw new OAuthError('invalid_target', 'Unknown resource')
  if (!verifyPkce(p.code_verifier, row.codeChallenge)) throw new OAuthError('invalid_grant', 'PKCE verification failed')
  return db.$transaction(async (tx) => {
    const used = await tx.oAuthAuthorization.updateMany({ where: { id: row.id, usedAt: null }, data: { usedAt: new Date() } })
    if (used.count !== 1) throw new OAuthError('invalid_grant', 'This code was already used')
    const grant = await tx.oAuthGrant.findUniqueOrThrow({ where: { id: row.grantId! } })
    if (!activeGrant(grant)) throw new OAuthError('invalid_grant', 'This connection was revoked')
    return issuePair(tx, grant)
  })
}

/** grant_type=refresh_token: rotation, with reuse detection. */
export async function refreshTokens(p: { refresh_token: string | null; client_id: string | null; scope: string | null; resource: string | null }): Promise<TokenResponse> {
  if (!p.refresh_token?.startsWith(REFRESH_PREFIX) || !p.client_id) throw new OAuthError('invalid_request', 'refresh_token and client_id are required')
  const hash = sha256(p.refresh_token)
  const result = await db.$transaction(async (tx) => {
    // Serializes refreshes of the same token.
    const rows = await tx.$queryRaw<{ id: string; grantId: string; usedAt: Date | null; expiresAt: Date }[]>`
      SELECT "id", "grantId", "usedAt", "expiresAt" FROM "OAuthToken" WHERE "tokenHash" = ${hash} AND "kind" = 'REFRESH' FOR UPDATE`
    const token = rows[0]
    if (!token) return { error: new OAuthError('invalid_grant', 'Unknown refresh token') }
    const grant = await tx.oAuthGrant.findUniqueOrThrow({ where: { id: token.grantId } })
    if (grant.clientId !== p.client_id) return { error: new OAuthError('invalid_grant', 'The refresh token belongs to another client') }
    if (token.usedAt) {
      // Used before: two refreshes racing (within the grace) is normal; later, the token was stolen.
      if (Date.now() - token.usedAt.getTime() > REFRESH_REUSE_GRACE_MS) return { error: new OAuthError('invalid_grant', 'This refresh token was already used'), revoke: grant.id }
      return { error: new OAuthError('invalid_grant', 'This refresh token was just used') }
    }
    if (token.expiresAt <= new Date() || !activeGrant(grant)) return { error: new OAuthError('invalid_grant', 'This connection expired or was revoked') }
    if (p.resource && p.resource !== grant.resource) return { error: new OAuthError('invalid_target', 'Unknown resource') }
    if (p.scope) {
      const wanted = p.scope.trim().split(/\s+/).filter((s) => s !== 'offline_access')
      if (wanted.some((s) => !grant.scopes.includes(s))) return { error: new OAuthError('invalid_scope', 'A refresh cannot add scopes') }
    }
    await tx.oAuthToken.update({ where: { id: token.id }, data: { usedAt: new Date() } })
    return { tokens: await issuePair(tx, grant) }
  })
  if ('revoke' in result && result.revoke) await revokeGrant(db, result.revoke, 'REFRESH_REUSE')
  if ('error' in result && result.error) throw result.error
  return (result as { tokens: TokenResponse }).tokens
}

/** RFC 7009. Revoking either token ends the whole connection (grant). Unknown tokens are not an error. */
export async function revokeToken(token: string | null): Promise<void> {
  if (!token || !/^ncm[ar]_/.test(token)) return
  const row = await db.oAuthToken.findUnique({ where: { tokenHash: sha256(token) }, select: { grantId: true } })
  if (row) await revokeGrant(db, row.grantId, 'USER')
}

/** Every connection of a person, when their password changes or they lose access (like revokeUserApiTokens). */
export function revokeUserOAuthGrants(userId: string, reason: string, tx: Tx | typeof db = db) {
  return tx.oAuthGrant.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date(), revokeReason: reason } })
}
