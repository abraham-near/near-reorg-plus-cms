'use client'

import { AdminApiError } from '@/cms/lib/client'
import type { MediaItem } from './types'
import { findUploadKind } from './upload-limits'
import { readVideoFacts } from './video-poster'

type UploadOptions = { imagesOnly?: boolean; videosOnly?: boolean; onProgress?: (fraction: number | null) => void; signal?: AbortSignal }

/**
 * Uploads one file with real progress (fetch cannot report upload progress). Videos go up in parts (uploadVideoInParts);
 * everything else is POST /api/admin/media as adminFetch would send it: multipart "file" (+ "imagesOnly=1" or
 * "videosOnly=1"), same-origin cookies. Errors arrive as AdminApiError with the server's message. `onProgress` gets 0..1,
 * or null when the size is unknown.
 */
export function uploadMedia(file: File, opts: UploadOptions = {}): Promise<MediaItem> {
  if (!opts.imagesOnly && findUploadKind(file)?.group === 'video') return uploadVideoInParts<MediaItem>(file, opts)
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const body = new FormData()
    body.set('file', file)
    if (opts.imagesOnly) body.set('imagesOnly', '1')
    if (opts.videosOnly) body.set('videosOnly', '1')
    xhr.open('POST', '/api/admin/media')
    xhr.withCredentials = true
    xhr.upload.onprogress = (event) => opts.onProgress?.(event.lengthComputable && event.total > 0 ? event.loaded / event.total : null)
    xhr.onload = () => {
      let data: unknown = null
      try { data = xhr.responseText ? JSON.parse(xhr.responseText) : null } catch { data = null }
      if (xhr.status >= 200 && xhr.status < 300 && data) return resolve(data as MediaItem)
      // Same as adminFetch: an expired session goes to sign-in.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      if (xhr.status === 401) window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname)}`
      const error = (data ?? {}) as { error?: string; details?: unknown }
      reject(new AdminApiError(xhr.status, error.error || `Upload failed (${xhr.status || 'no response'})`, error.details))
    }
    xhr.onerror = () => reject(new AdminApiError(0, 'Network error. Check your connection and retry.'))
    xhr.onabort = () => reject(new AdminApiError(0, 'Upload cancelled.'))
    opts.signal?.addEventListener('abort', () => xhr.abort(), { once: true })
    xhr.send(body)
  })
}

/* ── videos, in parts (src/cms/lib/chunked-upload.ts) ── */

type Reply = { status: number; data: unknown }

const cancelled = () => new AdminApiError(0, 'Upload cancelled.')

/** One request with upload progress; any HTTP answer resolves (the caller decides), a network failure rejects. */
function send(method: string, url: string, body: XMLHttpRequestBodyInit, headers: Record<string, string>, signal?: AbortSignal, onProgress?: (loaded: number) => void): Promise<Reply> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(cancelled())
    const xhr = new XMLHttpRequest()
    xhr.open(method, url)
    xhr.withCredentials = true
    for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value)
    if (onProgress) xhr.upload.onprogress = (event) => onProgress(event.loaded)
    xhr.onload = () => {
      let data: unknown = null
      try { data = xhr.responseText ? JSON.parse(xhr.responseText) : null } catch { data = null }
      resolve({ status: xhr.status, data })
    }
    xhr.onerror = () => reject(new AdminApiError(0, 'Network error. Check your connection and retry.'))
    xhr.onabort = () => reject(cancelled())
    signal?.addEventListener('abort', () => xhr.abort(), { once: true })
    xhr.send(body)
  })
}

function failure({ status, data }: Reply) {
  // Same as adminFetch: an expired session goes to sign-in.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  if (status === 401) window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname)}`
  const error = (data ?? {}) as { error?: string; details?: unknown }
  return new AdminApiError(status, error.error || `Upload failed (${status || 'no response'})`, error.details)
}

