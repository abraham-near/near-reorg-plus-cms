import type { Editor } from '@tiptap/core'
import type { LucideIcon } from 'lucide-react'
import { ChartColumn, Code2, Asterisk, FileCode2, Image, Images, Info, List, ListChecks, ListOrdered, Minus, MonitorPlay, Pilcrow, Quote, Table2, TextQuote } from 'lucide-react'

export type SlashGroup = 'Text' | 'Lists' | 'Media' | 'Layout' | 'Advanced'
/** Dispatched on the editor DOM: the image picker lives in React (BlockEditor listens). */
export const OPEN_IMAGE_PICKER_EVENT = 'cms:open-image-picker'
export interface SlashItem {
  id: string
  title: string
  description: string
  group: SlashGroup
  /** Markdown shortcut that creates the same block while typing. */
  shortcut?: string
  aliases: string[]
  /** Short text ("H2") or an icon for the 40px tile. */
  tile: string | LucideIcon
  run: (editor: Editor) => void
}
export interface SlashSection { label: string; items: SlashItem[] }

const GROUPS: SlashGroup[] = ['Text', 'Lists', 'Media', 'Layout', 'Advanced']

/** Headings 2 and 3 only: the post title is the page's heading 1. */
export const SLASH_ITEMS: SlashItem[] = [
  { id: 'text', title: 'Text', description: 'Plain paragraph', group: 'Text', aliases: ['paragraph', 'p', 'plain', 'body'], tile: Pilcrow,
    run: (editor) => { editor.chain().focus().clearNodes().run() } },
  { id: 'h2', title: 'Heading 2', description: 'Section title', group: 'Text', shortcut: '##', aliases: ['h2', 'title', 'heading', 'section', 'subtitle'], tile: 'H2',
    run: (editor) => { editor.chain().focus().clearNodes().setHeading({ level: 2 }).run() } },
  { id: 'h3', title: 'Heading 3', description: 'Small section title', group: 'Text', shortcut: '###', aliases: ['h3', 'title', 'heading', 'subheading', 'subsection'], tile: 'H3',
    run: (editor) => { editor.chain().focus().clearNodes().setHeading({ level: 3 }).run() } },
  { id: 'bullet', title: 'Bulleted list', description: 'Simple list with bullets', group: 'Lists', shortcut: '-', aliases: ['bullet', 'ul', 'unordered', 'list', 'points'], tile: List,
    run: (editor) => { editor.chain().focus().clearNodes().toggleBulletList().run() } },
  { id: 'ordered', title: 'Numbered list', description: 'List with numbers', group: 'Lists', shortcut: '1.', aliases: ['numbered', 'ordered', 'ol', 'list', 'steps', 'number'], tile: ListOrdered,
    run: (editor) => { editor.chain().focus().clearNodes().toggleOrderedList().run() } },
  { id: 'task', title: 'To-do list', description: 'Track tasks with checkboxes', group: 'Lists', shortcut: '[]', aliases: ['todo', 'to-do', 'task', 'checkbox', 'checklist', 'check'], tile: ListChecks,
    run: (editor) => { editor.chain().focus().clearNodes().toggleTaskList().run() } },
  { id: 'image', title: 'Image', description: 'Upload or pick from the library', group: 'Media', aliases: ['img', 'picture', 'photo', 'media', 'upload', 'figure'], tile: Image,
    run: (editor) => { editor.view.dom.dispatchEvent(new CustomEvent(OPEN_IMAGE_PICKER_EVENT, { bubbles: true })) } },
  { id: 'pair', title: 'Image pair', description: 'Pick two photos: they sit side by side', group: 'Media', aliases: ['pair', 'two images', 'side by side', 'gallery', 'photos', 'diptych'], tile: Images,
    run: (editor) => { editor.view.dom.dispatchEvent(new CustomEvent(OPEN_IMAGE_PICKER_EVENT, { bubbles: true })) } },
  { id: 'embed', title: 'Embed', description: 'YouTube, Vimeo, Spotify, Luma…', group: 'Media', aliases: ['youtube', 'vimeo', 'video', 'iframe', 'spotify', 'soundcloud', 'luma', 'media'], tile: MonitorPlay,
    run: (editor) => { editor.chain().focus().insertContent({ type: 'embedBlock', attrs: { url: '' } }).run() } },
  { id: 'quote', title: 'Quote', description: 'Pull a quote out of the text', group: 'Layout', shortcut: '>', aliases: ['blockquote', 'citation', 'cite'], tile: Quote,
    run: (editor) => { editor.chain().focus().clearNodes().setBlockquote().run() } },
  { id: 'pullquote', title: 'Pull quote', description: 'A line set large, with who said it', group: 'Layout', aliases: ['pull quote', 'quote', 'testimonial', 'citation', 'said'], tile: TextQuote,
    run: (editor) => { editor.chain().focus().insertContent({ type: 'blockquote', content: [{ type: 'paragraph' }, { type: 'paragraph', content: [{ type: 'text', text: '— ' }] }] }).run() } },
  { id: 'callout', title: 'Callout', description: 'A titled note in a soft box', group: 'Layout', aliases: ['note', 'aside', 'tip', 'info', 'box', 'highlight'], tile: Info,
    run: (editor) => { editor.chain().focus().insertContent({ type: 'callout', content: [{ type: 'paragraph' }, { type: 'paragraph' }] }).run() } },
  { id: 'figures', title: 'Figures', description: '2–4 numbers on an ink band', group: 'Layout', aliases: ['stats', 'numbers', 'metrics', 'figures', 'kpi', 'data', 'band'], tile: ChartColumn,
    run: (editor) => { editor.chain().focus().insertContent({ type: 'figures' }).run() } },
  { id: 'footnote', title: 'Footnote', description: 'A numbered note, listed at the end of the post', group: 'Text', aliases: ['footnote', 'note', 'reference', 'source', 'cite', 'sup'], tile: Asterisk,
    run: (editor) => {
      // the menu opens after a space ("word /"): the marker sits right after the word, so that space goes
      const { from } = editor.state.selection
      const space = from > 1 && editor.state.doc.textBetween(from - 1, from) === ' '
      editor.chain().focus().command(({ tr }) => { if (space) tr.delete(from - 1, from); return true }).insertContent({ type: 'footnote', attrs: { text: '' } }).run()
    } },
  { id: 'divider', title: 'Divider', description: 'Separate sections', group: 'Layout', shortcut: '---', aliases: ['hr', 'line', 'separator', 'rule', 'break'], tile: Minus,
    run: (editor) => { editor.chain().focus().setHorizontalRule().run() } },
  { id: 'table', title: 'Table', description: 'Rows and columns', group: 'Advanced', aliases: ['grid', 'columns', 'rows', 'spreadsheet'], tile: Table2,
    run: (editor) => { editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() } },
  { id: 'code', title: 'Code block', description: 'Code with syntax highlighting', group: 'Advanced', shortcut: '```', aliases: ['code', 'pre', 'snippet', 'program'], tile: Code2,
    run: (editor) => { editor.chain().focus().clearNodes().setCodeBlock().run() } },
  { id: 'html', title: 'HTML', description: 'Raw HTML, sanitized on save', group: 'Advanced', aliases: ['raw', 'markup', 'source', 'custom'], tile: FileCode2,
    run: (editor) => { editor.chain().focus().insertContent({ type: 'rawHtmlBlock', attrs: { content: '' } }).run() } },
]

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9#]+/g, ' ').trim()

