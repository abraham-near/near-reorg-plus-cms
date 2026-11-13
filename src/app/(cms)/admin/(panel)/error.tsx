'use client'

import { CmsErrorView } from '@/cms/components/CmsErrorView'

// Errors in a CMS page: shown inside the panel, with the sidebar still there.
export default function PanelError({ error, retry }: { error: unknown; retry: () => void }) {
  return <CmsErrorView error={error} retry={retry} />
}
