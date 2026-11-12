import type { Metadata } from 'next'
import type { Prisma } from '@/generated/prisma/client'
import { requirePagePermission } from '@/cms/lib/auth'
import { db } from '@/cms/lib/db'
import { can } from '@/cms/lib/permissions'
import { LOCK_TTL_MS } from '@/cms/lib/posts/service'
import { hasPostFilters, parsePostsQuery, postsHref, type PostTab } from '@/cms/lib/posts/list-query'
import { initialsOf } from '@/cms/lib/people/activity'
import { Button } from '@/cms/components/ui/button'
import PostsTable from '@/cms/components/posts/PostsTable'
import { NavLink, PostsNavProvider } from '@/cms/components/posts/list/PostsNav'
import { PostsHeader, PostsTabs } from '@/cms/components/posts/list/PostsToolbar'
import type { PostRow } from '@/cms/components/posts/list/types'
import Link from 'next/link'

// Reads the session (cookie + database) before rendering: this page blocks by design (src/app/(cms)/layout.tsx).
export const instant = false

export const metadata: Metadata = { title: 'Posts' }
const pageSize = 20

const EMPTY: Record<PostTab, { title: string; body: string }> = {
  all: { title: 'Your first story starts here', body: 'Create a draft to add text, images and publication details.' },
  draft: { title: 'No drafts yet', body: 'Drafts are private until you publish them.' },
  scheduled: { title: 'Nothing scheduled', body: 'Pick a future date when you publish a post and it will wait here until then.' },
  published: { title: 'Nothing published yet', body: 'Published posts are live on the blog.' },
  archived: { title: 'No archived posts', body: 'Archive a post to take it off the blog without deleting it.' },
}

