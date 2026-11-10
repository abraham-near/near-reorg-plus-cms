// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { Editor } from '@tiptap/core'
import { getExtensions } from '@/cms/components/editor/extensions'
import { htmlForEditor } from '@/cms/components/editor/legacy-html'
import { embedUrl } from '@/cms/components/editor/extensions/EmbedBlock'
import { findTextMatches } from '@/cms/components/editor/extensions/FindReplace'
import { sanitizeRichHtml } from '@/cms/lib/sanitize'

function editorFor(html: string) {
  return new Editor({ element: null, extensions: getExtensions(), content: htmlForEditor(html) })
}
function fragment(html: string) {
  const template = document.createElement('template')
  template.innerHTML = html
  return template.content
}
function canonical(html: string) {
  const root = fragment(html)
  for (const element of root.querySelectorAll('*')) {
    const attrs = [...element.attributes].map(({ name, value }) => [name, value]).sort(([a], [b]) => a.localeCompare(b))
    for (const attr of [...element.attributes]) element.removeAttribute(attr.name)
    for (const [name, value] of attrs) element.setAttribute(name, value)
  }
  const wrapper = document.createElement('div')
  wrapper.append(root)
  return wrapper.innerHTML
}
function meaningfulText(html: string) {
  const root = fragment(html)
  // Block boundaries create visual word separation even when HTML has no newlines.
  for (const node of root.querySelectorAll('p,h1,h2,h3,h4,h5,h6,div,li,blockquote,figure,figcaption,table,tr,td,th,pre,br')) { node.before(' ')
    node.after(' ') }
  return root.textContent?.replace(/\s+/g, ' ').trim() ?? ''
}
describe('HTML editor legacy fidelity', () => {
  // Bodies written through the API (Claude, pasted HTML) may hold markup the editor does not model; it must
  // come back unchanged after editing, not silently dropped.
  it('keeps text, links, media and complex markup it cannot model', () => {
    const html = '<h2>Section</h2><p>Intro with <a href="https://near.org">a link</a> and <mark>highlighted</mark> text<sup>1</sup>.</p><div class="callout"><p>Warning text</p></div><figure><img src="/cms/a.png" alt="A"><figcaption>Caption</figcaption></figure><pre><code>const x = 1</code></pre><iframe src="https://www.youtube.com/embed/abcdefghijk"></iframe><ul><li>One</li><li>Two</li></ul>'
    const safe = sanitizeRichHtml(html)
    const editor = editorFor(html)
    const output = sanitizeRichHtml(editor.getHTML())
    expect(meaningfulText(output)).toBe(meaningfulText(safe))
    for (const selector of ['a[href]', 'img[src]', 'iframe[src]', 'figure', 'figcaption', 'pre', 'mark', 'sup', '.callout']) {
      const before = [...fragment(safe).querySelectorAll(selector)]
      const after = [...fragment(output).querySelectorAll(selector)]
      expect(after.length, `${selector} count`).toBe(before.length)
      expect(after.map((node) => canonical(node.outerHTML))).toEqual(before.map((node) => canonical(node.outerHTML)))
    }
    const reopened = editorFor(output)
    expect(meaningfulText(sanitizeRichHtml(reopened.getHTML()))).toBe(meaningfulText(safe))
    editor.destroy()
    reopened.destroy()
  })

  it('preserves nested legacy attributes and unsupported elements across repeated edits', () => {
    const html = '<p id="intro">Before <span class="legacy">styled text</span></p><figure class="wp-caption"><img src="/cms/example.png" alt="Example"><figcaption>A caption</figcaption></figure><table><tbody><tr><td colspan="2">Table content</td></tr></tbody></table><iframe src="https://www.youtube.com/embed/abcdefghijk"></iframe>'
    const editor = editorFor(html)
    const safe = sanitizeRichHtml(html)
    expect(canonical(sanitizeRichHtml(editor.getHTML()))).toBe(canonical(safe))
    editor.commands.setContent(htmlForEditor(editor.getHTML()))
    expect(canonical(sanitizeRichHtml(editor.getHTML()))).toBe(canonical(safe))
    editor.destroy()
  })
})

