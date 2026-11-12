'use client'

import { useNow } from '@/cms/lib/useStoredState'
import { formatFullDate, formatRelativeTime } from '@/cms/lib/relative-time'
import { cn } from '@/cms/lib/utils'

/**
 * A relative time ("2 min ago", "Yesterday", "Nov 2") in the viewer's time zone, with the full local
 * date as a tooltip. The server and the hydrating client render an empty placeholder (they cannot
 * agree on a time zone); the text appears right after hydration and refreshes every 30 seconds.
 */
export function LocalTime({ value, className, inline }: { value: string; className?: string; inline?: boolean }) {
  const now = useNow(30_000)
  const text = now ? formatRelativeTime(value, now) : null
  // Mid-sentence ("edited yesterday"), the words read lowercase; dates ("Nov 2") keep their capital.
  const shown = text && inline && /^(Just now|Yesterday|Today|Tomorrow)/.test(text) ? text[0].toLowerCase() + text.slice(1) : text
  return (
    <time dateTime={value} title={now ? formatFullDate(value) : undefined} className={cn('whitespace-nowrap', className)}>
      {shown ??' '}
    </time>
  )
}
