'use client'

import { Check, FileArchive, FileAudio, FileText, FileVideo, Maximize2, Type } from 'lucide-react'
import { cn } from '@/cms/lib/utils'
import { isCmsMediaUrl } from './reference-values'
import type { MediaItem } from './types'
import { formatBytes, isImage, typeLabel } from './upload-limits'

/** Icon tile for files that have no thumbnail. */
export function FileTypeIcon({ item, className }: { item: Pick<MediaItem, 'mimeType' | 'filename'>; className?: string }) {
  const Icon = item.mimeType.startsWith('video/') ? FileVideo
    : item.mimeType.startsWith('audio/') ? FileAudio
      : item.mimeType.startsWith('font/') ? Type
        : item.mimeType.includes('zip') ? FileArchive
          : FileText
  return <span className={cn('flex size-full flex-col items-center justify-center gap-1.5 text-muted-foreground', className)}>
    <Icon className="size-8" strokeWidth={1.5} aria-hidden="true" />
    <span className="text-[11px] font-semibold tracking-wide">{typeLabel(item)}</span>
  </span>
}

export function MediaThumb({ item, className }: { item: MediaItem; className?: string }) {
  return isImage(item) && isCmsMediaUrl(item.url)
    // eslint-disable-next-line @next/next/no-img-element -- /cms files are served as-is
    ? <img src={item.url} alt="" loading="lazy" decoding="async" className={cn('size-full object-cover', className)} />
    : <FileTypeIcon item={item} className={className} />
}

type TileProps = {
  item: MediaItem
  /** Replaces the details line (the picker shows its own). */
  meta?: React.ReactNode
  /** Posts using the file: shows the In use / Unused chip (undefined while unknown). */
  usage?: number
  selected?: boolean
  /** Shows a round check in the corner (multi-select and bulk selection). */
  checkable?: boolean
  fresh?: boolean
  onClick: () => void
}

const added = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

/** "Added Nov 12, 2026 · 1600×900 · 240 KB" */
export function tileDetails(item: MediaItem) {
  const dims = item.width && item.height ? `${item.width}×${item.height}` : isImage(item) ? null : typeLabel(item)
  return [`Added ${added(item.createdAt)}`, dims, formatBytes(item.size)].filter(Boolean).join(' · ')
}

function UsageChip({ usage }: { usage: number }) {
  return usage > 0
    ? <span className="inline-flex flex-none items-center gap-1.5 rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground"><span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />In use{usage > 1 ? ` · ${usage}` : ''}<span className="sr-only">{` in ${usage} ${usage === 1 ? 'post' : 'posts'}`}</span></span>
    : <span className="inline-flex flex-none items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">Unused</span>
}

/** Grid tile: 4:3 thumbnail, then the name with its In use chip, then when it was added and its size. Enter or click opens it. */
export function MediaTile({ item, meta, usage, selected = false, checkable = false, fresh = false, onClick }: TileProps) {
  const missingAlt = isImage(item) && !item.alt?.trim()
  return <button
    type="button"
    data-media-id={item.id}
    aria-pressed={checkable ? selected : undefined}
    aria-current={!checkable && selected ? 'true' : undefined}
    onClick={onClick}
    className={cn('group flex min-w-0 flex-col gap-2 rounded-[12px] text-left outline-offset-4', fresh && 'cms-fade-up')}
  >
    <span className={cn(
      'relative block aspect-[4/3] w-full overflow-hidden rounded-[10px] bg-muted transition-shadow duration-[var(--dur-fast)]',
      selected
        ? 'shadow-[0_0_0_2px_var(--background),0_0_0_4px_var(--primary)]'
        : 'shadow-[inset_0_0_0_1px_var(--border)] group-hover:shadow-[0_0_0_1px_var(--border-strong)]',
    )}>
      {/* Hover: the picture zooms a little inside its frame (the tile itself never moves or resizes), a soft veil and an "open" hint. */}
      <MediaThumb item={item} className="transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out)] group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-[var(--dur-fast)] group-hover:bg-black/[.06] dark:group-hover:bg-white/[.04]" />
      {missingAlt && <span className="absolute top-2 left-2 rounded-[5px] bg-[var(--warning-bg)] px-[7px] py-0.5 text-[11px] font-semibold text-[var(--warning-fg)]">No alt</span>}
      {checkable
        ? <span aria-hidden="true" className={cn(
          'absolute top-2 right-2 grid size-[22px] place-items-center rounded-full border-2 transition-colors duration-[var(--dur-fast)]',
          selected ? 'border-primary bg-primary text-primary-foreground' : 'border-white bg-black/20 text-transparent group-hover:bg-black/30',
        )}><Check className="size-3.5" strokeWidth={3} /></span>
        : <span aria-hidden="true" className="absolute right-2 bottom-2 grid size-7 place-items-center rounded-md bg-background/90 text-foreground opacity-0 shadow-[0_1px_3px_rgb(var(--shadow)/.15)] transition-opacity duration-[var(--dur-fast)] group-hover:opacity-100 group-focus-visible:opacity-100"><Maximize2 className="size-3.5" /></span>}
    </span>
    <span className="flex min-w-0 flex-col gap-1 px-0.5">
      <span className="flex min-w-0 items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground" title={item.filename}>{item.filename}</span>
        {usage !== undefined && <UsageChip usage={usage} />}
      </span>
      <span className="block truncate text-xs text-muted-foreground tabular-nums">{meta ?? tileDetails(item)}</span>
    </span>
  </button>
}

export function MediaTileSkeleton() {
  return <div aria-hidden="true" className="flex flex-col gap-2">
    <span className="cms-skeleton block aspect-[4/3] w-full rounded-[10px]" />
    <span className="cms-skeleton block h-3 w-4/5" />
    <span className="cms-skeleton block h-2.5 w-1/2" />
  </div>
}

/** The library's grid: tiles keep one size (260 px) whatever the width; opening the detail panel changes how many fit
 *  in a row, never their size. Two flexible columns on narrow screens. */
export const LIBRARY_GRID_CLASS = 'grid grid-cols-2 gap-x-4 gap-y-6 @[600px]:grid-cols-[repeat(auto-fill,260px)] @[600px]:gap-x-5 @[600px]:max-w-[1380px]'

/** The picker's grid (a dialog of fixed width): at most 5 per row, columns follow its width. */
export const GRID_CLASS = 'grid grid-cols-2 gap-x-4 gap-y-5 @[600px]:grid-cols-3 @[820px]:grid-cols-4 @[1040px]:grid-cols-5'
