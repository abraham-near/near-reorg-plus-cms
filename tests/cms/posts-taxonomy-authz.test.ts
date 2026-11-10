import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Role } from '@/generated/prisma/client'

const state = vi.hoisted(() => ({ role: null as Role | null }))
vi.mock('@/cms/lib/session', () => ({
  getSession: vi.fn(async () => state.role ? { id: 'session', user: { id: 'user', email: 'test@near.org', name: 'Test', role: state.role } } : null),
}))
vi.mock('@/cms/lib/cache-tags', () => ({ revalidateCategories: vi.fn(), revalidatePost: vi.fn() }))
vi.mock('@/cms/lib/posts/taxonomy', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/cms/lib/posts/taxonomy')>()
  const item = { id: 'taxonomy', name: 'NEAR', slug: 'near', _count: { posts: 0 } }
  return {
    ...original,
    listTaxonomy: vi.fn(async () => [item]),
    getTaxonomy: vi.fn(async () => item),
    createTaxonomy: vi.fn(async () => item),
    updateTaxonomy: vi.fn(async () => item),
    deleteTaxonomy: vi.fn(async () => ({ success: true })),
  }
})

import * as categories from '@/app/(cms)/api/admin/categories/route'
import * as category from '@/app/(cms)/api/admin/categories/[id]/route'
import * as tags from '@/app/(cms)/api/admin/tags/route'
import * as tag from '@/app/(cms)/api/admin/tags/[id]/route'
import { createTaxonomy, deleteTaxonomy, getTaxonomy, listTaxonomy, updateTaxonomy } from '@/cms/lib/posts/taxonomy'

const context = { params: Promise.resolve({ id: 'taxonomy' }) }
const endpoints = [
  { path: 'categories', method: 'GET', handler: categories.GET, status: 200, service: listTaxonomy },
  { path: 'categories', method: 'POST', handler: categories.POST, status: 201, service: createTaxonomy },
  { path: 'categories/taxonomy', method: 'GET', handler: category.GET, status: 200, service: getTaxonomy },
  { path: 'categories/taxonomy', method: 'PATCH', handler: category.PATCH, status: 200, service: updateTaxonomy },
  { path: 'categories/taxonomy', method: 'DELETE', handler: category.DELETE, status: 200, service: deleteTaxonomy },
  { path: 'tags', method: 'GET', handler: tags.GET, status: 200, service: listTaxonomy },
  { path: 'tags', method: 'POST', handler: tags.POST, status: 201, service: createTaxonomy },
  { path: 'tags/taxonomy', method: 'GET', handler: tag.GET, status: 200, service: getTaxonomy },
  { path: 'tags/taxonomy', method: 'PATCH', handler: tag.PATCH, status: 200, service: updateTaxonomy },
  { path: 'tags/taxonomy', method: 'DELETE', handler: tag.DELETE, status: 200, service: deleteTaxonomy },
] as const

function request(path: string, method: string, body?: unknown, origin = 'http://localhost:3000') {
  return new Request(`http://localhost:3000/api/admin/${path}`, {
    method,
    headers: { host: 'localhost:3000', origin, 'content-type': 'application/json' },
    ...(method === 'POST' || method === 'PATCH' ? { body: JSON.stringify(body ?? { name: 'NEAR' }) } : {}),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  state.role = null
})

describe.each(endpoints)('$method /api/admin/$path permissions', (endpoint) => {
  // Both roles run categories and tags (content:read and taxonomy:manage); anonymous is refused.
  it.each([null, 'PUBLISHER', 'ADMIN'] as const)('checks %s before accessing data', async (role) => {
    state.role = role
    const response = await endpoint.handler(request(endpoint.path, endpoint.method), context)
    const allowed = role !== null
    expect(response.status).toBe(role === null ? 401 : allowed ? endpoint.status : 403)
    expect(endpoint.service).toHaveBeenCalledTimes(allowed ? 1 : 0)
    expect(response.headers.get('cache-control')).toContain('no-store')
  })

  if (endpoint.method !== 'GET') {
    it('blocks cross-origin requests before the write', async () => {
      state.role = 'ADMIN'
      const response = await endpoint.handler(request(endpoint.path, endpoint.method, undefined, 'https://evil.example'), context)
      expect(response.status).toBe(403)
      expect(endpoint.service).not.toHaveBeenCalled()
    })
  }
})

describe.each(endpoints.filter((endpoint) => endpoint.method === 'POST' || endpoint.method === 'PATCH'))('$method $path validation', (endpoint) => {
  it.each([{ name: '' }, { name: 123 }, { name: 'Valid', role: 'ADMIN' }, { name: 'Valid', slug: '../x' }])('rejects invalid input %#', async (body) => {
    state.role = 'ADMIN'
    const response = await endpoint.handler(request(endpoint.path, endpoint.method, body), context)
    expect(response.status).toBe(400)
    expect(endpoint.service).not.toHaveBeenCalled()
  })

  it('caps request bodies', async () => {
    state.role = 'ADMIN'
    const response = await endpoint.handler(request(endpoint.path, endpoint.method, { name: 'x'.repeat(5000) }), context)
    expect(response.status).toBe(413)
    expect(endpoint.service).not.toHaveBeenCalled()
  })
})
