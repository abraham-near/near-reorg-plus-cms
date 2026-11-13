// Markdown-like text of a parsed .docx (parse.ts), for the local MCP's import_docx, where Claude writes
// the HTML. No CMS imports: the local MCP runs outside Next and stays a plain client.
import { type Block, type Run, runsText } from './parse'

const textRun = (r: Run) => (r.href ? `[${r.text}](${r.href})` : r.text)
/** Headings as #, list items as -, links as [text](url), images as [image: name]. */
export function renderText(blocks: Block[]): string {
  const lines: string[] = []
  for (const b of blocks) {
    if (b.type === 'heading') lines.push(`${'#'.repeat(Math.min(b.level + 1, 6))} ${b.runs.map(textRun).join('')}`)
    else if (b.type === 'list') lines.push(`${'  '.repeat(b.level)}${b.ordered ? '1.' : '-'} ${b.runs.map(textRun).join('')}`)
    else if (b.type === 'paragraph') lines.push(b.runs.map(textRun).join(''))
    else if (b.type === 'image') lines.push(`[image: ${b.name}]`)
    else lines.push(b.rows.map((row) => row.map((cell) => cell.map(textRun).join('')).join(' | ')).join('\n'))
  }
  return lines.join('\n\n')
}


/** The document's title: its "Title" paragraph, else its first heading, else ''. */
export function documentTitle(blocks: Block[]): string {
  const title = blocks.find((b) => b.type === 'heading' && b.title) ?? blocks.find((b) => b.type === 'heading')
  return title && title.type === 'heading' ? runsText(title.runs).trim() : ''
}

/** Words a reader sees (for the import summary). */
export function countWords(blocks: Block[]): number {
  let text = ''
  for (const b of blocks) {
    if (b.type === 'image') continue
    text += ' ' + (b.type === 'table' ? b.rows.flat().map(runsText).join(' ') : runsText(b.runs))
  }
  return text.split(/\s+/).filter(Boolean).length
}
