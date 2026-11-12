import { Extension } from '@tiptap/core'
import { Plugin, PluginKey, NodeSelection, TextSelection } from '@tiptap/pm/state'
import { DOMSerializer } from '@tiptap/pm/model'
import type { EditorView } from '@tiptap/pm/view'

export interface BlockMenuRequest { pos: number; anchor: DOMRect }
/** Dispatched on the editor DOM when ⠿ is clicked (detail: BlockMenuRequest); BlockEditor shows the menu. */
export const BLOCK_MENU_EVENT = 'cms:block-menu'
export interface DragHandleStorage {
  /** While a block menu is open the handle stays on its block. */
  lockedPos: number | null
}

export const dragHandleKey = new PluginKey('dragHandle')

const PLUS = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>'
const GRIP = '<svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true"><circle cx="2" cy="2" r="1.5"/><circle cx="8" cy="2" r="1.5"/><circle cx="2" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="2" cy="14" r="1.5"/><circle cx="8" cy="14" r="1.5"/></svg>'
/** How far left of the text the handle sits (inside the page column's margin). */
const GUTTER = 50

function blockElement(view: EditorView, pos: number): HTMLElement | null {
  const dom = view.nodeDOM(pos)
  return dom instanceof HTMLElement ? dom : null
}

/** The top-level block nearest to a vertical coordinate. */
function blockAtY(view: EditorView, y: number): { pos: number; element: HTMLElement } | null {
  let best: { pos: number; element: HTMLElement; distance: number } | null = null
  let pos = 0
  for (let index = 0; index < view.state.doc.childCount; index++) {
    const node = view.state.doc.child(index)
    const element = blockElement(view, pos)
    if (element) {
      const rect = element.getBoundingClientRect()
      const distance = y < rect.top ? rect.top - y : y > rect.bottom ? y - rect.bottom : 0
      if (!best || distance < best.distance) best = { pos, element, distance }
      if (distance === 0 || rect.top > y) break
    }
    pos += node.nodeSize
  }
  return best && best.distance < 24 ? { pos: best.pos, element: best.element } : null
}

/**
 * Notion-style block handle: `+` and `⠿` in the left gutter of the hovered block, plus a subtle
 * hover background. Both live next to the editor (inside the page column), so they scroll with it.
 */
