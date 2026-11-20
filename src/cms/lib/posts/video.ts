// A video post's video (Post.video): an uploaded file of the media library, or a YouTube/Vimeo player
// URL. One parser for the editor (browser) and the API, so it has no server-only imports.
// The public site checks the stored value again on its own (src/lib/blog/video.ts).
// The body's embed block keeps its own parser (editor/extensions/EmbedBlock.ts): it rewrites
// existing embeds on every save, so it must not change with this one.

/** An uploaded MP4/WebM, exactly as the media library stores it (/cms/<name>.<ext>). MOV is not
 *  accepted: QuickTime files do not play reliably in Chrome or Firefox. */
const CMS_VIDEO = /^\/cms\/[A-Za-z0-9_-]+\.(mp4|webm)$/

export const isCmsVideoUrl = (value: string) => CMS_VIDEO.test(value)

const YT_ID = /^[\w-]{11}$/
const YT_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'])
const VIMEO_HOSTS = new Set(['vimeo.com', 'www.vimeo.com'])

/** "90", "90s", "1m30s", "1h2m3s" → seconds; anything else → null */
function seconds(value: string | null): number | null {
  if (!value) return null
  if (/^\d+$/.test(value)) return Number(value)
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(value)
  if (!m || !(m[1] || m[2] || m[3])) return null
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0)
}

function youtube(id: string | undefined, url: URL): string | null {
  // "videoseries" (a playlist player) is 11 characters too, but it is not a video.
  if (!id || !YT_ID.test(id) || id === 'videoseries') return null
  const start = seconds(url.searchParams.get('start') ?? url.searchParams.get('t'))
  return `https://www.youtube-nocookie.com/embed/${id}${start ? `?start=${start}` : ''}`
}

function vimeo(id: string | undefined, hash: string | null | undefined): string | null {
  if (!id || !/^\d+$/.test(id)) return null
  const h = hash && /^[0-9a-f]+$/i.test(hash) ? hash : null
  return `https://player.vimeo.com/video/${id}${h ? `?h=${h}` : ''}`
}

/**
 * A YouTube or Vimeo page/player link → its privacy-friendly player URL, or null.
 * Idempotent: its own output comes back unchanged.
 */
export function videoEmbedUrl(input: string): string | null {
  let url: URL
  try { url = new URL(input.trim()) } catch { return null }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return null
  const host = url.hostname.toLowerCase()
  const parts = url.pathname.split('/').filter(Boolean)

  if (host === 'youtu.be') return parts.length === 1 ? youtube(parts[0], url) : null
  if (YT_HOSTS.has(host)) {
    if (url.pathname === '/watch') return youtube(url.searchParams.get('v') ?? undefined, url)
    if (parts.length === 2 && ['embed', 'shorts', 'live'].includes(parts[0]!)) return youtube(parts[1], url)
    return null
  }
  if (host === 'player.vimeo.com') {
    return parts.length === 2 && parts[0] === 'video' ? vimeo(parts[1], url.searchParams.get('h')) : null
  }
  if (VIMEO_HOSTS.has(host)) {
    if (parts.length === 1) return vimeo(parts[0], url.searchParams.get('h'))
    if (parts.length === 2 && /^\d+$/.test(parts[0]!)) return vimeo(parts[0], parts[1])
    if (parts.length === 3 && parts[0] === 'channels') return vimeo(parts[2], null)
    return null
  }
  return null
}

/** What the editor or the API sends as `video` → the value to store, or null if it is not a video. */
export function normalizeVideo(input: string): string | null {
  const value = input.trim()
  if (isCmsVideoUrl(value)) return value
  return videoEmbedUrl(value)
}

export type VideoKind = 'file' | 'embed'
export const videoKind = (value: string): VideoKind => (value.startsWith('/cms/') ? 'file' : 'embed')

export const VIDEO_INPUT_ERROR = 'Choose an uploaded MP4/WebM or paste a YouTube or Vimeo link'
