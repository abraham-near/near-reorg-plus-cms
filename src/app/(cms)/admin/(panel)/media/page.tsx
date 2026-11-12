import type { Metadata } from 'next'
import { can, requirePagePermission } from '@/cms/lib/auth'
import MediaLibrary from '@/cms/components/media/MediaLibrary'

// Reads the session (cookie + database) before rendering: this page blocks by design (src/app/(cms)/layout.tsx).
export const instant = false

export const metadata: Metadata = { title: 'Media' }

/** /admin/media?upload=1 (the dashboard's "Upload images") opens the file picker or shows the drop hint. */
export default async function MediaPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { user } = await requirePagePermission('content:read')
  const { upload } = await searchParams
  return <MediaLibrary
    canUpload={can(user.role, 'media:upload')}
    canEdit={can(user.role, 'media:edit')}
    canDelete={can(user.role, 'media:delete')}
    startUpload={upload === '1'}
  />
}
