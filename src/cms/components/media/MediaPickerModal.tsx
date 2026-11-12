'use client'

import { useCallback, useRef, useState } from 'react'
import { ImageIcon, Search, Upload, X } from 'lucide-react'
import { cn } from '@/cms/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/cms/components/ui/dialog'
import { Button } from '@/cms/components/ui/button'
import { DropOverlay, useFileDrag } from './DropOverlay'
import { MediaTile, MediaTileSkeleton } from './MediaTile'
import type { MediaItem } from './types'
import { UploadTray } from './UploadTray'
import { acceptAttribute, tileMeta, uploadLimitLines } from './upload-limits'
import { useMediaList } from './useMediaList'
import { useUploadQueue } from './useUploadQueue'

interface MediaPickerModalProps {
  open: boolean
  onClose: () => void
  onSelect: (url: string | string[]) => void
  multiSelect?: boolean
}

/**
 * Image picker with library search and drag-and-drop upload. `onSelect` receives `/cms/...` URLs.
 * The body mounts fresh on every open, so selection and upload queue always start empty.
 */
export default function MediaPickerModal(props: MediaPickerModalProps) {
  return props.open ? <MediaPickerBody {...props} /> : null
}

function MediaPickerBody({ open, onClose, onSelect, multiSelect = false }: MediaPickerModalProps) {
  const [q, setQ] = useState('')
  const list = useMediaList({ q, type: 'image' })
  const [selected, setSelected] = useState<string[]>([])
  const [fresh, setFresh] = useState<Set<string>>(() => new Set())
  const body = useRef<HTMLDivElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const { prepend } = list
  const onUploaded = useCallback((media: MediaItem) => {
    if (!media.mimeType.startsWith('image/')) return
    setFresh((current) => new Set(current).add(media.id))
    prepend(media)
    // A fresh upload is almost always the image the person wants.
    setSelected((current) => multiSelect ? (current.includes(media.url) ? current : [...current, media.url]) : [media.url])
  }, [prepend, multiSelect])
  const uploads = useUploadQueue({ imagesOnly: true, onUploaded })
  const drag = useFileDrag(uploads.add, { target: body })

  function toggle(url: string) {
    setSelected((current) => multiSelect
      ? current.includes(url) ? current.filter((u) => u !== url) : [...current, url]
      : current[0] === url ? [] : [url])
  }
  function confirm(urls = selected) {
    if (!urls.length) return
    onSelect(multiSelect ? urls : urls[0])
    onClose()
  }

  const [limits] = uploadLimitLines(true)
  return <Dialog open={open} onOpenChange={(value) => { if (!value) onClose() }}>
    <DialogContent className="flex h-[min(760px,88vh)] w-[min(1040px,calc(100vw-2rem))] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
      <div ref={body} className="relative flex min-h-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-3 border-b border-border py-4 pr-14 pl-6">
          <div className="mr-auto">
            <DialogTitle className="text-lg font-semibold">{multiSelect ? 'Choose images' : 'Insert image'}</DialogTitle>
            <DialogDescription className="mt-0.5 text-[13px]">Pick from the library, or drop new images anywhere here.</DialogDescription>
          </div>
          <label className="flex h-[34px] w-full items-center gap-2 rounded-lg border border-input bg-background px-2.5 text-[13px] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20 sm:w-[240px]">
            <Search className="size-4 flex-none text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">Search images</span>
            <input type="search" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search name or alt text" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground focus-visible:outline-none" />
            {q && <button type="button" aria-label="Clear search" onClick={() => setQ('')} className="text-muted-foreground hover:text-foreground"><X className="size-3.5" /></button>}
          </label>
          <Button type="button" variant="outline" className="h-[34px]" onClick={() => fileInput.current?.click()}><Upload />Upload</Button>
          <input ref={fileInput} type="file" multiple hidden accept={acceptAttribute(true)} onChange={(event) => { uploads.add(Array.from(event.target.files ?? [])); event.target.value = '' }} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {list.error
            ? <div role="alert" className="rounded-xl border border-destructive/40 p-4 text-[13px]"><p>{list.error}</p><Button className="mt-3" size="sm" variant="outline" onClick={() => void list.reload()}>Retry</Button></div>
            : list.loading && !list.items.length
              ? <div className={PICKER_GRID} role="status" aria-label="Loading images">{Array.from({ length: 10 }, (_, i) => <MediaTileSkeleton key={i} />)}</div>
              : !list.items.length
                ? <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-10 text-center">
                  <span className="grid size-12 place-items-center rounded-2xl bg-accent text-accent-foreground"><ImageIcon className="size-5" aria-hidden="true" /></span>
                  <p className="mt-3 font-semibold">{q ? 'No images match' : 'No images yet'}</p>
                  <p className="mt-1 text-[13px] text-muted-foreground">{q ? 'Try another name or alt text.' : 'Drop images here, or upload them.'}</p>
                  {!q && <Button type="button" className="mt-4" size="sm" onClick={() => fileInput.current?.click()}><Upload />Upload images</Button>}
                  <p className="mt-3 text-xs text-muted-foreground">{limits}</p>
                </div>
                : <>
                  <div className={cn(PICKER_GRID, 'transition-opacity duration-[var(--dur-base)]', list.loading && 'opacity-60')} aria-busy={list.loading}>
                    {list.items.map((item) => <div key={item.id} onDoubleClick={() => { if (!multiSelect) confirm([item.url]) }}>
                      <MediaTile item={item} meta={tileMeta(item, undefined)} selected={selected.includes(item.url)} checkable={multiSelect} fresh={fresh.has(item.id)} onClick={() => toggle(item.url)} />
                    </div>)}
                    {list.loadingMore && Array.from({ length: 5 }, (_, i) => <MediaTileSkeleton key={`more-${i}`} />)}
                  </div>
                  {list.hasMore && <div className="mt-6 flex justify-center"><Button type="button" variant="outline" size="sm" disabled={list.loadingMore} onClick={list.loadMore}>{list.loadingMore ? 'Loading…' : 'Load more'}</Button></div>}
                </>}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-border px-6 py-3.5">
          <span className="mr-auto text-xs text-muted-foreground">{limits}</span>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="button" size="sm" disabled={!selected.length} onClick={() => confirm()}>
            {!multiSelect ? 'Insert image' : selected.length ? `Insert ${selected.length} ${selected.length === 1 ? 'image' : 'images'}` : 'Insert images'}
          </Button>
        </div>

        <DropOverlay state={drag} imagesOnly className="absolute inset-3" />
        <UploadTray rows={uploads.rows} onRetry={uploads.retry} onRemove={uploads.remove} onClear={uploads.clear} className="absolute right-5 bottom-[68px]" />
      </div>
    </DialogContent>
  </Dialog>
}

const PICKER_GRID = 'grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4'
