import type { Role } from '@/generated/prisma/client'

// Single source of truth for who may do what in the CMS. Every route handler and admin page
// checks a permission from this list (src/cms/lib/auth.ts); nothing compares roles inline.
export const PERMISSIONS = [
  'admin:access',
  'content:read',
  'post:write',
  'post:publish',
  'post:delete',
  'media:upload',
  'media:edit',
  'media:delete',
  'taxonomy:manage',
  'user:manage',
  'audit:read',
  'lock:override',
  'apitoken:manage',
] as const

export type Permission = (typeof PERMISSIONS)[number]

// Two roles. PUBLISHER runs the blog: writes, publishes and deletes posts, uploads and describes
// media, manages categories and tags, and may create API tokens for Claude. ADMIN has everything,
// plus people, the audit log, deleting media and taking over another editor's lock.
const PUBLISHER: Permission[] = [
  'admin:access',
  'content:read',
  'post:write',
  'post:publish',
  'post:delete',
  'media:upload',
  'media:edit',
  'taxonomy:manage',
  'apitoken:manage',
]

const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Permission>> = {
  PUBLISHER: new Set(PUBLISHER),
  ADMIN: new Set(PERMISSIONS),
}

export const can = (role: Role | null | undefined, permission: Permission) =>
  !!role && ROLE_PERMISSIONS[role].has(permission)

// The most an API token can ever do, whatever its owner's role: write blog content, upload and
// describe media, add categories and tags. No deletes, no lock takeover and nothing outside the
// blog. src/cms/lib/posts/token-rules.ts narrows this further (a published post keeps its URL).
export const TOKEN_CAP: ReadonlySet<Permission> = new Set<Permission>([
  'admin:access',
  'content:read',
  'post:write',
  'post:publish',
  'media:upload',
  'media:edit',
  'taxonomy:manage',
])

export type Via = 'session' | 'token'

/** `can` for whoever is acting: a token never exceeds TOKEN_CAP, even for an admin. */
export const canActor = (user: { role: Role; via?: Via }, permission: Permission) =>
  can(user.role, permission) && (user.via !== 'token' || TOKEN_CAP.has(permission))
