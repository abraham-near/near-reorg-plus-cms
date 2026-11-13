// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { Editor } from '@tiptap/core'
import { getExtensions } from '@/cms/components/editor/extensions'
import { htmlForEditor } from '@/cms/components/editor/legacy-html'
import { SLASH_ITEMS } from '@/cms/components/editor/extensions/slash-items'
import { sanitizeRichHtml } from '@/cms/lib/sanitize'

// Story mode: what the editor stores for the Cover layout's blocks, and what the public post makes of it.
const editorFor = (html: string) => new Editor({ element: document.createElement('div'), extensions: getExtensions(), content: htmlForEditor(html) })
const roundTrip = (html: string) => sanitizeRichHtml(editorFor(html).getHTML())
const FIGURES = '<figure data-type="figures"><ul><li><strong>$38B+</strong><span>Settled through NEAR Intents</span></li><li><strong>35+</strong><span>Chains</span></li></ul><figcaption>As of November 2026.</figcaption></figure>'

describe('the editor keeps story blocks', () => {
  it('keeps an image width through a save and a reload (not as raw HTML)', () => {
    const html = roundTrip('<p><img src="/cms/a.webp" alt="A lake" data-size="wide"></p>')
    expect(html).toContain('data-size="wide"')
    expect(html).not.toContain('raw-html')
    expect(editorFor(html).getJSON().content?.[0]?.content?.[0]).toMatchObject({ type: 'image', attrs: { size: 'wide' } })
  })

  it('drops a width it does not know', () => {
    expect(roundTrip('<p><img src="/cms/a.webp" alt="" data-size="huge"></p>')).not.toContain('data-size')
  })

  it('loads an image on its own line instead of dropping it', () => {
    expect(roundTrip('<p>Before</p><img src="/cms/a.webp" alt="A lake" title="Dawn"><p>After</p>')).toContain('src="/cms/a.webp"')
  })

  it('round-trips the figures band and the callout', () => {
    const html = roundTrip(`${FIGURES}<aside data-type="callout"><p>Why it matters</p><p>Settlement is the base layer.</p></aside>`)
    expect(html).toContain('<figure data-type="figures"><ul><li><strong>$38B+</strong><span>Settled through NEAR Intents</span></li><li><strong>35+</strong><span>Chains</span></li></ul><figcaption>As of November 2026.</figcaption></figure>')
    expect(html).toContain('<aside data-type="callout"><p>Why it matters</p><p>Settlement is the base layer.</p></aside>')
  })

  it('caps the figures at four and leaves empty ones out of the stored HTML', () => {
    const items = Array.from({ length: 6 }, (_, i) => `<li><strong>${i}</strong><span>n${i}</span></li>`).join('')
    const html = roundTrip(`<figure data-type="figures"><ul>${items}<li><strong></strong><span></span></li></ul></figure>`)
    expect(html.match(/<li>/g)).toHaveLength(4)
  })

  it('offers the story blocks in the slash menu', () => {
    const ids = SLASH_ITEMS.map((item) => item.id)
    for (const id of ['pullquote', 'callout', 'figures', 'pair']) expect(ids).toContain(id)
    for (const [id, type] of [['figures', 'figures'], ['callout', 'callout'], ['pullquote', 'blockquote']]) {
      const editor = editorFor('<p></p>')
      SLASH_ITEMS.find((item) => item.id === id)!.run(editor)
      expect((editor.getJSON().content ?? []).map((node) => node.type)).toContain(type)
    }
  })
})
