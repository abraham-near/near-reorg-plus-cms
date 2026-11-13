// Reads a Word document (.docx) into simple blocks: headings, paragraphs, list items, tables and
// images, with bold, italic and links on the text. Pure (no file system, no network), so the local
// MCP (src/cms/mcp/docx.ts) and the CMS server (Google Doc import) share it.
//
// The document is untrusted: it may come from anyone who can share a Google Doc. So
// - the archive is checked before unpacking (zip bombs), and each XML part is capped;
// - text a reader would not see (hidden runs, white text at a tiny size, tracked deletions) is
//   dropped and counted: it is a classic place to hide instructions for an AI;
// - nothing here is HTML yet: render-html.ts escapes every piece of text.
import { unzipSync } from 'fflate'

export const DOCX_LIMITS = {
  /** Unpacked size of the whole archive, from its directory, before inflating anything. */
  unpacked: 200 * 1024 * 1024,
  /** Each XML part. */
  xml: 20 * 1024 * 1024,
  /** All media together. */
  media: 100 * 1024 * 1024,
}
const MEDIA = /^word\/media\/[^/\\]+$/

export type Rel = { target: string; external: boolean }
export type Run = { text: string; bold?: boolean; italic?: boolean; href?: string }
export type Block =
  | { type: 'heading'; level: number; title: boolean; runs: Run[] }
  | { type: 'paragraph'; runs: Run[] }
  | { type: 'list'; ordered: boolean; level: number; runs: Run[] }
  | { type: 'image'; name: string; path: string; alt: string }
  | { type: 'table'; rows: Run[][][] }

export type ParsedDocx = {
  blocks: Block[]
  /** Media files by archive path (word/media/image1.png). */
  media: Map<string, Uint8Array>
  /** Runs of text dropped because a reader would not see them. */
  hiddenRemoved: number
}

export class DocxError extends Error {}

const decode = (s: string) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => safeCodePoint(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n: string) => safeCodePoint(Number(n)))
    .replace(/&amp;/g, '&')
const safeCodePoint = (n: number) => (n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '')

const attr = (tag: string, name: string) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1]

/** rId → target, from word/_rels/document.xml.rels. */
export function parseRels(xml: string): Map<string, Rel> {
  const rels = new Map<string, Rel>()
  for (const m of xml.matchAll(/<Relationship\b([^>]*)\/?>/g)) {
    const id = attr(m[1], 'Id'), target = attr(m[1], 'Target')
    if (id && target) rels.set(id, { target: decode(target), external: attr(m[1], 'TargetMode') === 'External' })
  }
  return rels
}

/** numId → whether its levels are numbered (true) or bulleted (false), from word/numbering.xml. */
export function parseNumbering(xml: string): Map<string, Map<number, boolean>> {
  const abstract = new Map<string, Map<number, boolean>>()
  for (const a of xml.matchAll(/<w:abstractNum\b([^>]*)>([\s\S]*?)<\/w:abstractNum>/g)) {
    const id = attr(a[1], 'w:abstractNumId')
    if (!id) continue
    const levels = new Map<number, boolean>()
    for (const l of a[2].matchAll(/<w:lvl\b([^>]*)>([\s\S]*?)<\/w:lvl>/g)) {
      const fmt = l[2].match(/<w:numFmt w:val="([^"]+)"/)?.[1] ?? 'bullet'
      levels.set(Number(attr(l[1], 'w:ilvl') ?? 0), fmt !== 'bullet' && fmt !== 'none')
    }
    abstract.set(id, levels)
  }
  const nums = new Map<string, Map<number, boolean>>()
  for (const n of xml.matchAll(/<w:num\b([^>]*)>([\s\S]*?)<\/w:num>/g)) {
    const id = attr(n[1], 'w:numId'), abs = n[2].match(/<w:abstractNumId w:val="([^"]+)"/)?.[1]
    if (id && abs && abstract.has(abs)) nums.set(id, abstract.get(abs)!)
  }
  return nums
}

/** Google Docs wraps every link as https://www.google.com/url?q=<real>&sa=…: keep the real one. */
export function unwrapLink(href: string): string {
  try {
    const url = new URL(href)
    if (/^(www\.)?google\.com$/.test(url.hostname) && url.pathname === '/url') return url.searchParams.get('q') ?? href
  } catch { /* not absolute: returned as is, render-html.ts decides */ }
  return href
}

