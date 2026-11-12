// The publish pre-flight checklist and the text helpers it needs. Pure (no DOM), unit-tested in
// tests/cms/post-publish.test.ts. Checks never block publishing: a failing one is a warning with a fix.

export const MIN_BODY_WORDS = 150
export const WORDS_PER_MINUTE = 220
export const SEARCH_TITLE_MAX = 60

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" }

/** Readable text of an HTML body: block ends become spaces so words never run together. */
export function plainText(html: string): string {
  return html
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|h[1-6]|li|blockquote|pre|td|th|div|figcaption)>|<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&(amp|lt|gt|quot|apos|nbsp|#39);/g, (_, name: string) => ENTITIES[name])
    .replace(/\s+/g, ' ')
    .trim()
}

export const countWords = (html: string) => plainText(html).split(' ').filter(Boolean).length
export const readingMinutes = (words: number) => Math.max(1, Math.ceil(words / WORDS_PER_MINUTE))

/** Number of <img> tags with no alt attribute, or an empty one. */
export function imagesMissingAlt(html: string): { total: number; missing: number } {
  const images = html.match(/<img\b[^>]*>/gi) ?? []
  const missing = images.filter((tag) => {
    const alt = /\salt\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i.exec(tag)
    return !alt || !(alt[1] ?? alt[2] ?? alt[3] ?? '').trim()
  }).length
  return { total: images.length, missing }
}

/** First ~160 characters of the body, for the search-result preview when there is no summary. */
export function snippet(html: string, max = 160): string {
  const text = plainText(html)
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}

export type CheckKey = 'title' | 'summary' | 'category' | 'cover' | 'alt' | 'length'
export type PublishCheck = { key: CheckKey; ok: boolean; title: string; detail: string; action?: string }

export function publishChecks(input: { title: string; excerpt: string; categoryNames: string[]; featuredImage: string; body: string }): PublishCheck[] {
  const title = input.title.trim()
  const words = countWords(input.body)
  const images = imagesMissingAlt(input.body)
  return [
    title
      ? { key: 'title', ok: true, title: 'Title', detail: `${title.length} characters · ${title.length <= SEARCH_TITLE_MAX ? 'fits in search results' : 'may be cut off in search results'}` }
      : { key: 'title', ok: false, title: 'No title', detail: 'Readers and search engines need one.', action: 'Add title' },
    input.excerpt.trim()
      ? { key: 'summary', ok: true, title: 'Summary', detail: 'Used for listings and as the search description' }
      : { key: 'summary', ok: false, title: 'No summary', detail: 'Listings and search will show the first lines of the post.', action: 'Add summary' },
    input.categoryNames.length
      ? { key: 'category', ok: true, title: 'Category', detail: input.categoryNames.join(', ') }
      : { key: 'category', ok: false, title: 'No category', detail: 'The post will not appear under any topic.', action: 'Choose' },
    input.featuredImage.trim()
      ? { key: 'cover', ok: true, title: 'Cover image', detail: 'Shown at the top and on shared links' }
      : { key: 'cover', ok: false, title: 'No cover image', detail: 'Shared links will show a plain card.', action: 'Add cover' },
    images.missing
      ? { key: 'alt', ok: false, title: `${images.missing} image${images.missing === 1 ? '' : 's'} without alt text`, detail: 'Screen readers and search need it.', action: 'Fix' }
      : { key: 'alt', ok: true, title: 'Images have alt text', detail: images.total ? `${images.total} image${images.total === 1 ? '' : 's'} described` : 'No images in the body' },
    words >= MIN_BODY_WORDS
      ? { key: 'length', ok: true, title: 'Body length', detail: `${words} words · ${readingMinutes(words)} min read` }
      : { key: 'length', ok: false, title: `Short post · ${words} word${words === 1 ? '' : 's'}`, detail: `Posts under ${MIN_BODY_WORDS} words can look thin in search.`, action: 'Keep writing' },
  ]
}
