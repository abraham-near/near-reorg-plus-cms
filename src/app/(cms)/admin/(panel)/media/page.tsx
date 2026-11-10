import type { Metadata } from 'next'
import { can, requirePagePermission } from '@/cms/lib/auth'
import MediaLibrary from '@/cms/components/media/MediaLibrary'

// Reads the session (cookie + database) before rendering: this page blocks by design (src/app/(cms)/layout.tsx).
export const instant = false

export const metadata: Metadata = { title: 'Media' }

export default async function MediaPage() {
  const { user } = await requirePagePermission('content:read')
  return <MediaLibrary canUpload={can(user.role, 'media:upload')} canEdit={can(user.role, 'media:edit')} canDelete={can(user.role, 'media:delete')} />
}
