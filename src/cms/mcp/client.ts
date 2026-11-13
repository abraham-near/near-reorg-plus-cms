export class CmsError extends Error {
  constructor(message: string, readonly status?: number) { super(message) }
}

export type Api = {
  origin: string
  request<T = unknown>(method: string, path: string, opts?: { query?: Record<string, string | number | boolean | undefined>; body?: unknown; form?: FormData }): Promise<T>
}

const STATUS_HINT: Record<number, string> = {
  401: 'token invalid/expired/revoked or API tokens disabled on this environment; create a new one in CMS Settings and run npm run mcp:cms:login',
  403: 'forbidden: this token is not allowed to do that',
  404: 'not found',
  409: 'conflict',
  423: 'locked: another editor holds this post',
  429: 'rate limited, wait a minute and retry',
}

/** A CMS error response → the message Claude sees (status, hint, the CMS's own error). */
export function cmsError(status: number, data: unknown, hints: Record<number, string> = STATUS_HINT): CmsError {
  const err = data as { error?: string; details?: unknown } | null
  let msg = `CMS returned HTTP ${status}: ${hints[status] ?? STATUS_HINT[status] ?? 'request failed'}`
  if (err?.error) msg += ` (${err.error})`
  if (status === 409 && /stale|changed|updated/i.test(err?.error ?? '')) msg += ' - the post changed, re-read it with get_post and retry'
  if (err?.details) msg += ` details: ${JSON.stringify(err.details).slice(0, 1000)}`
  return new CmsError(msg, status)
}

export function createApi(origin: string, getToken: () => Promise<string>): Api {
  return {
    origin,
    async request(method, path, opts = {}) {
      // Ids are interpolated into paths: never let one climb out of the endpoint it was meant for.
      if (!path.startsWith('/api/admin/') || path.split('/').some((s) => s === '..' || s === '.')) throw new CmsError('Invalid id')
      const token = await getToken()
      const url = new URL(path, origin)
      for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined) url.searchParams.set(k, String(v))
      const headers: Record<string, string> = { Authorization: `Bearer ${token}`, 'User-Agent': 'near-cms-mcp/1.0', Accept: 'application/json' }
      let body: BodyInit | undefined
      if (opts.form) body = opts.form
      else if (opts.body !== undefined) { body = JSON.stringify(opts.body); headers['Content-Type'] = 'application/json' }
      let res: Response
      try {
        res = await fetch(url, { method, headers, body, redirect: 'error', signal: AbortSignal.timeout(30_000), credentials: 'omit' })
      } catch (e) {
        const msg = (e as Error).message.replaceAll(token, '[redacted]')
        throw new CmsError(`Request to the CMS failed (${msg}). Redirects are never followed; check NEAR_CMS_URL.`)
      }
      const text = await res.text()
      let data: unknown = null
      try { data = text ? JSON.parse(text) : null } catch { /* non-JSON body */ }
      if (!res.ok) {
        const error = cmsError(res.status, data)
        throw new CmsError(error.message.replaceAll(token, '[redacted]'), res.status)
      }
      return data as never
    },
  }
}
