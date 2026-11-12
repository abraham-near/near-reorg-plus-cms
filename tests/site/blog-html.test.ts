import { describe, expect, it } from 'vitest'
import { countWords, idMaker, imageUrls, prepareBody, readMinutes, slugify, summarize } from '@/lib/blog/html'

// The public blog's body helpers (src/lib/blog/html.ts): heading ids, sections, reading time, and the markup the post layouts expect.
describe('heading ids', () => {
  it('slugifies text', () => {
    expect(slugify('Why verification matters')).toBe('why-verification-matters')
    expect(slugify('  Café & crème: 2026!  ')).toBe('cafe-and-creme-2026')
    expect(slugify('???')).toBe('section')
  })

  it('hands out each id once, and never one the page already uses', () => {
    const next = idMaker()
    expect(next('What we heard')).toBe('what-we-heard')
    expect(next('What we heard')).toBe('what-we-heard-2')
    expect(next('What we heard!')).toBe('what-we-heard-3')
    expect(next('Main')).toBe('main-2')
  })
})

describe('reading time', () => {
  it('counts words, not punctuation', () => {
    expect(countWords('One two  three — four.')).toBe(4)
    expect(countWords('')).toBe(0)
  })

  it('rounds at ~220 words a minute, never under one', () => {
    expect(readMinutes(0)).toBe(1)
    expect(readMinutes(440)).toBe(2)
    expect(readMinutes(1000)).toBe(5)
  })

  it('reads a body with a space between blocks', () => {
    const body = prepareBody(`<h2>Title</h2><p>${'word '.repeat(659)}end</p>`)
    expect(body.words).toBe(661)   // "Title" + 659 + "end": the heading and the paragraph do not merge into one word
    expect(body.readMin).toBe(3)
  })
})

describe('summarize', () => {
  it('keeps short text and cuts long text at a word', () => {
    expect(summarize('Short.')).toBe('Short.')
    const s = summarize('word '.repeat(60))
    expect(s.length).toBeLessThanOrEqual(160)
    expect(s.endsWith('word…')).toBe(true)
  })
})

describe('prepareBody', () => {
  it('numbers the h2s, gives them ids and lists them as sections', () => {
    const { html, sections } = prepareBody('<h1>Intro</h1><p>a</p><h2>How it <em>works</em></h2><h2>How it works</h2><h2></h2>')
    expect(sections).toEqual([
      { id: 'intro', t: 'Intro' },
      { id: 'how-it-works', t: 'How it works' },
      { id: 'how-it-works-2', t: 'How it works' },
    ])
    expect(html).toContain('<h2 id="intro" class="pb-h2" data-reveal=""><span class="pb-h2__n" aria-hidden="true">01</span><span class="pb-h2__t">Intro</span></h2>')
    expect(html).toContain('<span class="pb-h2__t">How it <em>works</em></span>')
    expect(html).not.toContain('<h1')
  })

  it('gives blocks the layouts\' classes', () => {
    const { html } = prepareBody('<p>Text</p><p></p><ul><li><p>a</p></li></ul><ol start="3"><li><p>b</p></li></ol><h3>Sub</h3><pre><code class="language-ts">x</code></pre><table><tbody><tr><td><p>c</p></td></tr></tbody></table>')
    expect(html).toContain('<p class="pb-p">Text</p>')
    expect(html).not.toContain('<p></p>')
    expect(html).toContain('<ul class="pb-list">')
    expect(html).toContain('<ol start="3" class="pb-list pb-list--ol" style="counter-reset: pb 2">')
    expect(html).toContain('<h3 class="pb-h3">Sub</h3>')
    expect(html).toContain('<pre class="pb-code" data-lang="ts">')
    expect(html).toMatch(/<div class="pb-table"[^>]*><table>/)
  })

  it('turns a quote\'s closing dash line into its attribution', () => {
    const { html } = prepareBody('<blockquote><p>Said well.</p><p>— Someone</p></blockquote>')
    expect(html).toBe('<figure class="pb-quote" data-reveal=""><blockquote><p>Said well.</p></blockquote><figcaption class="pb-quote__by">Someone</figcaption></figure>')
  })

  it('makes a paragraph of one image a figure, with its size from the Media table and its title as the caption', () => {
    const src = '/cms/abc.webp'
    expect(imageUrls(`<p><img src="${src}" alt="A"></p>`)).toEqual([src])
    const { html } = prepareBody(`<p><img src="${src}" alt="A" title="The caption"></p><p>Inline <img src="/x.png"> image</p>`, { [src]: { w: 800, h: 600, alt: 'Stored' } })
    expect(html).toContain('<figure class="pb-fig pb-fig--free" data-size="col" data-reveal=""><div class="pb-fig__ph"><img src="/cms/abc.webp" alt="A" loading="lazy" decoding="async" width="800" height="600" class="pb-fig__img"></div><figcaption class="pb-cap">The caption</figcaption></figure>')
    expect(html).toContain('<p class="pb-p">Inline <img src="/x.png" loading="lazy" decoding="async" alt=""> image</p>')
  })

  it('sanitizes again: no scripts, handlers or unknown embeds', () => {
    const { html } = prepareBody('<p onclick="x()">Hi<script>alert(1)</script></p><div data-type="embed-block"><iframe src="https://evil.example/x"></iframe></div><a href="javascript:alert(1)">l</a>')
    expect(html).not.toMatch(/script|onclick|evil|javascript/)
  })
})
