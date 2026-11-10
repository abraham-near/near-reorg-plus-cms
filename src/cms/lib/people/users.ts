import 'server-only'
import type { Prisma, Role } from '@/generated/prisma/client'
import { z } from 'zod'
import { revokeUserApiTokens } from '@/cms/lib/api-tokens/revoke'
import { audit, diffFields } from '@/cms/lib/audit'
import { randomToken, sha256 } from '@/cms/lib/crypto'
import { db } from '@/cms/lib/db'
import { cmsOrigin, inviteEmail, sendEmail } from '@/cms/lib/email'
import { allowedEmailDomains, isAllowedEmail, normalizeEmail } from '@/cms/lib/email-domain'
import { HttpError } from '@/cms/lib/http'
import { can } from '@/cms/lib/permissions'
import { rateLimit } from '@/cms/lib/rate-limit'
import { revokeUserSessions, type SessionUser } from '@/cms/lib/session'

export const userSelect = {
  id: true, name: true, email: true, role: true, active: true, emailVerifiedAt: true, createdAt: true, lastLoginAt: true,
} satisfies Prisma.UserSelect

export const invitationSelect = {
  id: true, email: true, name: true, role: true, createdAt: true, expiresAt: true,
} satisfies Prisma.InvitationSelect

const roleSchema = z.enum(['ADMIN', 'PUBLISHER'])
export const inviteSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254).transform(normalizeEmail),
  role: roleSchema.default('PUBLISHER'),
}).strict()

export const updateUserSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  role: roleSchema.optional(),
  active: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'Choose a field to update')

export const emptyBodySchema = z.object({}).strict()
export const usersQuerySchema = z.object({
  q: z.string().trim().max(200).default(''),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  invitePage: z.coerce.number().int().min(1).max(10_000).default(1),
})
export type UsersQuery = z.infer<typeof usersQuerySchema>
const PAGE_SIZE = 25

