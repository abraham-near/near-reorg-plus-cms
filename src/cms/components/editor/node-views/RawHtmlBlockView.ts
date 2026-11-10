import type { NodeViewRenderer } from '@tiptap/core'
import { sanitizeRichHtml } from '@/cms/lib/sanitize'

export const rawHtmlBlockView: NodeViewRenderer = ({ node, editor, getPos }) => {
  let currentNode = node
  const dom = document.createElement('div')
  dom.dataset.type = 'raw-html'
  dom.className = 'not-prose my-4 rounded-md border bg-muted/40 p-3'
  dom.contentEditable = 'false'
  const label = document.createElement('p')
  label.className = 'mb-2 text-sm font-medium'
  label.textContent = 'Preserved HTML block'
  const description = document.createElement('p')
  description.className = 'mb-2 text-xs text-muted-foreground'
  description.textContent = 'Complex layout stays intact. Unsafe markup is removed on save.'
  const input = document.createElement('textarea')
  input.className = 'min-h-28 w-full rounded border bg-background p-2 font-mono text-xs'
  input.setAttribute('aria-label', 'Preserved HTML source')
  input.value = String(node.attrs.content)
  input.readOnly = !editor.isEditable
  input.addEventListener('input', () => {
    if (!editor.isEditable) return
    const position = getPos()
    if (typeof position === 'number') editor.commands.command(({ tr }) => {
      // Store the draft while typing; serialization and previews are always sanitized.
      tr.setNodeMarkup(position, undefined, { ...currentNode.attrs, content: input.value })
      return true
    })
  })
  const preview = document.createElement('div')
  preview.className = 'prose max-w-none'
  preview.hidden = true
  const toggle = document.createElement('button')
  toggle.type = 'button'
  toggle.className = 'mr-4 mb-2 text-sm underline'
  toggle.textContent = 'Show preview'
  toggle.addEventListener('click', () => {
    preview.hidden = !preview.hidden
    input.hidden = !preview.hidden
    if (!preview.hidden) preview.innerHTML = sanitizeRichHtml(String(currentNode.attrs.content))
    toggle.textContent = preview.hidden ? 'Show preview' : 'Show source'
  })
  const remove = document.createElement('button')
  remove.type = 'button'
  remove.className = 'mb-2 text-sm underline'
  remove.textContent = 'Remove block'
  remove.hidden = !editor.isEditable
  remove.addEventListener('click', () => {
    const from = getPos()
    if (editor.isEditable && typeof from === 'number') editor.commands.deleteRange({ from, to: from + currentNode.nodeSize })
  })
  const syncEditable = () => { input.readOnly = !editor.isEditable
    remove.hidden = !editor.isEditable }
  editor.on('update', syncEditable)
  dom.append(label, description, toggle, remove, input, preview)
  return {
    destroy() { editor.off('update', syncEditable) },
    dom, stopEvent: () => true, ignoreMutation: () => true,
    update(nextNode) {
      if (nextNode.type !== currentNode.type) return false
      currentNode = nextNode
      if (document.activeElement !== input) input.value = String(nextNode.attrs.content)
      if (!preview.hidden) preview.innerHTML = sanitizeRichHtml(String(nextNode.attrs.content))
      input.readOnly = !editor.isEditable
      remove.hidden = !editor.isEditable
      return true
    },
  }
}
