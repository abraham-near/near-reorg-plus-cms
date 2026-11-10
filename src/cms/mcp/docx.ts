import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { unzipSync } from 'fflate'
import { IMAGE_TYPES, resolveInside } from './uploads'

// Reads a Word document from the upload folder: its text in reading order (headings, paragraphs,
// list items, links) with a marker where each image sits, and its images copied next to it so
// upload_media can send them. Unzips in process (macOS and Windows); nothing leaves the upload folder.
const MAX_DOCX = 50 * 1024 * 1024
const MAX_UNPACKED = 200 * 1024 * 1024
const MAX_XML = 20 * 1024 * 1024
const MEDIA = /^word\/media\/[^/\\]+$/

export type DocxImport = { text: string; folder: string; images: string[]; skipped: string[] }

const decode = (s: string) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n))).replace(/&amp;/g, '&')

/** rId → target, from word/_rels/document.xml.rels. */
export function parseRels(xml: string) {
  const rels = new Map<string, { target: string; external: boolean }>()
  for (const m of xml.matchAll(/<Relationship\b([^>]*)\/?>/g)) {
    const attr = (name: string) => m[1].match(new RegExp(`\\b${name}="([^"]*)"`))?.[1]
    const id = attr('Id'), target = attr('Target')
    if (id && target) rels.set(id, { target: decode(target), external: attr('TargetMode') === 'External' })
  }
  return rels
}

/** document.xml → Markdown-like text. Images become `[image: <file name>]`. */
export function docxToText(xml: string, rels: Map<string, { target: string; external: boolean }>) {
  const body = xml.match(/<w:body>([\s\S]*)<\/w:body>/)?.[1] ?? xml
  const lines: string[] = []
  const runText = (fragment: string) => {
    let out = ''
    for (const m of fragment.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\/>|<w:br\b[^>]*\/>|r:embed="([^"]+)"/g)) {
      if (m[1] !== undefined) out += decode(m[1])
      else if (m[2]) {
        const rel = rels.get(m[2])
        if (rel && !rel.external) out += `\n[image: ${path.posix.basename(rel.target)}]\n`
      } else out += m[0].startsWith('<w:tab') ? '\t' : '\n'
    }
    return out
  }
  for (const p of body.matchAll(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g)) {
    const inner = p[1]
    let text = ''
    // Hyperlinks wrap their runs; keep the link target next to the text.
    let last = 0
    for (const h of inner.matchAll(/<w:hyperlink\b([^>]*)>([\s\S]*?)<\/w:hyperlink>/g)) {
      text += runText(inner.slice(last, h.index))
      const id = h[1].match(/r:id="([^"]+)"/)?.[1]
      const target = id ? rels.get(id) : undefined
      const label = runText(h[2])
      text += target?.external ? `[${label}](${target.target})` : label
      last = h.index + h[0].length
    }
    text += runText(inner.slice(last))
    text = text.replace(/[ \t]+\n/g, '\n').trim()
    if (!text) continue
    const style = inner.match(/<w:pStyle w:val="([^"]+)"/)?.[1] ?? ''
    // Style ids drop non-ASCII letters: Spanish Título 1 is Ttulo1, German Überschrift 1 is berschrift1.
    const heading = style.match(/^(?:Heading|Ttulo|Titre|berschrift)(\d)$/i)?.[1] ?? (style === 'Title' ? '1' : null)
    if (heading) lines.push(`${'#'.repeat(Math.min(Number(heading) + 1, 6))} ${text}`)
    else if (/<w:numPr>/.test(inner)) lines.push(`- ${text}`)
    else lines.push(text)
  }
  return lines.join('\n\n')
}

async function freeFolder(root: string, base: string) {
  for (let i = 1; i < 100; i++) {
    const name = i === 1 ? base : `${base}-${i}`
    try { await readdir(path.join(root, name)) } catch { return name }
  }
  throw new Error('Too many image folders for this document; clean up the upload folder')
}

export async function importDocx(input: string, uploadDir: string | null): Promise<DocxImport> {
  const { root, real, size } = await resolveInside(input, uploadDir)
  if (path.extname(real).toLowerCase() !== '.docx') throw new Error('Only .docx files can be imported')
  if (size > MAX_DOCX) throw new Error('The document is larger than 50 MB')

  const zip = new Uint8Array(await readFile(real))
  // Read the directory first and refuse archives that unpack to something huge. Each entry then
  // inflates into a buffer of its declared size, so a lying header cannot grow past the limit.
  let total = 0
  const media: string[] = []
  try {
    unzipSync(zip, { filter: (entry) => { total += entry.originalSize; if (MEDIA.test(entry.name)) media.push(entry.name); return false } })
  } catch { throw new Error('This does not look like a Word document') }
  if (total > MAX_UNPACKED) throw new Error('The document is too large to unpack')

  const wanted = new Set(['word/document.xml', 'word/_rels/document.xml.rels', ...media])
  const files = unzipSync(zip, { filter: (entry) => wanted.has(entry.name) && (MEDIA.test(entry.name) || entry.originalSize <= MAX_XML) })
  const xml = (name: string) => (files[name] ? new TextDecoder().decode(files[name]) : '')
  const documentXml = xml('word/document.xml')
  if (!documentXml.includes('<w:body')) throw new Error('This does not look like a Word document')
  const text = docxToText(documentXml, parseRels(xml('word/_rels/document.xml.rels')))

  if (!media.length) return { text, folder: '', images: [], skipped: [] }

  const folder = await freeFolder(root, `${path.basename(real, '.docx').replace(/[^\w.-]+/g, '-').replace(/^[.-]+/, '') || 'document'}-images`)
  await mkdir(path.join(root, folder))
  const images: string[] = [], skipped: string[] = []
  for (const entry of media.sort()) {
    // Only the file name is kept (no path traversal), hidden names are dropped, and wx never overwrites.
    const name = path.posix.basename(entry)
    if (name.startsWith('.')) continue
    const rel = path.join(folder, name)
    await writeFile(path.join(root, rel), files[entry], { flag: 'wx' })
    if (IMAGE_TYPES[path.extname(name).slice(1).toLowerCase()]) images.push(rel)
    else skipped.push(rel)
  }
  return { text, folder, images, skipped }
}
