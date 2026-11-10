import { Extension, type Editor } from '@tiptap/core'
import Suggestion, { type SuggestionProps } from '@tiptap/suggestion'

type Item = { title: string,run: (editor: Editor) => void }
export type Insert = 'image' | 'embed'

export function createSlashCommand(onInsert: (kind: Insert) => void) {
  const items: Item[] = [
    { title: 'Paragraph', run: (editor) => { editor.chain().focus().setParagraph().run() } },
    { title: 'Heading 2', run: (editor) => { editor.chain().focus().setHeading({ level: 2 }).run() } },
    { title: 'Heading 3', run: (editor) => { editor.chain().focus().setHeading({ level: 3 }).run() } },
    { title: 'Bullet list', run: (editor) => { editor.chain().focus().toggleBulletList().run() } },
    { title: 'Numbered list', run: (editor) => { editor.chain().focus().toggleOrderedList().run() } },
    { title: 'Task list', run: (editor) => { editor.chain().focus().toggleTaskList().run() } },
    { title: 'Quote', run: (editor) => { editor.chain().focus().toggleBlockquote().run() } },
    { title: 'Code block', run: (editor) => { editor.chain().focus().toggleCodeBlock().run() } },
    { title: 'Divider', run: (editor) => { editor.chain().focus().setHorizontalRule().run() } },
    { title: 'Table', run: (editor) => { editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() } },
    { title: 'Image', run: () => onInsert('image') },
    { title: 'Embed', run: () => onInsert('embed') },
  ]
  return Extension.create({
    name: 'slashCommand',
    addProseMirrorPlugins() {
      return [Suggestion<Item>({
        editor: this.editor,
        char: '/',
        items: ({ query }) => items.filter((item) => item.title.toLowerCase().includes(query.toLowerCase())),
        command: ({ editor, range, props }) => {
          editor.chain().focus().deleteRange(range).run()
          props.run(editor)
        },
        render: () => {
          let menu: HTMLDivElement | null = null
          let props: SuggestionProps<Item> | null = null
          let selected = 0
          const render = (next: SuggestionProps<Item>) => {
            props = next
            if (!menu) {
              menu = document.createElement('div')
              menu.className = 'fixed z-50 max-h-72 min-w-48 overflow-auto rounded-md border bg-popover p-1 text-popover-foreground'
              menu.setAttribute('role', 'listbox')
              menu.setAttribute('aria-label', 'Insert a block')
              const portal = document.querySelector('.admin-wrapper') ?? document.body
              portal.append(menu)
            }
            menu.replaceChildren()
            const rect = next.clientRect?.()
            if (rect) {
              menu.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 220))}px`
              menu.style.top = `${Math.max(8, Math.min(rect.bottom + 4, window.innerHeight - 300))}px`
            }
            next.items.forEach((item, index) => {
              const button = document.createElement('button')
              button.type = 'button'
              button.className = `block w-full rounded px-3 py-2 text-left text-sm ${index === selected ? 'bg-accent' : 'hover:bg-accent'}`
              button.textContent = item.title
              button.setAttribute('role', 'option')
              button.setAttribute('aria-selected', String(index === selected))
              button.addEventListener('mousedown', (event) => event.preventDefault())
              button.addEventListener('click', () => next.command(item))
              menu?.append(button)
            })
            if (!next.items.length) menu.textContent = 'No matching blocks'
            menu.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
          }
          return {
            onStart(next) { selected = 0
              render(next) },
            onUpdate(next) { selected = 0
              render(next) },
            onKeyDown({ event }) {
              if (event.key === 'Escape') { menu?.remove()
                menu = null
                return true }
              if (!props?.items.length) return false
              if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                selected = (selected + (event.key === 'ArrowUp' ? -1 : 1) + props.items.length) % props.items.length
                render(props)
                return true
              }
              if (event.key === 'Enter') { props.command(props.items[selected])
                return true }
              return false
            },
            onExit() { menu?.remove()
              menu = null },
          }
        },
      })]
    },
  })
}
