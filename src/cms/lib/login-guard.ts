import 'server-only'
import { isRateLimited, rateLimit, resetRateLimit, setCooldown } from '@/cms/lib/rate-limit'

/**
 * Sign-in throttling. Failures are counted per (email, IP) pair, not per account, so failures on
 * an address from elsewhere never lock its owner out. The same rules apply to addresses that do
 * not exist, so the answers never reveal which accounts are real.
 */
export const LOGIN_LIMITS = {
  /** Attempts of any kind from one IP. */
  perIp: { limit: 30, windowSeconds: 15 * 60 },
  /** Failures for one email from one IP; past this the pair waits for the window to end. */
  perPair: { limit: 10, windowSeconds: 15 * 60 },
  /** Wait after the n-th failure in a row for a pair: 1, 2, 4, 8, 16, then 30 seconds. */
  maxCooldownSeconds: 30,
  /** Failures for one email from every IP together. */
  perEmail: { windowSeconds: 15 * 60, notifyAt: 10, slowAfter: 50, slowSeconds: 2 },
  /** Failures across the whole site; past this the admins get an alert. */
  sitewide: { limit: 100, windowSeconds: 60 * 60 },
} as const

const ipKey = (ip: string) => `login:ip:${ip}`
const pairKey = (email: string, ip: string) => `login:fail:${ip}:${email}`
const pairWaitKey = (email: string, ip: string) => `login:wait:${ip}:${email}`
const emailKey = (email: string) => `login:fail-email:${email}`
const emailWaitKey = (email: string) => `login:wait-email:${email}`
const SITEWIDE_KEY = 'login:fail-all'

export const cooldownSeconds = (failures: number) =>
  Math.min(2 ** Math.max(0, failures - 1), LOGIN_LIMITS.maxCooldownSeconds)

/** Whether this attempt may go ahead. Counts the attempt against the IP. */
export async function loginAllowed(email: string, ip: string | null) {
  const from = ip ?? 'unknown'
  const [byIp, pairBlocked, pairWaiting, emailWaiting] = await Promise.all([
    rateLimit(ipKey(from), LOGIN_LIMITS.perIp.limit, LOGIN_LIMITS.perIp.windowSeconds),
    isRateLimited(pairKey(email, from), LOGIN_LIMITS.perPair.limit),
    isRateLimited(pairWaitKey(email, from), 1),
    isRateLimited(emailWaitKey(email), 1),
  ])
  return byIp.ok && !pairBlocked && !pairWaiting && !emailWaiting
}

export type FailureCounts = { emailFailures: number; sitewideFailures: number }

/** Records a failed attempt and starts the wait before the next one. */
export async function recordLoginFailure(email: string, ip: string | null): Promise<FailureCounts> {
  const from = ip ?? 'unknown'
  const { perPair, perEmail, sitewide } = LOGIN_LIMITS
  const [pair, byEmail, all] = await Promise.all([
    rateLimit(pairKey(email, from), perPair.limit, perPair.windowSeconds),
    rateLimit(emailKey(email), perEmail.slowAfter, perEmail.windowSeconds),
    rateLimit(SITEWIDE_KEY, sitewide.limit, sitewide.windowSeconds),
  ])
  await Promise.all([
    setCooldown(pairWaitKey(email, from), cooldownSeconds(pair.count)),
    // Many IPs on one address: space out every failure on it, without locking the owner out.
    byEmail.count > perEmail.slowAfter ? setCooldown(emailWaitKey(email), perEmail.slowSeconds) : null,
  ])
  return { emailFailures: byEmail.count, sitewideFailures: all.count }
}

/** A successful sign-in clears the pair's failures and wait. The per-email count stays. */
export const clearLoginFailures = (email: string, ip: string | null) =>
  resetRateLimit([pairKey(email, ip ?? 'unknown'), pairWaitKey(email, ip ?? 'unknown')])
