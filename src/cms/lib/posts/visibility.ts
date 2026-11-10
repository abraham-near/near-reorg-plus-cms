import type { Status, Visibility } from '@/generated/prisma/client'

// The contract between the CMS and whoever reads posts from the database (a future public blog
// reads the same rows directly, without importing this file): a post is live when it is PUBLISHED
// and its publish time has come. A PUBLISHED post with a future publishedAt is scheduled and goes
// live on its own; nothing has to run at that moment.

/** Live: published and its publish time has come. */
export function isLive(row: { status: Status; publishedAt: Date | null }, now = new Date()) {
  return row.status === 'PUBLISHED' && (!row.publishedAt || row.publishedAt <= now)
}

/** Scheduled: published with a future publish time. */
export const isScheduled = (post: { status: Status; publishedAt: Date | null }, now = new Date()) =>
  post.status === 'PUBLISHED' && !!post.publishedAt && post.publishedAt > now

/** Listed in blog lists, feeds and sitemaps, and indexable. UNLISTED is reachable by URL only. */
export const isListed = (v: Visibility) => v === 'PUBLIC'
