import 'server-only'
import { createSign } from 'node:crypto'
import { safeFetch } from '@/cms/lib/safe-fetch'

// The CMS's own Google identity (a service account): people share a Doc with its email as Viewer and
// the CMS can read that Doc, and only the Docs shared with it. The key lives in the environment
// (GOOGLE_SERVICE_ACCOUNT_JSON, the JSON key file base64-encoded) and never leaves the server: not
// in logs, errors or responses. Access tokens are kept in memory for under an hour.

type ServiceAccount = { client_email: string; private_key: string; token_uri?: string }

const SCOPE = 'https://www.googleapis.com/auth/drive.readonly'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'

let cached: { account: ServiceAccount | null; raw: string | undefined } | null = null
function account(): ServiceAccount | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim()
  if (cached && cached.raw === raw) return cached.account
  let parsed: ServiceAccount | null = null
  if (raw) {
    try {
      const json = JSON.parse(raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8')) as Partial<ServiceAccount>
      if (typeof json.client_email === 'string' && typeof json.private_key === 'string') parsed = { client_email: json.client_email, private_key: json.private_key }
    } catch { /* misconfigured: reported as "not configured", never with the value */ }
    if (!parsed) console.error('[cms] GOOGLE_SERVICE_ACCOUNT_JSON is set but is not a service account key')
  }
  cached = { account: parsed, raw }
  return parsed
}

/** The address people share Docs with, or null when no service account is configured. */
export const serviceAccountEmail = () => account()?.client_email ?? null

const b64url = (data: string | Buffer) => Buffer.from(data).toString('base64url')

let token: { value: string; expiresAt: number; email: string } | null = null

/** A Drive read-only access token for the service account (cached until 5 minutes before it expires). */
export async function googleAccessToken(): Promise<string> {
  const sa = account()
  if (!sa) throw new Error('Google service account not configured')
  if (token && token.email === sa.client_email && token.expiresAt > Date.now() + 5 * 60_000) return token.value
  const now = Math.floor(Date.now() / 1000)
  const unsigned = `${b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${b64url(JSON.stringify({ iss: sa.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }))}`
  const signature = createSign('RSA-SHA256').update(unsigned).sign(sa.private_key)
  const res = await safeFetch(TOKEN_URL, {
    allow: ['oauth2.googleapis.com'], method: 'POST', maxBytes: 64 * 1024, timeoutMs: 10_000,
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${b64url(signature)}` }).toString(),
  })
  let data: { access_token?: string; expires_in?: number } = {}
  try { data = JSON.parse(res.body.toString('utf8')) } catch { /* handled below */ }
  if (res.status !== 200 || !data.access_token) {
    console.error('[cms] Google service account sign-in failed', res.status)
    throw new Error('Google service account sign-in failed')
  }
  token = { value: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000, email: sa.client_email }
  return token.value
}

/** For tests. */
export function resetGoogleAuthCache() { cached = null; token = null }
