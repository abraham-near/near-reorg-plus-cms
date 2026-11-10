import type { Prisma } from '@/generated/prisma/client'

// This projection is also the boundary for revisions and client responses.
export const postSelect = {
  id: true, slug: true, title: true, body: true, excerpt: true,
  featuredImage: true, metaTitle: true, metaDescription: true, metaImage: true,
  status: true, visibility: true, publishedAt: true,
  authorId: true, lastEditedById: true, lockedAt: true, lockedById: true, lockedByTokenId: true,
  createdAt: true, updatedAt: true,
  author: { select: { id: true, name: true, email: true } },
  lastEditedBy: { select: { id: true, name: true, email: true } },
  categories: {
    orderBy: { position: 'asc' },
    select: { categoryId: true, position: true, category: { select: { id: true, name: true, slug: true } } },
  },
  tags: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.PostSelect

export type AdminPost = Prisma.PostGetPayload<{ select: typeof postSelect }>
export type PostContext = { params: Promise<{ id: string }> }
