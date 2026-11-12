import { Extension } from '@tiptap/core'
import { ReactRenderer } from '@tiptap/react'
import { PluginKey } from '@tiptap/pm/state'
import Suggestion, { type SuggestionProps } from '@tiptap/suggestion'
import { SlashMenu, type SlashMenuHandle, type SlashMenuProps } from '../menus/SlashMenu'
import { readRecentSlashItems, rememberSlashItem, SLASH_ITEMS, type SlashItem } from './slash-items'

export const slashCommandKey = new PluginKey('slashCommand')

/** "/" opens the block picker (Menus A). */
export const SlashCommand = Extension.create({
    name: 'slashCommand',
    addProseMirrorPlugins() {
      return [Suggestion<SlashItem>({
        pluginKey: slashCommandKey,
        editor: this.editor,
        char: '/',
        // Notion-like: "/" at the start of a line or after a space; queries are short words.
        allowedPrefixes: [' ', ' '],
        allowSpaces: false,
        // Filtering and grouping happen in the menu; every item is a candidate.
        items: () => SLASH_ITEMS,
        allow: ({ editor, range }) => !editor.isActive('codeBlock') && editor.state.doc.resolve(range.from).parent.type.name !== 'codeBlock',
        // The menu is fixed-positioned so no scroll container can clip it; Floating UI flips it above
        // the line when there is no room below.
        floatingUi: { strategy: 'fixed' },
        offset: { mainAxis: 6 },
        container: '.admin-wrapper',
        command: ({ editor, range, props }) => {
          editor.chain().focus().deleteRange(range).run()
          rememberSlashItem(props.id)
          props.run(editor)
        },
        render: () => {
          let renderer: ReactRenderer<SlashMenuHandle, SlashMenuProps> | null = null
          let unmount: (() => void) | null = null
          const toMenuProps = (props: SuggestionProps<SlashItem>, recent: string[]): SlashMenuProps => ({
            items: props.items, query: props.query, recent, command: (item) => props.command(item),
          })
          let recent: string[] = []
          return {
            onStart(props) {
              recent = readRecentSlashItems()
              renderer = new ReactRenderer(SlashMenu, { props: toMenuProps(props, recent), editor: props.editor, className: 'cms-pop z-50' })
              renderer.element.setAttribute('data-cms-floating', '')
              unmount = props.mount(renderer.element as HTMLElement, {
                onPosition: ({ x, y, placement, strategy }) => {
                  const element = renderer?.element as HTMLElement | undefined
                  if (!element) return
                  element.style.setProperty('--origin', placement.startsWith('top') ? 'bottom left' : 'top left')
                  Object.assign(element.style, { position: strategy, left: `${x}px`, top: `${y}px`, visibility: 'visible' })
                },
              })
              ;(renderer.element as HTMLElement).style.visibility = 'hidden'
            },
            onUpdate(props) {
              renderer?.updateProps(toMenuProps(props, recent))
            },
            onKeyDown({ event }) {
              if (event.key === 'Escape') return true
              return renderer?.ref?.onKeyDown(event) ?? false
            },
            onExit() {
              unmount?.()
              renderer?.destroy()
              unmount = null
              renderer = null
            },
          }
        },
      })]
    },
  })
