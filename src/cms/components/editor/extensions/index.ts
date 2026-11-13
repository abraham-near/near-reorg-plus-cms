import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TaskList from '@tiptap/extension-task-list'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { SafeTaskItem } from './TaskItem'
import { EmbedBlock } from './EmbedBlock'
import { DragHandle } from './DragHandle'
import { FindReplace } from './FindReplace'
import { BlockKeymap } from './block-actions'
import { ImageUpload } from './ImageUpload'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { safeUrl } from '@/cms/lib/sanitize'
import { RawHtmlBlock } from './RawHtmlBlock'
import { ImageView } from '../node-views/ImageView'
import { Callout, FiguresBlock } from './StoryBlocks'

const lowlight = createLowlight(common)
export type ImageSize = 'wide' | 'bleed'
export const imageSize = (value: unknown): ImageSize | null => (value === 'wide' || value === 'bleed' ? value : null)
const SafeImage = Image.extend({
  addAttributes() { return { ...this.parent?.(), src: { default: null, parseHTML: (element) => safeUrl(element.getAttribute('src')), renderHTML: (attrs) => { const src = safeUrl(attrs.src)
    return src ? { src } : {} } },
  // how far the image reaches in layouts that support it (Cover): none = the text column, "wide", "bleed" (edge to edge)
  size: { default: null, parseHTML: (element) => imageSize(element.getAttribute('data-size')), renderHTML: (attrs) => { const size = imageSize(attrs.size)
    return size ? { 'data-size': size } : {} } } } },
  addNodeView() { return ReactNodeViewRenderer(ImageView) },
})

export const EMPTY_DOC_PLACEHOLDER = 'Type / for blocks, or just start writing'

export interface EditorExtensionOptions {
  /** Shown when the whole document is empty. */
  placeholder?: string
}

/** Placeholder of an empty block: headings name their level, other text blocks hint at "/". */
export function placeholderFor(node: { type: { name: string }; attrs: Record<string, unknown> }, parent: string, editorEmpty: boolean, emptyText = EMPTY_DOC_PLACEHOLDER, index = 0): string {
  if (node.type.name === 'heading') return `Heading ${node.attrs.level}`
  if (node.type.name !== 'paragraph') return ''
  if (editorEmpty) return emptyText
  if (parent === 'listItem') return 'List'
  if (parent === 'taskItem') return 'To-do'
  if (parent === 'blockquote') return index === 0 ? 'Quote' : '— Who said it, their role'
  if (parent === 'callout') return index === 0 ? 'Callout title' : 'The note'
  if (parent === 'tableCell' || parent === 'tableHeader') return ''
  return 'Type / for blocks'
}

/** Shared by the UI and headless tests. Headings 1–6 load as written; the menus offer 2 and 3. */
export function getExtensions(options: EditorExtensionOptions | string = {}) {
  const { placeholder } = typeof options === 'string' ? { placeholder: options } : options
  return [
    StarterKit.configure({ link: false, codeBlock: false, heading: { levels: [1, 2, 3, 4, 5, 6] } }),
    Link.configure({ openOnClick: false, autolink: true, isAllowedUri: (url) => !!safeUrl(url) }),
    SafeImage.configure({ inline: true }),
    Highlight.configure({ multicolor: false }),
    CodeBlockLowlight.configure({ lowlight }),
    Table.configure({ resizable: true, HTMLAttributes: { class: 'cms-editor-table' } }), TableRow, TableHeader, TableCell,
    TaskList, SafeTaskItem,
    EmbedBlock, Callout, FiguresBlock, DragHandle, FindReplace, BlockKeymap, ImageUpload,
    Placeholder.configure({
      includeChildren: true,
      showOnlyCurrent: true,
      placeholder: ({ editor, node, pos }) => {
        // the decorations can be built for a newer doc than editor.state holds (an insert in flight): out of range, treat it as top level
        const at = pos > 0 && pos <= editor.state.doc.content.size ? editor.state.doc.resolve(pos) : null
        return placeholderFor(node, at ? at.parent.type.name : 'doc', editor.isEmpty, placeholder || EMPTY_DOC_PLACEHOLDER, at ? at.index() : 0)
      },
    }),
    // Keeps HTML the editor cannot model (written through the API) instead of dropping it.
    RawHtmlBlock,
  ]
}
