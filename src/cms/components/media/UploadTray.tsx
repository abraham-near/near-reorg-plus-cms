'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, FileText, X } from 'lucide-react'
import { cn } from '@/cms/lib/utils'
import type { UploadRow } from './useUploadQueue'
import { formatBytes } from './upload-limits'

type Props = {
  rows: UploadRow[]
  onRetry: (id: string) => void
  onRemove: (id: string) => void
  onClear: () => void
  /** Positioning: fixed to the viewport on the media page, absolute inside the picker. */
  className?: string
}

export function CheckMark({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={cn('size-4', className)} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path className="cms-check" pathLength={1} d="m5 12.5 4.5 4.5L19 7.5" /></svg>
}

/** Bottom-right list of uploads: progress, ✓, or the reason it failed with Retry. */
export function UploadTray({ rows, onRetry, onRemove, onClear, className }: Props) {
  const [minimized, setMinimized] = useState(false)
  if (!rows.length) return null
  const active = rows.filter((row) => row.status === 'queued' || row.status === 'uploading').length
  const finished = rows.filter((row) => row.status === 'done').length
  const failed = rows.filter((row) => row.status === 'error').length
  const title = active
    ? `Uploading ${Math.min(rows.length, finished + failed + 1)} of ${rows.length}`
    : failed
      ? `${finished} uploaded · ${failed} failed`
      : `${finished} ${finished === 1 ? 'file' : 'files'} uploaded`
  return <section aria-label="Uploads" className={cn('cms-pop z-40 w-[min(320px,calc(100vw-2rem))] rounded-[14px] border border-border bg-card px-4 py-3 text-card-foreground shadow-[0_16px_40px_rgb(15_15_15/.14)] [--origin:bottom_right]', className)}>
    <div className="flex items-center gap-2">
      <h2 className="flex-1 text-[13px] font-semibold" aria-live="polite">{title}</h2>
      <button type="button" onClick={() => setMinimized((value) => !value)} aria-expanded={!minimized} aria-label={minimized ? 'Show uploads' : 'Minimize uploads'} className="cms-press grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
        {minimized ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </button>
      {!active && <button type="button" onClick={onClear} aria-label="Close uploads" className="cms-press grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"><X className="size-4" /></button>}
    </div>
    {active > 0 && minimized && <Bar value={rows.reduce((sum, row) => sum + (row.status === 'done' || row.status === 'error' ? 1 : row.progress ?? 0), 0) / rows.length} className="mt-2" />}
    {!minimized && <ul className="mt-1 max-h-[min(320px,50vh)] overflow-y-auto">
      {rows.map((row) => <li key={row.id} className="cms-fade-up flex items-center gap-2.5 py-2 text-[13px]">
        <span className="grid size-[30px] flex-none place-items-center overflow-hidden rounded-md bg-muted text-muted-foreground">
          {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
          {row.preview ? <img src={row.preview} alt="" className="size-full object-cover" /> : <FileText className="size-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate" title={row.file.name}>{row.file.name}</span>
          {row.status === 'error'
            ? <span role="alert" className="mt-0.5 block text-xs text-destructive">{row.error}</span>
            : row.status === 'done'
              ? <span className="mt-0.5 block text-xs text-muted-foreground">{formatBytes(row.file.size)}</span>
              : <Bar value={row.status === 'queued' ? 0 : row.progress} className="mt-1.5" label={`Uploading ${row.file.name}`} />}
        </span>
        <span className="flex-none text-xs tabular-nums text-muted-foreground">
          {row.status === 'done' && <span className="text-primary"><CheckMark /><span className="sr-only">Uploaded</span></span>}
          {row.status === 'uploading' && (row.progress === null ? '…' : row.progress >= 1 ? 'Saving' : `${Math.round(row.progress * 100)}%`)}
          {row.status === 'queued' && 'Waiting'}
          {row.status === 'error' && <span className="flex items-center gap-1">
            {row.retryable !== false && <button type="button" onClick={() => onRetry(row.id)} className="cms-press h-[26px] rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground hover:bg-muted">Retry</button>}
            <button type="button" onClick={() => onRemove(row.id)} aria-label={`Dismiss ${row.file.name}`} className="grid size-[26px] place-items-center rounded-md hover:bg-muted hover:text-foreground"><X className="size-3.5" /></button>
          </span>}
        </span>
      </li>)}
    </ul>}
  </section>
}

/** Thin progress bar; null shows an indeterminate shimmer. */
function Bar({ value, className, label }: { value: number | null; className?: string; label?: string }) {
  const indeterminate = value === null || value >= 1
  return <span role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={indeterminate ? undefined : Math.round(value * 100)} className={cn('block h-1 overflow-hidden rounded-full bg-muted', className)}>
    {indeterminate
      ? <span className="cms-skeleton block h-full w-full rounded-full" style={{ backgroundImage: 'linear-gradient(90deg, var(--muted) 0%, var(--primary) 50%, var(--muted) 100%)' }} />
      : <span className="block h-full rounded-full bg-primary transition-[width] duration-[var(--dur-base)] ease-[var(--ease-out)]" style={{ width: `${Math.max(2, value * 100)}%` }} />}
  </span>
}
