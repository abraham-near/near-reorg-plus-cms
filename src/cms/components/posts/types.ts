import type { AdminPost } from '@/cms/lib/posts/select'

export type PostRecord = Omit<AdminPost, 'createdAt' | 'updatedAt' | 'publishedAt' | 'lockedAt'> & {
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  lockedAt: string | null
}
export type TaxonomyOption = { id: string; name: string; slug: string }
export type PostPermissions = { write: boolean; publish: boolean; delete: boolean; overrideLock: boolean; manageTaxonomy: boolean }
export type PostListItem = Pick<PostRecord, 'id' | 'title' | 'slug' | 'status' | 'visibility' | 'publishedAt' | 'updatedAt' | 'author' | 'lockedById' | 'lockedAt'>
