import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** "Oct 15, 2026 · 14:05 UTC" — admin tables show UTC so every editor reads the same time. */
export function formatAdminDate(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '—'
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })
  return `${date} · ${time} UTC`
}

export function expandHexColor(color: string): string {
  return /^#[0-9a-fA-F]{3}$/.test(color) ? '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3] : color
}

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** Lowercase words joined by single hyphens (same rule as scripts/post-new.mjs). */
export const isValidSlug = (slug: string) => SLUG_PATTERN.test(slug)

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 120)
    // Trim after cutting: a cut can land on a hyphen, and a trailing one is not a valid slug.
    .replace(/^-+|-+$/g, '')
}

/** For titles with no Latin letters or digits ("日本語", "Привет"), whose slugify() is empty: "post-k3x9q2". */
export function fallbackSlug(prefix = 'post'): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return `${prefix}-${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')}`
}
