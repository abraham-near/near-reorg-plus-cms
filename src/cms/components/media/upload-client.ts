'use client'

import { AdminApiError } from '@/cms/lib/client'
import type { MediaItem } from './types'

/**
 * POST /api/admin/media with real progress (fetch cannot report upload progress). Same request as
 * adminFetch would send: multipart "file" (+ "imagesOnly=1"), same-origin cookies; errors arrive as
 * AdminApiError with the server's message. `onProgress` gets 0..1, or null when the size is unknown.
 */
export function uploadMedia(file: File, opts: { imagesOnly?: boolean; onProgress?: (fraction: number | null) => void; signal?: AbortSignal } = {}): Promise<MediaItem> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const body = new FormData()
    body.set('file', file)
    if (opts.imagesOnly) body.set('imagesOnly', '1')
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
