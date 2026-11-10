import 'server-only'
import { db } from './db'

export type RateLimitResult = { ok: boolean; count: number; remaining: number; resetAt: Date }

/**
 * Fixed-window counter stored in Postgres so every instance shares it and deploys do not reset it.
 * `key` should name the action and the subject, e.g. `login:ip:1.2.3.4` or `login:email:a@near.org`.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const rows = await db.$queryRaw<{ count: number; resetAt: Date }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt")
    VALUES (${key}, 1, now() + make_interval(secs => ${windowSeconds}))
    ON CONFLICT ("key") DO UPDATE SET
      "count"   = CASE WHEN "RateLimit"."resetAt" < now() THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" < now() THEN now() + make_interval(secs => ${windowSeconds}) ELSE "RateLimit"."resetAt" END
    RETURNING "count", "resetAt"`
  const { count, resetAt } = rows[0]
  return { ok: count <= limit, count, remaining: Math.max(0, limit - count), resetAt }
}

/** Whether `key` is already over `limit` in its current window, without counting this call. */
export async function isRateLimited(key: string, limit: number) {
  // Compared in SQL like rateLimit(): resetAt is written with the database clock.
  const rows = await db.$queryRaw<{ count: number }[]>`SELECT "count" FROM "RateLimit" WHERE "key" = ${key} AND "resetAt" >= now()`
  return !!rows[0] && rows[0].count >= limit
}

/**
 * Blocks `key` for `seconds` from now, replacing any earlier block. Read it back with
 * `isRateLimited(key, 1)`. Used for short waits between failed attempts.
 */
export async function setCooldown(key: string, seconds: number) {
  await db.$executeRaw`
    INSERT INTO "RateLimit" ("key", "count", "resetAt")
    VALUES (${key}, 1, now() + make_interval(secs => ${seconds}))
    ON CONFLICT ("key") DO UPDATE SET "count" = 1, "resetAt" = now() + make_interval(secs => ${seconds})`
}

export const resetRateLimit = (key: string | string[]) =>
  db.rateLimit.deleteMany({ where: { key: { in: Array.isArray(key) ? key : [key] } } })

/**
 * Housekeeping; safe to call from any cron or admin action (the cron runs it every 5 minutes).
 * Compared in SQL like rateLimit(): resetAt is written with the database clock.
 */
export const purgeExpiredRateLimits = async () => ({ count: await db.$executeRaw`DELETE FROM "RateLimit" WHERE "resetAt" < now()` })
