import { HttpError } from '@/cms/lib/http'
import { sanitizeRichHtml } from '@/cms/lib/sanitize'

// Limits checked before sanitizing: DOMPurify's cost grows with nesting depth, so a small but deeply
// nested body could tie up the server. Real posts stay far below both.
const MAX_DEPTH = 64
const MAX_ELEMENTS = 50_000
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'])

/** Rejects bodies nested deeper than MAX_DEPTH or with more than MAX_ELEMENTS tags, without parsing them. */
export function assertBodyShape(html: string) {
  let depth = 0
  let elements = 0
  for (const match of html.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)[^>]*?(\/?)>/g)) {
    const [, closing, name, selfClosing] = match
    if (closing) { depth = Math.max(0, depth - 1); continue }
    if (++elements > MAX_ELEMENTS) throw new HttpError(400, 'The post body has too many elements')
    if (selfClosing || VOID.has(name.toLowerCase())) continue
    if (++depth > MAX_DEPTH) throw new HttpError(400, `The post body is nested more than ${MAX_DEPTH} levels deep`)
  }
}

/** The post body as stored: HTML from the editor, sanitized on every save. */
export function prepareBody(html: string | undefined) {
  assertBodyShape(html ?? '')
  return sanitizeRichHtml(html ?? '')
}

/** Visible text or media, to tell an emptied body from an edited one. */
export const hasBody = (html: unknown) =>
  typeof html === 'string' && (/<(img|video|iframe)\b/i.test(html) || html.replace(/<[^>]*>|&nbsp;|\s/g, '') !== '')
