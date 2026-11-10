import 'server-only'
import { db } from '@/cms/lib/db'
import { can } from '@/cms/lib/permissions'
import type { SessionUser } from '@/cms/lib/session'
import { dashboardPeriods, fillDashboardPeriods, type PeriodCount } from '@/cms/lib/people/dashboard-periods'

export async function getDashboard(user: SessionUser, now = new Date()) {
  const periods = dashboardPeriods(now)
  const readAudit = can(user.role, 'audit:read')
  const writePosts = can(user.role, 'post:write')

  const [statuses, media, publications, drafts, scheduled, recentActivity] = await Promise.all([
    db.post.groupBy({ by: ['status'], _count: { _all: true } }),
    db.media.count(),
    db.$queryRaw<PeriodCount[]>`
      SELECT to_char(date_trunc('month', "publishedAt"), 'YYYY-MM-DD') AS period, count(*)::int AS count
      FROM "Post"
      WHERE status = 'PUBLISHED' AND "publishedAt" >= ${periods.monthStart} AND "publishedAt" <= ${now}
      GROUP BY date_trunc('month', "publishedAt") ORDER BY period`,
    writePosts ? db.post.findMany({
      where: { status: 'DRAFT', authorId: user.id },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: 6,
      select: { id: true, title: true, updatedAt: true },
    }) : [],
    db.post.findMany({
      where: { status: 'PUBLISHED', publishedAt: { gt: now } },
      orderBy: [{ publishedAt: 'asc' }, { id: 'asc' }],
      take: 6,
      select: { id: true, title: true, publishedAt: true },
    }),
    readAudit ? db.auditLog.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 10,
      select: { id: true, action: true, entityType: true, entityTitle: true, createdAt: true },
    }) : null,
  ])

  const posts = { DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0 }
  for (const row of statuses) posts[row.status] = row._count._all
  return {
    counts: { posts, media },
    publications: fillDashboardPeriods(periods.months, publications),
    drafts: drafts.map((post) => ({ ...post, updatedAt: post.updatedAt.toISOString() })),
    scheduled: scheduled.map((post) => ({ ...post, publishedAt: post.publishedAt?.toISOString() ?? null })),
    recentActivity: recentActivity?.map((entry) => ({ ...entry, createdAt: entry.createdAt.toISOString() })) ?? null,
  }
}
