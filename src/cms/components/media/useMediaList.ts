'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { adminFetch } from '@/cms/lib/client'
import type { MediaItem, MediaListResult } from './types'

export type MediaFilters = { q: string; type: 'all' | 'image' | 'video' | 'other'; unused?: boolean }

const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Please retry.'

/**
 * Pages of GET /api/admin/media for the current filters. Typing in the search box is debounced; other
 * filter changes load at once. Stale responses are dropped. `loading` is true until the first page of
 * the current filters arrives (show skeletons), `loadingMore` while appending.
 */
export function useMediaList(filters: MediaFilters, { debounceMs = 250 } = {}) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const request = useRef(0)
  const { q, type, unused = false } = filters

  const fetchPage = useCallback(async (pageNumber: number) => {
    const id = ++request.current
    if (pageNumber === 1) setLoading(true)
    else setLoadingMore(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(pageNumber), type })
      if (q.trim()) params.set('q', q.trim())
      if (unused) params.set('unused', '1')
      const data = await adminFetch<MediaListResult>(`/api/admin/media?${params}`)
      if (id !== request.current) return
      setItems((current) => {
        if (pageNumber === 1) return data.items
        const seen = new Set(current.map((item) => item.id))
        return [...current, ...data.items.filter((item) => !seen.has(item.id))]
      })
      setTotal(data.total)
      setPage(pageNumber)
    } catch (err) {
      if (id === request.current) setError(errorMessage(err))
    } finally {
      if (id === request.current) { setLoading(false); setLoadingMore(false) }
    }
  }, [q, type, unused])

  // The search text is the only filter that changes on every keystroke.
  const lastQ = useRef(q)
  useEffect(() => {
    const typing = lastQ.current !== q
    lastQ.current = q
    const timer = setTimeout(() => { void fetchPage(1) }, typing ? debounceMs : 0)
    // Bumping the counter makes any response still in flight for the old filters stale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { clearTimeout(timer); request.current++ }
  }, [fetchPage, q, debounceMs])

  const loadMore = useCallback(() => { if (!loadingMore && items.length < total) void fetchPage(page + 1) }, [fetchPage, items.length, loadingMore, page, total])
  const reload = useCallback(() => fetchPage(1), [fetchPage])

  const itemsRef = useRef(items)
  useEffect(() => { itemsRef.current = items }, [items])

  /** Puts a just-uploaded file first (or leaves it where it is when the same bytes were already there). */
  const prepend = useCallback((item: MediaItem) => {
    if (itemsRef.current.some((existing) => existing.id === item.id)) return
    itemsRef.current = [item, ...itemsRef.current]
    setItems(itemsRef.current)
    setTotal((count) => count + 1)
  }, [])
  const replace = useCallback((id: string, item: MediaItem) => setItems((current) => current.map((existing) => existing.id === id ? item : existing)), [])
  const remove = useCallback((ids: string[]) => {
    const drop = new Set(ids)
    const kept = itemsRef.current.filter((item) => !drop.has(item.id))
    const removed = itemsRef.current.length - kept.length
    itemsRef.current = kept
    setItems(kept)
    setTotal((count) => Math.max(0, count - removed))
  }, [])

  return { items, total, loading, loadingMore, error, hasMore: items.length < total, loadMore, reload, prepend, replace, remove }
}
