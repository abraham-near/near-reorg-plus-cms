import type { Metadata } from 'next'
import { requirePagePermission } from '@/cms/lib/auth'
import { db } from '@/cms/lib/db'
import { can } from '@/cms/lib/permissions'
import PostForm from '@/cms/components/posts/PostForm'

export const metadata: Metadata = { title: 'New post' }
export default async function NewPostPage() {
  const { user } = await requirePagePermission('post:write')
  const [categories, tags] = await Promise.all([
    db.category.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' } }),
    db.tag.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' } }),
  ])
  return <PostForm initialPost={null} categories={categories} tags={tags} permissions={{ write: can(user.role, 'post:write'), publish: can(user.role, 'post:publish'), delete: can(user.role, 'post:delete'), overrideLock: can(user.role, 'lock:override'), manageTaxonomy: can(user.role, 'taxonomy:manage') }} />
}
