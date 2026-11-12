// Plain-text views of a post body (sanitized HTML) for summaries: word counts and snippets.
// Pure and dependency-free so both server loaders and tests can use them.

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" }

/** Visible text of an HTML fragment: tags dropped, block boundaries kept as spaces, entities decoded. */
export function htmlToText(html: string | null | undefined) {
  if (!html) return ''
  return html
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
      const lower = code.toLowerCase()
      if (lower in ENTITIES) return ENTITIES[lower]
      if (lower.startsWith('#x')) return String.fromCodePoint(Number.parseInt(lower.slice(2), 16) || 32)
      if (lower.startsWith('#')) return String.fromCodePoint(Number.parseInt(lower.slice(1), 10) || 32)
      return match
    })
    .replace(/\s+/g, ' ')
    .trim()
}

/** Words that contain at least one letter or digit ("—" and "·" are not words). */
export function countWords(text: string) {
  return text.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length
}

/** The first `max` characters, cut at a word boundary, with "…" when shortened. */
export function textSnippet(text: string, max = 120) {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const space = cut.lastIndexOf(' ')
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s.,;:!?·—-]+$/, '')}…`
}

/** The last `max` characters, starting at a word boundary, with "…" in front when shortened: where the writer left off. */
export function textTail(text: string, max = 120) {
  if (text.length <= max) return text
  const cut = text.slice(-max)
  // Starts mid-word unless the character before the cut is a space: drop the partial word.
  const space = text[text.length - max - 1] === ' ' ? -1 : cut.indexOf(' ')
  return `…${(space >= 0 && space < max * 0.4 ? cut.slice(space + 1) : cut).trimStart()}`
}
