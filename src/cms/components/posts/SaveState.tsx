'use client'

import { relativeTime } from './schedule-time'

export type SaveStatus = 'new' | 'saving' | 'saved' | 'dirty' | 'error'

/** The top bar's save indicator. Each state swap fades/slides in (.cms-fade-up) and is announced politely. */
export default function SaveState({ status, savedAt, now, error, onRetry }: { status: SaveStatus; savedAt: Date | null; now: Date | null; error?: string; onRetry?: () => void }) {
  let content: React.ReactNode
  if (status === 'saving') content = <><span aria-hidden className="cms-spin size-[11px] rounded-full border-2 border-[var(--border-strong)] border-t-primary" />Saving…</>
  else if (status === 'error') content = <><span aria-hidden className="size-1.5 rounded-full bg-destructive" /><span className="text-destructive" title={error}>Couldn’t save</span>{onRetry && <>·<button type="button" onClick={onRetry} className="cms-press rounded px-1 font-medium text-foreground underline underline-offset-2 hover:text-primary">Retry</button></>}</>
  else if (status === 'dirty') content = <><span aria-hidden className="size-1.5 rounded-full bg-[var(--status-scheduled)]" />Unsaved changes</>
  else if (status === 'saved' && savedAt) content = <><span aria-hidden className="size-1.5 rounded-full bg-[var(--status-published)]" />Saved · {now ? relativeTime(savedAt, now) : 'just now'}</>
  else content = <>Not saved yet</>
  return <span role="status" aria-live="polite" className="inline-flex min-w-0 items-center">
    <span key={status} className="cms-fade-up inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground">{content}</span>
  </span>
}
