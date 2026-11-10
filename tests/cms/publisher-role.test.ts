import { describe, expect, it, vi } from 'vitest'
import type { Role } from '@/generated/prisma/client'
import { PERMISSIONS, can } from '@/cms/lib/permissions'

const state = vi.hoisted(() => ({ role: 'PUBLISHER' as Role }))
vi.mock('@/cms/lib/session', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/cms/lib/session')>()
  return { ...original, getSession: vi.fn(async () => ({ id: 'session', user: { id: 'publisher', email: 'p@near.org', name: 'Pub', role: state.role } })) }
})

import * as media from '@/app/(cms)/api/admin/media/[id]/route'
import * as users from '@/app/(cms)/api/admin/users/route'
import * as post from '@/app/(cms)/api/admin/posts/[id]/route'
import * as categories from '@/app/(cms)/api/admin/categories/route'
import { inviteSchema } from '@/cms/lib/people/users'

const PUBLISHER = [
  'admin:access', 'content:read', 'post:write', 'post:publish', 'post:delete', 'media:upload', 'media:edit',
  'taxonomy:manage', 'apitoken:manage',
]

const origin = 'http://localhost:3056'
const request = (path: string, method = 'GET', body?: unknown) => new Request(`${origin}/api/admin/${path}`, {
  method, headers: { host: 'localhost:3056', origin, 'content-type': 'application/json' },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
})
const ctx = { params: Promise.resolve({ id: 'missing' }) }

describe('PUBLISHER permissions', () => {
  it('has exactly the blog-focused set', () => {
    expect(PERMISSIONS.filter((p) => can('PUBLISHER', p))).toEqual(PUBLISHER)
  })
  it.each(['media:delete', 'user:manage', 'audit:read', 'lock:override'] as const)('lacks %s', (permission) => {
    expect(can('PUBLISHER', permission)).toBe(false)
  })
  it('ADMIN has everything PUBLISHER has', () => {
    expect(PERMISSIONS.filter((p) => can('PUBLISHER', p) && !can('ADMIN', p))).toEqual([])
  })
  it('can be chosen when inviting', () => {
    expect(inviteSchema.parse({ name: 'Pub', email: 'pub@near.org', role: 'PUBLISHER' }).role).toBe('PUBLISHER')
  })
})

describe('PUBLISHER route access', () => {
  it.each([
    ['DELETE media', () => media.DELETE(request('media/missing', 'DELETE', {}), ctx)],
    ['GET users', () => users.GET(request('users'), undefined)],
  ])('refuses %s', async (_name, call) => {
    expect((await call()).status).toBe(403)
  })

  // Past the permission check these hit the database (404/400/500 without one); only 401/403 would
  // mean the role was refused.
  it.each([
    ['DELETE post', () => post.DELETE(request('posts/missing', 'DELETE', {}), ctx)],
    ['POST category', () => categories.POST(request('categories', 'POST', {}), undefined)],
  ])('allows %s', async (_name, call) => {
    expect([401, 403]).not.toContain((await call()).status)
  })
})
