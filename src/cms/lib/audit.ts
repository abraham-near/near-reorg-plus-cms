import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import { db } from './db'
import { clientIp, userAgent } from './http'
import type { SessionUser } from './session'

export type AuditEntry = {
  action: string // e.g. CREATE, UPDATE, PUBLISH, DELETE, LOGIN, LOGIN_FAILED, ROLE_CHANGE
  entityType: string // e.g. POST, MEDIA, USER, SETTING, AUTH
  entityId?: string | null
  entityTitle?: string | null
  diff?: Prisma.InputJsonValue
}

/** Records an audit row. Never throws: a failed audit write is logged, not surfaced to the user. */
export async function audit(user: Pick<SessionUser, 'id' | 'email' | 'apiTokenId'> | null, entry: AuditEntry, req?: Request) {
  try {
    await db.auditLog.create({
      data: {
        userId: user?.id ?? null,
        userEmail: user?.email ?? null,
        apiTokenId: user?.apiTokenId ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        entityTitle: entry.entityTitle?.slice(0, 300) ?? null,
        diff: entry.diff,
        ip: req ? clientIp(req) : null,
        userAgent: req ? userAgent(req) : null,
      },
    })
  } catch (error) {
    console.error('[cms] audit write failed', entry.action, entry.entityType, error)
  }
}

const SAMPLE_EMAILS = 10

/**
 * Failed sign-ins for addresses with no account (or outside the allowed domains) share one
 * LOGIN_FAILED_UNKNOWN row per IP per hour, with a count and up to 10 sample addresses, instead
 * of one row each. Failures on real accounts still get their own row.
 */
export async function auditUnknownLoginFailure(email: string, req: Request) {
  try {
    const ip = clientIp(req)
    const now = new Date()
    const hour = new Date(now)
    hour.setUTCMinutes(0, 0, 0)
    const entityId = `${ip ?? 'unknown'}@${hour.toISOString()}`
    const sample = email.slice(0, 320)
    // One atomic statement, so parallel failures from the same IP do not lose counts.
    const updated = await db.$executeRaw`
      UPDATE "AuditLog" SET
        "diff" = jsonb_build_object(
          'count', COALESCE(("diff"->>'count')::int, 0) + 1,
          'emails', CASE
            WHEN jsonb_exists("diff"->'emails', ${sample}) OR jsonb_array_length("diff"->'emails') >= ${SAMPLE_EMAILS} THEN "diff"->'emails'
            ELSE ("diff"->'emails') || to_jsonb(${sample}::text) END,
          'firstAt', "diff"->'firstAt',
          'lastAt', to_jsonb(${now.toISOString()}::text)),
        "userAgent" = ${userAgent(req)}
      WHERE "id" = (
        SELECT "id" FROM "AuditLog"
        WHERE "action" = 'LOGIN_FAILED_UNKNOWN' AND "entityType" = 'AUTH' AND "entityId" = ${entityId}
        ORDER BY "createdAt" LIMIT 1)`
    if (updated > 0) return
    await db.auditLog.create({
      data: {
        action: 'LOGIN_FAILED_UNKNOWN', entityType: 'AUTH', entityId, entityTitle: sample.slice(0, 300),
        diff: { count: 1, emails: [sample], firstAt: now.toISOString(), lastAt: now.toISOString() },
        ip, userAgent: userAgent(req),
      },
    })
  } catch (error) {
    console.error('[cms] audit write failed', 'LOGIN_FAILED_UNKNOWN', error)
  }
}

/** Noise rows are kept this long; every other audit row is kept for good. */
export const AUDIT_NOISE_RETENTION_DAYS = 90

/** Deletes failed sign-ins and empty cron runs older than the retention window. */
export function purgeAuditNoise(now = new Date()) {
  const before = new Date(now.getTime() - AUDIT_NOISE_RETENTION_DAYS * 24 * 60 * 60 * 1000)
  return db.auditLog.deleteMany({
    where: {
      createdAt: { lt: before },
      OR: [
        { action: { in: ['LOGIN_FAILED', 'LOGIN_FAILED_UNKNOWN'] } },
        { action: 'SCHEDULE_REVALIDATE', diff: { path: ['count'], equals: 0 } },
      ],
    },
  })
}

/** Shallow field diff for audit rows: only keys whose JSON value changed. */
export function diffFields(before: Record<string, unknown>, after: Record<string, unknown>, ignore: string[] = ['updatedAt']) {
  const changed: Record<string, { from: unknown; to: unknown }> = {}
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (ignore.includes(key)) continue
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) changed[key] = { from: before[key], to: after[key] }
  }
  return changed as Prisma.InputJsonValue
}
