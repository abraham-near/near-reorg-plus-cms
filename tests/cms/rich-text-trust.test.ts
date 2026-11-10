import { describe, expect, it } from 'vitest'
import { sanitizeRichHtml } from '@/cms/lib/sanitize'

// Post bodies are stored as sanitized HTML (src/cms/lib/sanitize.ts); unsafe URL schemes must never survive,
// however they are spelled.
describe('sanitizeRichHtml URL schemes', () => {
  it.each([
    '<a href="javascript:alert(1)">x</a>',
    "<a href='JaVaScRiPt:alert(1)'>x</a>",
    '<a href=javascript:alert(1)>x</a>',
    '<a href="javascript&#58;alert(1)">x</a>',
    '<a href="jav&#x61;script:alert(1)">x</a>',
    '<a href="java&Tab;script:alert(1)">x</a>',
    '<a href=" data:text/html,<script>">x</a>',
    '<img src="vbscript:x">',
  ])('drops %s', (html) => {
    expect(sanitizeRichHtml(html)).not.toMatch(/href=|src=/i)
  })

  it.each(['<a href="https://near.org">x</a>', '<a href="/blog">x</a>', '<a href="#top">x</a>', '<a href="mailto:a@near.org">x</a>'])('keeps %s', (html) => {
    expect(sanitizeRichHtml(html)).toMatch(/href=/)
  })
})
