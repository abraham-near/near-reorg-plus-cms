import DOMPurify from 'isomorphic-dompurify'

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

/** Escape text for interpolation into HTML (emails, attributes). */
export const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (c) => HTML_ESCAPES[c])

const SAFE_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:'])

/**
 * Returns the URL if it is safe to put in href/src, else null. Allows http(s), mailto, tel,
 * site-relative paths ("/x", not protocol-relative "//x") and fragments.
 */
export function safeUrl(value: unknown, opts: { allowRelative?: boolean } = { allowRelative: true }): string | null {
  if (typeof value !== 'string') return null
  const url = value.trim()
  if (!url) return null
  if (opts.allowRelative !== false && ((url.startsWith('/') && !url.startsWith('//')) || url.startsWith('#'))) return url
  try {
    return SAFE_SCHEMES.has(new URL(url).protocol) ? url : null
  } catch {
    return null
  }
}

/** Hosts whose iframes may appear in CMS-authored HTML. Exact host match only. */
export const EMBED_HOSTS = new Set([
  'www.youtube-nocookie.com',
  'www.youtube.com',
  'youtube.com',
  'player.vimeo.com',
  'lu.ma',
  'luma.com',
  'open.spotify.com',
  'w.soundcloud.com',
  'docs.google.com',
])

export function isAllowedEmbed(src: unknown): boolean {
  if (typeof src !== 'string') return false
  try {
    const url = new URL(src)
    return url.protocol === 'https:' && EMBED_HOSTS.has(url.hostname)
  } catch {
    return false
  }
}

let hooked = false
function installHooks() {
  if (hooked) return
  hooked = true
  DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    if (data.tagName === 'iframe' && !isAllowedEmbed((node as Element).getAttribute?.('src'))) {
      node.parentNode?.removeChild(node)
    }
  })
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    const el = node as Element
    for (const attr of ['href', 'src', 'xlink:href', 'action', 'formaction', 'poster']) {
      if (el.hasAttribute?.(attr) && !safeUrl(el.getAttribute(attr))) el.removeAttribute(attr)
    }
    if (el.tagName === 'A' && el.getAttribute('target') === '_blank') el.setAttribute('rel', 'noopener noreferrer')
    if (el.tagName === 'IFRAME') {
      el.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation allow-popups')
      el.setAttribute('loading', 'lazy')
      el.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin')
    }
  })
}

/**
 * Sanitizes rich HTML written in the CMS (post bodies, document pages, block rich-text fields).
 * Run on every save, server-side. Scripts, event handlers, inline styles, forms and unknown
 * iframes are removed; links and media keep only safe URLs.
 */
export function sanitizeRichHtml(html: string): string {
  installHooks()
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe', 'figure', 'figcaption', 'video', 'source'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'target', 'rel', 'controls', 'loop', 'muted', 'playsinline', 'poster', 'colspan', 'rowspan', 'data-type', 'data-callout', 'data-footnote'],
    FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select', 'object', 'embed', 'base', 'meta', 'link'],
    FORBID_ATTR: ['style'],
    ALLOW_DATA_ATTR: false,
  })
}

/** Plain text only (titles, names): strips every tag. */
export const stripTags = (value: string) => DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