const flag = (rPr: string, tag: string) => {
  const m = rPr.match(new RegExp(`<w:${tag}(?:\\s+w:val="([^"]*)")?\\s*/>`))
  return !!m && !['0', 'false', 'none'].includes(m[1] ?? '')
}

/** A run nobody reading the document would see. */
function hiddenRun(rPr: string): boolean {
  if (flag(rPr, 'vanish') || flag(rPr, 'specVanish')) return true
  const color = rPr.match(/<w:color w:val="([0-9A-Fa-f]{6})"/)?.[1]?.toUpperCase()
  const size = Number(rPr.match(/<w:sz w:val="(\d+)"/)?.[1] ?? 24) // half-points
  return (color === 'FFFFFF' && size <= 8) || size <= 2
}

type Piece = Run | { image: string; alt: string }

/** document.xml → blocks. rels resolve links and images; numbering tells numbered from bulleted lists. */
export function parseDocument(xml: string, rels: Map<string, Rel>, numbering = new Map<string, Map<number, boolean>>()) {
  // Tracked deletions are not part of the document a reader sees.
  const body = (xml.match(/<w:body>([\s\S]*)<\/w:body>/)?.[1] ?? xml).replace(/<w:del\b[^>]*>[\s\S]*?<\/w:del>/g, '')
  const blocks: Block[] = []
  let hiddenRemoved = 0

  const runPieces = (run: string, href?: string): Piece[] => {
    const rPr = run.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/)?.[1] ?? ''
    if (hiddenRun(rPr)) {
      if (/<w:t\b/.test(run)) hiddenRemoved++
      return []
    }
    const style = { ...(flag(rPr, 'b') ? { bold: true } : {}), ...(flag(rPr, 'i') ? { italic: true } : {}), ...(href ? { href } : {}) }
    const pieces: Piece[] = []
    let text = ''
    const flush = () => { if (text) pieces.push({ text, ...style }); text = '' }
    for (const m of run.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\/>|<w:br\b[^>]*\/>|<w:drawing>([\s\S]*?)<\/w:drawing>/g)) {
      if (m[1] !== undefined) text += decode(m[1])
      else if (m[2] !== undefined) {
        const embed = m[2].match(/r:embed="([^"]+)"/)?.[1]
        const rel = embed ? rels.get(embed) : undefined
        if (rel && !rel.external) {
          flush()
          const docPr = m[2].match(/<wp:docPr\b([^>]*)>/)?.[1] ?? ''
          const alt = decode(attr(docPr, 'descr') || attr(docPr, 'title') || '').trim()
          pieces.push({ image: `word/${rel.target.replace(/^\/?(word\/)?/, '')}`, alt })
        }
      } else text += m[0].startsWith('<w:tab') ? '\t' : '\n'
    }
    flush()
    return pieces
  }

  const paragraphPieces = (inner: string): Piece[] => {
    const pieces: Piece[] = []
    for (const m of inner.matchAll(/<w:hyperlink\b([^>]*)>([\s\S]*?)<\/w:hyperlink>|<w:r\b[^>]*>([\s\S]*?)<\/w:r>/g)) {
      if (m[2] !== undefined) {
        const id = attr(m[1], 'r:id')
        const rel = id ? rels.get(id) : undefined
        const href = rel?.external ? unwrapLink(rel.target) : undefined
        for (const r of m[2].matchAll(/<w:r\b[^>]*>([\s\S]*?)<\/w:r>/g)) pieces.push(...runPieces(r[1], href))
      } else pieces.push(...runPieces(m[3]))
    }
    return pieces
  }

  // Joins neighbouring runs with the same style and trims the ends.
  const tidy = (runs: Run[]): Run[] => {
    const out: Run[] = []
    for (const r of runs) {
      const last = out.at(-1)
      if (last && last.bold === r.bold && last.italic === r.italic && last.href === r.href) last.text += r.text
      else out.push({ ...r })
    }
    if (out.length) { out[0].text = out[0].text.replace(/^\s+/, ''); out[out.length - 1].text = out[out.length - 1].text.replace(/\s+$/, '') }
    return out.filter((r) => r.text)
  }

  const paragraph = (inner: string) => {
    const pPr = inner.match(/<w:pPr>([\s\S]*?)<\/w:pPr>/)?.[1] ?? ''
    const style = pPr.match(/<w:pStyle w:val="([^"]+)"/)?.[1] ?? ''
    // Style ids drop non-ASCII letters: Spanish Título 1 is Ttulo1, German Überschrift 1 is berschrift1.
    const headingLevel = style.match(/^(?:Heading|Ttulo|Titre|berschrift)(\d)$/i)?.[1]
    const isTitle = style === 'Title'
    const numPr = pPr.match(/<w:numPr>([\s\S]*?)<\/w:numPr>/)?.[1]
    const make = (runs: Run[]): Block | null => {
      const clean = tidy(runs)
      if (!clean.length) return null
      if (isTitle) return { type: 'heading', level: 1, title: true, runs: clean }
      if (headingLevel) return { type: 'heading', level: Math.min(Number(headingLevel), 6), title: false, runs: clean }
      if (numPr !== undefined) {
        const level = Number(numPr.match(/<w:ilvl w:val="(\d+)"/)?.[1] ?? 0)
        const numId = numPr.match(/<w:numId w:val="([^"]+)"/)?.[1]
        return { type: 'list', ordered: !!(numId && numbering.get(numId)?.get(level)), level, runs: clean }
      }
      return { type: 'paragraph', runs: clean }
    }
    // An image splits its paragraph: text before, the image, text after.
    let runs: Run[] = []
    for (const piece of paragraphPieces(inner)) {
      if ('image' in piece) {
        const block = make(runs)
        if (block) blocks.push(block)
        runs = []
        blocks.push({ type: 'image', path: piece.image, name: piece.image.split('/').pop()!, alt: piece.alt })
      } else runs.push(piece)
    }
    const block = make(runs)
    if (block) blocks.push(block)
  }

  for (const m of body.matchAll(/<w:tbl\b[^>]*>([\s\S]*?)<\/w:tbl>|<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g)) {
    if (m[2] !== undefined) { paragraph(m[2]); continue }
    const rows: Run[][][] = []
    for (const tr of m[1].matchAll(/<w:tr\b[^>]*>([\s\S]*?)<\/w:tr>/g)) {
      const cells: Run[][] = []
      for (const tc of tr[1].matchAll(/<w:tc\b[^>]*>([\s\S]*?)<\/w:tc>/g)) {
        const runs: Run[] = []
        for (const p of tc[1].matchAll(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g)) {
          const pieces = paragraphPieces(p[1]).filter((x): x is Run => !('image' in x))
          if (runs.length && pieces.length) runs.push({ text: ' ' })
          runs.push(...pieces)
        }
        cells.push(tidy(runs))
      }
      if (cells.some((c) => c.length)) rows.push(cells)
    }
    if (rows.length) blocks.push({ type: 'table', rows })
  }
  return { blocks, hiddenRemoved }
}

