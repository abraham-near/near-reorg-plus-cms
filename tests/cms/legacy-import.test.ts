import { describe, expect, it } from 'vitest'
import { blocksToHtml, cleanField, ConvertError, convertBody, countRawBlocks, escapePseudoTags, findForeignImages, youtubeId } from '../../scripts/legacy-import/convert'

const opts = (images = new Map<string, string | null>()) => ({ slugs: new Set(['real-post']), images })
const convert = (html: string, images?: Map<string, string | null>) => convertBody(html, opts(images))

describe('legacy import: Builder blocks', () => {
  it('joins BlogContent, walks sections and columns, and turns images, buttons and carousels into editor HTML', () => {
    const notes: string[] = []
    const html = blocksToHtml([
      { component: { name: 'BlogContent', options: { content: '<p>One</p>' } } },
      { component: { name: 'Core:Section', options: {} }, children: [{ component: { name: 'Image', options: { image: '/cms/abc.jpg', width: 800, height: 600 } } }] },
      { component: { name: 'Columns', options: { columns: [{ blocks: [{ component: { name: 'BlogContent', options: { content: '<p>Two</p>' } } }] }] } } },
      { component: { name: 'Core:Button', options: { link: 'https://gov.example', text: 'Go', openLinkInNewTab: true } } },
      { component: { name: 'Media Carousel', options: { headline: ' ', youtubeVideos: [{ videoId: 'zwXL-umvm6E', title: 'Video' }] } } },
    ], notes)
    const out = convert(html)
    expect(out.html).toContain('<p>One</p>')
    expect(out.html).toContain('<img src="/cms/abc.jpg" alt="" width="800" height="600">')
    expect(out.html).toContain('<p>Two</p>')
    expect(out.html).toContain('href="https://gov.example"')
    expect(out.html).toMatch(/<div data-type="embed-block"><iframe src="https:\/\/www\.youtube\.com\/embed\/zwXL-umvm6E"/)
    expect(out.rawBlocks).toBe(0)
  })

  it('refuses block types it does not know', () => {
    expect(() => blocksToHtml([{ component: { name: 'Mystery' } }], [])).toThrow(ConvertError)
  })
})

