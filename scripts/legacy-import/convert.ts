// Turns a post of the previous CMS (near-org-website-primary: Builder.io `blocks` holding HTML that came from
// WordPress, Medium and the old editor) into the body this CMS stores: HTML the editor opens as rich text
// (src/cms/components/editor/legacy-html.ts) and the site renders (src/lib/blog/html.ts). Pure: no database,
// no network. Images that must be copied (data: URLs, Google-hosted) are found by `findForeignImages` and
// resolved by the caller, which passes the new URLs back in `ConvertOptions.images`.
import { JSDOM } from 'jsdom'
import { sanitizeRichHtml } from '../../src/cms/lib/sanitize'

const { window } = new JSDOM('')
const { document } = window
const ELEMENT = 1

export type LegacyBlock = {
  component?: { name?: string; options?: Record<string, unknown> }
  children?: LegacyBlock[]
}

export class ConvertError extends Error {}

export type ConvertOptions = {
  /** Slugs that exist after the import, to report internal links that point nowhere. */
  slugs: Set<string>
  /** Foreign image URL (data:, googleusercontent) → its copy in the bucket (`/cms/…`), or null to drop it. Missing = keep as is. */
  images: Map<string, string | null>
}

export type ConvertResult = {
  html: string
  /** Top-level blocks the editor will keep as raw HTML instead of rich text. */
  rawBlocks: number
  wordsBefore: number
  wordsAfter: number
  imagesBefore: number
  imagesAfter: number
  notes: string[]
}

// ---------------------------------------------------------------------------------------------------------
// Builder blocks → HTML

const esc = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
const str = (value: unknown) => (typeof value === 'string' ? value : '')

