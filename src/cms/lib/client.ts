'use client'

// Browser helpers for the admin UI. All admin API calls go through `adminFetch` so errors
// arrive as thrown `AdminApiError`s with the server's message.

export class AdminApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message)
  }
}

export async function adminFetch<T = unknown>(url: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init
  const res = await fetch(url, {
    credentials: 'same-origin',
    ...rest,
    headers: { ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  })
  const text = await res.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }
  if (res.status === 401 && !url.startsWith('/api/admin/auth/')) {
    window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname)}`
  }
  if (!res.ok) {
    const body = (data ?? {}) as { error?: string; details?: unknown }
    throw new AdminApiError(res.status, body.error || `Request failed (${res.status})`, body.details)
  }
  return data as T
}

export async function signOut() {
  try {
    await adminFetch('/api/admin/auth/logout', { method: 'POST' })
  } finally {
    window.location.href = '/admin/login'
  }
}
