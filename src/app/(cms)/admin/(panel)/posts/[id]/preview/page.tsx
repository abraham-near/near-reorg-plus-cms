import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { requirePagePermission } from '@/cms/lib/auth'
import { db } from '@/cms/lib/db'
import { postSelect } from '@/cms/lib/posts/select'
import { isLive, isScheduled } from '@/cms/lib/posts/visibility'
import { safeUrl, sanitizeRichHtml, stripTags } from '@/cms/lib/sanitize'
import LocalTime from '@/cms/components/posts/LocalTime'

// Reads the session (cookie + database) before rendering: this page blocks by design (src/app/(cms)/layout.tsx).
export const instant = false

export const metadata: Metadata = { title: 'Preview' }

/** What a share card shows: the same fallbacks a public page should use (meta → excerpt → body). */
function shareCard(post: { title: string; excerpt: string | null; body: string; metaTitle: string | null; metaDescription: string | null; metaImage: string | null; featuredImage: string | null }) {
  // Close each block with a space first, so headings and paragraphs do not run together.
  const text = stripTags(post.body.replace(/<\/(p|h[1-6]|li|blockquote|pre|td|th)>|<br\s*\/?>/gi, ' ')).replace(/\s+/g, ' ').trim()
  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || (text.length > 160 ? `${text.slice(0, 157)}…` : text),
    image: safeUrl(post.metaImage) ?? safeUrl(post.featuredImage),
  }
}

// The saved post as readers will see it, plus the card social networks show when it is shared.
// Rendered with the CMS's own styles: the site has no blog yet, and the CMS never imports the site.
export default async function PostPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission('content:read')
  const { id } = await params
  const post = await db.post.findUnique({ where: { id }, select: postSelect })
  if (!post) notFound()
  const card = shareCard(post)
  const featured = safeUrl(post.featuredImage)
  const state = isScheduled(post) ? <>Scheduled for <LocalTime value={post.publishedAt} /></> : isLive(post) ? <>Published <LocalTime value={post.publishedAt} /></> : post.status === 'ARCHIVED' ? 'Archived' : 'Draft'
  const categories = post.categories.map((join) => join.category.name)

  return (
    <div className="mx-auto max-w-[720px] space-y-10 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-soft)] pb-4">
        <Link href={`/admin/posts/${post.id}/edit`} className="cms-press inline-flex items-center gap-1 rounded-md text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Back to the editor</Link>
        <p className="text-xs text-muted-foreground">{state} · {post.visibility === 'UNLISTED' ? 'Unlisted' : 'Public'} · Last saved <LocalTime value={post.updatedAt} /></p>
      </header>

      <section aria-labelledby="share-heading" className="space-y-3">
        <h2 id="share-heading" className="text-xs font-semibold tracking-[.05em] text-muted-foreground">WHEN SHARED ON SOCIAL NETWORKS</h2>
        <div className="max-w-md overflow-hidden rounded-xl border border-input bg-card">
          {card.image ? <img src={card.image} alt="" className="aspect-[1200/630] w-full object-cover" /> : <div className="flex aspect-[1200/630] items-center justify-center bg-[repeating-linear-gradient(135deg,#f4f4f1_0_12px,#efefec_12px_24px)] text-xs text-muted-foreground">No social or cover image</div>}
          <div className="space-y-1 px-3 py-2.5">
            <p className="text-xs text-muted-foreground">near.org</p>
            <p className="text-sm font-semibold">{card.title}</p>
            {card.description && <p className="line-clamp-2 text-[13px] text-muted-foreground">{card.description}</p>}
          </div>
        </div>
      </section>

      <article className="space-y-6 border-t border-[var(--border-soft)] pt-10">
        {featured && <img src={featured} alt="" className="max-h-[360px] w-full rounded-xl object-cover" />}
        {categories.length > 0 && <p className="text-xs font-semibold tracking-[.05em] text-primary">{categories.join(' · ').toUpperCase()}</p>}
        <h1 className="text-[40px] font-bold leading-[1.12] tracking-[-0.02em]">{post.title}</h1>
        {post.excerpt && <p className="text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>}
        <div className="prose max-w-none text-[16.5px] leading-[1.7] prose-headings:tracking-[-0.01em] prose-a:text-primary prose-img:rounded-lg" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(post.body) }} />
      </article>
    </div>
  )
}
