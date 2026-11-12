// Time-zone helpers for the publish/schedule UI. Pure (Intl only), so they are unit-tested in
// tests/cms/post-publish.test.ts. The API stores publishedAt as a UTC instant; editors pick a wall-clock
// date and time in a zone of their choice, and every date shown in the editor is in the browser's zone.

type Parts = { year: number; month: number; day: number; hour: number; minute: number; second: number }

const partFormatters = new Map<string, Intl.DateTimeFormat>()
function partFormatter(timeZone: string) {
  let formatter = partFormatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    partFormatters.set(timeZone, formatter)
  }
  return formatter
}

function partsInZone(date: Date, timeZone: string): Parts {
  const parts: Record<string, number> = {}
  for (const part of partFormatter(timeZone).formatToParts(date)) if (part.type !== 'literal') parts[part.type] = Number(part.value)
  return { year: parts.year, month: parts.month, day: parts.day, hour: parts.hour % 24, minute: parts.minute, second: parts.second }
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Minutes the zone is ahead of UTC at that instant (Mexico City: -360, Kolkata: 330). */
export function zoneOffsetMinutes(date: Date, timeZone: string): number {
  const p = partsInZone(date, timeZone)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60_000)
}

/** The UTC instant for a wall-clock date ("2026-11-13") and time ("10:00") in a time zone. */
export function zonedToUtc(date: string, time: string, timeZone: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const guess = Date.UTC(year, month - 1, day, hour, minute)
  const first = guess - zoneOffsetMinutes(new Date(guess), timeZone) * 60_000
  // Around a DST change the offset at the guess and at the result can differ: use the result's.
  const second = guess - zoneOffsetMinutes(new Date(first), timeZone) * 60_000
  return new Date(second)
}

/** Wall-clock date ("YYYY-MM-DD") and time ("HH:MM") of an instant in a time zone. */
export function utcToZoned(date: Date, timeZone: string): { date: string; time: string } {
  const p = partsInZone(date, timeZone)
  return { date: `${p.year}-${pad(p.month)}-${pad(p.day)}`, time: `${pad(p.hour)}:${pad(p.minute)}` }
}

/** "UTC−6", "UTC+5:30", "UTC" (with a real minus sign). */
export function formatOffset(minutes: number): string {
  if (minutes === 0) return 'UTC'
  const sign = minutes < 0 ? '−' : '+'
  const abs = Math.abs(minutes)
  return `UTC${sign}${Math.floor(abs / 60)}${abs % 60 ? `:${pad(abs % 60)}` : ''}`
}

/** "America/Mexico_City" → "Mexico City". */
export const zoneCity = (timeZone: string) => (timeZone.split('/').pop() ?? timeZone).replace(/_/g, ' ')

/** "Mexico City (UTC−6)" for the offset in effect at `at`. */
export const zoneLabel = (timeZone: string, at: Date) => `${zoneCity(timeZone)} (${formatOffset(zoneOffsetMinutes(at, timeZone))})`

/** "Fri, Nov 13 · 10:00 AM" in the given zone. */
export function formatScheduleLabel(date: Date, timeZone: string): string {
  const day = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone })
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone })
  return `${day} · ${time}`
}

/** "Fri 16:00 UTC". */
export function formatUtcLine(date: Date): string {
  const day = date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })
  return `${day} ${utcToZoned(date, 'UTC').time} UTC`
}

/** "Nov 13, 2026 · 10:00 AM CST" in the given zone (default: the browser's). */
export function formatLocalDateTime(value: string | Date | null | undefined, timeZone?: string): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone })
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone })
  return `${day} · ${time}`
}

/** "just now", "5 min ago", "3 h ago", then a short local date. */
export function relativeTime(date: Date, now: Date): string {
  const seconds = Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000))
  if (seconds < 45) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** The browser's IANA zone ("UTC" when unknown). */
export function browserTimeZone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } catch { return 'UTC' }
}

/** Every IANA zone the runtime knows, always including `extra` (the browser zone) and UTC. */
export function timeZones(extra: string[] = []): string[] {
  let zones: string[] = []
  try { zones = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.('timeZone') ?? [] } catch { zones = [] }
  return [...new Set([...zones, ...extra, 'UTC'])].sort()
}

/** Calendar cells for a month (month is 1-12), weeks starting on Sunday: null for leading blanks. */
export function monthCells(year: number, month: number): Array<{ date: string; day: number } | null> {
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const cells: Array<{ date: string; day: number } | null> = Array.from({ length: first }, () => null)
  for (let day = 1; day <= days; day++) cells.push({ date: `${year}-${pad(month)}-${pad(day)}`, day })
  return cells
}

/** "YYYY-MM-DD" plus n days (calendar arithmetic, zone-free). */
export function addDays(date: string, n: number): string {
  const [year, month, day] = date.split('-').map(Number)
  const next = new Date(Date.UTC(year, month - 1, day + n))
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`
}
