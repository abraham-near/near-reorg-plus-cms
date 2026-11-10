import type { Metadata } from 'next'
import { requirePagePermission } from '@/cms/lib/auth'
import { listTaxonomy } from '@/cms/lib/posts/taxonomy'
import { TaxonomyManager } from '@/cms/components/posts/TaxonomyManager'

export const metadata: Metadata = { title: 'Categories & Tags' }

export default async function CategoriesPage() {
  await requirePagePermission('taxonomy:manage')
  const [categories, tags] = await Promise.all([listTaxonomy('category'), listTaxonomy('tag')])

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="flex items-center gap-2 text-2xl font-semibold">Categories &amp; tags</h1>
        <p className="text-sm text-muted-foreground">Organize posts with shared categories and tags.</p>
      </div>
      <TaxonomyManager categories={categories} tags={tags} />
    </div>
  )
}
