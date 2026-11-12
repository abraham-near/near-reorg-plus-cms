'use client'

// Light / dark / system theme for the CMS. The choice lives in this browser (localStorage, a
// per-viewer convenience); THEME_SCRIPT applies it before first paint so there is no flash.
// Tokens for both themes: src/app/(cms)/admin.css (:root and .dark).
import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from 'react'
import { Toaster } from 'sonner'

export type ThemeChoice = 'light' | 'dark' | 'system'
const KEY = 'cms-theme'
const QUERY = '(prefers-color-scheme: dark)'

/** Runs in <head> before the body paints: same rules as resolve() below. */
export const THEME_SCRIPT = `(function(){try{var c=localStorage.getItem('${KEY}');var d=c==='dark'||(c==='system'&&matchMedia('${QUERY}').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

function readChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'dark' || v === 'system' ? v : 'light'
  } catch {
    return 'light'
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  const mq = window.matchMedia(QUERY)
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) cb() }
  mq.addEventListener('change', cb)
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(cb)
    mq.removeEventListener('change', cb)
    window.removeEventListener('storage', onStorage)
  }
}

const resolve = (choice: ThemeChoice) => (choice === 'system' ? (window.matchMedia(QUERY).matches ? 'dark' : 'light') : choice)

type Ctx = { choice: ThemeChoice; resolved: 'light' | 'dark'; setChoice: (c: ThemeChoice) => void }
const ThemeContext = createContext<Ctx>({ choice: 'light', resolved: 'light', setChoice: () => {} })
export const useTheme = () => useContext(ThemeContext)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const choice = useSyncExternalStore(subscribe, readChoice, () => 'light' as ThemeChoice)
  const resolved = useSyncExternalStore(subscribe, () => resolve(readChoice()), () => 'light' as const)

  // Keep <html class="dark"> in step (system changes, other tabs).
  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark')
  }, [resolved])

  const setChoice = useCallback((next: ThemeChoice) => {
    const root = document.documentElement
    // A short cross-fade of colours only while switching (none with reduced motion: see admin.css).
    root.classList.add('theme-switching')
    try { localStorage.setItem(KEY, next) } catch { /* private mode: applies to this page only */ }
    root.classList.toggle('dark', resolve(next) === 'dark')
    emit()
    window.setTimeout(() => root.classList.remove('theme-switching'), 320)
  }, [])

  const value = useMemo(() => ({ choice, resolved, setChoice }), [choice, resolved, setChoice])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/** Sonner follows the CMS theme, not the OS. */
export function ThemedToaster() {
  const { resolved } = useTheme()
  return <Toaster richColors position="bottom-right" theme={resolved} />
}