describe('legacy import: WordPress and Medium HTML', () => {
  it('wraps top-level text in paragraphs (blank line = paragraph, newline = break) without touching structured HTML or <pre>', () => {
    const out = convert('First line\nsame paragraph\n\nSecond <strong>bold</strong>\n<h2>Title</h2>\n<pre><code>a\n\nb</code></pre>\n<p>Already\nfine</p>')
    expect(out.html).toBe('<p>First line<br>same paragraph</p><p>Second <strong>bold</strong></p><h2>Title</h2><pre><code>a\n\nb</code></pre><p>Already\nfine</p>')
  })

  it('removes WordPress comments, classes, styles and wrappers, and renames b/i', () => {
    const out = convert('<!-- wp:paragraph --><div class="x"><p class="wp" style="color:red"><span style="font-weight:400"><b>Bold</b> <i>it</i></span></p></div><!-- /wp:paragraph -->')
    expect(out.html).toBe('<p><strong>Bold</strong> <em>it</em></p>')
    expect(out.rawBlocks).toBe(0)
  })

  it('turns [caption] and figures into an image whose title is the caption', () => {
    const caption = convert('[caption id="attachment_1" align="aligncenter" width="1024"]<img class="wp-image-1" src="/cms/a.jpg" alt="Team" width="1024" height="768" /> Our team in Tokyo[/caption]')
    expect(caption.html).toBe('<p><img src="/cms/a.jpg" alt="Team" width="1024" height="768" title="Our team in Tokyo"></p>')
    const medium = convert('<figure class="graf graf--figure"><img class="graf-image" src="/cms/b.jpg" data-height="300" /><figcaption class="imageCaption">Program synthesis</figcaption></figure>')
    expect(medium.html).toBe('<p><img src="/cms/b.jpg" title="Program synthesis"></p>')
    expect(medium.wordsAfter).toBe(medium.wordsBefore)
  })

  it('keeps tables as editor tables, and YouTube as embeds (figure, iframe, bare URL, [embed])', () => {
    expect(convert('<figure class="wp-block-table"><table style="x"><tbody><tr><td colspan="2" class="c">A</td></tr></tbody></table></figure>').html)
      .toBe('<table class="cms-editor-table"><tbody><tr><td colspan="2">A</td></tr></tbody></table>')
    const embed = (id: string) => `<div data-type="embed-block"><iframe src="https://www.youtube.com/embed/${id}"`
    expect(convert('<figure class="wp-block-embed"><div class="wp-block-embed__wrapper">\nhttps://youtu.be/4CKvfYJTjxk\n</div></figure>').html).toContain(embed('4CKvfYJTjxk'))
    expect(convert('<p><iframe src="https://www.youtube.com/embed/MwqUVbV7N1s" width="560"></iframe></p>').html).toContain(embed('MwqUVbV7N1s'))
    expect(convert('https://www.youtube.com/watch?v=MwqUVbV7N1s').html).toContain(embed('MwqUVbV7N1s'))
    expect(convert('[embed]https://www.youtube.com/watch?v=MwqUVbV7N1s[/embed]').html).toContain(embed('MwqUVbV7N1s'))
    expect(convert('<p>Watch https://youtu.be/4CKvfYJTjxk now</p>').html).toBe('<p>Watch https://youtu.be/4CKvfYJTjxk now</p>')
  })

  it('rewrites near.org blog links (.html, absolute) only on near.org, and reports missing posts', () => {
    const out = convert('<p><a href="/blog/real-post.html">a</a> <a href="https://www.near.org/blog/gone.html#x">b</a> <a href="https://docs.near.org/blog/real-post">c</a></p>')
    expect(out.html).toContain('href="/blog/real-post"')
    expect(out.html).toContain('href="/blog/gone#x"')
    expect(out.html).toContain('href="https://docs.near.org/blog/real-post"')
    expect(out.notes).toContain('Link to a post that does not exist: /blog/gone')
  })

  it('keeps generics inside code as text', () => {
    expect(escapePseudoTags('<code>Vec<T> and F<Subtype></code> <b>x</b>')).toBe('<code>Vec&lt;T> and F&lt;Subtype></code> <b>x</b>')
    expect(convert('<pre><code class="language-rust x">let v: Vec<u8> = vec![];</code></pre>').html).toBe('<pre><code class="language-rust">let v: Vec&lt;u8&gt; = vec![];</code></pre>')
  })

  it('drops scripts, keeps a tweet as a plain quote', () => {
    const out = convert('<blockquote class="twitter-tweet"><p>Hi</p></blockquote><script async src="https://platform.twitter.com/widgets.js"></script>')
    expect(out.html).toBe('<blockquote><p>Hi</p></blockquote>')
  })
})

describe('legacy import: images', () => {
  const png = 'data:image/png;base64,iVBORw0KGgo='
  it('finds inline and Google-hosted images, and swaps them for their copies (or drops unreadable inline ones)', () => {
    const html = `<p><img src="${png}"><img src="https://lh3.googleusercontent.com/abc"><img src="/cms/x.jpg"></p>`
    expect(findForeignImages(html)).toEqual([png, 'https://lh3.googleusercontent.com/abc'])
    const out = convert(html, new Map([[png, '/cms/1111111111111111.webp'], ['https://lh3.googleusercontent.com/abc', null]]))
    expect(out.html).toBe('<p><img src="/cms/1111111111111111.webp"><img src="/cms/x.jpg"></p>')
  })
})

describe('legacy import: text fields and helpers', () => {
  it('decodes entities and line breaks in titles, as typed text', () => {
    expect(cleanField('Toward a Better Planet:<br>Green NFTs')).toBe('Toward a Better Planet: Green NFTs')
    expect(cleanField('Tom &amp; Jerry&nbsp;<3')).toBe('Tom & Jerry <3')
    expect(cleanField('Using Vec<u8>')).toBe('Using Vec<u8>')
    expect(cleanField('   ')).toBeNull()
    expect(cleanField(null)).toBeNull()
  })

  it('recognizes YouTube URLs only', () => {
    expect(youtubeId('https://youtu.be/4CKvfYJTjxk')).toBe('4CKvfYJTjxk')
    expect(youtubeId('https://www.youtube.com/watch?v=MwqUVbV7N1s&t=3')).toBe('MwqUVbV7N1s')
    expect(youtubeId('https://evil.com/watch?v=MwqUVbV7N1s')).toBeNull()
  })

  it('counts what the editor would keep as raw HTML', () => {
    expect(countRawBlocks('<p>a</p><div data-type="embed-block"><iframe src="https://www.youtube.com/embed/x"></iframe></div><table class="cms-editor-table"></table>')).toBe(0)
    expect(countRawBlocks('<p>a<sup>1</sup></p><video src="/cms/v.mp4"></video>')).toBe(2)
  })
})
