'use client'

import Link from 'next/link'
import { useNow } from '@/cms/lib/useStoredState'
import { calendarDayDiff, formatClock, formatFullDate, formatShortDate } from '@/cms/lib/relative-time'
import type { DashboardData } from '@/cms/lib/people/dashboard'

type Scheduled = DashboardData['scheduled'][number]

/** The next scheduled posts with a calendar-style date block, all in the viewer's time zone. */
export function UpNext({ posts }: { posts: Scheduled[] }) {
  const now = useNow(60_000)
  if (!posts.length) return <p className="text-sm text-muted-foreground">Nothing is scheduled. Pick a date in a post&rsquo;s publish settings to line it up here.</p>
  return (
    <ul>
      {posts.map((post) => {
        const date = post.publishedAt ? new Date(post.publishedAt) : null
        const soon = date && now ? calendarDayDiff(date, now) < 7 : false
        const when = date && now ? `${soon ? '' : `${formatShortDate(date, now)} · `}${formatClock(date)}` : ' '
        return (
          <li key={post.id} className="flex items-start gap-3.5 border-b border-border/70 py-3 first:pt-1 last:border-0 last:pb-0">
            <div className="w-11 flex-none text-center">
              <div className="text-[11px] font-[650] uppercase text-[var(--status-scheduled-fg)]">{date && now ? date.toLocaleDateString('en-US', { weekday: 'short' }) : ' '}</div>
              <div className="text-xl font-[650] leading-tight">{date && now ? date.getDate() : ' '}</div>
            </div>
            <div className="min-w-0">
              <Link href={`/admin/posts/${encodeURIComponent(post.id)}/edit`} className="block truncate text-sm font-semibold text-foreground hover:underline">{post.title || 'Untitled post'}</Link>
              <p className="text-[12.5px] text-muted-foreground">
                {date && <time dateTime={post.publishedAt ?? undefined} title={now ? formatFullDate(date) : undefined}>{when}</time>}
                {post.author && <> · {post.author}</>}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
