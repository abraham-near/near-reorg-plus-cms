// The post body the CMS builds itself from a parsed .docx (Google Doc import). Every piece of text is
// escaped here, and prepareBody() sanitizes the result again when the post is saved.
import { escapeHtml, safeUrl } from '@/cms/lib/sanitize'
import type { Block, Run } from './parse'

/** Only links a reader can follow safely: http(s) and mailto, made absolute. Anything else becomes plain text. */
function linkHref(href: string): string | null {
  const url = safeUrl(href, { allowRelative: false })
  return url && /^(https?:|mailto:)/i.test(url) ? url : null
}

function inline(runs: Run[]): string {
  return runs.map((r) => {
    let html = escapeHtml(r.text).replace(/\n/g, '<br>').replace(/\t/g, ' ')
    if (r.bold) html = `<strong>${html}</strong>`
    if (r.italic) html = `<em>${html}</em>`
    const href = r.href ? linkHref(r.href) : null
    if (href) html = `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${html}</a>`
    return html
  }).join('')
}

export type RenderedImage = { src: string; alt: string }

/**
 * HTML for the editor's nodes (headings h2–h6, paragraphs, nested lists, inline images, tables).
 * `image(path)` returns the stored image for an image block, or null to leave it out. The document
 * title (Word "Title" style) is not rendered: it becomes the post title.
 */
export function renderHtml(blocks: Block[], image: (path: string) => RenderedImage | null): string {
  const out: string[] = []
  // Open lists, innermost last: [ordered, level].
  const open: { ordered: boolean; level: number }[] = []
  const closeLists = (toLevel = -1) => {
    while (open.length && open.at(-1)!.level > toLevel) out.push(open.pop()!.ordered ? '</li></ol>' : '</li></ul>')
  }
  for (const b of blocks) {
    if (b.type === 'list') {
      closeLists(b.level)
      const same = open.at(-1)
      // A numbered list right after a bulleted one at the same level (or the reverse) is a new list.
      if (same && same.level === b.level && same.ordered !== b.ordered) out.push(open.pop()!.ordered ? '</li></ol>' : '</li></ul>')
      const current = open.at(-1)
      if (current && current.level === b.level) out.push('</li><li>')
      else {
        // A deeper item nests inside the open item; a first item starts a list.
        out.push(b.ordered ? '<ol><li>' : '<ul><li>')
        open.push({ ordered: b.ordered, level: b.level })
      }
      out.push(`<p>${inline(b.runs)}</p>`)
      continue
    }
    closeLists()
    if (b.type === 'heading') {
      if (b.title) continue
      // h1 is the page title on the site: document headings start at h2.
      const level = Math.min(b.level + 1, 6)
      out.push(`<h${level}>${inline(b.runs)}</h${level}>`)
    } else if (b.type === 'paragraph') out.push(`<p>${inline(b.runs)}</p>`)
    else if (b.type === 'image') {
      const img = image(b.path)
      if (img) out.push(`<p><img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.alt)}"></p>`)
    } else {
      const rows = b.rows.map((row) => `<tr>${row.map((cell) => `<td><p>${inline(cell)}</p></td>`).join('')}</tr>`).join('')
      out.push(`<table class="cms-editor-table"><tbody>${rows}</tbody></table>`)
    }
  }
  closeLists()
  return out.join('')
}
