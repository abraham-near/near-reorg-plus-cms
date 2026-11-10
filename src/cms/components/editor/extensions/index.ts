import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TaskList from '@tiptap/extension-task-list'
import { SafeTaskItem } from './TaskItem'
import { EmbedBlock } from './EmbedBlock'
import { DragHandle } from './DragHandle'
import { FindReplace } from './FindReplace'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { safeUrl } from '@/cms/lib/sanitize'
import { RawHtmlBlock } from './RawHtmlBlock'

const lowlight = createLowlight(common)
const SafeImage = Image.extend({
  addAttributes() { return { ...this.parent?.(), src: { default: null, parseHTML: (element) => safeUrl(element.getAttribute('src')), renderHTML: (attrs) => { const src = safeUrl(attrs.src)
    return src ? { src } : {} } } } },
})

/** Shared by the UI and headless tests. Headings 1–6 load as written; the menus offer 2 and 3. */
export function getExtensions(placeholder = "Type '/' to insert a block…") {
  return [
    StarterKit.configure({ link: false, codeBlock: false, heading: { levels: [1, 2, 3, 4, 5, 6] } }),
    Link.configure({ openOnClick: false, autolink: true, isAllowedUri: (url) => !!safeUrl(url) }),
    SafeImage.configure({ inline: true }),
    CodeBlockLowlight.configure({ lowlight }),
    Table.configure({ resizable: true, HTMLAttributes: { class: 'cms-editor-table' } }), TableRow, TableHeader, TableCell,
    TaskList, SafeTaskItem,
    EmbedBlock, DragHandle, FindReplace,
    Placeholder.configure({ placeholder }),
    // Keeps HTML the editor cannot model (pasted or written through the API) instead of dropping it.
    RawHtmlBlock,
  ]
}
