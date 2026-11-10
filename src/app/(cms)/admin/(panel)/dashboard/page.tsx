import type { Metadata } from 'next'
import Link from 'next/link'
import { FilePlus, Globe, ImageIcon, PenLine } from 'lucide-react'
import { DashboardChart } from '@/cms/components/dashboard/DashboardChart'
import { Button } from '@/cms/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/cms/components/ui/card'
import { requirePagePermission } from '@/cms/lib/auth'
import { can } from '@/cms/lib/permissions'
import { getDashboard } from '@/cms/lib/people/dashboard'
import { formatAdminDate } from '@/cms/lib/utils'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const { user } = await requirePagePermission('admin:access')
  const data = await getDashboard(user)
  const totalPosts = Object.values(data.counts.posts).reduce((sum, count) => sum + count, 0)
  const stats = [
    { href: '/admin/posts?status=PUBLISHED', label: 'Published posts', value: data.counts.posts.PUBLISHED, icon: Globe, tour: 'posts' },
    { href: '/admin/posts?status=DRAFT', label: 'Draft posts', value: data.counts.posts.DRAFT, icon: PenLine },
    { href: '/admin/media', label: 'Media files', value: data.counts.media, icon: ImageIcon, tour: 'media' },
  ]
  return (
    <div className="space-y-8">
      <div data-tour-id="dashboard" className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Welcome back, <span className="font-medium text-foreground">{user.name}</span>.</p>
        </div>
        {can(user.role, 'post:write') && <Button asChild><Link href="/admin/posts/new"><FilePlus className="size-4" /> New post</Link></Button>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(({ href, label, value, icon: Icon, tour }) => (
          <Link key={label} href={href} data-tour-id={tour} className="rounded-xl focus-visible:outline-2 focus-visible:outline-primary">
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardContent>
                <div className="mb-4 flex items-center justify-between gap-3 text-muted-foreground"><p className="text-sm">{label}</p><Icon className="size-4" /></div>
                <p className="text-3xl font-bold">{value.toLocaleString()}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Content breakdown</CardTitle><CardDescription>{totalPosts.toLocaleString()} total posts. Published status includes scheduled posts.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(data.counts.posts).map(([status, count]) => (
              <div key={status}>
                <div className="mb-2 flex justify-between text-sm"><span>{status.charAt(0) + status.slice(1).toLowerCase()}</span><span>{count.toLocaleString()}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${totalPosts ? count / totalPosts * 100 : 0}%` }} /></div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Shortcuts</CardTitle><CardDescription>Jump to common tasks.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline"><Link href="/admin/categories" data-tour-id="categories">Categories &amp; tags</Link></Button>
              <Button asChild variant="outline"><Link href="/admin/settings" data-tour-id="settings">Your settings</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <DashboardChart title="Posts published per month" description="Last 12 months, including this month · UTC" data={data.publications} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {can(user.role, 'post:write') && (
          <Card>
            <CardHeader><CardTitle>Your drafts</CardTitle><CardDescription>Your six most recently edited drafts.</CardDescription></CardHeader>
            <CardContent>
              {data.drafts.length === 0 ? <p className="text-sm text-muted-foreground">You have no drafts yet.</p> : <ul className="divide-y divide-border">{data.drafts.map((post) => <li key={post.id} className="py-3 first:pt-0"><Link className="block break-words text-sm font-medium hover:underline" href={`/admin/posts/${encodeURIComponent(post.id)}`}>{post.title}</Link><time dateTime={post.updatedAt} className="text-xs text-muted-foreground">Updated {formatAdminDate(post.updatedAt)}</time></li>)}</ul>}
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader><CardTitle>Scheduled posts</CardTitle><CardDescription>The next six posts scheduled for publication.</CardDescription></CardHeader>
          <CardContent>
            {data.scheduled.length === 0 ? <p className="text-sm text-muted-foreground">No posts are scheduled.</p> : <ul className="divide-y divide-border">{data.scheduled.map((post) => <li key={post.id} className="py-3 first:pt-0"><Link className="block break-words text-sm font-medium hover:underline" href={`/admin/posts/${encodeURIComponent(post.id)}`}>{post.title}</Link><time dateTime={post.publishedAt ?? undefined} className="text-xs text-muted-foreground">{formatAdminDate(post.publishedAt)}</time></li>)}</ul>}
          </CardContent>
        </Card>
      </div>

      {data.recentActivity && (
        <Card>
          <CardHeader><div className="flex items-center justify-between gap-4"><CardTitle>Recent activity</CardTitle><Link href="/admin/audit-log" className="text-sm text-muted-foreground hover:underline">View audit log</Link></div><CardDescription>Latest ten actions across the CMS.</CardDescription></CardHeader>
          <CardContent>
            {data.recentActivity.length === 0 ? <p className="text-sm text-muted-foreground">No activity recorded yet.</p> : <ul className="divide-y divide-border">{data.recentActivity.map((entry) => <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 text-sm"><div className="min-w-0 break-words"><span className="mr-2 rounded bg-muted px-2 py-1 text-xs font-medium">{entry.action}</span><span className="text-muted-foreground">{entry.entityType}</span> {entry.entityTitle}</div><time dateTime={entry.createdAt} className="text-xs text-muted-foreground">{formatAdminDate(entry.createdAt)}</time></li>)}</ul>}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
