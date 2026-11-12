'use client'

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { buildSlashSections, type SlashItem } from '../extensions/slash-items'

export interface SlashMenuProps {
  items: SlashItem[]
  query: string
  recent: string[]
  command: (item: SlashItem) => void
}
export interface SlashMenuHandle { onKeyDown: (event: KeyboardEvent) => boolean }

/** The "/" block picker (Menus A): grouped items, icon tile, description and markdown shortcut. */
export const SlashMenu = forwardRef<SlashMenuHandle, SlashMenuProps>(function SlashMenu({ items, query, recent, command }, ref) {
  const sections = useMemo(() => buildSlashSections(items, query, recent), [items, query, recent])
  const flat = useMemo(() => sections.flatMap((section) => section.items), [sections])
  const [active, setActive] = useState(0)
  const [previousQuery, setPreviousQuery] = useState(query)
  const listRef = useRef<HTMLDivElement>(null)
  // A new query starts again from the best match.
  if (previousQuery !== query) {
    setPreviousQuery(query)
    setActive(0)
  }
  const index = flat.length ? Math.min(active, flat.length - 1) : -1

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [index])

  useImperativeHandle(ref, () => ({
    onKeyDown(event) {
      if (!flat.length) return false
      if (event.key === 'ArrowDown' || (event.key === 'Tab' && !event.shiftKey)) {
        setActive((index + 1) % flat.length)
        return true
      }
      if (event.key === 'ArrowUp' || (event.key === 'Tab' && event.shiftKey)) {
        setActive((index - 1 + flat.length) % flat.length)
        return true
      }
      if (event.key === 'Enter') {
        command(flat[index])
        return true
      }
      return false
    },
  }), [command, flat, index])

  let position = -1
  return (
    <div className="cms-slash-menu w-[340px] overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-[0_16px_40px_rgb(var(--shadow)/0.12),0_2px_6px_rgb(var(--shadow)/0.06)]">
      <div ref={listRef} role="listbox" aria-label="Insert a block" id="cms-slash-listbox" className="max-h-[min(380px,calc(100vh-96px))] overflow-y-auto overscroll-contain px-1.5 py-1">
        {flat.length === 0 && <p className="px-2 py-3 text-sm text-muted-foreground">No matching blocks</p>}
        {sections.map((section) => (
          <div key={section.label} role="group" aria-label={section.label}>
            <div className="px-2 pt-2.5 pb-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground/80" aria-hidden="true">{section.label}</div>
            {section.items.map((item) => {
              position += 1
              const itemIndex = position
              const selected = itemIndex === index
              const Tile = item.tile
              return (
                <button
                  key={`${section.label}-${item.id}`}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  tabIndex={-1}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseMove={() => { if (!selected) setActive(itemIndex) }}
                  onClick={() => command(item)}
                  className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors duration-[var(--dur-fast)] ${selected ? 'bg-accent shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_22%,transparent)]' : ''}`}
                >
                  <span className="grid size-10 flex-none place-items-center rounded-lg border bg-background text-sm font-semibold text-secondary-foreground">
                    {typeof Tile === 'string' ? Tile : <Tile className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{item.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{item.description}</span>
                  </span>
                  {item.shortcut && <span className="ml-2 flex-none font-mono text-[11px] text-muted-foreground/80" aria-label={`Shortcut ${item.shortcut}`}>{item.shortcut}</span>}
                </button>
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 border-t bg-muted/60 px-3 py-2 text-[11.5px] text-muted-foreground" aria-hidden="true">
        <span><kbd className="cms-kbd">↑</kbd> <kbd className="cms-kbd">↓</kbd> move</span>
        <span><kbd className="cms-kbd">↵</kbd> insert</span>
        <span><kbd className="cms-kbd">esc</kbd> close</span>
      </div>
    </div>
  )
})
