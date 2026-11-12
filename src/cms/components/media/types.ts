export const mediaSelect = {
  id: true, key: true, url: true, filename: true, mimeType: true, size: true,
  width: true, height: true, alt: true, createdAt: true, updatedAt: true,
  originalKey: true, originalMimeType: true, originalSize: true,
} as const

export type MediaItem = {
  id: string
  url: string
  filename: string
  mimeType: string
  size: number
  width?: number | null
  height?: number | null
  alt: string | null
  createdAt: string
  updatedAt: string
  /** The file as uploaded, when the served copy is an optimized WebP ("cms/<hash>.<ext>"). */
  originalKey?: string | null
  originalMimeType?: string | null
  originalSize?: number | null
}

/** GET /api/admin/media/:id: the file, where it is used and (when known) who uploaded it. */
export type MediaDetail = MediaItem & { references: MediaReference[]; uploadedBy?: { name: string | null; email: string } | null }

export type MediaListResult = { items: MediaItem[]; total: number; page: number; pageSize: number }

export type MediaReference = {
  entityType: 'POST'
  id: string
  title: string
  path: string | null
  fields: string[]
  occurrences: number
  /** The post's status (DRAFT, PUBLISHED…), when known. */
  status?: string
}