export function youtubeId(url: string): string | null {
  const m = url.trim().match(/^(?:https?:)?\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:[^#\s]*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{11})(?:[?&#][^\s]*)?$/i)
  return m ? m[1] : null
}

export const embedHtml = (videoId: string) => `<div data-type="embed-block"><iframe src="https://www.youtube.com/embed/${videoId}"></iframe></div>`

/** The blocks of one post, in reading order, as one HTML string. Unknown block types throw. */
export function blocksToHtml(blocks: LegacyBlock[], notes: string[]): string {
  const out: string[] = []
  const walk = (block: LegacyBlock) => {
    const name = block.component?.name
    const o = block.component?.options ?? {}
    switch (name) {
      case 'BlogContent':
        out.push(str(o.content))
        break
      case 'Core:Section':
      case undefined:
        break
      case 'Columns':
        for (const column of (o.columns as { blocks?: LegacyBlock[] }[] | undefined) ?? []) for (const b of column.blocks ?? []) walk(b)
        break
      case 'Image': {
        const src = str(o.image)
        if (src) out.push(`<p><img src="${esc(src)}" alt="${esc(o.altText)}"${o.width ? ` width="${Number(o.width)}"` : ''}${o.height ? ` height="${Number(o.height)}"` : ''}></p>`)
        break
      }
      case 'Core:Button': {
        const href = str(o.link)
        if (href) out.push(`<p><a href="${esc(href)}"${o.openLinkInNewTab ? ' target="_blank" rel="noopener noreferrer"' : ''}>${esc(o.text || href)}</a></p>`)
        break
      }
      case 'Media Carousel': {
        if (str(o.headline).trim()) out.push(`<h2>${esc(str(o.headline).trim())}</h2>`)
        for (const video of (o.youtubeVideos as { title?: string; videoId?: string; description?: string }[] | undefined) ?? []) {
          if (video.videoId && /^[\w-]{11}$/.test(video.videoId)) out.push(embedHtml(video.videoId))
          if (video.title?.trim()) out.push(`<p><strong>${esc(video.title.trim())}</strong></p>`)
          if (video.description) out.push(video.description)
        }
        break
      }
      case 'Project Carousel':
        if (str(o.headline).trim()) out.push(`<h2>${esc(str(o.headline).trim())}</h2>`)
        out.push(str(o.subhead))
        notes.push(`Project Carousel: its ${((o.projects as unknown[]) ?? []).length} project cards are references to another Builder model and were not migrated (headline and text kept)`)
        break
      case 'MediaExpander': {
        if (str(o.headline).trim()) out.push(`<h2>${esc(str(o.headline).trim())}</h2>`)
        const media = o.media as { video?: { file?: string }; image?: string } | undefined
        if (media?.video?.file) out.push(`<video src="${esc(media.video.file)}" controls playsinline muted loop></video>`)
        else if (typeof media?.image === 'string') out.push(`<p><img src="${esc(media.image)}" alt=""></p>`)
        out.push(str(o.subhead))
        notes.push('MediaExpander: kept as a video (opens in the editor as an HTML block)')
        break
      }
      default:
        throw new ConvertError(`Unknown block type: ${name}`)
    }
    for (const child of block.children ?? []) walk(child)
  }
  for (const block of blocks) walk(block)
  return out.join('\n')
}

// ---------------------------------------------------------------------------------------------------------
// Raw HTML clean-up (strings, before parsing)

const HTML_TAGS = new Set('a abbr address article aside audio b bdi bdo blockquote br button caption cite code col colgroup data dd del details dfn div dl dt em figcaption figure font footer h1 h2 h3 h4 h5 h6 header hr i iframe img ins kbd label li main mark nav noscript ol p picture pre q s samp script section small source span strike strong style sub summary sup table tbody td tfoot th thead time tr u ul var video wbr center'.split(' '))

/** `Vec<T>` inside <code>/<pre> is text, not a tag: escape every `<` that does not start a real HTML tag. */
export function escapePseudoTags(html: string): string {
  return html.replace(/(<(code|pre)\b[^>]*>)([\s\S]*?)(<\/\2>)/gi, (_m, open: string, _tag: string, inner: string, close: string) =>
    open + inner.replace(/<(\/?)([A-Za-z][\w:-]*)/g, (all, slash: string, name: string) => (HTML_TAGS.has(name.toLowerCase()) ? all : `&lt;${slash}${name}`)) + close)
}

const attr = (attrs: string, name: string) => attrs.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s\\]]+))`, 'i'))?.slice(1).find((v) => v !== undefined) ?? ''

/** WordPress shortcodes the old content still has as text. Unknown ones are left alone (square brackets are common in prose). */
export function expandShortcodes(html: string, notes: string[]): string {
  return html
    .replace(/\[caption([^\]]*)\]([\s\S]*?)\[\/caption\]/gi, (_m, attrs: string, inner: string) => {
      const media = inner.match(/(<a\b[^>]*>\s*)?<img\b[^>]*>(\s*<\/a>)?/i)
      if (!media) { notes.push('[caption] without an image: kept as text'); return inner }
      const caption = inner.replace(media[0], '').replace(/<[^>]+>/g, '').trim() || attr(attrs, 'caption')
      return `<figure>${media[0]}${caption ? `<figcaption>${esc(caption)}</figcaption>` : ''}</figure>`
    })
    .replace(/\[embed[^\]]*\]([\s\S]*?)\[\/embed\]/gi, (_m, url: string) => {
      const id = youtubeId(url.replace(/<[^>]+>/g, ''))
      if (id) return embedHtml(id)
      notes.push(`[embed] of a non-YouTube URL turned into a link: ${url.trim()}`)
      return `<p><a href="${esc(url.trim())}">${esc(url.trim())}</a></p>`
    })
    .replace(/\[video([^\]]*)\](?:\[\/video\])?/gi, (_m, attrs: string) => {
      const src = attr(attrs, 'mp4') || attr(attrs, 'src') || attr(attrs, 'webm')
      const id = youtubeId(src)
      if (id) return embedHtml(id)
      if (src) { notes.push(`[video] turned into a video element: ${src}`); return `<video src="${esc(src)}" controls></video>` }
      notes.push('[video] without a source removed')
      return ''
    })
    .replace(/\[audio([^\]]*)\](?:\[\/audio\])?/gi, (_m, attrs: string) => {
      const src = attr(attrs, 'mp3') || attr(attrs, 'src') || attr(attrs, 'm4a') || attr(attrs, 'ogg')
      if (!src) { notes.push('[audio] without a source removed'); return '' }
      notes.push(`[audio] turned into a link: ${src}`)
      return `<p><a href="${esc(src)}">Listen to the audio</a></p>`
    })
    .replace(/\[gallery([^\]]*)\]/gi, (_m, attrs: string) => {
      notes.push(`[gallery ${attrs.trim()}] removed: it points to WordPress image ids that no longer exist`)
      return ''
    })
}

// ---------------------------------------------------------------------------------------------------------
// DOM normalization: only what the editor models (legacy-html.ts `modeledTags` / `modeledAttributes`)

const KEEP_ATTRS: Record<string, string[]> = {
  A: ['href', 'target', 'rel'],
  IMG: ['src', 'alt', 'title', 'width', 'height'],
  OL: ['start'],
  CODE: ['class'],
  TD: ['colspan', 'rowspan'],
  TH: ['colspan', 'rowspan'],
  TABLE: ['class'],
  IFRAME: ['src'],
  DIV: ['data-type'],
  VIDEO: ['src', 'controls', 'playsinline', 'muted', 'loop', 'poster'],
  SOURCE: ['src', 'type'],
}
/** Kept as they are (their text and children are normalized). */
const KEEP_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'STRONG', 'EM', 'S', 'DEL', 'U', 'MARK', 'CODE', 'PRE', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'BR', 'HR', 'A', 'IMG', 'SUP', 'SUB', 'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TD', 'TH', 'CAPTION', 'COLGROUP', 'COL', 'IFRAME', 'VIDEO', 'SOURCE'])
const RENAME: Record<string, string> = { B: 'strong', I: 'em', STRIKE: 's', INS: 'u' }
const DROP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'LINK', 'META', 'TEMPLATE', 'BUTTON', 'FORM', 'INPUT', 'SVG', 'OBJECT', 'EMBED'])
const BLOCK_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'PRE', 'BLOCKQUOTE', 'UL', 'OL', 'HR', 'TABLE', 'DIV', 'VIDEO', 'FIGURE'])

const isEmbedDiv = (node: Node | null): node is Element => !!node && node.nodeType === ELEMENT && (node as Element).tagName === 'DIV' && (node as Element).getAttribute('data-type') === 'embed-block'

function unwrap(el: Element) {
  const parent = el.parentNode!
  while (el.firstChild) parent.insertBefore(el.firstChild, el)
  parent.removeChild(el)
}

function rename(el: Element, tag: string): Element {
  const next = document.createElement(tag)
  for (const a of [...el.attributes]) next.setAttribute(a.name, a.value)
  while (el.firstChild) next.appendChild(el.firstChild)
  el.replaceWith(next)
  return next
}

function embedFor(src: string): Element | null {
  const id = youtubeId(src.replace(/^https?:\/\/(www\.)?youtube-nocookie\.com/, 'https://www.youtube.com'))
  if (!id) return null
  const tpl = document.createElement('template')
  tpl.innerHTML = embedHtml(id)
  return tpl.content.firstElementChild!
}

const BLOG_LINK = /^(?:https?:\/\/(?:www\.)?near\.org)?\/blog\/([\w%-]+?)(?:\.html)?\/?([?#].*)?$/i

function normalizeElement(el: Element, opts: ConvertOptions, notes: string[]): void {
  // children first, so a figure sees its normalized contents
  for (const child of [...el.children]) normalizeElement(child, opts, notes)
  const tag = el.tagName

  if (DROP.has(tag)) { el.remove(); return }

  // left for its figure (below); its own children are already normalized
  if (tag === 'FIGCAPTION') { for (const a of [...el.attributes]) el.removeAttribute(a.name); return }

  if (tag === 'FIGURE') {
    const table = el.querySelector('table')
    const iframe = el.querySelector('iframe')
    const imgs = [...el.querySelectorAll('img')]
    const video = el.querySelector('video')
    const caption = el.querySelector('figcaption')
    const captionText = caption?.textContent?.replace(/\s+/g, ' ').trim() ?? ''
    if (caption?.querySelector('a')) notes.push(`A caption had a link that the image caption cannot keep: "${captionText.slice(0, 80)}"`)
    caption?.remove()
    const embed = iframe ? embedFor(iframe.getAttribute('src') ?? '') : !imgs.length && !table && !video ? embedFor(el.textContent ?? '') : null
    if (embed) { el.replaceWith(embed); return }
    if (table) { el.replaceWith(table); if (captionText) table.insertAdjacentHTML('afterend', `<p><em>${esc(captionText)}</em></p>`); return }
    if (imgs.length) {
      const paragraphs = imgs.map((img, i) => {
        if (captionText && i === 0) img.setAttribute('title', captionText)
        const p = document.createElement('p')
        p.appendChild(img)
        return p
      })
      el.replaceWith(...paragraphs)
      return
    }
    if (captionText) el.insertAdjacentHTML('beforeend', `<p><em>${esc(captionText)}</em></p>`)
    unwrap(el)
    return
  }

  if (tag === 'IFRAME') {
    const embed = embedFor(el.getAttribute('src') ?? '')
    if (embed) { el.replaceWith(embed); return }
    notes.push(`Iframe removed: ${el.getAttribute('src')}`)
    el.remove()
    return
  }

  if (tag === 'DIV' && isEmbedDiv(el)) {
    for (const a of [...el.attributes]) if (a.name !== 'data-type') el.removeAttribute(a.name)
    return
  }

  if (tag === 'BLOCKQUOTE' && el.classList.contains('twitter-tweet')) notes.push('Tweet kept as a quote (the site does not load Twitter embeds)')

  if (tag === 'A' && !el.getAttribute('href')) { unwrap(el); return }

  let node: Element = el
  if (RENAME[tag]) node = rename(el, RENAME[tag])
  else if (!KEEP_TAGS.has(tag)) { unwrap(el); return }

  const keep = KEEP_ATTRS[node.tagName] ?? []
  for (const a of [...node.attributes]) if (!keep.includes(a.name)) node.removeAttribute(a.name)
  if (node.tagName === 'CODE') {
    const lang = (node.getAttribute('class') ?? '').split(/\s+/).find((c) => c.startsWith('language-'))
    if (lang) node.setAttribute('class', lang)
    else node.removeAttribute('class')
  }
  if (node.tagName === 'TABLE') node.setAttribute('class', 'cms-editor-table')
  if (node.tagName === 'A') {
    const href = node.getAttribute('href')!.trim()
    const m = href.match(BLOG_LINK)
    if (m) {
      const slug = decodeURIComponent(m[1])
      node.setAttribute('href', `/blog/${slug}${m[2] ?? ''}`)
      if (!opts.slugs.has(slug)) notes.push(`Link to a post that does not exist: /blog/${slug}`)
    }
    if (node.getAttribute('target') !== '_blank') { node.removeAttribute('target'); node.removeAttribute('rel') }
  }
  if (node.tagName === 'IMG') {
    const src = node.getAttribute('src') ?? ''
    if (opts.images.has(src)) {
      const next = opts.images.get(src)
      if (next) node.setAttribute('src', next)
      else { notes.push(`Image removed: ${src.slice(0, 60)}`); node.remove() }
    }
  }
}

/** Splits a paragraph that holds block content (an embed, a table, a video) around it. */
function liftBlocks(root: Element | DocumentFragment) {
  for (const p of [...root.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote')]) {
    const inner = [...p.querySelectorAll(':scope div[data-type="embed-block"], :scope table, :scope video')].filter((b) => b.parentElement === p)
    if (!inner.length || p.tagName === 'LI' || p.tagName === 'BLOCKQUOTE') continue
    let current = document.createElement(p.tagName)
    const pieces: Node[] = [current]
    for (const child of [...p.childNodes]) {
      if (inner.includes(child as Element)) { pieces.push(child); current = document.createElement(p.tagName); pieces.push(current) }
      else current.appendChild(child)
    }
    p.replaceWith(...pieces.filter((n) => inner.includes(n as Element) || hasContent(n as Element)))
  }
}

const hasContent = (el: Element) => !!el.textContent?.replace(/ /g, ' ').trim() || !!el.querySelector('img, iframe, video, br')

/** Top-level runs of text and inline elements (WordPress' "paragraphs are blank lines"): wrap them in <p>. Never enters a block. */
function autop(root: DocumentFragment) {
  const runs: Node[][] = []
  let run: Node[] = []
  for (const node of [...root.childNodes]) {
    const block = node.nodeType === ELEMENT && (BLOCK_TAGS.has((node as Element).tagName) || isEmbedDiv(node))
    if (block) { if (run.length) runs.push(run); run = [] } else run.push(node)
  }
  if (run.length) runs.push(run)
  for (const nodes of runs) {
    const holder = document.createElement('div')
    nodes[0].parentNode!.insertBefore(holder, nodes[0])
    for (const n of nodes) holder.appendChild(n)
    const html = holder.innerHTML
    if (!html.replace(/&nbsp;| /g, ' ').trim()) { holder.remove(); continue }
    const paragraphs = html.split(/\n\s*\n/).map((chunk) => chunk.trim()).filter(Boolean)
      .map((chunk) => `<p>${chunk.replace(/\s*\n\s*/g, '<br>')}</p>`)
    holder.insertAdjacentHTML('beforebegin', paragraphs.join(''))
    holder.remove()
  }
}

/** A paragraph that only holds a YouTube URL (as text or as a link to itself) becomes an embed. */
function bareYoutube(root: DocumentFragment) {
  for (const p of [...root.querySelectorAll('p')]) {
    if (p.querySelector('img, iframe')) continue
    const embed = embedFor(p.textContent ?? '')
    if (embed) p.replaceWith(embed)
  }
}

function removeEmpty(root: DocumentFragment) {
  for (const el of [...root.querySelectorAll('p, h1, h2, h3, h4, h5, h6, strong, em, u, s, mark, sup, sub')].reverse()) {
    if (!hasContent(el)) el.remove()
  }
}

// ---------------------------------------------------------------------------------------------------------
// What the editor will keep as raw HTML (copy of legacy-html.ts needsPreservation, which is client code)

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

export function countRawBlocks(html: string): number {
  const tpl = document.createElement('template')
  tpl.innerHTML = html
  return [...tpl.content.children].filter((el) => el.tagName !== 'IMG' && needsPreservation(el)).length
}

// ---------------------------------------------------------------------------------------------------------
// Limits of src/cms/lib/posts/body.ts assertBodyShape (that module imports server-only)

const MAX_DEPTH = 64
const MAX_ELEMENTS = 50_000
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'])
export function assertBodyShape(html: string) {
  let depth = 0
  let elements = 0
  for (const match of html.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)[^>]*?(\/?)>/g)) {
    const [, closing, name, selfClosing] = match
    if (closing) { depth = Math.max(0, depth - 1); continue }
    if (++elements > MAX_ELEMENTS) throw new ConvertError('The post body has too many elements')
    if (selfClosing || VOID.has(name.toLowerCase())) continue
    if (++depth > MAX_DEPTH) throw new ConvertError(`The post body is nested more than ${MAX_DEPTH} levels deep`)
  }
}

// ---------------------------------------------------------------------------------------------------------

const words = (text: string) => text.replace(/ /g, ' ').split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length

function measure(html: string) {
  const tpl = document.createElement('template')
  // a space before every tag: "</p><p>" separates words in the page, not in textContent
  tpl.innerHTML = html.replace(/<!--[\s\S]*?-->/g, '').replace(/</g, ' <')
  tpl.content.querySelectorAll('script, style').forEach((s) => s.remove())
  // captions moved into the image title still count as text
  const captions = [...tpl.content.querySelectorAll('img[title]')].map((img) => img.getAttribute('title')).join(' ')
  // shortcode markup is not prose
  const text = `${tpl.content.textContent ?? ''} ${captions}`.replace(/\[\/?(caption|embed|video|audio|gallery)[^\]]*\]/gi, ' ')
  return { words: words(text), images: tpl.content.querySelectorAll('img').length }
}

/** Every image URL in the raw HTML that has to be copied before converting: inline data: images and Google-hosted ones. */
export function findForeignImages(html: string): string[] {
  const tpl = document.createElement('template')
  tpl.innerHTML = html
  return [...new Set([...tpl.content.querySelectorAll('img')].map((img) => img.getAttribute('src') ?? '')
    .filter((src) => src.startsWith('data:') || /^https:\/\/[\w-]+\.googleusercontent\.com\//i.test(src)))]
}

/** Raw HTML of a post → the stored body. */
export function convertBody(rawHtml: string, opts: ConvertOptions): ConvertResult {
  const notes: string[] = []
  const before = measure(rawHtml)
  const pre = expandShortcodes(escapePseudoTags(rawHtml).replace(/<!--[\s\S]*?-->/g, ''), notes)

  const tpl = document.createElement('template')
  tpl.innerHTML = pre
  const root = tpl.content
  for (const el of [...root.children]) normalizeElement(el, opts, notes)
  // a caption outside any figure: an italic line
  for (const caption of [...root.querySelectorAll('figcaption')]) { const p = document.createElement('p'); p.innerHTML = `<em>${caption.innerHTML}</em>`; caption.replaceWith(p) }
  liftBlocks(root)
  autop(root)
  bareYoutube(root)
  removeEmpty(root)
  if (root.querySelector('sup, sub')) notes.push('Has superscript/subscript text (kept; the editor shows that paragraph as HTML)')

  const serialized = tpl.innerHTML
  assertBodyShape(serialized)
  const html = sanitizeRichHtml(serialized)
  const after = measure(html)
  return {
    html,
    rawBlocks: countRawBlocks(html),
    wordsBefore: before.words,
    wordsAfter: after.words,
    imagesBefore: before.images,
    imagesAfter: after.images,
    notes: [...new Set(notes)],
  }
}

// ---------------------------------------------------------------------------------------------------------
// Plain-text fields (titles, SEO fields, excerpts, category names): stored as typed, never HTML (sanitize.ts cleanText)

const textarea = document.createElement('textarea')

export function cleanField(value: string | null | undefined, { singleLine = true, max }: { singleLine?: boolean; max?: number } = {}): string | null {
  if (value == null) return null
  let text = value.replace(/<br\s*\/?>/gi, singleLine ? ' ' : '\n')
  if (/&(#\d+|#x[\da-f]+|[a-z]+);/i.test(text)) { textarea.innerHTML = text; text = textarea.value }
  text = text.replace(singleLine ? /[\u0000-\u001F\u007F]+/g : /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]+/g, singleLine ? ' ' : '')
  if (singleLine) text = text.replace(/ /g, ' ').replace(/ {2,}/g, ' ')
  text = text.trim()
  if (max && text.length > max) text = text.slice(0, max)
  return text || null
}