export const DragHandle = Extension.create<Record<string, never>, DragHandleStorage>({
  name: 'dragHandle',
  addStorage() { return { lockedPos: null } },
  addProseMirrorPlugins() {
    const editor = this.editor
    const storage = this.storage
    return [new Plugin({ key: dragHandleKey, view(view) {
      const parent = view.dom.parentElement
      if (!parent || typeof document === 'undefined') return {}
      let current: { pos: number; element: HTMLElement } | null = null
      let frame = 0
      let pointer = { x: 0, y: 0 }

      const hover = document.createElement('div')
      hover.className = 'cms-block-hover'
      hover.setAttribute('aria-hidden', 'true')
      const handle = document.createElement('div')
      handle.className = 'cms-block-handle'
      const add = document.createElement('button')
      add.type = 'button'
      add.className = 'cms-block-handle-add'
      add.innerHTML = PLUS
      add.title = 'Click to add a block below'
      add.setAttribute('aria-label', 'Add block below')
      const grip = document.createElement('button')
      grip.type = 'button'
      grip.draggable = true
      grip.className = 'cms-block-handle-grip'
      grip.innerHTML = GRIP
      grip.title = 'Drag to move · Click for options'
      grip.setAttribute('aria-label', 'Drag to move, or open block menu')
      grip.setAttribute('aria-haspopup', 'menu')
      handle.append(add, grip)
      parent.insertBefore(hover, view.dom)
      parent.append(handle)

      const hide = () => {
        if (storage.lockedPos !== null) return
        current = null
        handle.classList.remove('is-visible')
        hover.classList.remove('is-visible')
      }
      const place = (block: { pos: number; element: HTMLElement }) => {
        current = block
        const parentRect = parent.getBoundingClientRect()
        const rect = block.element.getBoundingClientRect()
        const style = getComputedStyle(block.element)
        const lineHeight = parseFloat(style.lineHeight) || 24
        const paddingTop = parseFloat(style.paddingTop) || 0
        const editorLeft = view.dom.getBoundingClientRect().left - parentRect.left
        const top = rect.top - parentRect.top + parent.scrollTop
        handle.style.transform = `translate(${editorLeft - GUTTER}px, ${top + paddingTop + Math.max(0, (Math.min(lineHeight, 40) - 24) / 2)}px)`
        Object.assign(hover.style, { left: `${rect.left - parentRect.left - 10}px`, top: `${top - 3}px`, width: `${rect.width + 20}px`, height: `${rect.height + 6}px` })
        handle.classList.add('is-visible')
        hover.classList.add('is-visible')
      }
      const update = () => {
        frame = 0
        if (!editor.isEditable || view.dragging) { hide()
          return }
        if (storage.lockedPos !== null) {
          const element = blockElement(view, storage.lockedPos)
          if (element) place({ pos: storage.lockedPos, element })
          return
        }
        const rect = view.dom.getBoundingClientRect()
        const { x, y } = pointer
        if (x < rect.left - GUTTER - 16 || x > rect.right + 24 || y < rect.top - 8 || y > rect.bottom + 8) { hide()
          return }
        const block = blockAtY(view, y)
        if (!block) { hide()
          return }
        place(block)
      }
      const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
      const onMove = (event: MouseEvent) => {
        pointer = { x: event.clientX, y: event.clientY }
        if (handle.contains(event.target as Node)) return
        schedule()
      }

      grip.addEventListener('mousedown', (event) => event.stopPropagation())
      grip.addEventListener('click', () => {
        if (!current || !editor.isEditable) return
        view.dom.dispatchEvent(new CustomEvent<BlockMenuRequest>(BLOCK_MENU_EVENT, { detail: { pos: current.pos, anchor: grip.getBoundingClientRect() } }))
      })
      grip.addEventListener('dragstart', (event) => {
        if (!current || !event.dataTransfer) return
        const selection = NodeSelection.create(view.state.doc, current.pos)
        view.dispatch(view.state.tr.setSelection(selection))
        const slice = selection.content()
        const fragment = DOMSerializer.fromSchema(view.state.schema).serializeFragment(slice.content)
        const container = document.createElement('div')
        container.append(fragment)
        event.dataTransfer.clearData()
        event.dataTransfer.setData('text/html', container.innerHTML)
        event.dataTransfer.setData('text/plain', container.textContent ?? '')
        event.dataTransfer.effectAllowed = 'move'
        // A tilted copy of the block follows the pointer (`.cms-dragging`); the original keeps its
        // node-selection outline until it lands.
        const ghost = document.createElement('div')
        ghost.className = 'cms-drag-ghost cms-dragging ProseMirror'
        ghost.style.width = `${current.element.getBoundingClientRect().width}px`
        ghost.append(current.element.cloneNode(true))
        document.body.append(ghost)
        event.dataTransfer.setDragImage(ghost, 16, 16)
        setTimeout(() => ghost.remove(), 0)
        view.dragging = { slice, move: true, node: selection } as unknown as typeof view.dragging
        handle.classList.remove('is-visible')
        hover.classList.remove('is-visible')
      })
      const onDragEnd = () => schedule()
      add.addEventListener('mousedown', (event) => event.preventDefault())
      add.addEventListener('click', () => {
        if (!current || !editor.isEditable) return
        const node = view.state.doc.nodeAt(current.pos)
        if (!node) return
        // An empty paragraph is reused; otherwise a new one goes below. "/" opens the block picker.
        if (node.type.name === 'paragraph' && node.content.size === 0) {
          const tr = view.state.tr.insertText('/', current.pos + 1)
          view.dispatch(tr.setSelection(TextSelection.create(tr.doc, current.pos + 2)))
        } else {
          const after = current.pos + node.nodeSize
          const paragraph = view.state.schema.nodes.paragraph.create(null, view.state.schema.text('/'))
          const tr = view.state.tr.insert(after, paragraph)
          view.dispatch(tr.setSelection(TextSelection.create(tr.doc, after + 2)).scrollIntoView())
        }
        view.focus()
      })
      const onScroll = () => { if (current) schedule() }
      document.addEventListener('mousemove', onMove, { passive: true })
      document.addEventListener('dragend', onDragEnd)
      document.addEventListener('drop', onDragEnd)
      document.addEventListener('scroll', onScroll, { capture: true, passive: true })
      view.dom.addEventListener('mouseleave', schedule)
      return {
        update() { if (current || storage.lockedPos !== null) schedule() },
        destroy() {
          cancelAnimationFrame(frame)
          handle.remove()
          hover.remove()
          document.removeEventListener('mousemove', onMove)
          document.removeEventListener('dragend', onDragEnd)
          document.removeEventListener('drop', onDragEnd)
          document.removeEventListener('scroll', onScroll, { capture: true })
          view.dom.removeEventListener('mouseleave', schedule)
        },
      }
    } })]
  },
})