/** Unpacks and parses a .docx. Throws DocxError for anything that is not a sane Word document. */
export function parseDocx(zip: Uint8Array): ParsedDocx {
  // Read the directory first and refuse archives that unpack to something huge. Each entry then
  // inflates into a buffer of its declared size, so a lying header cannot grow past the limit.
  let total = 0, mediaTotal = 0
  const mediaNames: string[] = []
  try {
    unzipSync(zip, { filter: (entry) => {
      total += entry.originalSize
      if (MEDIA.test(entry.name)) { mediaNames.push(entry.name); mediaTotal += entry.originalSize }
      return false
    } })
  } catch { throw new DocxError('This does not look like a Word document') }
  if (total > DOCX_LIMITS.unpacked || mediaTotal > DOCX_LIMITS.media) throw new DocxError('The document is too large to unpack')

  const xmlParts = ['word/document.xml', 'word/_rels/document.xml.rels', 'word/numbering.xml']
  const wanted = new Set([...xmlParts, ...mediaNames])
  let files: Record<string, Uint8Array>
  try {
    files = unzipSync(zip, { filter: (entry) => wanted.has(entry.name) && (MEDIA.test(entry.name) || entry.originalSize <= DOCX_LIMITS.xml) })
  } catch { throw new DocxError('This does not look like a Word document') }
  const xml = (name: string) => (files[name] ? new TextDecoder().decode(files[name]) : '')
  const documentXml = xml('word/document.xml')
  if (!documentXml.includes('<w:body')) throw new DocxError('This does not look like a Word document')

  const { blocks, hiddenRemoved } = parseDocument(documentXml, parseRels(xml('word/_rels/document.xml.rels')), parseNumbering(xml('word/numbering.xml')))
  const media = new Map<string, Uint8Array>()
  for (const name of mediaNames.sort()) if (files[name]) media.set(name, files[name])
  return { blocks, media, hiddenRemoved }
}

/** Plain text of some runs (titles, alt text, word counts). */
export const runsText = (runs: Run[]) => runs.map((r) => r.text).join('')
