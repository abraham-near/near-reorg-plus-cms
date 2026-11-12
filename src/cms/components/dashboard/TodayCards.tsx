import Link from 'next/link'
import { ArrowRight, Bot, FileText, ImageUp, PenLine, Plus } from 'lucide-react'
import { Button } from '@/cms/components/ui/button'
import { cn } from '@/cms/lib/utils'
import { safeUrl } from '@/cms/lib/sanitize'
import type { DashboardData } from '@/cms/lib/people/dashboard'
import { LocalTime } from './LocalTime'

// The cards of the "Today" dashboard. Server components; times render through <LocalTime> so they
// read in the viewer's own time zone.

export const cardClass = 'cms-fade-up rounded-[14px] border bg-card p-5 text-card-foreground'
const capClass = 'text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground'

export function CardCaption({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn(capClass, className)}>{children}</h2>
}

type QuickAction = { href: string; title: string; hint: string; icon: typeof Plus }

export function QuickActions({ canWrite, canUpload, claude }: { canWrite: boolean; canUpload: boolean; claude: boolean }) {
  const actions: QuickAction[] = [
    ...(canWrite ? [{ href: '/admin/posts/new', title: 'Write a post', hint: 'Start with a blank page', icon: Plus }] : []),
    ...(canUpload ? [{ href: '/admin/media?upload=1', title: 'Upload images', hint: 'Add photos to the media library', icon: ImageUp }] : []),
    ...(claude ? [{ href: '/admin/settings?tab=claude', title: 'Draft with Claude', hint: 'Connect in Settings › Claude', icon: Bot }] : []),
  ]
  // Three cards line up with the 2/3 + 1/3 columns below; without Claude the third one opens the posts list.
  if (actions.length < 3) actions.push({ href: '/admin/posts', title: 'Browse posts', hint: 'Drafts, scheduled and published', icon: FileText })
  return (
    <nav aria-label="Quick actions" className="grid gap-5 sm:grid-cols-3">
      {actions.map(({ href, title, hint, icon: Icon }, index) => (
        <Link
          key={href}
          href={href}
          style={{ animationDelay: `${index * 40}ms` }}
          className="cms-fade-up cms-lift flex min-w-0 flex-col gap-2.5 rounded-[14px] border bg-card p-5 text-foreground hover:border-primary/30 focus-visible:outline-2 focus-visible:outline-ring"
        >
          <span className="grid size-[34px] place-items-center rounded-[9px] bg-accent text-primary" aria-hidden="true"><Icon className="size-[18px]" strokeWidth={1.75} /></span>
          <span className="text-sm font-semibold">{title}</span>
          <span className="text-[12.5px] text-muted-foreground">{hint}</span>
        </Link>
      ))}
    </nav>
  )
}

function Cover({ src, className }: { src: string | null; className?: string }) {
  const url = safeUrl(src)
  // eslint-disable-next-line @next/next/no-img-element -- CMS media are served as is from /cms/*
  if (url) return <img src={url} alt="" loading="lazy" className={cn('flex-none rounded-[10px] border object-cover', className)} />
  return <div aria-hidden="true" className={cn('flex-none rounded-[10px] bg-gradient-to-br from-accent to-muted', className)} />
}

