import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { db } from '@/cms/lib/db'
import { getDashboard } from '@/cms/lib/people/dashboard'
import { purgeExpiredSessions, type SessionUser } from '@/cms/lib/session'
import { purgeExpiredRateLimits } from '@/cms/lib/rate-limit'

describe.skipIf(!process.env.TEST_DATABASE_URL)('people dashboard database aggregates and maintenance', () => {
  const prefix = `people-dashboard-${randomUUID()}`
  const now = new Date('2031-05-15T12:00:00Z')
  const user: SessionUser = { id: `${prefix}-user`, name: 'Dashboard fixture', email: `${prefix}@near.org`, role: 'ADMIN' }
  const otherId = `${prefix}-other`
  const secret = `${prefix}-private-content`

  beforeAll(async () => {
    await db.user.createMany({ data: [
      { ...user, passwordHash: secret },
      { id: otherId, name: 'Other fixture', email: `${prefix}-other@near.org`, passwordHash: secret, role: 'PUBLISHER' },
    ] })
    await db.post.createMany({ data: [
      { id: `${prefix}-draft`, slug: `${prefix}-draft`, title: 'Your draft', authorId: user.id, body: `<p>${secret}</p>`, metaDescription: secret },
      { id: `${prefix}-other-draft`, slug: `${prefix}-other-draft`, title: 'Someone else’s draft', authorId: otherId, body: `<p>${secret}</p>` },
      { id: `${prefix}-published`, slug: `${prefix}-published`, title: 'Published in May', authorId: user.id, status: 'PUBLISHED', publishedAt: new Date('2031-05-01T00:00:00Z'), body: `<p>${secret}</p>` },
      { id: `${prefix}-april`, slug: `${prefix}-april`, title: 'Published in April', authorId: user.id, status: 'PUBLISHED', publishedAt: new Date('2031-04-30T23:59:59Z'), body: `<p>${secret}</p>` },
      { id: `${prefix}-scheduled`, slug: `${prefix}-scheduled`, title: 'Scheduled in May', authorId: user.id, status: 'PUBLISHED', publishedAt: new Date('2031-05-16T00:00:00Z'), body: `<p>${secret}</p>` },
      { id: `${prefix}-archived`, slug: `${prefix}-archived`, title: 'Archived in May', authorId: user.id, status: 'ARCHIVED', publishedAt: new Date('2031-05-02T00:00:00Z'), body: `<p>${secret}</p>` },
    ] })
    await db.auditLog.create({ data: { id: `${prefix}-audit`, userId: user.id, userEmail: user.email, action: 'CREATE', entityType: 'POST', entityTitle: 'Dashboard fixture', diff: { secret }, ip: secret, userAgent: secret } })
  })

  afterAll(async () => {
    await db.auditLog.deleteMany({ where: { userId: user.id } })
    await db.post.deleteMany({ where: { authorId: { in: [user.id, otherId] } } })
    await db.rateLimit.deleteMany({ where: { key: { startsWith: prefix } } })
    await db.user.deleteMany({ where: { id: { in: [user.id, otherId] } } })
  })

  it('aggregates in SQL, excludes future publications, and selects only safe summaries', async () => {
    const result = await getDashboard(user, now)
    expect(result.publications).toHaveLength(12)
    expect(result.publications.find(({ period }) => period === '2031-04-01')?.count).toBe(1)
    expect(result.publications.find(({ period }) => period === '2031-05-01')?.count).toBe(1)
    expect(result.drafts.map(({ id }) => id)).toEqual([`${prefix}-draft`])
    expect(result.scheduled.some(({ id }) => id === `${prefix}-scheduled`)).toBe(true)
    expect(result.recentActivity).not.toBeNull()
    expect(JSON.stringify(result)).not.toContain(secret)
    expect(JSON.stringify(result)).not.toMatch(/passwordHash|tokenHash|userAgent|ipHash/)
  })

  it('does not disclose audit activity to a PUBLISHER', async () => {
    const result = await getDashboard({ ...user, role: 'PUBLISHER' }, now)
    expect(result.recentActivity).toBeNull()
    expect(result.drafts.map(({ id }) => id)).toEqual([`${prefix}-draft`])
  })

  it('purges only expired sessions and rate-limit rows', async () => {
    const expired = new Date(Date.now() - 60_000)
    const future = new Date(Date.now() + 60_000)
    await db.session.createMany({ data: [
      { id: `${prefix}-expired`, tokenHash: `${prefix}-expired-hash`, userId: user.id, expiresAt: expired },
      { id: `${prefix}-active`, tokenHash: `${prefix}-active-hash`, userId: user.id, expiresAt: future },
    ] })
    // Rate-limit rows are written with the database clock (see src/cms/lib/rate-limit.ts).
    await db.$executeRaw`INSERT INTO "RateLimit" ("key", "count", "resetAt") VALUES
      (${`${prefix}-expired`}, 0, now() - interval '1 minute'), (${`${prefix}-active`}, 0, now() + interval '1 minute')`
    await purgeExpiredSessions()
    await purgeExpiredRateLimits()
    expect(await db.session.count({ where: { id: `${prefix}-expired` } })).toBe(0)
    expect(await db.session.count({ where: { id: `${prefix}-active` } })).toBe(1)
    expect(await db.rateLimit.count({ where: { key: `${prefix}-expired` } })).toBe(0)
    expect(await db.rateLimit.count({ where: { key: `${prefix}-active` } })).toBe(1)
  })
})
