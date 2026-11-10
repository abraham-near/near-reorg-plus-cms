'use client'

import { useCallback, useSyncExternalStore } from 'react'

// localStorage-backed UI state without the "setState in useEffect after mount" pattern.
// The server snapshot is null, so the first client render matches SSR, then React re-renders
// with the stored value. Writes notify every hook instance on the page (and other tabs via
// the `storage` event), so two components reading the same key never disagree.

const listeners = new Set<() => void>()

function subscribe(callback: () => void) {
  listeners.add(callback)
  window.addEventListener('storage', callback)
  return () => {
    listeners.delete(callback)
    window.removeEventListener('storage', callback)
  }
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStored(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {}
  listeners.forEach((l) => l())
}

/** [value, set] for one localStorage key; value is null on the server and when unset. */
export function useStoredValue(key: string): [string | null, (value: string | null) => void] {
  const value = useSyncExternalStore(subscribe, () => read(key), () => null)
  const set = useCallback((next: string | null) => writeStored(key, next), [key])
  return [value, set]
}

const noopSubscribe = () => () => {}

/** false during SSR and hydration, true afterwards. */
export const useHydrated = () => useSyncExternalStore(noopSubscribe, () => true, () => false)

/** Current time, refreshed every `intervalMs`; null on the server. */
export function useNow(intervalMs: number): Date | null {
  const tick = useSyncExternalStore(
    useCallback(
      (callback: () => void) => {
        const id = setInterval(callback, intervalMs)
        return () => clearInterval(id)
      },
      [intervalMs],
    ),
    () => Math.floor(Date.now() / intervalMs),
    () => null,
  )
  return tick === null ? null : new Date()
}
