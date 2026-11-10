import type { Prisma } from '@/generated/prisma/client'

// Work on JSON string values only, preserving keys, types and HTML around whole URL tokens.
export function replaceExactUrl(value: Prisma.JsonValue, oldUrl: string, newUrl: string): { value: Prisma.JsonValue; count: number } {
  let count = 0
  function replaceUrl(url: string) {
    if (url !== oldUrl) return url
    count++
    return newUrl
  }
  function replaceString(input: string) {
    // Parse complete URL attributes first so query parameters are never treated as file references.
    return input.replace(/\b((?:srcset|src|href|poster)\s*=\s*)("[^"]*"|'[^']*'|[^\s>]+)|[^\s"'<>]+/gi, (token, attribute: string | undefined, raw: string | undefined) => {
      if (attribute && raw) {
        const quote = raw.startsWith('"') || raw.startsWith("'") ? raw[0] : ''
        const value = quote ? raw.slice(1, -1) : raw
        const replaced = /^srcset/i.test(attribute)
          ? value.replace(/(^|,)(\s*)([^\s,]+)([^,]*)/g, (_candidate, comma: string, space: string, url: string, descriptor: string) => comma + space + replaceUrl(url) + descriptor)
          : value.replace(/^(\s*)([\s\S]*?)(\s*)$/, (_attribute, leading: string, url: string, trailing: string) => leading + replaceUrl(url) + trailing)
        return attribute + quote + replaced + quote
      }
      if (token === oldUrl) return replaceUrl(token)
      // Also recognize prose punctuation and CSS url() without entering a larger URL.
      for (const [prefix, suffix] of [['', ','], ['', '.'], ['', ';'], ['(', ')'], ['url(', ')']]) {
        if (token === prefix + oldUrl + suffix) return prefix + replaceUrl(oldUrl) + suffix
      }
      return token
    })
  }
  function visit(input: Prisma.JsonValue): Prisma.JsonValue {
    if (typeof input === 'string') {
      return replaceString(input)
    }
    if (Array.isArray(input)) return input.map(visit)
    if (input && typeof input === 'object') return Object.fromEntries(Object.entries(input).map(([key, child]) => [key, visit(child ?? null)]))
    return input
  }
  return { value: visit(value), count }
}

export function isCmsMediaUrl(url: string) {
  return /^\/cms\/[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(url)
}
