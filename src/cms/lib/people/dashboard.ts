import 'server-only'
import { db } from '@/cms/lib/db'
import { can } from '@/cms/lib/permissions'
import type { SessionUser } from '@/cms/lib/session'
import { postReadiness } from '@/cms/lib/posts/readiness'
import { countWords, htmlToText, textTail } from '@/cms/lib/posts/text'
import { ACTIVITY_ACTIONS, buildActivity, type ActivityItem } from '@/cms/lib/people/activity'

const ACTIVITY_ROWS = 80

/**
 * The "Today" dashboard: the signed-in person's drafts (the latest one in detail), the next
 * scheduled posts, and, for people who may read the audit log, recent team activity in words.
 * Only summaries leave the server: a snippet of the person's own latest draft, never other bodies.
 */
export async function getDashboard(user: SessionUser, now = new Date()) {
  const readAudit = can(user.role, 'audit:read')
  const writePosts = can(user.role, 'post:write')

  const [drafts, scheduled, audit] = await Promise.all([
    writePosts ? db.post.findMany({
      where: { status: 'DRAFT', authorId: user.id },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: 4,
      select: { id: true, title: true, updatedAt: true, featuredImage: true },
    }) : [],
    db.post.findMany({
      where: { status: 'PUBLISHED', publishedAt: { gt: now } },
      orderBy: [{ publishedAt: 'asc' }, { id: 'asc' }],
      take: 4,
      select: { id: true, title: true, publishedAt: true, author: { select: { name: true, email: true } } },
    }),
    readAudit ? db.auditLog.findMany({
      where: { OR: Object.entries(ACTIVITY_ACTIONS).map(([entityType, actions]) => ({ entityType, action: { in: [...actions] } })) },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: ACTIVITY_ROWS,
      select: { id: true, userId: true, userEmail: true, apiTokenId: true, action: true, entityType: true, entityId: true, entityTitle: true, createdAt: true, diff: true },
    }) : null,
  ])

  // The latest draft in detail: only now is its body read, and only to count words and quote its end.
  const latest = drafts[0]
    ? await db.post.findUnique({
      where: { id: drafts[0].id },
      select: { body: true, excerpt: true, _count: { select: { categories: true } } },
    })
    : null
  const text = htmlToText(latest?.body)
  const words = countWords(text)
  const continueWriting = drafts[0] && latest ? {
    id: drafts[0].id,
    title: drafts[0].title,
    featuredImage: drafts[0].featuredImage,
    updatedAt: drafts[0].updatedAt.toISOString(),
    snippet: text ? textTail(text, 120) : null,
    words,
    readiness: postReadiness({ title: drafts[0].title, excerpt: latest.excerpt, categoryCount: latest._count.categories, featuredImage: drafts[0].featuredImage, wordCount: words }),
  } : null

  let activity: ActivityItem[] | null = null
  if (audit) {
    const userIds = [...new Set(audit.map((row) => row.userId).filter((id): id is string => !!id))]
    const postIds = [...new Set(audit.filter((row) => row.entityType === 'POST' && row.entityId).map((row) => row.entityId as string))]
    const [people, posts] = await Promise.all([
      userIds.length ? db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } }) : [],
      postIds.length ? db.post.findMany({ where: { id: { in: postIds } }, select: { id: true, publishedAt: true } }) : [],
    ])
    const names = new Map(people.map((person) => [person.id, person.name]))
    const published = new Map(posts.map((post) => [post.id, post.publishedAt]))
    activity = buildActivity(audit.map((row) => {
      const publishedAt = row.entityId ? published.get(row.entityId) : undefined
      return {
        id: row.id,
        userId: row.userId,
        actorName: (row.userId && names.get(row.userId)) || row.userEmail?.split('@')[0] || null,
        viaToken: !!row.apiTokenId,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        entityTitle: row.entityTitle,
        createdAt: row.createdAt,
        // Only the status change is read from the diff; nothing else from it leaves the server.
        diff: row.action === 'STATUS_CHANGE' || row.action === 'BULK_DELETE' ? row.diff : undefined,
        postExists: row.entityType === 'POST' && !!row.entityId && published.has(row.entityId),
        scheduled: row.action === 'PUBLISH' && !!publishedAt && publishedAt.getTime() > row.createdAt.getTime() + 60_000,
      }
    }), user.id)
  }

  return {
    continueWriting,
    drafts: drafts.slice(1).map((post) => ({ id: post.id, title: post.title, updatedAt: post.updatedAt.toISOString() })),
    scheduled: scheduled.map((post) => ({
      id: post.id,
      title: post.title,
      publishedAt: post.publishedAt?.toISOString() ?? null,
      author: post.author?.name || post.author?.email?.split('@')[0] || null,
    })),
    activity,
  }
}

export type DashboardData = Awaited<ReturnType<typeof getDashboard>>
