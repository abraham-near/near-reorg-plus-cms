import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { DocxError, parseDocument, parseDocx, parseRels, type Rel } from '../lib/docx/parse'
import { renderText } from '../lib/docx/render-text'
import { IMAGE_TYPES, resolveInside } from './uploads'

// Reads a Word document from the upload folder: its text in reading order (headings, paragraphs,
// list items, links) with a marker where each image sits, and its images copied next to it so
// upload_media can send them. Parsing is shared with the CMS (src/cms/lib/docx); nothing leaves
// the upload folder.
const MAX_DOCX = 50 * 1024 * 1024

export type DocxImport = { text: string; folder: string; images: string[]; skipped: string[]; hiddenTextRemoved: number }

/** document.xml → Markdown-like text. Images become `[image: <file name>]`. */
export function docxToText(xml: string, rels: Map<string, Rel>) {
  return renderText(parseDocument(xml, rels).blocks)
}
export { parseRels }

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

  let parsed
  try { parsed = parseDocx(new Uint8Array(await readFile(real))) } catch (e) { throw new Error(e instanceof DocxError ? e.message : 'This does not look like a Word document') }
  const text = renderText(parsed.blocks)
  const media = [...parsed.media.keys()]
  const files = Object.fromEntries(parsed.media)
  const hiddenTextRemoved = parsed.hiddenRemoved

  if (!media.length) return { text, folder: '', images: [], skipped: [], hiddenTextRemoved }

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
  return { text, folder, images, skipped, hiddenTextRemoved }
}
