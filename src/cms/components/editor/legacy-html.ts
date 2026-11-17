import { escapeHtml, sanitizeRichHtml } from '@/cms/lib/sanitize'

const customBlocks = new Set(['embed-block', 'taskList', 'taskItem', 'callout', 'figures', 'footnote'])
const modeledTags = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'STRONG', 'B', 'EM', 'I', 'S', 'DEL', 'U', 'MARK', 'CODE', 'PRE', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'BR', 'HR', 'A', 'IMG'])
const modeledAttributes: Record<string, Set<string>> = {
  A: new Set(['href', 'target', 'rel']),
  IMG: new Set(['src', 'alt', 'title', 'width', 'height', 'data-size']),
  OL: new Set(['start']),
  CODE: new Set(['class']),
}

function needsPreservation(element: Element): boolean {
  if (customBlocks.has(element.getAttribute('data-type') ?? '') || element.classList.contains('cms-editor-table')) return false
  if (!modeledTags.has(element.tagName)) return true
  if ([...element.attributes].some(({ name }) => !modeledAttributes[element.tagName]?.has(name))) return true
  return [...element.children].some(needsPreservation)
}

/**
 * Stored HTML (a saved post, or a body written through the API) → editor HTML. Only schema-compatible
 * sections become rich text; anything else is kept intact in a raw HTML block. Pasted HTML is cleaned
 * instead and never preserved this way: see `htmlForPaste`.
 */
export function htmlForEditor(html: string): string {
  const safeHtml = sanitizeRichHtml(html)
  if (typeof document === 'undefined') return safeHtml
  const template = document.createElement('template')
  template.innerHTML = safeHtml
  return [...template.content.childNodes].map((node) => {
    if (node.nodeType !== 1) return node.nodeType === 3 && node.textContent ? escapeHtml(node.textContent) : ''
    const element = node as Element
    // an image on its own line (HTML written elsewhere: imports, the API): the editor's images are inline, so give it its paragraph
    if (element.tagName === 'IMG') return `<p>${element.outerHTML}</p>`
    return needsPreservation(element)
      ? `<div data-type="raw-html" data-content="${escapeHtml(element.outerHTML)}"></div>`
      : element.outerHTML
  }).join('')
}
