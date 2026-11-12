// Upload limits for the browser. The server decides the type from the file's bytes (src/cms/lib/media.ts,
// server-only); this mirrors its table so the UI can explain limits and refuse obvious mistakes before
// sending anything. tests/cms/media-ui.test.ts keeps the two tables in step.

const KB = 1024
const MB = 1024 * 1024

export type UploadGroup = 'image' | 'video' | 'audio' | 'document' | 'font'
export type UploadKind = { ext: string; aliases?: string[]; mimes: string[]; label: string; max: number; group: UploadGroup }

export const UPLOAD_KINDS: UploadKind[] = [
  { ext: 'jpg', aliases: ['jpeg'], mimes: ['image/jpeg'], label: 'JPG', max: 15 * MB, group: 'image' },
  { ext: 'png', mimes: ['image/png'], label: 'PNG', max: 15 * MB, group: 'image' },
  { ext: 'webp', mimes: ['image/webp'], label: 'WebP', max: 15 * MB, group: 'image' },
  { ext: 'gif', mimes: ['image/gif'], label: 'GIF', max: 15 * MB, group: 'image' },
  { ext: 'avif', mimes: ['image/avif'], label: 'AVIF', max: 15 * MB, group: 'image' },
  { ext: 'svg', mimes: ['image/svg+xml'], label: 'SVG', max: 2 * MB, group: 'image' },
  { ext: 'mp4', mimes: ['video/mp4'], label: 'MP4', max: 200 * MB, group: 'video' },
  { ext: 'webm', mimes: ['video/webm'], label: 'WebM', max: 200 * MB, group: 'video' },
  { ext: 'mov', mimes: ['video/quicktime'], label: 'MOV', max: 200 * MB, group: 'video' },
  { ext: 'mp3', mimes: ['audio/mpeg', 'audio/mp3'], label: 'MP3', max: 50 * MB, group: 'audio' },
  { ext: 'm4a', mimes: ['audio/mp4', 'audio/x-m4a'], label: 'M4A', max: 50 * MB, group: 'audio' },
  { ext: 'wav', mimes: ['audio/wav', 'audio/x-wav', 'audio/wave'], label: 'WAV', max: 50 * MB, group: 'audio' },
  { ext: 'ogg', mimes: ['audio/ogg'], label: 'OGG', max: 50 * MB, group: 'audio' },
  { ext: 'pdf', mimes: ['application/pdf'], label: 'PDF', max: 50 * MB, group: 'document' },
  { ext: 'docx', mimes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'], label: 'DOCX', max: 50 * MB, group: 'document' },
  { ext: 'xlsx', mimes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], label: 'XLSX', max: 50 * MB, group: 'document' },
  { ext: 'pptx', mimes: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'], label: 'PPTX', max: 100 * MB, group: 'document' },
  { ext: 'csv', mimes: ['text/csv'], label: 'CSV', max: 20 * MB, group: 'document' },
  { ext: 'zip', mimes: ['application/zip', 'application/x-zip-compressed'], label: 'ZIP', max: 100 * MB, group: 'document' },
  { ext: 'woff', mimes: ['font/woff'], label: 'WOFF', max: 5 * MB, group: 'font' },
  { ext: 'woff2', mimes: ['font/woff2'], label: 'WOFF2', max: 5 * MB, group: 'font' },
]

/** At most this many files are queued from one drop or one pick. */
export const MAX_FILES_PER_BATCH = 25

export const extensionOf = (name: string) => {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
}

/** The kind a file will most likely be stored as: by extension, then by the browser's type. */
export function findUploadKind(file: { name: string; type?: string }): UploadKind | null {
  const ext = extensionOf(file.name)
  const byExt = UPLOAD_KINDS.find((kind) => kind.ext === ext || kind.aliases?.includes(ext))
  if (byExt) return byExt
  const type = (file.type || '').toLowerCase()
  return (type && UPLOAD_KINDS.find((kind) => kind.mimes.includes(type))) || null
}

/** "512 B", "284 KB", "1.4 MB", "22 MB". */
export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return '—'
  if (bytes < KB) return `${bytes} B`
  if (bytes < MB) return `${Math.max(1, Math.round(bytes / KB))} KB`
  const mb = bytes / MB
  return `${mb < 10 ? Math.round(mb * 10) / 10 : Math.round(mb)} MB`
}