export function ContinueWriting({ draft, canWrite }: { draft: DashboardData['continueWriting']; canWrite: boolean }) {
  if (!draft) {
    return (
      <section aria-labelledby="continue-writing" className={cardClass}>
        <CardCaption className="mb-3"><span id="continue-writing">Continue writing</span></CardCaption>
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid size-12 flex-none place-items-center rounded-xl bg-accent text-primary" aria-hidden="true"><PenLine className="size-5" /></span>
          <div className="min-w-[200px] flex-1">
            <p className="text-base font-semibold">No drafts in progress</p>
            <p className="mt-1 text-sm text-muted-foreground">{canWrite ? 'Your drafts show up here so you can pick up where you left off.' : 'Drafts you write will show up here.'}</p>
          </div>
          {canWrite && <Button asChild><Link href="/admin/posts/new"><Plus />Write your first post</Link></Button>}
        </div>
      </section>
    )
  }
  const { ready, total, checks } = draft.readiness
  const missing = checks.filter((check) => !check.ok).map((check) => check.label)
  const href = `/admin/posts/${encodeURIComponent(draft.id)}/edit`
  return (
    <section aria-labelledby="continue-writing" className={cardClass}>
      <CardCaption className="mb-3"><span id="continue-writing">Continue writing</span></CardCaption>
      <div className="flex flex-wrap items-center gap-[18px]">
        <Cover src={draft.featuredImage} className="h-24 w-[140px]" />
        <div className="min-w-[220px] flex-1">
          <Link href={href} className="text-lg font-[650] leading-snug text-foreground hover:underline">{draft.title || 'Untitled post'}</Link>
          <p className="mt-1.5 mb-2.5 text-[13.5px] leading-[1.55] text-muted-foreground">
            {draft.snippet && <>&ldquo;{draft.snippet}&rdquo; · </>}
            {draft.words.toLocaleString()} {draft.words === 1 ? 'word' : 'words'} · edited <LocalTime value={draft.updatedAt} inline />
          </p>
          <div className="flex items-center gap-2.5">
            <div
              role="progressbar"
              aria-label="Ready to publish"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={ready}
              aria-valuetext={`${ready} of ${total} ready${missing.length ? `. Missing: ${missing.join(', ')}` : ''}`}
              title={missing.length ? `Missing: ${missing.join(', ')}` : 'Ready to publish'}
              className="h-1.5 max-w-[200px] flex-1 overflow-hidden rounded-full bg-border"
            >
              <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${(ready / total) * 100}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">{ready} of {total} ready</span>
          </div>
        </div>
        <Button asChild><Link href={href}>Continue<ArrowRight /></Link></Button>
      </div>
    </section>
  )
}

export function YourDrafts({ drafts }: { drafts: DashboardData['drafts'] }) {
  return (
    <section aria-labelledby="your-drafts" className={cardClass} style={{ animationDelay: '40ms' }}>
      <div className="flex items-center">
        <CardCaption><span id="your-drafts">Your drafts</span></CardCaption>
        <span className="flex-1" />
        <Link href="/admin/posts?status=draft" className="text-[13px] font-medium text-primary hover:underline">All drafts</Link>
      </div>
      {drafts.length ? (
        <ul className="mt-1.5">
          {drafts.map((post) => (
            <li key={post.id} className="flex items-center gap-3 border-b border-border/70 py-2.5 text-[13.5px] last:border-0 last:pb-0">
              <Link href={`/admin/posts/${encodeURIComponent(post.id)}/edit`} className="min-w-0 flex-1 truncate font-medium text-foreground hover:underline">{post.title || 'Untitled post'}</Link>
              <LocalTime value={post.updatedAt} className="text-muted-foreground" />
            </li>
          ))}
        </ul>
      ) : <p className="mt-3 text-sm text-muted-foreground">No other drafts. Everything else is out the door.</p>}
    </section>
  )
}

export function TeamActivity({ items }: { items: NonNullable<DashboardData['activity']> }) {
  return (
    <section aria-labelledby="team-activity" className={cardClass} style={{ animationDelay: '80ms' }}>
      <CardCaption className="mb-1"><span id="team-activity">Team activity</span></CardCaption>
      {items.length ? (
        <ul>
          {items.map((item) => (
            <li key={item.id} className="flex gap-3 border-b border-border/70 py-2.5 text-[13.5px] last:border-0 last:pb-0">
              <span aria-hidden="true" className="grid size-[26px] flex-none place-items-center rounded-full bg-accent text-[10px] font-[650] text-accent-foreground">{item.initials}</span>
              <span className="min-w-0 break-words">
                <b className="font-semibold">{item.actor}</b> {item.verb}
                {item.object && <> {item.href ? <Link href={item.href} className="text-primary hover:underline">{item.object}</Link> : <span className="text-foreground">{item.object}</span>}</>}
                {item.viaClaude && <span className="text-muted-foreground"> with Claude</span>}
                <br />
                <LocalTime value={item.createdAt} className="text-xs text-muted-foreground" />
              </span>
            </li>
          ))}
        </ul>
      ) : <p className="mt-2 text-sm text-muted-foreground">No activity yet. Posts and uploads will show up here.</p>}
    </section>
  )
}
