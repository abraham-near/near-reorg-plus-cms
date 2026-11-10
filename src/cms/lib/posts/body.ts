import { sanitizeRichHtml } from '@/cms/lib/sanitize'

/** The post body as stored: HTML from the editor, sanitized on every save. */
export const prepareBody = (html: string | undefined) => sanitizeRichHtml(html ?? '')

/** Visible text or media, to tell an emptied body from an edited one. */
export const hasBody = (html: unknown) =>
  typeof html === 'string' && (/<(img|video|iframe)\b/i.test(html) || html.replace(/<[^>]*>|&nbsp;|\s/g, '') !== '')
