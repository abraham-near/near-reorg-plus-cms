// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { prepareBody } from '@/lib/blog/html'

// Story mode on the public post (src/lib/blog/html.ts): the Cover layout's blocks from what the editor stores (tests/cms/story-blocks.test.ts).
const FIGURES = '<figure data-type="figures"><ul><li><strong>$38B+</strong><span>Settled through NEAR Intents</span></li><li><strong>35+</strong><span>Chains</span></li></ul><figcaption>As of November 2026.</figcaption></figure>'

describe('the public post draws them', () => {
  const body = (html: string) => prepareBody(html).html   // prepareBody sanitizes on its own

  it('turns the figures into the ink band, without empty figures', () => {
    const html = body(FIGURES.replace('</ul>', '<li><strong></strong><span></span></li></ul>'))
    expect(html).toContain('class="pb-stats"')
    expect(html.match(/class="pb-stat"/g)).toHaveLength(2)
    expect(html).toContain('<strong class="pb-stat__n">$38B+</strong>')
    expect(html).toContain('<p class="pb-stats__note">As of November 2026.</p>')
  })

  it('leaves out a figures band with nothing in it', () => {
    expect(body('<figure data-type="figures"><ul><li><strong></strong><span></span></li></ul></figure>')).not.toContain('pb-stats')
  })

  it('gives a callout its title and text', () => {
    const html = body('<aside data-type="callout"><p>Why it matters</p><p>Settlement is the base layer.</p></aside>')
    expect(html).toContain('class="pb-callout"')
    expect(html).toContain('<p class="pb-callout__t">Why it matters</p>')
    expect(html).toContain('<p class="pb-callout__b">Settlement is the base layer.</p>')
  })

  it('sets two images on one line side by side, the first title as the caption', () => {
    const html = body('<p><img src="/cms/a.webp" alt="One" title="Two views"><img src="/cms/b.webp" alt="Two"></p>')
    expect(html).toContain('class="pb-pair"')
    expect(html.match(/class="pb-fig__ph"/g)).toHaveLength(2)
    expect(html).toContain('<figcaption class="pb-cap">Two views</figcaption>')
  })

  it('gives a figure the width set in the editor', () => {
    expect(body('<p><img src="/cms/a.webp" alt="A" data-size="wide"></p>')).toMatch(/<figure class="pb-fig pb-fig--free" data-size="wide"/)
    expect(body('<p><img src="/cms/a.webp" alt="A" data-size="bleed"></p>')).toMatch(/<figure class="pb-fig" data-size="bleed"/)
    expect(body('<p><img src="/cms/a.webp" alt="A"></p>')).toMatch(/data-size="col"/)
  })

  it('numbers the footnotes in order and lists their texts, leaving empty ones out', () => {
    const fn = (t: string) => `<sup data-type="footnote" data-footnote="${t}"></sup>`
    const out = prepareBody(`<p>First${fn('Note one.')} and${fn('')} second${fn('Note  two.')}</p><h2>Notes</h2><p>Words</p>`)
    expect(out.notes).toEqual(['Note one.', 'Note two.'])
    expect(out.html).toContain('<sup class="pb-fn"><a id="fnref-1" href="#fn-1" aria-label="Note 1">1</a></sup>')
    expect(out.html).toContain('<sup class="pb-fn"><a id="fnref-2" href="#fn-2" aria-label="Note 2">2</a></sup>')
    expect(out.html).not.toContain('data-footnote')
    expect(out.words).toBe(5)   // the notes' text is not the body's
  })

  it('never gives a heading a footnote\'s id', () => {
    const out = prepareBody('<h2>Fn 1</h2><p>A<sup data-type="footnote" data-footnote="N."></sup></p>')
    expect(out.sections[0].id).not.toBe('fn-1')
  })

  it('makes a figure of an image on its own line, with its caption', () => {
    const html = body('<img src="/cms/a.webp" alt="A" title="Dawn">')
    expect(html).toContain('class="pb-fig pb-fig--free"')
    expect(html).toContain('<figcaption class="pb-cap">Dawn</figcaption>')
  })
})
