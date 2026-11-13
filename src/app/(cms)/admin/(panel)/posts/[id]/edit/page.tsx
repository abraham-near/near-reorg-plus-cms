import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requirePagePermission } from '@/cms/lib/auth'
import { db } from '@/cms/lib/db'
import { can } from '@/cms/lib/permissions'
import { postSelect } from '@/cms/lib/posts/select'
import { PostEditor } from '@/cms/components/posts/PostForm'

// Reads the session (cookie + database) before rendering: this page blocks by design (src/app/(cms)/layout.tsx).
export const instant = false

export const metadata: Metadata = { title: 'Edit post' }
export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requirePagePermission('content:read')
  const { id } = await params
  const [post, categories, tags] = await Promise.all([
    db.post.findUnique({ where: { id }, select: postSelect }),
    db.category.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' } }),
    db.tag.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' } }),
  ])
  if (!post) notFound()
  const initialPost = { ...post, createdAt: post.createdAt.toISOString(), updatedAt: post.updatedAt.toISOString(), publishedAt: post.publishedAt?.toISOString() ?? null, lockedAt: post.lockedAt?.toISOString() ?? null }
  return <PostEditor initialPost={initialPost} categories={categories} tags={tags} permissions={{ write: can(user.role, 'post:write'), publish: can(user.role, 'post:publish'), delete: can(user.role, 'post:delete'), overrideLock: can(user.role, 'lock:override'), manageTaxonomy: can(user.role, 'taxonomy:manage') }} />
}
