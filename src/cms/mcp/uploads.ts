import { lstat, mkdir, readdir, readFile, realpath } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'

export const MAX_UPLOAD = 15 * 1024 * 1024
export const IMAGE_TYPES: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif',
}

const noDir = 'Uploads are disabled: set NEAR_CMS_UPLOAD_DIR to the folder that holds the images (export it before starting Claude Code, or edit env in .mcp.json; in Claude Desktop, choose the folder in the extension settings)'

/** The Claude Desktop extension's upload folder when none is chosen in its settings. */
export const defaultUploadDir = () => path.join(homedir(), 'Documents', 'NEAR CMS uploads')

/** The upload folder, resolved. Everything the server reads or writes stays inside it. */
export async function uploadRoot(uploadDir: string | null, create = false): Promise<string> {
  if (!uploadDir) throw new Error(noDir)
  // Only open_upload_folder creates it; reading and uploading never do.
  if (create) await mkdir(uploadDir, { recursive: true })
  try { return await realpath(uploadDir) } catch { throw new Error(`The upload folder does not exist: ${uploadDir}`) }
}

/** Resolves a path relative to the upload folder to a regular file inside it (no dotfiles, no symlinks). */
export async function resolveInside(input: string, uploadDir: string | null): Promise<{ root: string; real: string; size: number }> {
  const root = await uploadRoot(uploadDir)
  if (input.split(/[\\/]/).some((s) => s.startsWith('.'))) throw new Error('Paths with segments starting with "." (including ..) are not allowed')
  const candidate = path.resolve(root, input)
  let real: string
  try { real = await realpath(candidate) } catch { throw new Error('File not found inside NEAR_CMS_UPLOAD_DIR') }
  const rel = path.relative(root, real)
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) throw new Error('File is outside NEAR_CMS_UPLOAD_DIR')
  if (rel.split(path.sep).some((s) => s.startsWith('.'))) throw new Error('Hidden files and folders are not allowed')
  const st = await lstat(candidate)
  if (st.isSymbolicLink() || !st.isFile()) throw new Error('Only regular files can be used (no symlinks)')
  return { root, real, size: st.size }
}

export async function prepareUpload(input: string, uploadDir: string | null): Promise<{ blob: Blob; filename: string }> {
  const { real, size } = await resolveInside(input, uploadDir)
  const ext = path.extname(real).slice(1).toLowerCase()
  const type = IMAGE_TYPES[ext]
  if (!type) throw new Error(`Extension .${ext} is not allowed. Allowed: ${Object.keys(IMAGE_TYPES).join(', ')}`)
  if (size > MAX_UPLOAD) throw new Error('File is larger than 15 MB')
  return { blob: new Blob([await readFile(real)], { type }), filename: path.basename(real) }
}

export type UploadFile = { path: string; size: number; kind: 'image' | 'docx' | 'other' }

/** Lists the files in the upload folder (two levels deep, no hidden entries, no symlinks). */
export async function listUploads(uploadDir: string | null, limit = 500): Promise<UploadFile[]> {
  const root = await uploadRoot(uploadDir)
  const found: UploadFile[] = []
  async function walk(dir: string, depth: number) {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (found.length >= limit || entry.name.startsWith('.') || entry.isSymbolicLink()) continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) { if (depth < 2) await walk(full, depth + 1); continue }
      if (!entry.isFile()) continue
      const ext = path.extname(entry.name).slice(1).toLowerCase()
      const kind = IMAGE_TYPES[ext] ? 'image' : ext === 'docx' ? 'docx' : 'other'
      found.push({ path: path.relative(root, full), size: (await lstat(full)).size, kind })
    }
  }
  await walk(root, 1)
  return found
}
