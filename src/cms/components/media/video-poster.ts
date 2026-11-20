'use client'

// What the browser can read from a video file before it is sent: its size in pixels, its length and a frame to use as its
// poster. All local (an object URL of the file): nothing leaves the browser here. A video the browser cannot decode (a MOV
// on Chrome, an unusual codec) simply gives nothing, and the upload goes on without a poster.

export type VideoFacts = { width?: number; height?: number; duration?: number; poster: Blob | null }

/** Longest side of the poster frame; the server re-encodes it to WebP (and caps it again). */
const POSTER_SIDE = 1280
const TIMEOUT_MS = 15_000

const once = (target: EventTarget, type: string) => new Promise<void>((resolve, reject) => {
  const ok = () => { target.removeEventListener('error', fail); resolve() }
  const fail = () => { target.removeEventListener(type, ok); reject(new Error(`video ${type} failed`)) }
  target.addEventListener(type, ok, { once: true })
  target.addEventListener('error', fail, { once: true })
})

/** The frame about a second in (a tenth in for a very short video), so it is rarely a black first frame. */
export const posterTime = (duration: number) => (Number.isFinite(duration) && duration > 0 ? Math.min(1, duration / 10) : 0)

export async function readVideoFacts(file: Blob): Promise<VideoFacts> {
  if (typeof document === 'undefined') return { poster: null }
  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'
  const work = (async (): Promise<VideoFacts> => {
    const loaded = once(video, 'loadeddata')
    video.src = url
    await loaded
    const { videoWidth: width, videoHeight: height, duration } = video
    const facts: VideoFacts = {
      ...(width && height ? { width, height } : {}),
      ...(Number.isFinite(duration) && duration > 0 ? { duration } : {}),
      poster: null,
    }
    if (!width || !height) return facts
    const seeked = once(video, 'seeked')
    video.currentTime = posterTime(duration)
    await seeked
    const scale = Math.min(1, POSTER_SIDE / Math.max(width, height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(width * scale)
    canvas.height = Math.round(height * scale)
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)
    facts.poster = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
    return facts
  })()
  const timeout = new Promise<VideoFacts>((resolve) => setTimeout(() => resolve({ poster: null }), TIMEOUT_MS))
  try {
    return await Promise.race([work.catch(() => ({ poster: null })), timeout])
  } finally {
    video.removeAttribute('src')
    video.load()
    URL.revokeObjectURL(url)
  }
}

/** "0:42", "12:05", "1:02:03". */
export function formatDuration(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds) || seconds < 0) return ''
  const s = Math.round(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const pad = (n: number) => String(n).padStart(2, '0')
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`
}
