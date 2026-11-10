import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { requirePagePermission } from '@/cms/lib/auth'
import { db } from '@/cms/lib/db'
import { postSelect } from '@/cms/lib/posts/select'
import { isLive, isScheduled } from '@/cms/lib/posts/visibility'
import { safeUrl, sanitizeRichHtml, stripTags } from '@/cms/lib/sanitize'
import { formatAdminDate } from '@/cms/lib/utils'

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
  const state = isScheduled(post) ? `Scheduled for ${formatAdminDate(post.publishedAt)}` : isLive(post) ? `Published ${formatAdminDate(post.publishedAt)}` : post.status === 'ARCHIVED' ? 'Archived' : 'Draft'

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/admin/posts/${post.id}/edit`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Back to the editor</Link>
        <p className="text-sm text-muted-foreground">{state} · {post.visibility === 'UNLISTED' ? 'Unlisted' : 'Public'} · Last saved {formatAdminDate(post.updatedAt)}</p>
      </header>

      <section aria-labelledby="share-heading" className="space-y-3">
        <h2 id="share-heading" className="text-sm font-semibold text-muted-foreground">When shared on social networks</h2>
        <div className="max-w-lg overflow-hidden rounded-xl border bg-card">
          {card.image ? <img src={card.image} alt="" className="aspect-[1200/630] w-full object-cover" /> : <div className="flex aspect-[1200/630] items-center justify-center bg-muted text-sm text-muted-foreground">No social or featured image</div>}
          <div className="space-y-1 p-4">
            <p className="font-semibold">{card.title}</p>
            {card.description && <p className="line-clamp-2 text-sm text-muted-foreground">{card.description}</p>}
          </div>
        </div>
      </section>

      <article className="space-y-6 border-t pt-10">
        {featured && <img src={featured} alt="" className="w-full rounded-lg object-cover" />}
        <h1 className="text-4xl font-bold">{post.title}</h1>
        {post.excerpt && <p className="text-lg text-muted-foreground">{post.excerpt}</p>}
        <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(post.body) }} />
      </article>
    </div>
  )
}
