'use client'

import { useState } from 'react'
import { ArrowLeft, Eye, X } from 'lucide-react'
import { Button } from '@/cms/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/cms/components/ui/dialog'
import { cn } from '@/cms/lib/utils'
import SchedulePicker from './SchedulePicker'
import type { CheckKey, PublishCheck } from './publish-checks'

type Visibility = 'PUBLIC' | 'UNLISTED'
export type PublishKind = 'publish' | 'reschedule' | 'date'
export const SITE_HOST = 'near.org'

/** A filled circle whose tick draws in (.cms-check). */
export function CheckBadge({ size = 20 }: { size?: number }) {
  return <span aria-hidden className="grid flex-none place-items-center rounded-full bg-primary text-primary-foreground" style={{ width: size, height: size }}>
    <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round"><path className="cms-check" pathLength={1} d="M20 6 9 17l-5-5" /></svg>
  </span>
}
const WarnBadge = () => <span aria-hidden className="grid size-5 flex-none place-items-center rounded-full bg-[var(--warning-bg)] text-xs font-bold text-[var(--warning-fg)]">!</span>

export default function PublishDialog({ open, onOpenChange, kind, initialMode, checks, preview, visibility, onVisibilityChange, publishedAt, busy, dirty, previewHref, onPublishNow, onSchedule, onFix, onCloseAutoFocus, error }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  kind: PublishKind
  initialMode: 'checklist' | 'schedule'
  checks: PublishCheck[]
  preview: { title: string; description: string; image: string | null; slug: string }
  visibility: Visibility
  onVisibilityChange: (value: Visibility) => void
  publishedAt: string | null
  busy: boolean
  dirty: boolean
  previewHref: string | null
  /** Resolve with the success message, or null when it failed (the editor shows the error). */
  onPublishNow: () => Promise<string | null>
  onSchedule: (iso: string) => Promise<string | null>
  onFix: (key: CheckKey) => void
  /** Lets the editor move focus to a field instead of back to the Publish button. */
  onCloseAutoFocus?: (event: Event) => void
  /** The last save error, shown inside the dialog (the editor's banner is behind the overlay). */
  error?: string
}) {
  const [mode, setMode] = useState<'checklist' | 'schedule' | 'done'>(initialMode)
  const [done, setDone] = useState<{ title: string; detail: string } | null>(null)
  const passed = checks.filter((check) => check.ok).length
  const url = `${SITE_HOST}/blog/${preview.slug || '…'}`
  async function finish(run: Promise<string | null>, title: string) {
    const message = await run
    if (message) { setDone({ title, detail: message })
      setMode('done') }
  }
  const scheduleTitle = kind === 'date' ? 'Change publish date' : kind === 'reschedule' ? 'Reschedule post' : 'Schedule post'
  const wide = mode === 'checklist'

  return <Dialog open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next) }}>
    <DialogContent showCloseButton={false} className={cn('cms-pop block max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-2xl border-0 p-0 shadow-[0_32px_80px_rgba(0,0,0,.25)] [--origin:center]', wide ? 'sm:max-w-[960px]' : 'sm:max-w-[440px]')}
      onCloseAutoFocus={onCloseAutoFocus}>
      {mode === 'done' && done ? <div key="done" className="cms-fade-up flex flex-col items-center gap-3 px-8 py-10 text-center">
        <CheckBadge size={48} />
        <DialogTitle className="mt-2 text-xl font-semibold">{done.title}</DialogTitle>
        <DialogDescription className="max-w-sm text-[13px]">{done.detail}</DialogDescription>
        <div className="mt-3 flex gap-2">
          {previewHref && <Button variant="outline" className="cms-press" asChild><a href={previewHref} target="_blank" rel="noreferrer"><Eye />Open preview</a></Button>}
          <DialogClose asChild><Button className="cms-press">Done</Button></DialogClose>
        </div>
      </div> : <>
        <div className="flex items-center gap-3 border-b border-[var(--border-soft)] px-7 pb-4 pt-[22px]">
          {mode === 'schedule' && kind === 'publish' && <Button type="button" variant="ghost" size="icon-sm" className="cms-press -ml-2" aria-label="Back to the checklist" onClick={() => setMode('checklist')}><ArrowLeft /></Button>}
          <div className="min-w-0">
            <DialogTitle className="text-xl font-semibold leading-tight">{mode === 'checklist' ? 'Ready to publish?' : scheduleTitle}</DialogTitle>
            <DialogDescription className="mt-1 text-[13px]">
              {mode === 'checklist'
                ? passed === checks.length ? `All ${checks.length} checks passed.` : `${passed} of ${checks.length} checks passed. You can publish anyway; the warnings are optional.`
                : kind === 'date' ? 'The date shown on the post. Past dates keep it live; a future date takes it offline until then.' : 'It goes live on its own at this time.'}
            </DialogDescription>
          </div>
          <span className="grow" />
          <DialogClose asChild><Button type="button" variant="ghost" size="icon-sm" className="cms-press text-muted-foreground" aria-label="Close" disabled={busy}><X /></Button></DialogClose>
        </div>

        {error && <p role="alert" className="cms-fade-up mx-7 mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive">{error}</p>}
        {mode === 'checklist' ? <div key="checklist" className="cms-fade-up">
          <div className="grid md:grid-cols-2">
            <section aria-label="Checks" className="px-7 pb-5 pt-2">
              <ul>{checks.map((check) => <li key={check.key} className="flex items-start gap-3 border-b border-[var(--border-soft)] py-3 last:border-b-0">
                {check.ok ? <CheckBadge /> : <WarnBadge />}
                <div className="min-w-0 flex-1"><p className="text-sm font-medium">{check.title}<span className="sr-only">{check.ok ? ' (passed)' : ' (warning)'}</span></p><p className="mt-0.5 text-[12.5px] text-muted-foreground">{check.detail}</p></div>
                {!check.ok && check.action && <button type="button" onClick={() => onFix(check.key)} className="cms-press rounded px-1 text-[13px] font-medium text-primary hover:text-accent-foreground hover:underline">{check.action}</button>}
              </li>)}</ul>
            </section>
            <section aria-label="Previews" className="flex flex-col gap-5 border-t border-[var(--border-soft)] bg-sidebar px-7 py-5 md:border-l md:border-t-0">
              <div>
                <p className="mb-2.5 text-xs font-semibold tracking-[.05em] text-[var(--muted-foreground)]">GOOGLE</p>
                <p className="text-xs text-[var(--text-secondary)]">{SITE_HOST} › blog</p>
                <p className="my-0.5 line-clamp-2 text-lg leading-snug text-[var(--google-link)]">{preview.title || 'Untitled'}</p>
                <p className="line-clamp-3 text-[13px] leading-normal text-[var(--google-text)]">{preview.description || 'Add a summary so search engines show a description.'}</p>
              </div>
              <div>
                <p className="mb-2.5 text-xs font-semibold tracking-[.05em] text-[var(--muted-foreground)]">X / LINKEDIN</p>
                <div className="overflow-hidden rounded-xl border border-input bg-background">
                  {preview.image ? <img src={preview.image} alt="" className="aspect-[1200/630] w-full object-cover" /> : <div className="grid h-[150px] place-items-center bg-[repeating-linear-gradient(135deg,#f4f4f1_0_12px,#efefec_12px_24px)] text-xs text-[var(--muted-foreground)]">No cover · add one for a richer card</div>}
                  <div className="px-3 py-2.5"><p className="text-xs text-muted-foreground">{SITE_HOST}</p><p className="line-clamp-2 text-sm font-semibold">{preview.title || 'Untitled'}</p></div>
                </div>
              </div>
            </section>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 border-t border-[var(--border-soft)] px-7 py-3.5">
            <label className="flex min-w-0 items-center gap-1.5 text-[13px] text-muted-foreground">
              <span className="sr-only">Visibility</span>
              <select value={visibility} onChange={(event) => onVisibilityChange(event.target.value as Visibility)} className="h-7 rounded-md border border-transparent bg-transparent px-1 text-[13px] font-medium text-foreground hover:border-input focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20">
                <option value="PUBLIC">Public</option><option value="UNLISTED">Unlisted</option>
              </select>
              <span className="truncate">· {url}</span>
            </label>
            <span className="grow" />
            <Button type="button" variant="outline" className="cms-press" disabled={busy} onClick={() => setMode('schedule')}>Schedule…</Button>
            <Button type="button" className="cms-press" disabled={busy} onClick={() => void finish(onPublishNow(), 'Your post is live')}>
              {busy ? <><span aria-hidden className="cms-spin size-3 rounded-full border-2 border-white/40 border-t-white" />Publishing…</> : 'Publish now'}
            </Button>
          </div>
        </div> : <div key="schedule" className="cms-fade-up px-7 pb-6 pt-4">
          {kind === 'publish' && <div role="radiogroup" aria-label="When" className="mb-4 flex gap-1 rounded-[9px] bg-[var(--muted)] p-[3px]">
            <button type="button" role="radio" aria-checked={false} onClick={() => setMode('checklist')} className="cms-press h-[30px] flex-1 rounded-[7px] text-[13px] font-medium text-muted-foreground hover:text-foreground">Publish now</button>
            <button type="button" role="radio" aria-checked className="h-[30px] flex-1 rounded-[7px] bg-background text-[13px] font-medium shadow-[0_1px_2px_rgba(0,0,0,.08)]">Schedule</button>
          </div>}
          {kind === 'reschedule' && <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2 text-[13px]"><span className="text-muted-foreground">Or skip the wait</span><Button type="button" size="sm" variant="outline" className="cms-press" disabled={busy} onClick={() => void finish(onPublishNow(), 'Your post is live')}>Publish now</Button></div>}
          <SchedulePicker initial={publishedAt} allowPast={kind === 'date'} visibility={visibility} onVisibilityChange={onVisibilityChange} busy={busy}
            submitPrefix={kind === 'date' ? 'Set date to' : 'Schedule for'} onSubmit={(iso) => void finish(onSchedule(iso), kind === 'date' ? 'Publish date updated' : 'Post scheduled')} />
          {dirty && kind !== 'publish' && <p className="mt-3 text-xs text-muted-foreground">This also saves your unsaved changes to the post.</p>}
        </div>}
      </>}
    </DialogContent>
  </Dialog>
}
