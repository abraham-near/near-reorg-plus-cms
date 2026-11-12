'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Editor } from '@tiptap/react'
import { ArrowDown, ArrowUp, Check, ChevronRight, Copy, Repeat2, Trash2 } from 'lucide-react'
import { BLOCK_KINDS, blockKind, blockLabel, canTurnInto, deleteBlock, duplicateBlock, moveBlock, turnBlockInto } from '../extensions/block-actions'

export interface BlockMenuProps {
  editor: Editor
  pos: number
  anchor: DOMRect
  onClose: () => void
}

const MENU_WIDTH = 248
const SUBMENU_WIDTH = 208

/** Fixed position next to an anchor, flipped/clamped so the menu stays in the viewport. */
function placeMenu(anchor: DOMRect, width: number, height: number) {
  const margin = 8
  let left = anchor.left
  let top = anchor.bottom + 6
  let origin = 'top left'
  if (top + height > window.innerHeight - margin) {
    top = Math.max(margin, anchor.top - height - 6)
    origin = 'bottom left'
  }
  left = Math.max(margin, Math.min(left, window.innerWidth - width - margin))
  return { left, top, origin }
}

/** The ⠿ menu (MenuBlock): Turn into ▸, Duplicate, Move up / down, Delete. */
export function BlockMenu({ editor, pos, anchor, onClose }: BlockMenuProps) {
  const node = editor.state.doc.nodeAt(pos)
  const menuRef = useRef<HTMLDivElement>(null)
  const subRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ left: number; top: number; origin: string } | null>(null)
  const [subOpen, setSubOpen] = useState(false)
  const [subPosition, setSubPosition] = useState<{ left: number; top: number } | null>(null)
  const turnRef = useRef<HTMLButtonElement>(null)

  useLayoutEffect(() => {
    const height = menuRef.current?.offsetHeight ?? 240
    setPosition(placeMenu(anchor, MENU_WIDTH, height))
  }, [anchor])
  useLayoutEffect(() => {
    if (!subOpen || !turnRef.current) return
    const rect = turnRef.current.getBoundingClientRect()
    const height = subRef.current?.offsetHeight ?? 300
    const fitsRight = rect.right + 6 + SUBMENU_WIDTH < window.innerWidth - 8
    setSubPosition({
      left: fitsRight ? rect.right + 6 : rect.left - SUBMENU_WIDTH - 6,
      top: Math.max(8, Math.min(rect.top - 6, window.innerHeight - height - 8)),
    })
  }, [subOpen])
  useEffect(() => {
    menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
  }, [])
  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node
      if (menuRef.current?.contains(target) || subRef.current?.contains(target)) return
      onClose()
    }
    const onScroll = (event: Event) => {
      if (menuRef.current?.contains(event.target as Node) || subRef.current?.contains(event.target as Node)) return
      onClose()
    }
    document.addEventListener('pointerdown', onPointer, true)
    document.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onClose)
    return () => {
      document.removeEventListener('pointerdown', onPointer, true)
      document.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onClose)
    }
  }, [onClose])

  if (!node) return null
  const kind = blockKind(node)
  const run = (action: () => void) => () => {
    action()
    onClose()
    editor.commands.focus()
  }
  const close = () => {
    onClose()
    editor.commands.focus()
  }
  const roving = (event: React.KeyboardEvent<HTMLDivElement>, selector: string) => {
    const items = [...event.currentTarget.querySelectorAll<HTMLButtonElement>(selector)]
    const index = items.indexOf(document.activeElement as HTMLButtonElement)
    if (event.key === 'ArrowDown') { event.preventDefault()
      items[(index + 1) % items.length]?.focus() }
    else if (event.key === 'ArrowUp') { event.preventDefault()
      items[(index - 1 + items.length) % items.length]?.focus() }
    else if (event.key === 'Escape') { event.preventDefault()
      event.stopPropagation()
      close() }
  }
  const portal = document.querySelector('.admin-wrapper') ?? document.body
  const last = editor.state.doc.childCount - 1
  const index = editor.state.doc.resolve(pos).index(0)

  return createPortal(<>
    <div ref={menuRef} role="menu" aria-label="Block actions" data-cms-floating=""
      className="cms-menu cms-pop fixed z-50" style={{ width: MENU_WIDTH, left: position?.left ?? -9999, top: position?.top ?? -9999, '--origin': position?.origin ?? 'top left' } as React.CSSProperties}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight' && document.activeElement === turnRef.current) { event.preventDefault()
          setSubOpen(true)
          requestAnimationFrame(() => subRef.current?.querySelector<HTMLButtonElement>('[aria-checked="true"], [role="menuitemradio"]')?.focus())
          return }
        roving(event, ':scope > [role="menuitem"]')
      }}>
      <div className="px-2.5 pt-1 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground/80" aria-hidden="true">{blockLabel(node)}</div>
      {canTurnInto(node) && (
        <button ref={turnRef} type="button" role="menuitem" aria-haspopup="menu" aria-expanded={subOpen} className="cms-menu-item" data-open={subOpen || undefined}
          onMouseEnter={() => setSubOpen(true)} onClick={() => setSubOpen((open) => !open)}>
          <Repeat2 className="size-4" aria-hidden="true" />Turn into<ChevronRight className="ml-auto size-4 text-muted-foreground" aria-hidden="true" />
        </button>
      )}
      <button type="button" role="menuitem" className="cms-menu-item" onMouseEnter={() => setSubOpen(false)} onClick={run(() => duplicateBlock(editor, pos))}>
        <Copy className="size-4" aria-hidden="true" />Duplicate<span className="cms-menu-shortcut">⌘D</span>
      </button>
      <button type="button" role="menuitem" className="cms-menu-item" disabled={index === 0} onMouseEnter={() => setSubOpen(false)} onClick={run(() => moveBlock(editor, pos, -1))}>
        <ArrowUp className="size-4" aria-hidden="true" />Move up<span className="cms-menu-shortcut">⌘⇧↑</span>
      </button>
      <button type="button" role="menuitem" className="cms-menu-item" disabled={index === last} onMouseEnter={() => setSubOpen(false)} onClick={run(() => moveBlock(editor, pos, 1))}>
        <ArrowDown className="size-4" aria-hidden="true" />Move down<span className="cms-menu-shortcut">⌘⇧↓</span>
      </button>
      <div className="cms-menu-separator" role="separator" />
      <button type="button" role="menuitem" className="cms-menu-item text-destructive" onMouseEnter={() => setSubOpen(false)} onClick={run(() => deleteBlock(editor, pos))}>
        <Trash2 className="size-4" aria-hidden="true" />Delete<span className="cms-menu-shortcut opacity-70">del</span>
      </button>
    </div>
    {subOpen && canTurnInto(node) && (
      <div ref={subRef} role="menu" aria-label="Turn into" data-cms-floating="" className="cms-menu cms-pop fixed z-50"
        style={{ width: SUBMENU_WIDTH, left: subPosition?.left ?? -9999, top: subPosition?.top ?? -9999, '--origin': 'top left' } as React.CSSProperties}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') { event.preventDefault()
            setSubOpen(false)
            turnRef.current?.focus()
            return }
          roving(event, '[role="menuitemradio"]')
        }}>
        {BLOCK_KINDS.map((item) => (
          <button key={item.kind} type="button" role="menuitemradio" aria-checked={kind === item.kind} className="cms-menu-item"
            onClick={run(() => turnBlockInto(editor, pos, item.kind))}>
            {item.label}{kind === item.kind && <Check className="ml-auto size-4 text-primary" aria-hidden="true" />}
          </button>
        ))}
      </div>
    )}
  </>, portal)
}