const wait = (ms: number, signal?: AbortSignal) => new Promise<void>((resolve, reject) => {
  const timer = setTimeout(resolve, ms)
  signal?.addEventListener('abort', () => { clearTimeout(timer); reject(cancelled()) }, { once: true })
})

/** Retries a step that is safe to repeat: up to 3 more times on a network error, a 429 or a 5xx (1 s, 2 s, 4 s apart). */
async function withRetries(step: () => Promise<Reply>, signal?: AbortSignal): Promise<Reply> {
  for (let attempt = 0; ; attempt++) {
    let reply: Reply
    try { reply = await step() } catch (error) {
      if (signal?.aborted || attempt >= 3) throw error
      await wait(1000 * 2 ** attempt, signal)
      continue
    }
    if ((reply.status === 429 || reply.status >= 500) && attempt < 3) { await wait(1000 * 2 ** attempt, signal); continue }
    return reply
  }
}

const ok = (reply: Reply) => reply.status >= 200 && reply.status < 300

/**
 * A video of up to 100 MB, in parts small enough for one request each (src/proxy.ts passes at most 10 MB of a body, and
 * Railway ends a request whose body takes over 5 minutes): start, the parts one at a time (a failed part is sent again,
 * not the whole file), complete. Cancelling, a failure or leaving the page drops what was sent. `replaceId` replaces a
 * library file everywhere it is used (the answer is then the replace route's: {media, updated, occurrences}).
 */
export async function uploadVideoInParts<T>(file: File, opts: UploadOptions & { replaceId?: string } = {}): Promise<T> {
  const { signal } = opts
  const ext = findUploadKind(file)?.ext ?? ''
  const json = { 'content-type': 'application/json' }
  const start = await send('POST', '/api/admin/media/uploads', JSON.stringify({ filename: file.name, ext, size: file.size, videosOnly: !!opts.videosOnly, ...(opts.replaceId ? { replaceId: opts.replaceId } : {}) }), json, signal)
  if (!ok(start)) throw failure(start)
  const { ticket, partSize, parts } = start.data as { ticket: string; partSize: number; parts: number }
  // Size, length and a poster frame, read from the file while its parts go up.
  const facts = readVideoFacts(file)

  const drop = () => {
    void fetch('/api/admin/media/uploads/abort', { method: 'POST', keepalive: true, credentials: 'same-origin', headers: json, body: JSON.stringify({ ticket }) }).catch(() => undefined)
  }
  window.addEventListener('pagehide', drop)
  try {
    let sent = 0
    opts.onProgress?.(0)
    for (let n = 1; n <= parts; n++) {
      const part = file.slice((n - 1) * partSize, Math.min(file.size, n * partSize), 'application/octet-stream')
      const reply = await withRetries(() => send('PUT', `/api/admin/media/uploads/part?n=${n}`, part, { 'x-upload-ticket': ticket }, signal, (loaded) => opts.onProgress?.(Math.min(1, (sent + loaded) / file.size))), signal)
      if (!ok(reply)) throw failure(reply)
      sent += part.size
      opts.onProgress?.(sent / file.size)
    }
    const { poster, ...size } = await facts
    const done = await withRetries(() => send('POST', '/api/admin/media/uploads/complete', JSON.stringify({ ticket, ...size, ...(opts.replaceId ? { replaceEverywhere: true } : {}) }), json, signal), signal)
    if (!ok(done)) throw failure(done)
    // The poster is a nicety: the video is stored either way.
    if (poster) {
      const framed = await send('PUT', '/api/admin/media/uploads/poster', poster, { 'x-upload-ticket': ticket }, signal).catch(() => null)
      if (framed && ok(framed)) {
        const data = done.data as { media?: unknown }
        return (data && typeof data === 'object' && 'media' in data ? { ...data, media: framed.data } : framed.data) as T
      }
    }
    return done.data as T
  } catch (error) {
    drop()
    throw error
  } finally {
    window.removeEventListener('pagehide', drop)
  }
}
