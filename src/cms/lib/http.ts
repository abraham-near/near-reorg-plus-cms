import 'server-only'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message)
  }
}

export const json = (data: unknown, init?: number | ResponseInit) =>
  NextResponse.json(data, typeof init === 'number' ? { status: init, headers: NO_STORE } : { ...init, headers: { ...NO_STORE, ...init?.headers } })

const NO_STORE = { 'Cache-Control': 'private, no-store' }

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/** Host the browser talked to (Railway terminates TLS and forwards the original host). */
export function requestHost(req: Request) {
  return req.headers.get('x-forwarded-host')?.split(',')[0].trim() || req.headers.get('host') || ''
}

/**
 * CSRF guard for cookie-authenticated endpoints: a mutating request must carry an Origin
 * (or, failing that, a Referer) on the same host. Browsers always send Origin on fetch POSTs.
 */
export function assertSameOrigin(req: Request) {
  if (!MUTATING.has(req.method)) return
  const source = req.headers.get('origin') ?? req.headers.get('referer')
  if (!source) throw new HttpError(403, 'Missing origin')
  let host: string
  try {
    host = new URL(source).host
  } catch {
    throw new HttpError(403, 'Bad origin')
  }
  if (host !== requestHost(req)) throw new HttpError(403, 'Cross-site request blocked')
}

/** Best-effort client IP. Railway sets X-Real-IP; otherwise take the hop closest to us. */
export function clientIp(req: Request): string | null {
  const real = req.headers.get('x-real-ip')?.trim()
  if (real) return real
  const hops = req.headers.get('x-forwarded-for')?.split(',').map((h) => h.trim()).filter(Boolean)
  return hops?.length ? hops[hops.length - 1] : null
}

export const userAgent = (req: Request) => req.headers.get('user-agent')?.slice(0, 300) ?? null

/** Parse a JSON body with a size cap and a zod schema; errors become 400/413 HttpErrors. */
export async function parseJson<S extends z.ZodType>(req: Request, schema: S, maxBytes = 1_000_000): Promise<z.infer<S>> {
  const length = Number(req.headers.get('content-length') ?? 0)
  if (length > maxBytes) throw new HttpError(413, 'Request body too large')
  const text = await req.text()
  if (Buffer.byteLength(text) > maxBytes) throw new HttpError(413, 'Request body too large')
  let raw: unknown
  try {
    raw = text ? JSON.parse(text) : {}
  } catch {
    throw new HttpError(400, 'Invalid JSON')
  }
  const result = schema.safeParse(raw)
  if (!result.success) {
    throw new HttpError(400, 'Validation failed', process.env.NODE_ENV === 'production' ? undefined : z.treeifyError(result.error))
  }
  return result.data
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>

// Matches lib/cms/api-tokens/format.ts LOOKS_LIKE_TOKEN (kept inline: this module is imported everywhere).
const API_TOKEN_HEADER = /^Bearer\s+ncms_/i

/**
 * Wraps a route handler: same-origin check on mutations, HttpError → JSON, anything else → logged 500.
 *
 * `token: true` lets the handler accept personal API tokens (it must then authenticate with
 * `requireActor`). Every other handler refuses them. A token request skips the same-origin check:
 * browsers never attach an `Authorization: Bearer` header on their own, and a cross-site page could
 * only add one after a CORS preflight, which fails because the CMS sends no CORS headers. Only our
 * own `ncms_` bearer counts, so cached Basic credentials (review copies) never bypass the check.
 */
export function route<C = unknown>(handler: Handler<C>, opts: { csrf?: boolean; token?: boolean } = {}): Handler<C> {
  return async (req, ctx) => {
    try {
      const bearer = API_TOKEN_HEADER.test(req.headers.get('authorization') ?? '')
      if (bearer && !opts.token) throw new HttpError(401, 'API tokens are not accepted on this endpoint')
      if (opts.csrf !== false && !bearer) assertSameOrigin(req)
      return await handler(req, ctx)
    } catch (error) {
      if (error instanceof HttpError) {
        return json({ error: error.message, ...(error.details ? { details: error.details } : {}) }, error.status)
      }
      console.error(`[cms] ${req.method} ${new URL(req.url).pathname} failed`, error)
      return json({ error: 'Internal error' }, 500)
    }
  }
}
