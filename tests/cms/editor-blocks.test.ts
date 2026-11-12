// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { Editor } from '@tiptap/core'
import { getExtensions, placeholderFor } from '@/cms/components/editor/extensions'
import { buildSlashSections, scoreSlashItem, SLASH_ITEMS } from '@/cms/components/editor/extensions/slash-items'
import { blockKind, deleteBlock, duplicateBlock, moveBlock, topLevelBlockAt, turnBlockInto, turnSelectionInto } from '@/cms/components/editor/extensions/block-actions'
import { normalizeLinkInput } from '@/cms/components/editor/menus/BubbleToolbar'
import { countWords } from '@/cms/components/editor/BlockEditor'

const editorFor = (html: string) => new Editor({ element: document.createElement('div'), extensions: getExtensions(), content: html })
/** Top-level block types, without the empty paragraph StarterKit keeps at the end (TrailingNode). */
function top(editor: Editor) {
  const nodes = editor.getJSON().content ?? []
  const last = nodes.at(-1)
  const trimmed = nodes.length > 1 && last?.type === 'paragraph' && !last.content?.length ? nodes.slice(0, -1) : nodes
  return trimmed.map((node) => node.type === 'heading' ? `h${node.attrs?.level}` : node.type)
}

/** Position before the top-level block at `index`. */
function blockPos(editor: Editor, index: number) {
  let pos = 0
  for (let i = 0; i < index; i++) pos += editor.state.doc.child(i).nodeSize
  return pos
}

/** A real keydown through the editor's keymaps (Tiptap's keyboardShortcut command drops selection changes). */
function press(editor: Editor, key: string, mods: { mod?: boolean; shift?: boolean } = {}) {
  const event = new KeyboardEvent('keydown', { key, ctrlKey: !!mods.mod, metaKey: false, shiftKey: !!mods.shift, bubbles: true, cancelable: true })
  editor.view.someProp('handleKeyDown', (handler) => handler(editor.view, event))
}

/** Types like a user: every character goes through the input rules first. */
function type(editor: Editor, text: string) {
  for (const char of text) {
    const { view } = editor
    const { from, to } = view.state.selection
    const handled = view.someProp('handleTextInput', (handler) => handler(view, from, to, char, () => view.state.tr.insertText(char, from, to)))
    if (!handled) view.dispatch(view.state.tr.insertText(char, from, to))
  }
}

describe('slash menu filtering', () => {
  const titles = (query: string) => buildSlashSections(SLASH_ITEMS, query).flatMap((section) => section.items.map((item) => item.title))

  it('groups every block when the query is empty, recently used first', () => {
    expect(buildSlashSections(SLASH_ITEMS, '').map((section) => section.label)).toEqual(['Text', 'Lists', 'Media', 'Layout', 'Advanced'])
    const withRecent = buildSlashSections(SLASH_ITEMS, '', ['table', 'unknown', 'h2'])
    expect(withRecent[0]).toMatchObject({ label: 'Recent' })
    expect(withRecent[0].items.map((item) => item.id)).toEqual(['table', 'h2'])
    expect(withRecent.slice(1).flatMap((section) => section.items).some((item) => item.id === 'table')).toBe(false)
  })

  it('matches titles, aliases and shortcuts', () => {
    expect(titles('h2')[0]).toBe('Heading 2')
    expect(titles('hea').slice(0, 2)).toEqual(['Heading 2', 'Heading 3'])
    expect(titles('title')).toEqual(expect.arrayContaining(['Heading 2', 'Heading 3']))
    expect(titles('bullet')[0]).toBe('Bulleted list')
    expect(titles('todo')[0]).toBe('To-do list')
    expect(titles('img')[0]).toBe('Image')
    expect(titles('youtube')[0]).toBe('Embed')
    expect(titles('---')[0]).toBe('Divider')
    expect(titles('zzzz')).toEqual([])
    expect(scoreSlashItem(SLASH_ITEMS.find((item) => item.id === 'bullet')!, 'bltd')).toBeGreaterThan(0)
  })

  it('puts weaker matches under "Also matches"', () => {
    const sections = buildSlashSections(SLASH_ITEMS, 'list')
    expect(sections[0].label).toBe('Lists')
    expect(sections.map((section) => section.label)).not.toContain('Text')
  })
})

