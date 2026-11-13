import 'server-only'
import { HttpError } from '@/cms/lib/http'
import { safeFetch, SafeFetchError } from '@/cms/lib/safe-fetch'
import { googleAccessToken, serviceAccountEmail } from './google-auth'

// Downloads a Google Doc as .docx from the link someone pasted. The link is never fetched as given:
// only the document id is taken from it, and the CMS builds the Google URL itself. Two ways in:
// 1. the Doc is shared with the CMS's service account (stays private) → Drive API export;
// 2. the Doc is "Anyone with the link" → Google's public export (no sign-in; undocumented, so it can
//    be switched off with CMS_GOOGLE_PUBLIC_EXPORT=false).
// Nothing Google returns (pages, errors) is passed on to the person or to Claude.

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const GOOGLE_DOC_MIME = 'application/vnd.google-apps.document'
/** Drive's own export cap is 10 MB. */
export const MAX_DOC_BYTES = 10 * 1024 * 1024
const FETCH_TIMEOUT_MS = 20_000

/** The document id from a Google Docs link, or an HttpError(400) saying what to paste instead. */
export function parseGoogleDocId(input: string): string {
  const raw = input.trim()
  if (!raw || raw.length > 2048) throw new HttpError(400, 'Paste the link of the Google Doc (from the address bar).')
  let url: URL
  try { url = new URL(raw) } catch { throw new HttpError(400, 'Paste the full link of the Google Doc, starting with https://docs.google.com/document/…') }
  if (url.protocol !== 'https:' || url.hostname !== 'docs.google.com' || url.port || url.username || url.password) {
    throw new HttpError(400, 'Only Google Docs links (https://docs.google.com/document/…) can be imported.')
  }
  if (/^\/document\/(?:u\/\d+\/)?d\/e\//.test(url.pathname)) {
    throw new HttpError(400, 'This is a "Publish to the web" link. Paste the normal link of the Doc (from the address bar while editing it).')
  }
  const id = url.pathname.match(/^\/document\/(?:u\/\d+\/)?d\/([A-Za-z0-9_-]{25,100})(?:\/|$)/)?.[1]
  if (!id) throw new HttpError(400, 'Paste the link of the Google Doc (from the address bar while editing it).')
  return id
}

export type FetchedDoc = { bytes: Uint8Array; name: string | null; source: 'service-account' | 'public-link' }

const isDocx = (b: Buffer) => b.length > 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04

function notShared(): never {
  const email = serviceAccountEmail()
  throw new HttpError(403, email
    ? `I can't open this Doc. Share it with ${email} as Viewer (Share › add people), or set General access to "Anyone with the link", then try again.`
    : 'I can\'t open this Doc. Set General access to "Anyone with the link" (Share), then try again.')
}

function tooLarge(): never {
  throw new HttpError(413, 'This Doc is larger than 10 MB once exported. Split it, or make its images smaller.')
}

const ownerDomains = () => (process.env.CMS_GOOGLE_OWNER_DOMAINS ?? '').split(',').map((d) => d.trim().toLowerCase()).filter(Boolean)

/** Through the service account. null when the Doc is not shared with it (or no account is configured). */
async function viaServiceAccount(id: string): Promise<FetchedDoc | null> {
  if (!serviceAccountEmail()) return null
  let token: string
  try { token = await googleAccessToken() } catch {
    // A broken key must not block "Anyone with the link" Docs: fall through to the public export.
    return null
  }
  const headers = { authorization: `Bearer ${token}` }
  const opts = { allow: ['www.googleapis.com'], headers, timeoutMs: FETCH_TIMEOUT_MS }
  const meta = await safeFetch(`https://www.googleapis.com/drive/v3/files/${id}?fields=id,name,mimeType,size,owners(emailAddress)&supportsAllDrives=true`, { ...opts, maxBytes: 64 * 1024 })
  if (meta.status === 404 || meta.status === 403) return null
  if (meta.status !== 200) throw new HttpError(502, 'Google Drive did not answer. Try again in a minute.')
  const file = JSON.parse(meta.body.toString('utf8')) as { name?: string; mimeType?: string; size?: string; owners?: { emailAddress?: string }[] }
  // Optional: only Docs owned by people in these domains (CMS_GOOGLE_OWNER_DOMAINS=near.org,…).
  const domains = ownerDomains()
  if (domains.length && !file.owners?.some((o) => domains.includes(o.emailAddress?.split('@')[1]?.toLowerCase() ?? ''))) {
    throw new HttpError(403, 'This Doc is owned by someone outside the organization, so it cannot be imported.')
  }
  let res
  if (file.mimeType === GOOGLE_DOC_MIME) {
    res = await safeFetch(`https://www.googleapis.com/drive/v3/files/${id}/export?mimeType=${encodeURIComponent(DOCX_MIME)}`, { ...opts, maxBytes: MAX_DOC_BYTES })
  } else if (file.mimeType === DOCX_MIME) {
    if (Number(file.size ?? 0) > MAX_DOC_BYTES) tooLarge()
    res = await safeFetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media&supportsAllDrives=true`, { ...opts, maxBytes: MAX_DOC_BYTES })
  } else {
    throw new HttpError(400, 'This link is not a Google Doc (or a Word document in Drive).')
  }
  if (res.status === 403 && res.body.includes('exportSizeLimitExceeded')) tooLarge()
  if (res.status !== 200 || !isDocx(res.body)) throw new HttpError(502, 'Google Drive could not export this Doc. Try again in a minute.')
  return { bytes: new Uint8Array(res.body), name: file.name ?? null, source: 'service-account' }
}

/** Through Google's public export: works only for "Anyone with the link" Docs. */
async function viaPublicLink(id: string): Promise<FetchedDoc | null> {
  if (process.env.CMS_GOOGLE_PUBLIC_EXPORT === 'false') return null
  const res = await safeFetch(`https://docs.google.com/document/d/${id}/export?format=docx`, {
    allow: ['docs.google.com', /^[a-z0-9-]+\.googleusercontent\.com$/],
    maxBytes: MAX_DOC_BYTES, timeoutMs: FETCH_TIMEOUT_MS,
    // Google may hand the file over from its download host; a private Doc redirects to the sign-in page instead.
    allowRedirect: (to) => to.protocol === 'https:' && /^[a-z0-9-]+\.googleusercontent\.com$/.test(to.hostname),
  })
  if (res.status !== 200 || !isDocx(res.body)) return null
  return { bytes: new Uint8Array(res.body), name: null, source: 'public-link' }
}

/** The Doc as .docx bytes, or an HttpError the person can act on. */
export async function fetchGoogleDoc(id: string): Promise<FetchedDoc> {
  try {
    return (await viaServiceAccount(id)) ?? (await viaPublicLink(id)) ?? notShared()
  } catch (error) {
    if (error instanceof HttpError) throw error
    if (error instanceof SafeFetchError && error.reason === 'too-large') tooLarge()
    if (error instanceof SafeFetchError && error.reason === 'timeout') throw new HttpError(504, 'Google took too long to send this Doc. Try again in a minute.')
    console.error('[cms] Google Doc fetch failed', error instanceof Error ? error.message : error)
    throw new HttpError(502, 'Google could not be reached. Try again in a minute.')
  }
}
