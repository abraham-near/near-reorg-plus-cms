import { Extension, type Editor } from '@tiptap/core'
import type { Node as PMNode } from '@tiptap/pm/model'
import { NodeSelection, TextSelection, type EditorState, type Transaction } from '@tiptap/pm/state'

/** Block types a text block can turn into (bubble menu and block menu). */
export type BlockKind = 'text' | 'h2' | 'h3' | 'quote' | 'bullet' | 'ordered' | 'task' | 'code'

export const BLOCK_KINDS: { kind: BlockKind; label: string }[] = [
  { kind: 'text', label: 'Text' },
  { kind: 'h2', label: 'Heading 2' },
  { kind: 'h3', label: 'Heading 3' },
  { kind: 'quote', label: 'Quote' },
  { kind: 'bullet', label: 'Bulleted list' },
  { kind: 'ordered', label: 'Numbered list' },
  { kind: 'task', label: 'To-do list' },
  { kind: 'code', label: 'Code block' },
]

const NAMES: Record<string, string> = {
  paragraph: 'Text', blockquote: 'Quote', bulletList: 'Bulleted list', orderedList: 'Numbered list', taskList: 'To-do list',
  codeBlock: 'Code block', table: 'Table', horizontalRule: 'Divider', embedBlock: 'Embed', rawHtmlBlock: 'HTML', image: 'Image',
}

/** A readable name for a top-level block ("Heading 2", "Quote"…). */
export function blockLabel(node: PMNode): string {
  if (node.type.name === 'heading') return `Heading ${node.attrs.level}`
  if (node.type.name === 'paragraph' && node.childCount === 1 && node.firstChild?.type.name === 'image') return 'Image'
  return NAMES[node.type.name] ?? node.type.name
}

/** The kind a block currently is, or null when it cannot be turned into another kind (tables, embeds…). */
export function blockKind(node: PMNode): BlockKind | null {
  switch (node.type.name) {
    case 'paragraph': return 'text'
    case 'heading': return node.attrs.level === 3 ? 'h3' : node.attrs.level === 2 ? 'h2' : null
    case 'blockquote': return 'quote'
    case 'bulletList': return 'bullet'
    case 'orderedList': return 'ordered'
    case 'taskList': return 'task'
    case 'codeBlock': return 'code'
    default: return null
  }
}

export function canTurnInto(node: PMNode) {
  return node.type.name === 'heading' || blockKind(node) !== null
}

/** The top-level block holding a position (position before the block, the node and its index). */
export function topLevelBlockAt(state: EditorState, position: number): { pos: number; node: PMNode; index: number } | null {
  const doc = state.doc
  if (!doc.childCount) return null
  const clamped = Math.max(0, Math.min(position, doc.content.size))
  const index = Math.min(doc.resolve(clamped).index(0), doc.childCount - 1)
  let pos = 0
  for (let i = 0; i < index; i++) pos += doc.child(i).nodeSize
  return { pos, node: doc.child(index), index }
}

function selectInside(tr: Transaction, pos: number, offset = 1) {
  const node = tr.doc.nodeAt(pos)
  if (!node) return
  if (node.isAtom) tr.setSelection(NodeSelection.create(tr.doc, pos))
  else tr.setSelection(TextSelection.near(tr.doc.resolve(Math.min(pos + offset, pos + node.nodeSize - 1))))
}

/** Swaps the block at `pos` with its neighbour. Returns the block's new position, or null at the edge. */
export function moveBlock(editor: Editor, pos: number, direction: -1 | 1): number | null {
  const { state } = editor
  const block = topLevelBlockAt(state, pos + 1)
  if (!block || block.pos !== pos) return null
  const neighbourIndex = block.index + direction
  if (neighbourIndex < 0 || neighbourIndex >= state.doc.childCount) return null
  const neighbour = state.doc.child(neighbourIndex)
  const selectionOffset = state.selection.from >= pos && state.selection.to <= pos + block.node.nodeSize ? state.selection.from - pos : 1
  const tr = state.tr
  let next: number
  if (direction === -1) {
    const start = pos - neighbour.nodeSize
    tr.replaceWith(start, pos + block.node.nodeSize, [block.node, neighbour])
    next = start
  } else {
    tr.replaceWith(pos, pos + block.node.nodeSize + neighbour.nodeSize, [neighbour, block.node])
    next = pos + neighbour.nodeSize
  }
  if (state.selection instanceof NodeSelection && state.selection.from === pos) tr.setSelection(NodeSelection.create(tr.doc, next))
  else selectInside(tr, next, Math.max(1, selectionOffset))
  editor.view.dispatch(tr.scrollIntoView())
  return next
}

export function duplicateBlock(editor: Editor, pos: number): number | null {
  const node = editor.state.doc.nodeAt(pos)
  if (!node) return null
  const after = pos + node.nodeSize
  const tr = editor.state.tr.insert(after, node.copy(node.content))
  selectInside(tr, after)
  editor.view.dispatch(tr.scrollIntoView())
  return after
}

export function deleteBlock(editor: Editor, pos: number) {
  const node = editor.state.doc.nodeAt(pos)
  if (!node) return
  const tr = editor.state.tr.delete(pos, pos + node.nodeSize)
  if (!tr.doc.childCount) tr.insert(0, editor.schema.nodes.paragraph.create())
  selectInside(tr, Math.min(pos, Math.max(0, tr.doc.content.size - tr.doc.lastChild!.nodeSize)))
  editor.view.dispatch(tr)
}

/** Turns the current selection's blocks into `kind`, unwrapping lists and quotes first. */
export function turnSelectionInto(editor: Editor, kind: BlockKind) {
  const chain = editor.chain().focus().clearNodes()
  switch (kind) {
    case 'h2': chain.setHeading({ level: 2 }); break
    case 'h3': chain.setHeading({ level: 3 }); break
    case 'quote': chain.setBlockquote(); break
    case 'bullet': chain.toggleBulletList(); break
    case 'ordered': chain.toggleOrderedList(); break
    case 'task': chain.toggleTaskList(); break
    case 'code': chain.setCodeBlock(); break
    default: break
  }
  return chain.run()
}

/** Turns a whole top-level block into `kind`. */
export function turnBlockInto(editor: Editor, pos: number, kind: BlockKind) {
  const node = editor.state.doc.nodeAt(pos)
  if (!node || !canTurnInto(node)) return false
  // A text selection over the whole block (its first to its last text position), so every item turns.
  const { doc } = editor.state
  editor.view.dispatch(editor.state.tr.setSelection(TextSelection.between(doc.resolve(pos + 1), doc.resolve(pos + node.nodeSize - 1))))
  return turnSelectionInto(editor, kind)
}

/** ⌘⇧↑ / ⌘⇧↓ move the block holding the cursor, ⌘D duplicates it. */
export const BlockKeymap = Extension.create({
  name: 'blockKeymap',
  addKeyboardShortcuts() {
    const current = () => topLevelBlockAt(this.editor.state, this.editor.state.selection.from)
    return {
      'Mod-Shift-ArrowUp': () => { const block = current()
        return !!block && moveBlock(this.editor, block.pos, -1) !== null },
      'Mod-Shift-ArrowDown': () => { const block = current()
        return !!block && moveBlock(this.editor, block.pos, 1) !== null },
      'Mod-d': () => { const block = current()
        return !!block && duplicateBlock(this.editor, block.pos) !== null },
    }
  },
})
