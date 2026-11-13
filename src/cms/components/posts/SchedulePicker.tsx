'use client'

import { useId, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/cms/components/ui/button'
import { cn } from '@/cms/lib/utils'
import { useNow } from '@/cms/lib/useStoredState'
import { addDays, browserTimeZone, formatScheduleLabel, formatUtcLine, monthCells, timeZones, utcToZoned, zoneCity, zoneLabel, zonedToUtc } from './schedule-time'

type Visibility = 'PUBLIC' | 'UNLISTED'
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const fieldClass = 'h-[34px] w-full rounded-lg border border-input bg-background px-2.5 text-[13px] text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20'

/** Month calendar + time + time zone + visibility. Emits the UTC instant (ISO) of the chosen wall-clock time. */
export default function SchedulePicker({ initial, allowPast = false, visibility, onVisibilityChange, busy, submitPrefix = 'Schedule for', onSubmit }: {
  initial: string | null
  allowPast?: boolean
  visibility: Visibility
  onVisibilityChange: (value: Visibility) => void
  busy?: boolean
  submitPrefix?: string
  onSubmit: (iso: string) => void
}) {
  const id = useId()
  const now = useNow(15_000)
  const [localZone] = useState(browserTimeZone)
  const [zone, setZone] = useState(localZone)
  const [start] = useState(() => {
    const now = new Date()
    const from = initial ? new Date(initial) : null
    if (from && !Number.isNaN(from.getTime()) && (allowPast || from > now)) return utcToZoned(from, localZone)
    return { date: addDays(utcToZoned(now, localZone).date, 1), time: '10:00' }
  })
  const [date, setDate] = useState(start.date)
  const [time, setTime] = useState(start.time)
  const [view, setView] = useState(() => ({ year: Number(start.date.slice(0, 4)), month: Number(start.date.slice(5, 7)) }))

  const instant = useMemo(() => /^\d{2}:\d{2}$/.test(time) ? zonedToUtc(date, time, zone) : null, [date, time, zone])
  const today = now ? utcToZoned(now, zone).date : ''
  const inPast = !instant || (!allowPast && (!now || instant.getTime() <= now.getTime() + 60_000))
  const zones = useMemo(() => {
    const at = instant ?? new Date(`${date}T12:00:00Z`)
    const groups = new Map<string, { value: string; label: string }[]>()
    for (const value of timeZones([localZone])) {
      const region = value.includes('/') ? value.split('/')[0] : 'Other'
      if (!groups.has(region)) groups.set(region, [])
      groups.get(region)!.push({ value, label: zoneLabel(value, at) })
    }
    return [...groups.entries()]
  }, [instant, date, localZone])
  const cells = monthCells(view.year, view.month)
  const monthName = new Date(Date.UTC(view.year, view.month - 1, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  const shift = (n: number) => setView(({ year, month }) => { const m = month - 1 + n
    return { year: year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 + 1 } })
  const others = instant && zone !== localZone ? ` · ${instant.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} your time (${zoneCity(localZone)})` : ''

  return <div className="space-y-4">
    <div>
      <div className="mb-2 flex items-center justify-between">
        <b className="text-sm font-semibold" id={`${id}-month`} aria-live="polite">{monthName}</b>
        <span className="flex gap-1">
          <Button type="button" variant="outline" size="icon-sm" className="cms-press size-[30px]" aria-label="Previous month" onClick={() => shift(-1)}><ChevronLeft /></Button>
          <Button type="button" variant="outline" size="icon-sm" className="cms-press size-[30px]" aria-label="Next month" onClick={() => shift(1)}><ChevronRight /></Button>
        </span>
      </div>
      <div role="group" aria-labelledby={`${id}-month`} className="grid grid-cols-7 justify-items-center gap-0.5">
        {WEEKDAYS.map((day) => <span key={day} aria-hidden className="w-9 text-center text-xs font-semibold text-muted-foreground">{day}</span>)}
        {cells.map((cell, index) => {
          if (!cell) return <span key={`blank-${index}`} aria-hidden className="h-8 w-9" />
          const selected = cell.date === date
          const disabled = !allowPast && cell.date < today
          const label = new Date(`${cell.date}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
          return <button key={cell.date} type="button" disabled={disabled} aria-pressed={selected} aria-current={cell.date === today ? 'date' : undefined} aria-label={label} onClick={() => setDate(cell.date)}
            className={cn('cms-press grid h-8 w-9 place-items-center rounded-lg text-[13px] text-secondary-foreground hover:bg-muted disabled:cursor-not-allowed disabled:text-[var(--text-subtle)] disabled:hover:bg-transparent',
              cell.date === today && !selected && 'font-semibold text-primary shadow-[inset_0_0_0_1px_#a7ebcd]',
              selected && 'bg-primary font-semibold text-primary-foreground hover:bg-primary')}>{cell.day}</button>
        })}
      </div>
    </div>

    <div className="flex gap-2">
      <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-[var(--text-secondary)]">Time<input type="time" required value={time} onChange={(event) => setTime(event.target.value)} className={fieldClass} /></label>
      <label className="flex flex-[1.4] flex-col gap-1 text-xs font-medium text-[var(--text-secondary)]">Time zone
        <select value={zone} onChange={(event) => setZone(event.target.value)} className={fieldClass}>
          {zones.map(([region, items]) => <optgroup key={region} label={region}>{items.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</optgroup>)}
        </select>
      </label>
    </div>
    {/* Every text that changes sits in its own keyed element (see the dateLabel note in PostForm.tsx). */}
    <p className="text-xs text-muted-foreground" aria-live="polite">{instant ? <span key="utc">= {formatUtcLine(instant)}{others}</span> : <span key="none">Enter a time</span>}{instant && inPast && !allowPast ? <span key="past" className="mt-1 block text-[var(--warning-fg)]">Choose a time in the future.</span> : null}</p>

    <fieldset className="flex flex-col gap-1.5">
      <legend className="sr-only">Visibility</legend>
      {([['PUBLIC', 'Public', 'Listed on the blog and in search'], ['UNLISTED', 'Unlisted', 'Only people with the link']] as const).map(([value, title, hint]) => (
        <label key={value} className={cn('flex cursor-pointer items-start gap-2.5 rounded-[9px] border p-2.5 transition-colors duration-[var(--dur-fast)] has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/20', visibility === value ? 'border-[var(--accent-border)] bg-[var(--accent-soft)]' : 'border-[var(--border)] hover:bg-muted/50')}>
          <input type="radio" name={`${id}-visibility`} value={value} checked={visibility === value} onChange={() => onVisibilityChange(value)} className="mt-0.5 accent-[var(--primary)]" />
          <span><b className="block text-[13px] font-semibold">{title}</b><span className="text-xs text-muted-foreground">{hint}</span></span>
        </label>
      ))}
    </fieldset>

    <Button type="button" className="cms-press h-10 w-full text-sm" disabled={busy || inPast || !instant} onClick={() => instant && onSubmit(instant.toISOString())}>
      {busy ? <span key="busy" className="inline-flex items-center gap-2"><span aria-hidden className="cms-spin size-3 rounded-full border-2 border-white/40 border-t-white" /><span>Saving…</span></span> : <span key="label">{instant ? `${submitPrefix} ${formatScheduleLabel(instant, zone)}` : submitPrefix}</span>}
    </Button>
  </div>
}
