import { Extension } from '@tiptap/core'
import { Plugin, NodeSelection } from '@tiptap/pm/state'
import { DOMSerializer } from '@tiptap/pm/model'

export const DragHandle = Extension.create({
  name: 'dragHandle',
  addProseMirrorPlugins() {
    const editor = this.editor
    return [new Plugin({ view(view) {
      let position: number | null = null
      const wrapper = document.createElement('div')
      wrapper.className = 'fixed z-40 flex rounded border bg-popover text-popover-foreground'
      wrapper.style.display = 'none'
      const drag = document.createElement('button')
      drag.type = 'button'
      drag.draggable = true
      drag.textContent = '⠿'
      drag.className = 'px-1 py-1 cursor-grab'
      drag.setAttribute('aria-label', 'Drag block')
      const add = document.createElement('button')
      add.type = 'button'
      add.textContent = '+'
      add.className = 'px-1 py-1'
      add.setAttribute('aria-label', 'Insert block after')
      wrapper.append(drag, add)
      const portal = view.dom.closest('.admin-wrapper') ?? document.body
      portal.append(wrapper)
      const hide = () => { wrapper.style.display = 'none'
        position = null }
      const move = (event: MouseEvent) => {
        if (!editor.isEditable) { hide()
          return }
        if (wrapper.contains(event.target as globalThis.Node)) return
        const rect = view.dom.getBoundingClientRect()
        if (event.clientX < rect.left - 42 || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) { hide()
          return }
        const found = view.posAtCoords({ left: rect.left + 1, top: event.clientY })
        if (!found) { hide()
          return }
        const resolved = view.state.doc.resolve(found.pos)
        if (!resolved.depth) { hide()
          return }
        position = resolved.before(1)
        const node = view.nodeDOM(position)
        if (!(node instanceof HTMLElement)) { hide()
          return }
        wrapper.style.left = `${Math.max(0, rect.left - 34)}px`
        wrapper.style.top = `${node.getBoundingClientRect().top}px`
        wrapper.style.display = 'flex'
      }
      drag.addEventListener('mousedown', (event) => event.preventDefault())
      drag.addEventListener('dragstart', (event) => {
        if (position === null || !event.dataTransfer) return
        const selection = NodeSelection.create(view.state.doc, position)
        view.dispatch(view.state.tr.setSelection(selection))
        const slice = selection.content()
        const fragment = DOMSerializer.fromSchema(view.state.schema).serializeFragment(slice.content)
        const container = document.createElement('div')
        container.append(fragment)
        event.dataTransfer.setData('text/html', container.innerHTML)
        event.dataTransfer.setData('text/plain', container.textContent ?? '')
        event.dataTransfer.effectAllowed = 'move'
        view.dragging = { slice, move: true }
      })
      add.addEventListener('click', () => {
        if (position === null || !editor.isEditable) return
        const node = view.state.doc.nodeAt(position)
        if (!node) return
        const after = position + node.nodeSize
        editor.chain().insertContentAt(after, { type: 'paragraph', content: [{ type: 'text', text: '/' }] }).setTextSelection(after + 2).focus().run()
      })
      document.addEventListener('mousemove', move)
      document.addEventListener('scroll', hide, true)
      return { destroy() { wrapper.remove()
        document.removeEventListener('mousemove', move)
        document.removeEventListener('scroll', hide, true) } }
    } })]
  },
})
