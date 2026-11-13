import { createHash, randomBytes } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { OAuthError, parseScopes, redirectAllowed, redirectMatches, verifyPkce } from '@/cms/lib/oauth/config'
import { canActor, SCOPES } from '@/cms/lib/permissions'

const challenge = (verifier: string) => createHash('sha256').update(verifier).digest('base64url')

describe('PKCE (S256 only)', () => {
  it('accepts the verifier that produced the challenge, and nothing else', () => {
    const verifier = randomBytes(32).toString('base64url')
    expect(verifyPkce(verifier, challenge(verifier))).toBe(true)
    expect(verifyPkce(`${verifier}x`, challenge(verifier))).toBe(false)
    // "plain" (verifier == challenge) never passes.
    expect(verifyPkce(verifier, verifier)).toBe(false)
    // Verifiers must be 43–128 unreserved characters.
    expect(verifyPkce('short', challenge('short'))).toBe(false)
    expect(verifyPkce('a'.repeat(129), challenge('a'.repeat(129)))).toBe(false)
    expect(verifyPkce(`${'a'.repeat(43)} `, challenge(`${'a'.repeat(43)} `))).toBe(false)
  })
})

describe('redirect URIs', () => {
  it('allows Claude\'s hosted callback and loopback addresses (Claude Code), nothing else', () => {
    expect(redirectAllowed('https://claude.ai/api/mcp/auth_callback')).toBe(true)
    expect(redirectAllowed('https://claude.com/api/mcp/auth_callback')).toBe(true)
    expect(redirectAllowed('http://localhost:54321/callback')).toBe(true)
    expect(redirectAllowed('http://127.0.0.1:8080/callback')).toBe(true)
    for (const bad of ['https://claude.ai/api/mcp/auth_callback/', 'https://claude.ai.evil.test/api/mcp/auth_callback', 'http://claude.ai/api/mcp/auth_callback', 'https://evil.test/callback', 'https://localhost/callback', 'http://user@localhost:1/callback', 'http://localhost.evil.test:1/callback', 'javascript:alert(1)']) {
      expect(redirectAllowed(bad), bad).toBe(false)
    }
  })
  it('matches exactly, except the port of a loopback address', () => {
    const registered = ['https://claude.ai/api/mcp/auth_callback', 'http://localhost:1234/callback']
    expect(redirectMatches('https://claude.ai/api/mcp/auth_callback', registered)).toBe(true)
    expect(redirectMatches('http://localhost:9999/callback', registered)).toBe(true)
    expect(redirectMatches('http://localhost:9999/other', registered)).toBe(false)
    expect(redirectMatches('http://127.0.0.1:9999/callback', registered)).toBe(false)
    expect(redirectMatches('https://claude.com/api/mcp/auth_callback', registered)).toBe(false)
  })
})

describe('scopes', () => {
  it('defaults to everything, always includes reading, and refuses unknown scopes', () => {
    expect(parseScopes(null)).toEqual(SCOPES)
    expect(parseScopes('cms:write offline_access')).toEqual(['cms:read', 'cms:write'])
    expect(() => parseScopes('cms:read admin:all')).toThrow(OAuthError)
  })
  it('limit what a connection can do, inside the token cap', () => {
    const claude = { role: 'ADMIN' as const, via: 'token' as const, scopes: ['cms:read', 'cms:write', 'media:write'] }
    expect(canActor(claude, 'post:write')).toBe(true)
    expect(canActor(claude, 'media:upload')).toBe(true)
    expect(canActor(claude, 'post:publish')).toBe(false)
    expect(canActor({ ...claude, scopes: SCOPES }, 'post:publish')).toBe(true)
    // Even with every scope, never more than an API token: no deletes, no people.
    for (const permission of ['post:delete', 'media:delete', 'user:manage', 'lock:override', 'apitoken:manage'] as const) expect(canActor({ ...claude, scopes: SCOPES }, permission)).toBe(false)
    // And never more than the person's role.
    expect(canActor({ role: 'PUBLISHER', via: 'token', scopes: SCOPES }, 'user:manage')).toBe(false)
  })
})
