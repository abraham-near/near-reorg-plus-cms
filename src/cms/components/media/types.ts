export const mediaSelect = {
  id: true, key: true, url: true, filename: true, mimeType: true, size: true,
  width: true, height: true, alt: true, createdAt: true, updatedAt: true,
} as const

export type MediaItem = {
  id: string
  url: string
  filename: string
  mimeType: string
  size: number
  alt: string | null
  createdAt: string
  updatedAt: string
}

export type MediaReference = {
  entityType: 'POST'
  id: string
  title: string
  path: string | null
  fields: string[]
  occurrences: number
}
