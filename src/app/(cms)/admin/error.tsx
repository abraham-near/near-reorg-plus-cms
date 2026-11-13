'use client'

import { CmsErrorView } from '@/cms/components/CmsErrorView'

// Errors in the panel layout itself (sidebar, session): (panel)/error.tsx cannot catch those.
export default function AdminError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="admin-wrapper min-h-screen bg-background text-foreground">
      <CmsErrorView error={error} retry={retry} />
    </div>
  )
}
