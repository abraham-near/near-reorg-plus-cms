'use client'

import { Check, FileArchive, FileAudio, FileText, FileVideo, Type } from 'lucide-react'
import { cn } from '@/cms/lib/utils'
import { isCmsMediaUrl } from './reference-values'
import type { MediaItem } from './types'
import { isImage, typeLabel } from './upload-limits'

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
  meta: React.ReactNode
  selected?: boolean
  /** Shows a round check in the corner (multi-select and bulk selection). */
  checkable?: boolean
  fresh?: boolean
  onClick: () => void
}

/** Grid tile: 4:3 thumbnail, file name and one line of context. Enter or click opens it. */
export function MediaTile({ item, meta, selected = false, checkable = false, fresh = false, onClick }: TileProps) {
  const missingAlt = isImage(item) && !item.alt?.trim()
  return <button
    type="button"
    data-media-id={item.id}
    aria-pressed={checkable ? selected : undefined}
    aria-current={!checkable && selected ? 'true' : undefined}
    onClick={onClick}
    className={cn('cms-lift group flex min-w-0 flex-col gap-1.5 rounded-[12px] text-left outline-offset-4', fresh && 'cms-fade-up')}
  >
    <span className={cn(
      'relative block aspect-[4/3] w-full overflow-hidden rounded-[10px] bg-muted transition-shadow duration-[var(--dur-fast)]',
      selected ? 'shadow-[0_0_0_2px_var(--background),0_0_0_4px_var(--primary)]' : 'shadow-[inset_0_0_0_1px_rgb(15_15_15/.04)]',
    )}>
      <MediaThumb item={item} />
      {missingAlt && <span className="absolute top-2 left-2 rounded-[5px] bg-[var(--warning-bg)] px-[7px] py-0.5 text-[11px] font-semibold text-[var(--warning-fg)]">No alt</span>}
      {checkable && <span aria-hidden="true" className={cn(
        'absolute top-2 right-2 grid size-[22px] place-items-center rounded-full border-2 transition-colors duration-[var(--dur-fast)]',
        selected ? 'border-primary bg-primary text-primary-foreground' : 'border-white bg-black/20 text-transparent group-hover:bg-black/30',
      )}><Check className="size-3.5" strokeWidth={3} /></span>}
    </span>
    <span className="block truncate text-[13px] text-secondary-foreground" title={item.filename}>{item.filename}</span>
    <span className="block truncate text-xs text-muted-foreground">{meta}</span>
  </button>
}

export function MediaTileSkeleton() {
  return <div aria-hidden="true" className="flex flex-col gap-1.5">
    <span className="cms-skeleton block aspect-[4/3] w-full rounded-[10px]" />
    <span className="cms-skeleton block h-3 w-4/5" />
    <span className="cms-skeleton block h-2.5 w-1/2" />
  </div>
}

export const GRID_CLASS = 'grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-[18px]'
