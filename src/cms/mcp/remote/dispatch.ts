import 'server-only'
import { bindActor } from '@/cms/lib/auth'
import { cmsOrigin } from '@/cms/lib/email'
import type { CurrentSession } from '@/cms/lib/session'
import * as categories from '@/app/(cms)/api/admin/categories/route'
import * as importGoogleDoc from '@/app/(cms)/api/admin/import/google-doc/route'
import * as mediaItem from '@/app/(cms)/api/admin/media/[id]/route'
import * as media from '@/app/(cms)/api/admin/media/route'
import * as postItem from '@/app/(cms)/api/admin/posts/[id]/route'
import * as postLock from '@/app/(cms)/api/admin/posts/[id]/lock/route'
import * as posts from '@/app/(cms)/api/admin/posts/route'
import * as tags from '@/app/(cms)/api/admin/tags/route'
import * as whoami from '@/app/(cms)/api/admin/whoami/route'
import { cmsError, type Api } from '../client'

// The remote connector's tools are the same as the local MCP's, written against the /api/admin HTTP
// API. Here that API is called in process: the OAuth actor is attached to a Request built for the
// call (bindActor) and the route handler runs as usual, with its own permission checks, rate limits
// and audit. Only the calls the tools make are reachable: no DELETE, no bulk, no people, no tokens.

type Handler = (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>
type Rule = [method: string, pattern: RegExp, handler: Handler]

const ID = '([A-Za-z0-9_-]{1,100})'
const RULES: Rule[] = [
  ['GET', /^\/api\/admin\/whoami$/, whoami.GET as Handler],
  ['GET', /^\/api\/admin\/posts$/, posts.GET as Handler],
  ['POST', /^\/api\/admin\/posts$/, posts.POST as Handler],
  ['GET', new RegExp(`^/api/admin/posts/${ID}$`), postItem.GET as Handler],
  ['PATCH', new RegExp(`^/api/admin/posts/${ID}$`), postItem.PATCH as Handler],
  ['POST', new RegExp(`^/api/admin/posts/${ID}/lock$`), postLock.POST as Handler],
  ['DELETE', new RegExp(`^/api/admin/posts/${ID}/lock$`), postLock.DELETE as Handler],
  ['GET', /^\/api\/admin\/categories$/, categories.GET as Handler],
  ['POST', /^\/api\/admin\/categories$/, categories.POST as Handler],
  ['GET', /^\/api\/admin\/tags$/, tags.GET as Handler],
  ['POST', /^\/api\/admin\/tags$/, tags.POST as Handler],
  ['GET', /^\/api\/admin\/media$/, media.GET as Handler],
  ['PATCH', new RegExp(`^/api/admin/media/${ID}$`), mediaItem.PATCH as Handler],
  ['POST', /^\/api\/admin\/import\/google-doc$/, importGoogleDoc.POST as Handler],
]

const HINTS: Record<number, string> = {
  401: 'the connection expired or was ended; the person reconnects the NEAR CMS in Claude (Settings › Connectors)',
  403: 'not allowed through this connection (it may need a permission the person did not grant when connecting)',
}

/** Who a call came from, for the audit log: the MCP request's address and client. */
const FORWARDED = ['x-real-ip', 'x-forwarded-for', 'user-agent']

export function createInProcessApi(actor: CurrentSession, incoming: Request): Api {
  const origin = cmsOrigin()
  return {
    origin,
    async request(method, path, opts = {}) {
      const rule = RULES.find(([m, re]) => m === method && re.test(path))
      if (!rule) throw cmsError(404, { error: 'Not available through the connector' })
      const params = path.match(rule[1])?.[1]
      const url = new URL(path, origin)
      for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined) url.searchParams.set(k, String(v))
      const headers = new Headers({ origin, host: url.host, accept: 'application/json' })
      for (const name of FORWARDED) { const value = incoming.headers.get(name); if (value) headers.set(name, value) }
      if (opts.form) throw cmsError(400, { error: 'File uploads are not available through the connector' })
      if (opts.body !== undefined) headers.set('content-type', 'application/json')
      const req = new Request(url, { method, headers, body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined })
      bindActor(req, actor)
      const routeParams: Record<string, string> = params ? { id: params } : {}
      const res = await rule[2](req, { params: Promise.resolve(routeParams) })
      const text = await res.text()
      let data: unknown = null
      try { data = text ? JSON.parse(text) : null } catch { /* non-JSON body */ }
      if (!res.ok) throw cmsError(res.status, data, HINTS)
      return data as never
    },
  }
}
