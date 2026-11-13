import 'server-only'
import { db } from '@/cms/lib/db'
import { safeFetch, SafeFetchError } from '@/cms/lib/safe-fetch'
import { OAuthError, redirectAllowed } from './config'

// Who may ask a person to connect. Claude identifies itself with a Client ID Metadata Document
// (CIMD): its client_id is an https URL serving a small JSON document with its name and redirect
// URIs. The CMS fetches it only from allowlisted hosts (CMS_OAUTH_CLIENT_HOSTS, default claude.ai
// and claude.com), through safeFetch, and caches it. Clients registered dynamically (DCR, off by
// default) are rows in OAuthClient.

export type Client = { clientId: string; name: string; redirectUris: string[]; kind: 'CIMD' | 'DCR' | 'STATIC' }

const clientHosts = () => (process.env.CMS_OAUTH_CLIENT_HOSTS ?? 'claude.ai,claude.com').split(',').map((h) => h.trim().toLowerCase()).filter(Boolean)
const MIN_CACHE_S = 300
const MAX_CACHE_S = 24 * 60 * 60

type Metadata = { client_id?: unknown; client_name?: unknown; redirect_uris?: unknown; token_endpoint_auth_method?: unknown; grant_types?: unknown }

function cacheSeconds(header: string | string[] | undefined): number {
  const maxAge = Number(String(header ?? '').match(/max-age=(\d+)/)?.[1] ?? 3600)
  return Math.min(MAX_CACHE_S, Math.max(MIN_CACHE_S, maxAge))
}

async function fetchMetadataDocument(clientId: string): Promise<Client> {
  const url = new URL(clientId)
  if (url.protocol !== 'https:' || url.hash || url.username || url.password || !clientHosts().includes(url.hostname.toLowerCase())) {
    throw new OAuthError('invalid_client', 'This client is not allowed to connect to the CMS')
  }
  let res
  try {
    res = await safeFetch(clientId, { allow: clientHosts(), maxBytes: 64 * 1024, timeoutMs: 5000, headers: { accept: 'application/json' } })
  } catch (error) {
    console.error('[cms] client metadata fetch failed', clientId, error instanceof SafeFetchError ? error.reason : error)
    throw new OAuthError('invalid_client', 'The client\'s metadata could not be read')
  }
  let doc: Metadata
  try { doc = JSON.parse(res.body.toString('utf8')) } catch { throw new OAuthError('invalid_client', 'The client\'s metadata is not JSON') }
  if (res.status !== 200 || doc.client_id !== clientId) throw new OAuthError('invalid_client', 'The client\'s metadata does not match its id')
  // Public clients only: no client secrets to keep or leak.
  if (doc.token_endpoint_auth_method !== undefined && doc.token_endpoint_auth_method !== 'none') throw new OAuthError('invalid_client', 'Only public clients (PKCE, no secret) can connect')
  const redirectUris = Array.isArray(doc.redirect_uris) ? doc.redirect_uris.filter((u): u is string => typeof u === 'string' && redirectAllowed(u)) : []
  if (!redirectUris.length) throw new OAuthError('invalid_client', 'The client has no allowed redirect URI')
  const name = typeof doc.client_name === 'string' && doc.client_name.trim() ? doc.client_name.trim().slice(0, 100) : url.hostname
  const cacheUntil = new Date(Date.now() + cacheSeconds(res.headers['cache-control']) * 1000)
  await db.oAuthClient.upsert({
    where: { clientId },
    create: { clientId, kind: 'CIMD', name, redirectUris, cacheUntil },
    update: { name, redirectUris, cacheUntil },
  })
  // The real client ids Claude uses are not all documented: log them once in a while.
  console.info('[cms] OAuth client metadata loaded', clientId)
  return { clientId, name, redirectUris, kind: 'CIMD' }
}

/** The client behind a client_id, or OAuthError('invalid_client'). */
export async function resolveClient(clientId: string | null): Promise<Client> {
  if (!clientId || clientId.length > 512) throw new OAuthError('invalid_client', 'Missing or invalid client_id')
  const row = await db.oAuthClient.findUnique({ where: { clientId } })
  if (row && (row.kind !== 'CIMD' || (row.cacheUntil && row.cacheUntil > new Date()))) {
    if (row.kind === 'DCR' && process.env.CMS_OAUTH_DCR_ENABLED !== 'true') throw new OAuthError('invalid_client', 'Dynamic client registration is turned off')
    return { clientId: row.clientId, name: row.name, redirectUris: row.redirectUris, kind: row.kind }
  }
  if (/^https:\/\//i.test(clientId)) return fetchMetadataDocument(clientId)
  throw new OAuthError('invalid_client', 'Unknown client')
}
