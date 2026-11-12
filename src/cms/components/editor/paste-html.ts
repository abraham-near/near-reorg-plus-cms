import { isAllowedEmbed, sanitizeRichHtml } from '@/cms/lib/sanitize'

/*
 * Clipboard HTML → editor HTML. Pasting never creates a preserved raw HTML block: Google Docs, Word
 * and web pages wrap plain formatting in styled spans, classes and ids, so the markup is reduced to
 * what the editor models (paragraphs, headings, lists, marks, links, tables, images) and the schema
 * drops anything else while keeping its text. Stored HTML goes through `htmlForEditor` instead.
 */

const DROP = new Set(['SCRIPT', 'STYLE', 'META', 'LINK', 'TITLE', 'XML', 'HEAD', 'COLGROUP', 'COL', 'OBJECT', 'EMBED', 'FORM', 'INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'SVG', 'CANVAS', 'NOSCRIPT', 'TEMPLATE'])
const BLOCKS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TD', 'TH', 'BLOCKQUOTE', 'PRE', 'HR', 'DIV', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'MAIN', 'ASIDE', 'NAV', 'FIGURE', 'FIGCAPTION', 'DL', 'DT', 'DD', 'IFRAME', 'VIDEO'])
const KEEP_ATTRIBUTES: Record<string, string[]> = {
  A: ['href', 'title'],
  IMG: ['src', 'alt', 'title'],
  TD: ['colspan', 'rowspan'],
  TH: ['colspan', 'rowspan'],
  OL: ['start'],
  IFRAME: ['src'],
  VIDEO: ['src', 'poster', 'controls'],
  SOURCE: ['src', 'type'],
  CODE: ['class'],
}
const NBSP_ONLY = /^[\s ​]*$/

type Marks = { bold: boolean; italic: boolean; underline: boolean; strike: boolean }

function styleOf(element: Element): CSSStyleDeclaration | null {
  return (element as HTMLElement).style ?? null
}

/** Formatting expressed with inline styles (Google Docs, Word, web pages). */
function marksFromStyle(element: Element): Marks {
  const style = styleOf(element)
  const weight = style?.fontWeight ?? ''
  const decoration = `${style?.textDecoration ?? ''} ${style?.textDecorationLine ?? ''}`
  return {
    bold: weight === 'bold' || weight === 'bolder' || Number(weight) >= 600,
    italic: style?.fontStyle === 'italic' || style?.fontStyle === 'oblique',
    underline: decoration.includes('underline'),
    strike: decoration.includes('line-through'),
  }
}

function unwrap(element: Element) {
  element.replaceWith(...element.childNodes)
}

function rename(element: Element, tag: string): Element {
  const next = element.ownerDocument.createElement(tag)
  next.append(...element.childNodes)
  element.replaceWith(next)
  return next
}

function hasBlockChild(element: Element) {
  return [...element.children].some((child) => BLOCKS.has(child.tagName))
}

/** Word list paragraphs (`mso-list: l0 level1 lfo1`) become real nested lists. */
function convertWordLists(root: DocumentFragment) {
  const paragraphs = [...root.querySelectorAll('p')].filter((p) => /mso-list\s*:/i.test(p.getAttribute('style') ?? ''))
  let stack: { list: Element; level: number }[] = []
  let previous: Element | null = null
  for (const paragraph of paragraphs) {
    const style = paragraph.getAttribute('style') ?? ''
    const level = Number(/level(\d+)/i.exec(style)?.[1] ?? 1)
    // The bullet or number Word renders itself sits in a span marked `mso-list: Ignore`, or between
    // `<![if !supportLists]>` conditional comments (parsed as comments around the span).
    let marker = ''
    const ignored = [...paragraph.querySelectorAll('span')].find((span) => /mso-list\s*:\s*ignore/i.test(span.getAttribute('style') ?? ''))
    if (ignored) {
      marker = ignored.textContent ?? ''
      // The outer span holding the marker font (Symbol, Wingdings) goes too.
      const outer = ignored.parentElement && ignored.parentElement !== paragraph && ignored.parentElement.textContent === ignored.textContent ? ignored.parentElement : ignored
      outer.remove()
    } else {
      const nodes = [...paragraph.childNodes]
      const start = nodes.findIndex((node) => node.nodeType === 8 && /if\s+!supportLists/i.test(node.textContent ?? ''))
      const end = nodes.findIndex((node, index) => index > start && node.nodeType === 8 && /endif/i.test(node.textContent ?? ''))
      if (start >= 0 && end > start) for (const node of nodes.slice(start, end + 1)) {
        marker += node.nodeType === 8 ? '' : node.textContent ?? ''
        node.remove()
      }
    }
    const ordered = /^\s*\(?[0-9a-z]{1,4}[.)]/i.test(marker.replace(/ /g, ' ')) && !/^\s*[o§·•▪-]\s*$/.test(marker.replace(/ /g, ' '))
    const tag = ordered ? 'OL' : 'UL'
    const contiguous = previous !== null && previous.nextElementSibling === paragraph
    if (!contiguous) stack = []
    while (stack.length && stack[stack.length - 1].level > level) stack.pop()
    let current = stack[stack.length - 1]
    if (!current || current.level < level || current.list.tagName !== tag) {
      const list = paragraph.ownerDocument.createElement(tag)
      if (current && current.level < level) {
        const parentItem = current.list.lastElementChild
        ;(parentItem ?? current.list).append(list)
      } else if (current && current.level === level) {
        // Same level, different list type: start a sibling list.
        current.list.after(list)
        stack.pop()
      } else paragraph.before(list)
      current = { list, level }
      stack.push(current)
    }
    const item = paragraph.ownerDocument.createElement('li')
    const content = paragraph.ownerDocument.createElement('p')
    content.append(...paragraph.childNodes)
    item.append(content)
    current.list.append(item)
    previous = paragraph
    // Keep the empty paragraph as the adjacency anchor until the loop ends.
    paragraph.replaceChildren()
    paragraph.setAttribute('data-cms-list-anchor', '')
  }
  for (const anchor of root.querySelectorAll('[data-cms-list-anchor]')) anchor.remove()
}

function clean(element: Element, insideLink: boolean) {
  for (const child of [...element.children]) clean(child, insideLink || child.tagName === 'A')
  const tag = element.tagName
  // Namespaced Office elements (<o:p>, <v:shape>, <w:sdt>) and anything never pasted as content.
  if (DROP.has(tag) || tag.includes(':')) {
    element.remove()
    return
  }
  if (tag === 'BR' && element.classList.contains('Apple-interchange-newline')) {
    element.remove()
    return
  }
  if (tag === 'IMG') {
    const src = element.getAttribute('src') ?? ''
    // Word pastes local file paths, which never load; data URIs are not uploaded files either.
    if (!/^(https?:)?\/\//i.test(src) && !src.startsWith('/')) {
      element.remove()
      return
    }
  }
  // Google Docs wraps the whole clipboard in <b style="font-weight:normal" id="docs-internal-guid-…">.
  if ((tag === 'B' || tag === 'STRONG') && (/^docs-internal-guid/.test(element.id) || /^(normal|[1-5]00)$/.test(styleOf(element)?.fontWeight ?? ''))) {
    unwrap(element)
    return
  }
  if ((tag === 'I' || tag === 'EM') && styleOf(element)?.fontStyle === 'normal') {
    unwrap(element)
    return
  }
  if (tag === 'SPAN' || tag === 'FONT') {
    const marks = marksFromStyle(element)
    if (insideLink) marks.underline = false
    let inner: Node[] = [...element.childNodes]
    if (!inner.length || (element.textContent === '' && !element.querySelector('img'))) {
      element.remove()
      return
    }
    for (const [mark, name] of [['strike', 's'], ['underline', 'u'], ['italic', 'em'], ['bold', 'strong']] as const) {
      if (!marks[mark]) continue
      const wrapper = element.ownerDocument.createElement(name)
      wrapper.append(...inner)
      inner = [wrapper]
    }
    element.replaceWith(...inner)
    return
  }
  if (tag === 'A' && !element.getAttribute('href')) {
    // Word bookmarks (<a name="_Toc…">) and anchors without a target.
    unwrap(element)
    return
  }
  if (tag === 'FIGURE') {
    unwrap(element)
    return
  }
  if (tag === 'FIGCAPTION') {
    stripAttributes(rename(element, 'p'))
    return
  }
  if (['DIV', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'MAIN', 'ASIDE', 'NAV', 'CENTER'].includes(tag)) {
    // Wrappers around blocks disappear; a wrapper of inline content is a paragraph (one line per div).
    if (hasBlockChild(element) || !element.textContent?.trim()) unwrap(element)
    else stripAttributes(rename(element, 'p'))
    return
  }
  if (tag === 'IFRAME') {
    // An embeddable iframe becomes an embed block; the editor checks the provider.
    const src = element.getAttribute('src') ?? ''
    if (!isAllowedEmbed(src)) {
      element.remove()
      return
    }
    const embed = element.ownerDocument.createElement('div')
    embed.setAttribute('data-type', 'embed-block')
    const frame = element.ownerDocument.createElement('iframe')
    frame.setAttribute('src', src)
    embed.append(frame)
    element.replaceWith(embed)
    return
  }
  stripAttributes(element)
}

function stripAttributes(element: Element) {
  const keep = KEEP_ATTRIBUTES[element.tagName] ?? []
  for (const { name } of [...element.attributes]) if (!keep.includes(name)) element.removeAttribute(name)
}

function removeEmpty(root: DocumentFragment) {
  // Empty formatting left behind by unwrapped spans.
  for (const element of [...root.querySelectorAll('strong, em, u, s, b, i, a, code')].reverse()) {
    if (!element.textContent && !element.querySelector('img')) element.remove()
  }
  // Word's `<p class=MsoNormal>&nbsp;</p>` and Docs' empty lines: spacing, not content.
  for (const element of [...root.querySelectorAll('p, h1, h2, h3, h4, h5, h6')]) {
    if (NBSP_ONLY.test(element.textContent ?? '') && !element.querySelector('img')) element.remove()
  }
  // Line breaks between blocks (Docs separates paragraphs with a top-level <br>). A <br> between two
  // lines of plain inline text is a real line break and stays.
  const isBlock = (node: Node | null) => node instanceof Element && BLOCKS.has(node.tagName)
  const sibling = (node: Node, direction: 'previousSibling' | 'nextSibling') => {
    let current = node[direction]
    while (current && current.nodeType === 3 && !current.textContent?.trim()) current = current[direction]
    return current
  }
  for (const br of [...root.querySelectorAll('br')]) {
    const parent = br.parentNode
    const between = !sibling(br, 'previousSibling') || !sibling(br, 'nextSibling') || isBlock(sibling(br, 'previousSibling')) || isBlock(sibling(br, 'nextSibling'))
    if ((parent === root && between) || (parent instanceof Element && ['UL', 'OL', 'TABLE', 'THEAD', 'TBODY', 'TR'].includes(parent.tagName))) br.remove()
  }
  // Source formatting whitespace between blocks (Word's newlines) would become empty paragraphs.
  const containers = new Set(['UL', 'OL', 'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'BLOCKQUOTE', 'LI', 'TD', 'TH'])
  const walker = root.ownerDocument!.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */)
  const blank: Node[] = []
  while (walker.nextNode()) {
    const text = walker.currentNode
    if (text.textContent?.trim()) continue
    const parent = text.parentNode
    if (parent === root || (parent instanceof Element && containers.has(parent.tagName)) || isBlock(text.previousSibling) || isBlock(text.nextSibling)) blank.push(text)
  }
  for (const text of blank) text.parentNode?.removeChild(text)
  // Docs nests a sub-list directly in its parent list: move it into the previous item.
  for (const list of [...root.querySelectorAll('ul > ul, ul > ol, ol > ul, ol > ol')]) {
    const item = list.previousElementSibling
    if (item?.tagName === 'LI') item.append(list)
    else {
      const wrapper = list.ownerDocument.createElement('li')
      list.replaceWith(wrapper)
      wrapper.append(list)
    }
  }
}

function removeComments(root: Node) {
  const walker = root.ownerDocument!.createTreeWalker(root, 128 /* NodeFilter.SHOW_COMMENT */)
  const comments: Node[] = []
  while (walker.nextNode()) comments.push(walker.currentNode)
  for (const comment of comments) comment.parentNode?.removeChild(comment)
}

/** Strips Google Docs and Microsoft Word artefacts so the HTML maps onto editable nodes. */
export function cleanPastedHtml(html: string): string {
  if (typeof document === 'undefined') return html
  // Word sends a whole document: only the <body> holds content (and the fragment comments).
  const body = /<body[^>]*>([\s\S]*)<\/body>/i.exec(html)?.[1] ?? html
  const template = document.createElement('template')
  template.innerHTML = body
  const root = template.content
  convertWordLists(root)
  removeComments(root)
  for (const child of [...root.children]) clean(child, child.tagName === 'A')
  removeEmpty(root)
  const wrapper = document.createElement('div')
  wrapper.append(root)
  return wrapper.innerHTML.replace(/ /g, ' ').replace(/ {2,}/g, ' ')
}

/**
 * The editor's `transformPastedHTML`. ProseMirror marks its own clipboard with `data-pm-slice`
 * (list and nesting context); that markup is already clean and keeps the marker so pasting inside
 * the editor behaves natively. Everything else is cleaned first. Both are sanitized.
 */
export function htmlForPaste(html: string): string {
  if (typeof document === 'undefined') return sanitizeRichHtml(html)
  const slice = /data-pm-slice="([^"]*)"/.exec(html)?.[1]
  const safe = sanitizeRichHtml(slice === undefined ? cleanPastedHtml(html) : html)
  if (slice === undefined) return safe
  const template = document.createElement('template')
  template.innerHTML = safe
  template.content.firstElementChild?.setAttribute('data-pm-slice', slice.replace(/&quot;/g, '"').replace(/&amp;/g, '&'))
  const wrapper = document.createElement('div')
  wrapper.append(template.content)
  return wrapper.innerHTML
}