export default async function PostsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { user } = await requirePagePermission('content:read')
  const query = parsePostsQuery(await searchParams)
  const now = new Date()
  const q = query.q.trim()

  // Search and filters narrow every tab (and its count); the tab adds the status.
  const base: Prisma.PostWhereInput = {
    ...(q ? { OR: [{ title: { contains: q, mode: 'insensitive' } }, { slug: { contains: q, mode: 'insensitive' } }, { excerpt: { contains: q, mode: 'insensitive' } }] } : {}),
    ...(query.categoryId ? { categories: { some: { categoryId: query.categoryId } } } : {}),
    ...(query.tagId ? { tags: { some: { id: query.tagId } } } : {}),
    ...(query.authorId ? { authorId: query.authorId } : {}),
  }
  const scheduledWhere: Prisma.PostWhereInput = { status: 'PUBLISHED', publishedAt: { gt: now } }
  const liveWhere: Prisma.PostWhereInput = { status: 'PUBLISHED', OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] }
  const byTab: Record<PostTab, Prisma.PostWhereInput> = {
    all: {}, draft: { status: 'DRAFT' }, scheduled: scheduledWhere, published: liveWhere, archived: { status: 'ARCHIVED' },
  }
  const where: Prisma.PostWhereInput = { AND: [base, byTab[query.tab]] }
  const direction = query.sort === 'title' ? 'asc' : 'desc'
  const orderBy: Prisma.PostOrderByWithRelationInput[] = [
    query.sort === 'publishedAt' ? { publishedAt: { sort: 'desc', nulls: 'last' } } : { [query.sort]: direction },
    { id: 'asc' },
  ]

  const [posts, total, statusCounts, scheduledCount, categories, authors] = await Promise.all([
    db.post.findMany({
      where, orderBy, skip: (query.page - 1) * pageSize, take: pageSize,
      select: {
        id: true, title: true, excerpt: true, featuredImage: true, status: true, visibility: true, publishedAt: true, updatedAt: true, lockedById: true, lockedAt: true,
        author: { select: { name: true, email: true } },
        categories: { orderBy: { position: 'asc' }, take: 1, select: { category: { select: { name: true } } } },
      },
    }),
    db.post.count({ where }),
    db.post.groupBy({ by: ['status'], where: base, _count: { _all: true } }),
    db.post.count({ where: { AND: [base, scheduledWhere] } }),
    db.category.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    db.user.findMany({ where: { posts: { some: {} } }, select: { id: true, name: true, email: true }, orderBy: { name: 'asc' } }),
  ])

  const byStatus = (status: string) => statusCounts.find((row) => row.status === status)?._count._all ?? 0
  const counts: Record<PostTab, number> = {
    all: statusCounts.reduce((sum, row) => sum + row._count._all, 0),
    draft: byStatus('DRAFT'),
    scheduled: scheduledCount,
    published: byStatus('PUBLISHED') - scheduledCount,
    archived: byStatus('ARCHIVED'),
  }
  const permissions = { write: can(user.role, 'post:write'), publish: can(user.role, 'post:publish'), delete: can(user.role, 'post:delete') }
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const rows: PostRow[] = posts.map((post) => {
    const authorName = post.author ? post.author.name || post.author.email.split('@')[0] : null
    return {
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      featuredImage: post.featuredImage,
      status: post.status,
      scheduled: post.status === 'PUBLISHED' && !!post.publishedAt && post.publishedAt > now,
      visibility: post.visibility,
      publishedAt: post.publishedAt?.toISOString() ?? null,
      updatedAt: post.updatedAt.toISOString(),
      locked: !!post.lockedById && !!post.lockedAt && now.getTime() - post.lockedAt.getTime() < LOCK_TTL_MS,
      author: authorName ? { name: authorName, initials: initialsOf(authorName) } : null,
      category: post.categories[0]?.category.name ?? null,
    }
  })

  const filtered = hasPostFilters(query)
  const empty = filtered
    ? { title: 'No posts match', body: q ? `Nothing matches “${q}” here. Try other words or clear the filters.` : 'Try another filter or clear them.' }
    : EMPTY[query.tab]
  const emptyState = (
    <div className="cms-fade-up px-5 py-16 text-center">
      <h2 className="text-base font-semibold">{empty.title}</h2>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">{empty.body}</p>
      <div className="mt-4 flex justify-center gap-2">
        {filtered && <Button asChild variant="outline" size="sm"><NavLink href={postsHref(query, { q: '', categoryId: '', tagId: '', authorId: '' })}>Clear filters</NavLink></Button>}
        {!filtered && permissions.write && (query.tab === 'all' || query.tab === 'draft') && <Button asChild size="sm"><Link href="/admin/posts/new">Write a post</Link></Button>}
      </div>
    </div>
  )

  const first = (query.page - 1) * pageSize + 1
  return (
    <PostsNavProvider>
      <div className="flex flex-col gap-[18px]">
        <PostsHeader query={query} canWrite={permissions.write} />
        <PostsTabs
          query={query}
          counts={counts}
          categories={categories}
          authors={authors.map((author) => ({ id: author.id, name: author.id === user.id ? `${author.name || author.email} (you)` : author.name || author.email }))}
        />
        <section aria-label="Posts" className="-mt-3.5">
          <PostsTable key={rows.map((row) => row.id).join(',')} posts={rows} permissions={permissions} empty={emptyState} />
          {total > 0 && (
            <footer className="flex flex-wrap items-center justify-between gap-3 py-4">
              <p className="text-[13px] text-muted-foreground">
                {total > pageSize ? <>Showing {Math.min(first, total).toLocaleString()}–{Math.min(first + posts.length - 1, total).toLocaleString()} of {total.toLocaleString()}</> : <>{total.toLocaleString()} {total === 1 ? 'post' : 'posts'}</>}
              </p>
              {pages > 1 && (
                <nav aria-label="Pages" className="flex items-center gap-2">
                  <span className="text-[13px] text-muted-foreground">Page {query.page} of {pages}</span>
                  {query.page > 1 && <Button asChild variant="outline" size="sm"><NavLink href={postsHref(query, { page: query.page - 1 })} rel="prev">Previous</NavLink></Button>}
                  {query.page < pages && <Button asChild variant="outline" size="sm"><NavLink href={postsHref(query, { page: query.page + 1 })} rel="next">Next</NavLink></Button>}
                </nav>
              )}
            </footer>
          )}
        </section>
      </div>
    </PostsNavProvider>
  )
}
