import 'server-only'
import { revalidateTag } from 'next/cache'

// Cache tags for anything that caches posts read from the database (a future public blog would tag
// its `"use cache"` reads with these strings; it does not import this file). Every write in the
// admin expires them, so cached pages update without a rebuild.
export const TAGS = {
  posts: 'cms:posts', // post index, lists, feeds, sitemaps
  post: (slug: string) => `cms:post:${slug}`,
  categories: 'cms:categories',
} as const

// 'max' = stale-while-revalidate: visitors get the cached page while the fresh one renders.
const expire = (tag: string) => revalidateTag(tag, 'max')

export function revalidatePost(slug: string, previousSlug?: string) {
  expire(TAGS.posts)
  expire(TAGS.post(slug))
  if (previousSlug && previousSlug !== slug) expire(TAGS.post(previousSlug))
}

export const revalidateCategories = () => {
  expire(TAGS.categories)
  expire(TAGS.posts)
}