/** In-order subsequence match ("bltd" → "bulleted"), for typos and abbreviations. */
function subsequence(query: string, text: string) {
  let index = 0
  for (const char of text) if (char === query[index]) index++
  return index === query.length
}

/**
 * Score of an item for a query: higher is better, 0 means no match. Title matches rank above aliases,
 * which rank above loose (subsequence / description) matches.
 */
export function scoreSlashItem(item: SlashItem, rawQuery: string): number {
  const raw = rawQuery.trim()
  if (!raw) return 1
  // Typing the markdown shortcut itself ("/---", "/##") finds its block.
  if (item.shortcut && item.shortcut === raw) return 95
  const query = normalize(rawQuery)
  if (!query) return 0
  const title = normalize(item.title)
  const words = title.split(' ')
  if (title === query) return 100
  if (title.startsWith(query)) return 90
  if (words.some((word) => word.startsWith(query))) return 80
  if (item.aliases.some((alias) => normalize(alias) === query)) return 70
  if (item.aliases.some((alias) => normalize(alias).startsWith(query))) return 60
  if (title.includes(query)) return 40
  if (query.length >= 3 && normalize(item.description).split(' ').some((word) => word.startsWith(query))) return 20
  if (query.length >= 2 && subsequence(query.replace(/ /g, ''), title.replace(/ /g, ''))) return 10
  return 0
}

/**
 * Sections for the slash menu. Empty query: recently used first, then every group. With a query: strong
 * matches grouped as usual, weaker ones under "Also matches".
 */
export function buildSlashSections(items: SlashItem[], query: string, recentIds: string[] = []): SlashSection[] {
  if (!query.trim()) {
    const recent = recentIds.map((id) => items.find((item) => item.id === id)).filter((item): item is SlashItem => !!item).slice(0, 3)
    const sections: SlashSection[] = recent.length ? [{ label: 'Recent', items: recent }] : []
    for (const group of GROUPS) {
      const groupItems = items.filter((item) => item.group === group && !recent.includes(item))
      if (groupItems.length) sections.push({ label: group, items: groupItems })
    }
    return sections
  }
  const scored = items.map((item) => ({ item, score: scoreSlashItem(item, query) })).filter(({ score }) => score > 0)
  const strong = scored.filter(({ score }) => score >= 55)
  const weak = scored.filter(({ score }) => score < 55).sort((a, b) => b.score - a.score)
  const sections: SlashSection[] = []
  for (const group of GROUPS) {
    const groupItems = strong.filter(({ item }) => item.group === group).sort((a, b) => b.score - a.score).map(({ item }) => item)
    if (groupItems.length) sections.push({ label: group, items: groupItems })
  }
  // The best match leads, whatever its group.
  sections.sort((a, b) => Math.max(...b.items.map((item) => scoreSlashItem(item, query))) - Math.max(...a.items.map((item) => scoreSlashItem(item, query))))
  if (weak.length) sections.push({ label: strong.length ? 'Also matches' : 'Closest matches', items: weak.map(({ item }) => item) })
  return sections
}

const RECENT_KEY = 'cms.editor.slash-recent'

export function readRecentSlashItems(): string[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? '[]')
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string').slice(0, 5) : []
  } catch { return [] }
}

export function rememberSlashItem(id: string) {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...readRecentSlashItems().filter((item) => item !== id)].slice(0, 5)))
  } catch { /* storage unavailable (private mode): recents are a convenience */ }
}
