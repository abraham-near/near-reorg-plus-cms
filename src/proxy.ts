import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// CMS only: /admin and /api/admin need a session cookie (validated for real in the handlers via
// src/cms/lib/auth.ts; this is only a cheap early exit) and are never cached, framed or indexed.
// The site's routes never reach this file (see `matcher`).
export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/admin/:path*'],
}

const NO_STORE = 'private, no-store'
const SESSION_COOKIES = ['__Host-near_cms', 'near_cms']

// Admin routes reachable without a session.
const PUBLIC_ADMIN = [/^\/admin\/login$/, /^\/admin\/forgot-password$/, /^\/admin\/reset-password\/[^/]+$/, /^\/admin\/accept-invite\/[^/]+$/, /^\/admin\/verify-email\/[^/]+$/]
const PUBLIC_ADMIN_API = /^\/api\/admin\/auth\//
const API_TOKEN = /^Bearer ncms_[A-Za-z0-9_-]{43}$/

function adminHeaders(response: NextResponse, pathname = '') {
  response.headers.set('Cache-Control', NO_STORE)
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  // The Claude consent screen must never be framed, not even by the CMS itself (clickjacking).
  const consent = pathname.startsWith('/admin/oauth/')
  response.headers.set('X-Frame-Options', consent ? 'DENY' : 'SAMEORIGIN')
  if (consent) response.headers.set('Content-Security-Policy', "frame-ancestors 'none'")
  response.headers.set('Referrer-Policy', 'same-origin')
  return response
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name))
  const isApi = pathname.startsWith('/api/admin')
  const isPublic = isApi ? PUBLIC_ADMIN_API.test(pathname) : PUBLIC_ADMIN.some((re) => re.test(pathname))
  // API tokens (Claude MCP) only reach the admin API, never admin pages; the handler decides
  // whether it accepts them (route(…, { token: true })).
  const hasToken = isApi && !isPublic && API_TOKEN.test(request.headers.get('authorization') ?? '')

  if (!hasSession && !hasToken && !isPublic) {
    if (isApi) return adminHeaders(NextResponse.json({ error: 'Not signed in' }, { status: 401 }))
    const login = new URL('/admin/login', request.url)
    if (pathname !== '/admin') login.searchParams.set('next', pathname + search)
    return adminHeaders(NextResponse.redirect(login), pathname)
  }
  return adminHeaders(NextResponse.next(), pathname)
}