export async function listUsers(query: UsersQuery) {
  const where: Prisma.UserWhereInput = query.q ? {
    OR: [{ name: { contains: query.q, mode: 'insensitive' } }, { email: { contains: query.q, mode: 'insensitive' } }],
  } : {}
  const pending = { acceptedAt: null, expiresAt: { gt: new Date() } }
  const [total, invitationTotal] = await Promise.all([
    db.user.count({ where }),
    db.invitation.count({ where: pending }),
  ])
  const page = Math.min(query.page, Math.max(1, Math.ceil(total / PAGE_SIZE)))
  const invitePage = Math.min(query.invitePage, Math.max(1, Math.ceil(invitationTotal / PAGE_SIZE)))
  const [users, invitations] = await Promise.all([
    db.user.findMany({ where, select: userSelect, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.invitation.findMany({ where: pending, select: invitationSelect, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (invitePage - 1) * PAGE_SIZE, take: PAGE_SIZE }),
  ])
  return {
    users: users.map((user) => ({ ...user, createdAt: user.createdAt.toISOString(), lastLoginAt: user.lastLoginAt?.toISOString() ?? null })),
    invitations: invitations.map((invite) => ({ ...invite, createdAt: invite.createdAt.toISOString(), expiresAt: invite.expiresAt.toISOString() })),
    total, invitationTotal, pageSize: PAGE_SIZE, query: { ...query, page, invitePage }, allowedDomains: allowedEmailDomains(),
  }
}
export type UsersData = Awaited<ReturnType<typeof listUsers>>

// Serialize account changes across instances, including two administrators editing each other.
async function lockAccounts(tx: Prisma.TransactionClient, actorId: string) {
  await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(724103, 1)`
  const actor = await tx.user.findUnique({ where: { id: actorId }, select: { active: true, role: true } })
  if (!actor?.active || !can(actor.role, 'user:manage')) throw new HttpError(403, 'Your account can no longer manage users')
}

export function assertAccountChange(
  actorId: string,
  target: { id: string; active: boolean; role: Role },
  next: { active: boolean; role: Role } | null,
  activeAdmins: number,
) {
  const removesAdmin = !next || !next.active || !can(next.role, 'user:manage')
  if (target.id === actorId && removesAdmin) throw new HttpError(400, 'You cannot demote, deactivate or delete your own account')
  if (target.active && can(target.role, 'user:manage') && removesAdmin && activeAdmins <= 1) {
    throw new HttpError(409, 'The last active administrator must be kept')
  }
}

export async function updateUser(actor: SessionUser, id: string, data: z.infer<typeof updateUserSchema>, req: Request) {
  const { before, after, tokensRevoked } = await db.$transaction(async (tx) => {
    await lockAccounts(tx, actor.id)
    const before = await tx.user.findUnique({ where: { id }, select: userSelect })
    if (!before) throw new HttpError(404, 'User not found')
    const next = { ...before, ...data }
    const count = await tx.user.count({ where: { active: true, role: 'ADMIN' } })
    assertAccountChange(actor.id, before, next, count)
    const after = await tx.user.update({ where: { id }, data, select: userSelect })
    let tokensRevoked = 0
    if (before.role !== after.role || (before.active && !after.active)) {
      await tx.session.deleteMany({ where: { userId: id } })
      tokensRevoked = (await revokeUserApiTokens(id, before.active && !after.active ? 'DEACTIVATED' : 'ROLE_CHANGE', tx)).count
    }
    return { before, after, tokensRevoked }
  })
  if (tokensRevoked) await audit(actor, { action: 'API_TOKENS_REVOKED', entityType: 'USER', entityId: id, entityTitle: after.email, diff: { count: tokensRevoked, reason: before.active && !after.active ? 'DEACTIVATED' : 'ROLE_CHANGE' } }, req)
  const roleChanged = before.role !== after.role
  const deactivated = before.active && !after.active
  if (roleChanged || deactivated) await revokeUserSessions(id)
  const diff = diffFields(
    { name: before.name, role: before.role, active: before.active },
    { name: after.name, role: after.role, active: after.active },
  )
  const actions = [
    ...(roleChanged ? ['ROLE_CHANGE'] : []),
    ...(deactivated ? ['DEACTIVATE'] : []),
    ...(!before.active && after.active ? ['ACTIVATE'] : []),
    ...(before.name !== after.name ? ['UPDATE'] : []),
  ]
  for (const action of actions) await audit(actor, { action, entityType: 'USER', entityId: id, entityTitle: after.email, diff }, req)
  return after
}

export async function deleteUser(actor: SessionUser, id: string, req: Request) {
  const before = await db.$transaction(async (tx) => {
    await lockAccounts(tx, actor.id)
    const user = await tx.user.findUnique({ where: { id }, select: userSelect })
    if (!user) throw new HttpError(404, 'User not found')
    const count = await tx.user.count({ where: { active: true, role: 'ADMIN' } })
    assertAccountChange(actor.id, user, null, count)
    await tx.user.delete({ where: { id }, select: { id: true } })
    return user
  })
  await revokeUserSessions(id)
  await audit(actor, {
    action: 'DELETE', entityType: 'USER', entityId: id, entityTitle: before.email,
    diff: { name: { from: before.name, to: null }, role: { from: before.role, to: null }, active: { from: before.active, to: null } },
  }, req)
}

export async function inviteUser(actor: SessionUser, data: z.infer<typeof inviteSchema>, req: Request) {
  if (!isAllowedEmail(data.email)) throw new HttpError(400, `Use an allowed NEAR email domain: ${allowedEmailDomains().join(', ')}`)
  if (!(await rateLimit(`people:invite:actor:${actor.id}`, 20, 3600)).ok ||
      !(await rateLimit(`people:invite:email:${data.email}`, 5, 3600)).ok) {
    throw new HttpError(429, 'Too many invitations. Try again later.')
  }
  const token = randomToken()
  const link = `${cmsOrigin()}/admin/accept-invite/${token}`
  const { invitation, revoked } = await db.$transaction(async (tx) => {
    await lockAccounts(tx, actor.id)
    // Acceptance also updates this row: wait for it before deciding whether to replace the invite.
    await tx.$queryRaw`SELECT id FROM "Invitation" WHERE email = ${data.email} AND "acceptedAt" IS NULL FOR UPDATE`
    if (await tx.user.findUnique({ where: { email: data.email }, select: { id: true } })) {
      throw new HttpError(409, 'An account with this email already exists')
    }
    const revoked = await tx.invitation.findMany({
      where: { email: data.email, acceptedAt: null, expiresAt: { gt: new Date() } }, select: { id: true },
    })
    await tx.invitation.deleteMany({ where: { email: data.email, acceptedAt: null } })
    const invitation = await tx.invitation.create({
      data: { ...data, tokenHash: sha256(token), invitedById: actor.id, expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) },
      select: invitationSelect,
    })
    return { invitation, revoked }
  })
  for (const previous of revoked) {
    await audit(actor, { action: 'INVITE_REVOKE', entityType: 'INVITATION', entityId: previous.id, entityTitle: data.email, diff: { pending: { from: true, to: false } } }, req)
  }
  await audit(actor, {
    action: 'INVITE', entityType: 'INVITATION', entityId: invitation.id, entityTitle: data.email,
    diff: { email: { from: null, to: data.email }, role: { from: null, to: data.role } },
  }, req)
  let emailSent = false
  try {
    const delivery = await sendEmail(data.email, 'You are invited to the NEAR CMS', inviteEmail(data.name, actor.name, link))
    emailSent = delivery.ok
  } catch {
    // The invitation is already saved; report failed delivery without exposing provider errors.
  }
  if (!emailSent) await audit(actor, { action: 'INVITE_EMAIL_NOT_SENT', entityType: 'INVITATION', entityId: invitation.id, entityTitle: data.email }, req)
  return { invitation, emailSent }
}

export async function revokeInvitation(actor: SessionUser, id: string, req: Request) {
  const invitation = await db.$transaction(async (tx) => {
    await lockAccounts(tx, actor.id)
    const before = await tx.invitation.findUnique({ where: { id }, select: { id: true, email: true, acceptedAt: true } })
    if (!before) throw new HttpError(404, 'Invitation not found')
    if (before.acceptedAt) throw new HttpError(409, 'This invitation has already been accepted')
    const deleted = await tx.invitation.deleteMany({ where: { id, acceptedAt: null } })
    if (!deleted.count) throw new HttpError(409, 'This invitation has already been accepted')
    return before
  })
  await audit(actor, { action: 'INVITE_REVOKE', entityType: 'INVITATION', entityId: id, entityTitle: invitation.email, diff: { pending: { from: true, to: false } } }, req)
}