describe('HTML editor behavior and safe serialization', () => {
  it('retains embeds and task lists after sanitization and reopening', () => {
    const editor = editorFor('')
    editor.commands.setContent({ type: 'doc', content: [
      { type: 'embedBlock', attrs: { url: 'https://youtu.be/abcdefghijk' } },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Heading' }] },
      { type: 'taskList', content: [{ type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Completed task' }] }] }] },
    ] })
    const safe = sanitizeRichHtml(editor.getHTML())
    expect(safe).toContain('https://www.youtube-nocookie.com/embed/abcdefghijk')
    expect(safe).not.toContain('style=')
    const reopened = editorFor(safe)
    const nodes = reopened.getJSON().content ?? []
    expect(nodes.map((node) => node.type)).toEqual(['embedBlock', 'heading', 'taskList'])
    const task = nodes[2].content?.[0]
    expect(task && 'attrs' in task ? task.attrs?.checked : false).toBe(true)
    editor.destroy()
    reopened.destroy()
  })

  it('drops comments without exposing them and validates direct image commands', () => {
    const editor = editorFor('<p>Visible text</p><!-- Internal source comment -->')
    editor.commands.setImage({ src: 'javascript:alert(1)', alt: 'Unsafe image' })
    expect(editor.getHTML()).not.toContain('Internal source comment')
    expect(editor.getHTML()).not.toContain('javascript:')
    editor.destroy()
  })

  it('keeps authored tables editable after saving', () => {
    const editor = editorFor('')
    editor.commands.insertTable({ rows: 2, cols: 2, withHeaderRow: true })
    const reopened = editorFor(sanitizeRichHtml(editor.getHTML()))
    expect(reopened.getJSON().content?.some((node) => node.type === 'table')).toBe(true)
    editor.destroy()
    reopened.destroy()
  })

  it('rejects source substring-host bypasses and unsafe URLs', () => {
    for (const value of ['javascript:alert(1)', 'https://youtube.com.evil.test/watch?v=abcdefghijk', 'https://evil.test/youtube.com', 'http://www.youtube.com/embed/abcdefghijk', '//www.youtube.com/embed/abcdefghijk']) expect(embedUrl(value)).toBeNull()
    expect(embedUrl('https://vimeo.com/12345')).toBe('https://player.vimeo.com/video/12345')
    const editor = editorFor('<p><a href="javascript:alert(1)">Click</a><img src="javascript:alert(1)" onerror="alert(1)"></p><iframe src="https://evil.test"></iframe><script>alert(1)</script>')
    editor.commands.insertContent({ type: 'rawHtmlBlock', attrs: { content: '<img src="/cms/safe.png" onerror="alert(1)"><script>alert(1)</script>' } })
    const html = editor.getHTML()
    expect(html).not.toMatch(/javascript:|onerror|<script|evil\.test/)
    expect(html).toContain('/cms/safe.png')
    editor.destroy()
  })

  it('finds literal strings across formatted runs and replaces matches without regular expression hazards', () => {
    const editor = editorFor('<p>Hel<strong>lo</strong> hello .* HELLO</p>')
    const matches = findTextMatches(editor.state.doc, 'hello')
    expect(matches).toHaveLength(3)
    expect(findTextMatches(editor.state.doc, 'hello', true)).toHaveLength(1)
    expect(findTextMatches(editor.state.doc, '.*')).toHaveLength(1)
    expect(findTextMatches(editor.state.doc, '')).toEqual([])
    const transaction = editor.state.tr
    for (const match of [...matches].reverse()) transaction.insertText('Bye', match.from, match.to)
    editor.view.dispatch(transaction)
    expect(editor.getText()).toBe('Bye Bye .* Bye')
    editor.destroy()
  })
})
