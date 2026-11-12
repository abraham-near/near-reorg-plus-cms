'use client'

import { useHydrated } from '@/cms/lib/useStoredState'
import { formatAdminDate } from '@/cms/lib/utils'
import { formatLocalDateTime } from './schedule-time'

/** A date in the viewer's time zone. Server-rendered as UTC, then switched to local after hydration. */
export default function LocalTime({ value }: { value: string | Date | null | undefined }) {
  const hydrated = useHydrated()
  const iso = value ? new Date(value).toISOString() : undefined
  return <time dateTime={iso} suppressHydrationWarning>{hydrated ? formatLocalDateTime(value) : formatAdminDate(value)}</time>
}
