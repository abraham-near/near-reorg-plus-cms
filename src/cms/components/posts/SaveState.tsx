'use client'

import { relativeTime } from './schedule-time'

export type SaveStatus = 'new' | 'saving' | 'saved' | 'dirty' | 'error'

/** The top bar's save indicator. Each state swap fades/slides in (.cms-fade-up) and is announced politely. */
export default function SaveState({ status, savedAt, now, error, onRetry }: { status: SaveStatus; savedAt: Date | null; now: Date | null; error?: string; onRetry?: () => void }) {
  let content: React.ReactNode
  if (status === 'saving') content = <><span aria-hidden className="cms-spin size-[11px] rounded-full border-2 border-[var(--border-strong)] border-t-primary" /><span>Saving…</span></>
  else if (status === 'error') content = <><span aria-hidden className="size-1.5 rounded-full bg-destructive" /><span className="text-destructive" title={error}>Couldn’t save</span>{onRetry && <span key="retry" className="inline-flex items-center gap-1.5"><span aria-hidden>·</span><button type="button" onClick={onRetry} className="cms-press rounded px-1 font-medium text-foreground underline underline-offset-2 hover:text-primary">Retry</button></span>}</>
  else if (status === 'dirty') content = <><span aria-hidden className="size-1.5 rounded-full bg-[var(--status-scheduled)]" /><span>Unsaved changes</span></>
  else if (status === 'saved' && savedAt) content = <><span aria-hidden className="size-1.5 rounded-full bg-[var(--status-published)]" /><span>Saved · {now ? relativeTime(savedAt, now) : 'just now'}</span></>
  else content = <span>Not saved yet</span>
  return <span role="status" aria-live="polite" className="inline-flex min-w-0 items-center">
    <span key={status} className="cms-fade-up inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground">{content}</span>
  </span>
}
