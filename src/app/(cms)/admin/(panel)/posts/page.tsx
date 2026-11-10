import type { Metadata } from 'next'
import type { Prisma, Status } from '@/generated/prisma/client'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { requirePagePermission } from '@/cms/lib/auth'
import { db } from '@/cms/lib/db'
import { can } from '@/cms/lib/permissions'
import { Button } from '@/cms/components/ui/button'
import { Input } from '@/cms/components/ui/input'
import PostsTable from '@/cms/components/posts/PostsTable'

export const metadata: Metadata = { title: 'Posts' }
const pageSize = 20
const statuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const
export default async function PostsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { user } = await requirePagePermission('content:read')
  const params = await searchParams
  const string = (name: string) => typeof params[name] === 'string' ? params[name] as string : ''
  const page = Math.min(100000, Math.max(1, Number.parseInt(string('page') || '1', 10) || 1))
  const q = string('q').slice(0, 200)
  const status = statuses.includes(string('status') as Status) ? string('status') as Status : undefined
  const categoryId = string('categoryId')
  const tagId = string('tagId')
  const scheduled = string('scheduled') === 'true'
  const sort = ['title', 'createdAt', 'updatedAt', 'publishedAt'].includes(string('sort')) ? string('sort') : 'updatedAt'
  const where: Prisma.PostWhereInput = {
    ...(q ? { OR: [{ title: { contains: q, mode: 'insensitive' } }, { slug: { contains: q, mode: 'insensitive' } }, { excerpt: { contains: q, mode: 'insensitive' } }] } : {}),
    ...(status ? { status } : {}), ...(categoryId ? { categories: { some: { categoryId } } } : {}), ...(tagId ? { tags: { some: { id: tagId } } } : {}),
    ...(scheduled ? { status: 'PUBLISHED', publishedAt: { gt: new Date() } } : {}),
  }
  const [posts, total, allCount, statusCounts, categories, tags] = await Promise.all([
    db.post.findMany({ where, skip: (page - 1) * pageSize, take: pageSize, orderBy: { [sort]: sort === 'title' ? 'asc' : 'desc' }, select: { id: true, title: true, slug: true, status: true, visibility: true, publishedAt: true, updatedAt: true, lockedById: true, lockedAt: true, author: { select: { id: true, name: true, email: true } } } }),
    db.post.count({ where }), db.post.count(), db.post.groupBy({ by: ['status'], _count: true }),
    db.category.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    db.tag.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ])
  const permissions = { write: can(user.role, 'post:write'), publish: can(user.role, 'post:publish'), delete: can(user.role, 'post:delete'), overrideLock: can(user.role, 'lock:override'), manageTaxonomy: can(user.role, 'taxonomy:manage') }
  const pages = Math.max(1, Math.ceil(total / pageSize))
  function url(changes: Record<string, string>) {
    const next = new URLSearchParams()
    for (const key of ['q', 'status', 'categoryId', 'tagId', 'scheduled', 'sort']) if (string(key)) next.set(key, string(key))
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    return `/admin/posts?${next}`
  }
  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold">Posts</h1><p className="mt-1 text-sm text-muted-foreground">{allCount} posts · Draft, schedule and publish.</p></div>{permissions.write && <Button asChild><Link href="/admin/posts/new"><Plus />New post</Link></Button>}</header>
    <nav className="flex flex-wrap gap-2" aria-label="Filter by status">{[{ value: '', label: 'All', count: allCount }, ...statuses.map((value) => ({ value, label: value.charAt(0) + value.slice(1).toLowerCase(), count: statusCounts.find((item) => item.status === value)?._count ?? 0 }))].map((item) => <Link key={item.value} href={url({ status: item.value, page: '1', scheduled: '' })} aria-current={(status ?? '') === item.value && !scheduled ? 'page' : undefined} className={`rounded-full px-3 py-1.5 text-sm ${(status ?? '') === item.value && !scheduled ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>{item.label} <span className="ml-1 text-xs">{item.count}</span></Link>)}<Link href={url({ status: '', page: '1', scheduled: scheduled ? '' : 'true' })} className={`rounded-full px-3 py-1.5 text-sm ${scheduled ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>Scheduled</Link></nav>
    <form action="/admin/posts" className="flex flex-wrap items-center gap-2">
      {status && <input type="hidden" name="status" value={status} />}{scheduled && <input type="hidden" name="scheduled" value="true" />}
      <div className="relative min-w-52 flex-1"><Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input name="q" defaultValue={q} aria-label="Search posts" placeholder="Search title, slug or excerpt…" className="pl-9" /></div>
      <select name="categoryId" defaultValue={categoryId} aria-label="Filter by category" className="h-9 max-w-52 rounded-md border bg-background px-2 text-sm"><option value="">All categories</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <select name="tagId" defaultValue={tagId} aria-label="Filter by tag" className="h-9 max-w-40 rounded-md border bg-background px-2 text-sm"><option value="">All tags</option>{tags.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <select name="sort" defaultValue={sort} aria-label="Sort posts" className="h-9 rounded-md border bg-background px-2 text-sm"><option value="updatedAt">Recently updated</option><option value="createdAt">Newest created</option><option value="publishedAt">Publication date</option><option value="title">Title A–Z</option></select>
      <Button type="submit" variant="outline">Filter</Button>{Object.keys(where).length > 0 && <Button asChild variant="ghost"><Link href="/admin/posts">Clear</Link></Button>}
    </form>
    <section className="overflow-hidden rounded-lg border bg-card" aria-label="Posts">
      {posts.length ? <PostsTable key={posts.map((post) => post.id).join(',')} permissions={permissions} posts={posts.map((post) => ({ ...post, publishedAt: post.publishedAt?.toISOString() ?? null, updatedAt: post.updatedAt.toISOString(), lockedAt: post.lockedAt?.toISOString() ?? null }))} /> : <div className="px-5 py-16 text-center"><h2 className="font-medium">{allCount ? 'No posts match these filters' : 'Your first story starts here'}</h2><p className="mt-2 text-sm text-muted-foreground">{allCount ? 'Try another search or clear the filters.' : 'Create a draft to add content, images, and publication details.'}</p><Button asChild variant="link" className="mt-2"><Link href={allCount ? '/admin/posts' : permissions.write ? '/admin/posts/new' : '/admin/posts'}>{allCount ? 'Clear filters' : permissions.write ? 'Create a post' : 'Refresh posts'}</Link></Button></div>}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3"><p className="text-sm text-muted-foreground">{total} results · Page {page} of {pages}</p><div className="flex gap-2">{page > 1 && <Button asChild variant="outline" size="sm"><Link href={url({ page: String(page - 1) })}>Previous</Link></Button>}{page < pages && <Button asChild variant="outline" size="sm"><Link href={url({ page: String(page + 1) })}>Next</Link></Button>}</div></footer>
    </section>
  </div>
}
