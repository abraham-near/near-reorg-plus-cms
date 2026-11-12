import type { Status, Visibility } from '@/generated/prisma/client'

/** One row of the posts list, as the server page sends it. */
export type PostRow = {
  id: string
  title: string
  excerpt: string | null
  featuredImage: string | null
  status: Status
  /** PUBLISHED with a publication date still ahead. */
  scheduled: boolean
  visibility: Visibility
  publishedAt: string | null
  updatedAt: string
  /** Someone has the post open in the editor right now. */
  locked: boolean
  author: { name: string; initials: string } | null
  category: string | null
}

export type ListPermissions = { write: boolean; publish: boolean; delete: boolean }

export type FilterOption = { id: string; name: string }
