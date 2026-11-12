import type { Metadata } from 'next'
import { requirePagePermission } from '@/cms/lib/auth'
import { listTaxonomy } from '@/cms/lib/posts/taxonomy'
import { TaxonomyManager } from '@/cms/components/posts/TaxonomyManager'

// Reads the session (cookie + database) before rendering: this page blocks by design (src/app/(cms)/layout.tsx).
export const instant = false

export const metadata: Metadata = { title: 'Categories & Tags' }

export default async function CategoriesPage() {
  await requirePagePermission('taxonomy:manage')
  const [categories, tags] = await Promise.all([listTaxonomy('category'), listTaxonomy('tag')])

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Categories &amp; tags</h1>
        <p className="mt-1 text-sm text-muted-foreground">Group posts so readers can find related stories. You pick them in each post&rsquo;s properties.</p>
      </header>
      <TaxonomyManager categories={categories} tags={tags} />
    </div>
  )
}
