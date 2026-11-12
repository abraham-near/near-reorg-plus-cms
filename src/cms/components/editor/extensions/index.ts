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

const lowlight = createLowlight(common)
const SafeImage = Image.extend({
  addAttributes() { return { ...this.parent?.(), src: { default: null, parseHTML: (element) => safeUrl(element.getAttribute('src')), renderHTML: (attrs) => { const src = safeUrl(attrs.src)
    return src ? { src } : {} } } } },
  addNodeView() { return ReactNodeViewRenderer(ImageView) },
})

export const EMPTY_DOC_PLACEHOLDER = 'Type / for blocks, or just start writing'

export interface EditorExtensionOptions {
  /** Shown when the whole document is empty. */
  placeholder?: string
}

/** Placeholder of an empty block: headings name their level, other text blocks hint at "/". */
export function placeholderFor(node: { type: { name: string }; attrs: Record<string, unknown> }, parent: string, editorEmpty: boolean, emptyText = EMPTY_DOC_PLACEHOLDER): string {
  if (node.type.name === 'heading') return `Heading ${node.attrs.level}`
  if (node.type.name !== 'paragraph') return ''
  if (editorEmpty) return emptyText
  if (parent === 'listItem') return 'List'
  if (parent === 'taskItem') return 'To-do'
  if (parent === 'blockquote') return 'Quote'
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
    EmbedBlock, DragHandle, FindReplace, BlockKeymap, ImageUpload,
    Placeholder.configure({
      includeChildren: true,
      showOnlyCurrent: true,
      placeholder: ({ editor, node, pos }) => {
        const parent = pos > 0 ? editor.state.doc.resolve(pos).parent.type.name : 'doc'
        return placeholderFor(node, parent, editor.isEmpty, placeholder || EMPTY_DOC_PLACEHOLDER)
      },
    }),
    // Keeps HTML the editor cannot model (written through the API) instead of dropping it.
    RawHtmlBlock,
  ]
}
