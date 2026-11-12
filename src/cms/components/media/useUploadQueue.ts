'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AdminApiError } from '@/cms/lib/client'
import type { MediaItem } from './types'
import { uploadMedia } from './upload-client'
import { checkUpload, MAX_FILES_PER_BATCH, uploadErrorMessage } from './upload-limits'

export type UploadRow = {
  id: string
  file: File
  /** Object URL for image thumbnails; revoked when the row goes away. */
  preview: string | null
  status: 'queued' | 'uploading' | 'done' | 'error'
  /** 0..1, or null while the browser cannot tell (shown as an indeterminate bar). */
  progress: number | null
  error?: string
  /** False when trying again cannot help (wrong type, too large): the tray offers only Dismiss. */
  retryable?: boolean
  media?: MediaItem
}

const AUTO_HIDE_MS = 4000

/**
 * Upload queue shared by the media page and the picker: files go up one at a time with real progress,
 * failures stay listed with a reason and Retry, and the list clears itself a few seconds after
 * everything succeeded. `onUploaded` runs for each stored file.
 */
export function useUploadQueue({ imagesOnly = false, onUploaded }: { imagesOnly?: boolean; onUploaded?: (media: MediaItem) => void } = {}) {
  const [rows, setRows] = useState<UploadRow[]>([])
  const pending = useRef<string[]>([])
  const files = useRef(new Map<string, File>())
  const running = useRef(false)
  const abort = useRef<AbortController | null>(null)
  const uploadedRef = useRef(onUploaded)
  useEffect(() => { uploadedRef.current = onUploaded }, [onUploaded])

  const update = useCallback((id: string, patch: Partial<UploadRow>) => {
    setRows((current) => current.map((row) => row.id === id ? { ...row, ...patch } : row))
  }, [])

  const pump = useCallback(async () => {
    if (running.current) return
    running.current = true
    try {
      while (pending.current.length) {
        const id = pending.current.shift()!
        const file = files.current.get(id)
        if (!file) continue
        update(id, { status: 'uploading', progress: 0, error: undefined })
        abort.current = new AbortController()
        try {
          const media = await uploadMedia(file, { imagesOnly, signal: abort.current.signal, onProgress: (progress) => update(id, { progress }) })
          update(id, { status: 'done', progress: 1, media })
          uploadedRef.current?.(media)
        } catch (error) {
          if (abort.current?.signal.aborted) return
          const message = error instanceof AdminApiError ? uploadErrorMessage(error.status, error.message, file) : 'Upload failed. Please retry.'
          const retryable = !(error instanceof AdminApiError && [400, 413, 415].includes(error.status))
          update(id, { status: 'error', progress: null, error: message, retryable })
        }
      }
    } finally {
      running.current = false
      abort.current = null
    }
  }, [imagesOnly, update])

  const add = useCallback((list: File[] | FileList) => {
    const all = Array.from(list)
    if (!all.length) return
    if (all.length > MAX_FILES_PER_BATCH) toast.warning(`Only the first ${MAX_FILES_PER_BATCH} files were added. Drop the rest after these finish.`)
    const added: UploadRow[] = all.slice(0, MAX_FILES_PER_BATCH).map((file) => {
      const id = crypto.randomUUID()
      const problem = checkUpload(file, { imagesOnly })
      files.current.set(id, file)
      if (!problem) pending.current.push(id)
      const preview = file.type.startsWith('image/') && !problem ? URL.createObjectURL(file) : null
      return { id, file, preview, status: problem ? 'error' : 'queued', progress: problem ? null : 0, error: problem ?? undefined, retryable: !problem }
    })
    setRows((current) => [...current, ...added])
    void pump()
  }, [imagesOnly, pump])

  const retry = useCallback((id: string) => {
    const file = files.current.get(id)
    if (!file) return
    const problem = checkUpload(file, { imagesOnly })
    if (problem) { update(id, { error: problem }); return }
    update(id, { status: 'queued', progress: 0, error: undefined, retryable: true })
    pending.current.push(id)
    void pump()
  }, [imagesOnly, pump, update])

  const forget = useCallback((ids: string[]) => {
    const drop = new Set(ids)
    pending.current = pending.current.filter((id) => !drop.has(id))
    for (const id of ids) files.current.delete(id)
    setRows((current) => {
      for (const row of current) if (drop.has(row.id) && row.preview) URL.revokeObjectURL(row.preview)
      return current.filter((row) => !drop.has(row.id))
    })
  }, [])

  const remove = useCallback((id: string) => forget([id]), [forget])
  /** Clears finished rows (done or failed); uploads in progress keep going. */
  const clear = useCallback(() => forget(rows.filter((row) => row.status === 'done' || row.status === 'error').map((row) => row.id)), [forget, rows])

  // Hide the tray a few seconds after every file went up without problems.
  const allDone = rows.length > 0 && rows.every((row) => row.status === 'done')
  useEffect(() => {
    if (!allDone) return
    const timer = setTimeout(() => forget(rows.map((row) => row.id)), AUTO_HIDE_MS)
    return () => clearTimeout(timer)
  }, [allDone, rows, forget])

  // Leaving the page cancels the upload in flight and frees the thumbnails.
  const rowsRef = useRef(rows)
  useEffect(() => { rowsRef.current = rows }, [rows])
  useEffect(() => () => {
    pending.current = []
    abort.current?.abort()
    for (const row of rowsRef.current) if (row.preview) URL.revokeObjectURL(row.preview)
  }, [])

  return { rows, add, retry, remove, clear, busy: rows.some((row) => row.status === 'queued' || row.status === 'uploading') }
}
