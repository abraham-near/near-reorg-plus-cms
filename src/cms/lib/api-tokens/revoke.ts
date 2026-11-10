import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import { db } from '@/cms/lib/db'

export type RevokeReason = 'USER' | 'ADMIN' | 'ROLE_CHANGE' | 'DEACTIVATED' | 'PASSWORD_RESET' | 'PASSWORD_CHANGE'

/**
 * Revokes every active token of a user (role change, deactivation, password reset or change).
 * Returns a Prisma promise so it can join a `$transaction([...])`, or pass `tx`.
 */
export const revokeUserApiTokens = (userId: string, reason: RevokeReason, tx: Prisma.TransactionClient = db) =>
  tx.apiToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date(), revokeReason: reason } })
