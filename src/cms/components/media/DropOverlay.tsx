'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import { Upload } from 'lucide-react'
import { cn } from '@/cms/lib/utils'
import { uploadLimitLines } from './upload-limits'

type Box = { top: number; left: number; width: number; height: number }
export type DragState = { active: boolean; count: number; images: boolean; box: Box | null }
const IDLE: DragState = { active: false, count: 0, images: false, box: null }

const hasFiles = (event: DragEvent) => !!event.dataTransfer && Array.from(event.dataTransfer.types).includes('Files')

/**
 * Tracks files dragged over `target` (the whole window when omitted) and hands dropped files to
 * `onDrop`. Text or links dragged inside the page are ignored. With `anchorId`, the state carries that
 * element's box so a fixed overlay can cover just it (e.g. the main column, not the sidebar).
 */
export function useFileDrag(onDrop: (files: File[]) => void, { target, enabled = true, anchorId }: { target?: RefObject<HTMLElement | null>; enabled?: boolean; anchorId?: string } = {}) {
  const [state, setState] = useState<DragState>(IDLE)
  const drop = useRef(onDrop)
  useEffect(() => { drop.current = onDrop }, [onDrop])

  useEffect(() => {
    if (!enabled) return
    const node: HTMLElement | Window | null = target ? target.current : window
    if (!node) return
    let depth = 0
    const reset = () => { depth = 0; setState((current) => current.active ? { ...IDLE, box: current.box } : current) }
    const enter = (event: DragEvent) => {
      if (!hasFiles(event)) return
      event.preventDefault()
      depth++
      const items = Array.from(event.dataTransfer?.items ?? []).filter((item) => item.kind === 'file')
      const rect = anchorId ? document.getElementById(anchorId)?.getBoundingClientRect() : null
      const box = rect ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height } : null
      setState({ active: true, count: items.length, images: items.length > 0 && items.every((item) => item.type.startsWith('image/')), box })
    }
    const over = (event: DragEvent) => {
      if (!hasFiles(event)) return
      event.preventDefault()
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
    }
    const leave = (event: DragEvent) => {
      if (!hasFiles(event)) return
      depth = Math.max(0, depth - 1)
      if (depth === 0) reset()
    }
    const dropped = (event: DragEvent) => {
      if (!hasFiles(event)) return
      event.preventDefault()
      reset()
      const files = Array.from(event.dataTransfer?.files ?? [])
      if (files.length) drop.current(files)
    }
    const listeners = [['dragenter', enter], ['dragover', over], ['dragleave', leave], ['drop', dropped]] as const
    for (const [name, listener] of listeners) node.addEventListener(name, listener as EventListener)
    // A drag cancelled outside the target (Esc, dropped on another window) never fires drop here.
    window.addEventListener('dragend', reset)
    return () => {
      for (const [name, listener] of listeners) node.removeEventListener(name, listener as EventListener)
      window.removeEventListener('dragend', reset)
    }
  }, [enabled, target, anchorId])

  return state
}

/** Full-area "Drop to upload" overlay; fades in while files are dragged over. */
export function DropOverlay({ state, imagesOnly = false, className }: { state: DragState; imagesOnly?: boolean; className?: string }) {
  const noun = state.images || imagesOnly ? 'image' : 'file'
  const what = state.count > 0 ? `${state.count} ${noun}${state.count === 1 ? '' : 's'}` : `${noun}s`
  const [first, second] = uploadLimitLines(imagesOnly)
  const style = state.box ? { top: state.box.top + 12, left: state.box.left + 12, width: state.box.width - 24, height: state.box.height - 24 } : undefined
  return <div aria-hidden={!state.active} style={style} className={cn(
    'pointer-events-none z-40 flex flex-col items-center justify-center gap-2.5 rounded-[18px] border-2 border-dashed border-primary bg-[color-mix(in_oklab,var(--accent-soft)_90%,transparent)] p-6 text-center transition-[opacity,visibility] duration-[var(--dur-base)] ease-[var(--ease-out)]',
    state.active ? 'visible opacity-100' : 'invisible opacity-0',
    className,
  )}>
    <span className={cn('grid size-16 place-items-center rounded-[18px] bg-primary text-primary-foreground shadow-[0_12px_28px_rgb(10_123_80/.3)] transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out)]', state.active ? 'scale-100' : 'scale-90')}>
      <Upload className="size-7" strokeWidth={2} />
    </span>
    <b className="text-xl font-semibold text-accent-foreground">Drop to upload {what}</b>
    <span className="text-[13px] text-secondary-foreground">{first}</span>
    {second && <span className="text-xs text-muted-foreground">{second}</span>}
  </div>
}