describe('block actions', () => {
  it('moves, duplicates and deletes top-level blocks', () => {
    const editor = editorFor('<p>One</p><h2>Two</h2><ul><li><p>Three</p></li></ul>')
    expect(moveBlock(editor, 0, 1)).toBe(editor.state.doc.child(0).nodeSize)
    expect(top(editor)).toEqual(['h2', 'paragraph', 'bulletList'])
    expect(moveBlock(editor, 0, -1)).toBeNull()
    expect(moveBlock(editor, blockPos(editor, editor.state.doc.childCount - 1), 1)).toBeNull()
    moveBlock(editor, blockPos(editor, 2), -1)
    expect(top(editor)).toEqual(['h2', 'bulletList', 'paragraph'])
    duplicateBlock(editor, 0)
    expect(top(editor)).toEqual(['h2', 'h2', 'bulletList', 'paragraph'])
    deleteBlock(editor, 0)
    deleteBlock(editor, 0)
    expect(top(editor)).toEqual(['bulletList', 'paragraph'])
    editor.destroy()
  })

  it('keyboard shortcuts move and duplicate the block holding the cursor', () => {
    const editor = editorFor('<p>One</p><p>Two</p>')
    editor.commands.setTextSelection(7)
    press(editor, 'ArrowUp', { mod: true, shift: true })
    expect(editor.getText()).toBe('Two\n\nOne')
    press(editor, 'd', { mod: true })
    expect(editor.getText()).toBe('Two\n\nTwo\n\nOne')
    editor.destroy()
  })

  it('turns blocks into other kinds, unwrapping lists and quotes first', () => {
    const editor = editorFor('<ul><li><p>A</p></li><li><p>B</p></li></ul><blockquote><p>Q</p></blockquote>')
    turnBlockInto(editor, 0, 'ordered')
    expect(top(editor)).toEqual(['orderedList', 'blockquote'])
    turnBlockInto(editor, 0, 'text')
    expect(top(editor)).toEqual(['paragraph', 'paragraph', 'blockquote'])
    expect(topLevelBlockAt(editor.state, blockPos(editor, 2) + 1)?.node.type.name).toBe('blockquote')
    turnBlockInto(editor, blockPos(editor, 2), 'h2')
    expect(top(editor)).toEqual(['paragraph', 'paragraph', 'h2'])
    expect(blockKind(editor.state.doc.child(2))).toBe('h2')
    editor.commands.setTextSelection({ from: 1, to: 2 })
    turnSelectionInto(editor, 'task')
    expect(top(editor)[0]).toBe('taskList')
    editor.destroy()
  })
})

describe('markdown shortcuts', () => {
  const cases: [string, string][] = [
    ['## ', 'h2'], ['### ', 'h3'], ['> ', 'blockquote'], ['- ', 'bulletList'], ['* ', 'bulletList'], ['1. ', 'orderedList'], ['[] ', 'taskList'], ['``` ', 'codeBlock'],
  ]
  for (const [input, expected] of cases) {
    it(`"${input}" starts a ${expected}`, () => {
      const editor = editorFor('<p></p>')
      editor.commands.setTextSelection(1)
      type(editor, input)
      expect(top(editor)[0]).toBe(expected)
      editor.destroy()
    })
  }

  it('"---" inserts a divider', () => {
    const editor = editorFor('<p></p>')
    editor.commands.setTextSelection(1)
    type(editor, '---')
    expect(top(editor)).toContain('horizontalRule')
    editor.destroy()
  })

  it('formats **bold**, *italic*, `code` and ==highlight== inline', () => {
    const editor = editorFor('<p></p>')
    editor.commands.setTextSelection(1)
    type(editor, 'a **b** c *d* e `f` g ==h== ')
    expect(editor.getHTML()).toBe('<p>a <strong>b</strong> c <em>d</em> e <code>f</code> g <mark>h</mark> </p>')
    editor.destroy()
  })

  it('Enter twice in an empty list item leaves the list', () => {
    const editor = editorFor('<ul><li><p>Item</p></li></ul>')
    editor.commands.setTextSelection(editor.state.doc.content.size - 3)
    press(editor, 'Enter')
    press(editor, 'Enter')
    expect(top(editor)).toEqual(['bulletList', 'paragraph'])
    editor.destroy()
  })
})

describe('placeholders and helpers', () => {
  it('names empty blocks', () => {
    const node = (name: string, attrs: Record<string, unknown> = {}) => ({ type: { name }, attrs })
    expect(placeholderFor(node('paragraph'), 'doc', true)).toBe('Type / for blocks, or just start writing')
    expect(placeholderFor(node('paragraph'), 'doc', false)).toBe('Type / for blocks')
    expect(placeholderFor(node('heading', { level: 2 }), 'doc', false)).toBe('Heading 2')
    expect(placeholderFor(node('heading', { level: 3 }), 'doc', true)).toBe('Heading 3')
    expect(placeholderFor(node('paragraph'), 'listItem', false)).toBe('List')
  })

  it('validates link input', () => {
    expect(normalizeLinkInput('near.org/blog')).toBe('https://near.org/blog')
    expect(normalizeLinkInput('https://near.org')).toBe('https://near.org')
    expect(normalizeLinkInput('/blog/post')).toBe('/blog/post')
    expect(normalizeLinkInput('hi@near.org')).toBe('mailto:hi@near.org')
    expect(normalizeLinkInput('javascript:alert(1)')).toBeNull()
    expect(normalizeLinkInput('not a link')).toBeNull()
  })

  it('counts words and inserts images at the end of the body', () => {
    expect(countWords('  one two\nthree ')).toBe(3)
    expect(countWords('')).toBe(0)
    const editor = editorFor('<h2>Title</h2>')
    editor.chain().insertContentAt(editor.state.doc.content.size, { type: 'image', attrs: { src: '/cms/a.png', alt: '' } }).run()
    expect(editor.getHTML()).toBe('<h2>Title</h2><p><img src="/cms/a.png" alt=""></p>')
    editor.destroy()
  })
})