export const tooLargeMessage = (size: number, max: number) => `Too large (${formatBytes(size)}). Max ${formatBytes(max)}.`

/** Why this file would be refused, or null when it looks fine (the server still has the last word). */
export function checkUpload(file: { name: string; type?: string; size: number }, opts: { imagesOnly?: boolean } = {}): string | null {
  if (file.size === 0) return 'This file is empty.'
  const kind = findUploadKind(file)
  const ext = extensionOf(file.name)
  if (!kind) return `This file type${ext ? ` (.${ext})` : ''} can't be uploaded.`
  if (opts.imagesOnly && kind.group !== 'image') return 'Only images can be added here.'
  if (file.size > kind.max) return tooLargeMessage(file.size, kind.max)
  return null
}

/** Value for <input type="file" accept>. */
export function acceptAttribute(imagesOnly = false) {
  return UPLOAD_KINDS.filter((kind) => !imagesOnly || kind.group === 'image')
    .flatMap((kind) => [`.${kind.ext}`, ...(kind.aliases ?? []).map((alias) => `.${alias}`), ...kind.mimes])
    .join(',')
}

const listOf = (labels: string[]) => labels.length < 2 ? labels.join('') : `${labels.slice(0, -1).join(', ')} or ${labels[labels.length - 1]}`
const maxOf = (kinds: UploadKind[]) => Math.max(...kinds.map((kind) => kind.max))

/** One or two short lines describing what can be dropped, built from the table above. */
export function uploadLimitLines(imagesOnly = false): string[] {
  const images = UPLOAD_KINDS.filter((kind) => kind.group === 'image')
  const svg = images.find((kind) => kind.ext === 'svg')
  const raster = images.filter((kind) => kind !== svg)
  const first = `${listOf(images.map((kind) => kind.label))} · up to ${formatBytes(maxOf(raster))} each${svg ? ` (SVG ${formatBytes(svg.max)})` : ''}`
  if (imagesOnly) return [first]
  const group = (name: UploadGroup) => UPLOAD_KINDS.filter((kind) => kind.group === name)
  const documents = group('document')
  const docMax = documents.find((kind) => kind.ext === 'pdf')?.max ?? maxOf(documents)
  const big = documents.filter((kind) => kind.max > docMax)
  return [first, `Video up to ${formatBytes(maxOf(group('video')))} · audio, PDF and Office files up to ${formatBytes(Math.max(maxOf(group('audio')), docMax))}${big.length ? ` (${big.map((kind) => kind.label).join(', ')} ${formatBytes(maxOf(big))})` : ''}`]
}

/** Short type label for a stored file: "PNG", "PDF", or the extension. */
export function typeLabel(item: { mimeType: string; filename: string }) {
  const kind = UPLOAD_KINDS.find((k) => k.mimes[0] === item.mimeType) ?? findUploadKind({ name: item.filename, type: item.mimeType })
  return kind?.label ?? (extensionOf(item.filename).toUpperCase() || item.mimeType.split('/')[1]?.toUpperCase() || 'File')
}

export const isImage = (item: { mimeType: string }) => item.mimeType.startsWith('image/')

/** A clear sentence for a failed upload, from the HTTP status and the server's message. */
export function uploadErrorMessage(status: number, serverMessage: string, file: { name: string; type?: string; size: number }) {
  const kind = findUploadKind(file)
  if (status === 413) {
    const max = serverMessage.match(/max (\d+(?:\.\d+)?) MB/i)
    const limit = max ? Number(max[1]) * MB : kind?.max
    return limit ? tooLargeMessage(file.size, limit) : `Too large (${formatBytes(file.size)}).`
  }
  if (status === 415 && /unsupported|unrecognized/i.test(serverMessage)) return "This file type can't be uploaded, or its contents don't match its name."
  return serverMessage || 'Upload failed. Please retry.'
}

/** The tile's second line: usage first, then missing alt text; type and size until usage is known. */
export function tileMeta(item: { mimeType: string; filename: string; size: number; alt: string | null }, usage: number | undefined) {
  if (usage === undefined) return `${typeLabel(item)} · ${formatBytes(item.size)}`
  if (usage === 0) return 'Not used yet'
  if (isImage(item) && !item.alt?.trim()) return 'Missing alt text'
  return `In ${usage} ${usage === 1 ? 'post' : 'posts'}`
}
