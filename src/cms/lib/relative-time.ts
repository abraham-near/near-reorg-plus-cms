// Human dates for lists ("2 min ago", "Yesterday", "Nov 2") and their full form for tooltips.
// Pure functions: the caller passes `now` and, in tests, a time zone. In the browser the time zone
// defaults to the viewer's own, so call these from client components after hydration (useNow).

type Input = string | number | Date

const toDate = (value: Input) => (value instanceof Date ? value : new Date(value))
const MINUTE = 60_000
const HOUR = 60 * MINUTE

/** Calendar day number (days since epoch) of `date` in `timeZone`, to compare days across zones. */
function dayNumber(date: Date, timeZone?: string) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(date)
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value)
  return Math.round(Date.UTC(get('year'), get('month') - 1, get('day')) / 86_400_000)
}

/** Whole calendar days from `now` to `date` in `timeZone`: 0 today, -1 yesterday, 1 tomorrow. */
export function calendarDayDiff(value: Input, now: Date, timeZone?: string) {
  return dayNumber(toDate(value), timeZone) - dayNumber(now, timeZone)
}

const yearOf = (date: Date, timeZone?: string) => new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric' }).format(date)

/** "Nov 2", or "Nov 2, 2025" outside the current year. */
export function formatShortDate(value: Input, now: Date, timeZone?: string) {
  const date = toDate(value)
  const sameYear = yearOf(date, timeZone) === yearOf(now, timeZone)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }), timeZone })
}

/** "10:00 AM" in the viewer's time zone. */
export function formatClock(value: Input, timeZone?: string) {
  return toDate(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone })
}

/**
 * Past dates: "Just now", "2 min ago", "3 h ago" (same day), "Yesterday", "Nov 2", "Nov 2, 2025".
 * Future dates (a schedule): "in 5 min", "Today · 3:00 PM", "Tomorrow · 9:00 AM", "Nov 13 · 10:00 AM".
 */
export function formatRelativeTime(value: Input, now: Date, timeZone?: string) {
  const date = toDate(value)
  if (Number.isNaN(date.getTime())) return '—'
  const diff = now.getTime() - date.getTime()
  const days = calendarDayDiff(date, now, timeZone)
  if (diff >= -MINUTE) {
    // Small clock skew between server and browser shows as "Just now", never "in 0 min".
    if (diff < MINUTE) return 'Just now'
    if (diff < HOUR) return `${Math.floor(diff / MINUTE)} min ago`
    if (days === 0) return `${Math.floor(diff / HOUR)} h ago`
    if (days === -1) return 'Yesterday'
    return formatShortDate(date, now, timeZone)
  }
  const ahead = -diff
  if (ahead < HOUR) return `in ${Math.max(1, Math.round(ahead / MINUTE))} min`
  const clock = formatClock(date, timeZone)
  if (days === 0) return `Today · ${clock}`
  if (days === 1) return `Tomorrow · ${clock}`
  return `${formatShortDate(date, now, timeZone)} · ${clock}`
}

/** Full local date for a title attribute: "Wednesday, November 11, 2026 at 2:05 PM". */
export function formatFullDate(value: Input, timeZone?: string) {
  const date = toDate(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone })
}

/** "Good morning" (5–11), "Good afternoon" (12–17), otherwise "Good evening", by local hour. */
export function greetingFor(now: Date, timeZone?: string) {
  const hour = Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone }).format(now))
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 18) return 'Good afternoon'
  return 'Good evening'
}
