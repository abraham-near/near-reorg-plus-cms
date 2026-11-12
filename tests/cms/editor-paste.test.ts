// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { Editor, type JSONContent } from '@tiptap/core'
import { getExtensions } from '@/cms/components/editor/extensions'
import { htmlForEditor } from '@/cms/components/editor/legacy-html'
import { cleanPastedHtml, htmlForPaste } from '@/cms/components/editor/paste-html'

// Real clipboard shapes (trimmed): Google Docs in Chrome, Word for Mac/Windows.
const GOOGLE_DOCS = `<meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-4c1a2b7f-7fff-5d3e-91a0-3b1c2d4e5f60"><h2 dir="ltr" style="line-height:1.38;margin-top:18pt;margin-bottom:6pt;"><span style="font-size:16pt;font-family:Arial,sans-serif;color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">Own your data</span></h2><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:11pt;font-family:Arial,sans-serif;color:#000000;background-color:transparent;font-weight:700;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">Agents</span><span style="font-size:11pt;font-family:Arial,sans-serif;color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;"> that act for you should </span><span style="font-size:11pt;font-family:Arial,sans-serif;color:#000000;background-color:transparent;font-weight:400;font-style:italic;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">answer</span><span style="font-size:11pt;font-family:Arial,sans-serif;color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:underline;-webkit-text-decoration-skip:none;text-decoration-skip-ink:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;"> to you</span><span style="font-size:11pt;font-family:Arial,sans-serif;color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:line-through;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">, always</span><span style="font-size:11pt;font-family:Arial,sans-serif;color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">. Read </span><a href="https://near.org/blog" style="text-decoration:none;"><span style="font-size:11pt;font-family:Arial,sans-serif;color:#1155cc;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:underline;-webkit-text-decoration-skip:none;text-decoration-skip-ink:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">the blog</span></a><span style="font-size:11pt;font-family:Arial,sans-serif;color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">.</span></p><br><ul style="margin-top:0;margin-bottom:0;padding-inline-start:48px;"><li dir="ltr" style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;" aria-level="1"><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;" role="presentation"><span style="font-size:11pt;font-family:Arial,sans-serif;color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">Data</span></p></li><ul style="margin-top:0;margin-bottom:0;padding-inline-start:48px;"><li dir="ltr" style="list-style-type:circle;" aria-level="2"><p dir="ltr" role="presentation"><span style="font-weight:400;">Nested</span></p></li></ul><li dir="ltr" style="list-style-type:disc;" aria-level="1"><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;" role="presentation"><span style="font-size:11pt;font-family:Arial,sans-serif;color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">Assets</span></p></li></ul><br><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:11pt;font-family:Arial,sans-serif;color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;"><span style="border:none;display:inline-block;overflow:hidden;width:602px;height:339px;"><img src="https://lh7-rt.googleusercontent.com/docsz/AD_4nXexample?key=abc" width="602" height="339" style="margin-left:0px;margin-top:0px;" /></span></span></p><br><div dir="ltr" style="margin-left:0pt;" align="left"><table style="border:none;border-collapse:collapse;"><colgroup><col width="301" /><col width="301" /></colgroup><tbody><tr style="height:0pt"><td style="border-left:solid #000000 1pt;vertical-align:top;padding:5pt 5pt 5pt 5pt;overflow:hidden;overflow-wrap:break-word;"><p dir="ltr" style="line-height:1.2;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:11pt;font-weight:400;">Cell A</span></p></td><td style="border-left:solid #000000 1pt;vertical-align:top;"><p dir="ltr" style="line-height:1.2;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:11pt;font-weight:700;">Cell B</span></p></td></tr></tbody></table></div></b><br class="Apple-interchange-newline">`

const WORD = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns:m="http://schemas.microsoft.com/office/2004/12/omml" xmlns="http://www.w3.org/TR/REC-html40"><head><meta http-equiv=Content-Type content="text/html; charset=utf-8"><meta name=ProgId content=Word.Document><meta name=Generator content="Microsoft Word 15"><!--[if gte mso 9]><xml><o:OfficeDocumentSettings><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]--><style><!--
 /* Style Definitions */
 p.MsoNormal, li.MsoNormal, div.MsoNormal {margin:0cm; font-size:12.0pt; font-family:"Calibri",sans-serif;}
h1 {mso-style-priority:9; mso-style-link:"Heading 1 Char";}
p.MsoListParagraphCxSpFirst {mso-style-priority:34; margin-left:36.0pt;}
--></style></head><body lang=EN-US style='tab-interval:36.0pt;word-wrap:break-word'><!--StartFragment--><h1><a name="_Toc12345"></a><span lang=EN-US>Quarterly update</span></h1>
<p class=MsoNormal><b><span lang=EN-US>Revenue</span></b><span lang=EN-US> grew, and <i>costs</i> fell.<o:p></o:p></span></p>
<p class=MsoNormal><span lang=EN-US style='font-weight:bold'>Bold by style</span><span lang=EN-US> and <u>underlined</u><o:p></o:p></span></p>
<p class=MsoNormal><o:p>&nbsp;</o:p></p>
<p class=MsoListParagraphCxSpFirst style='text-indent:-18.0pt;mso-list:l0 level1 lfo1'><![if !supportLists]><span lang=EN-US style='font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol'><span style='mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; </span></span></span><![endif]><span lang=EN-US>First point<o:p></o:p></span></p>
<p class=MsoListParagraphCxSpMiddle style='margin-left:72.0pt;mso-add-space:auto;text-indent:-18.0pt;mso-list:l0 level2 lfo1'><![if !supportLists]><span lang=EN-US style='font-family:"Courier New"'><span style='mso-list:Ignore'>o<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp; </span></span></span><![endif]><span lang=EN-US>Sub point<o:p></o:p></span></p>
<p class=MsoListParagraphCxSpLast style='text-indent:-18.0pt;mso-list:l0 level1 lfo1'><![if !supportLists]><span lang=EN-US style='font-family:Symbol'><span style='mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp; </span></span></span><![endif]><span lang=EN-US>Second point<o:p></o:p></span></p>
<p class=MsoNormal><o:p>&nbsp;</o:p></p>
<p class=MsoListParagraphCxSpFirst style='text-indent:-18.0pt;mso-list:l1 level1 lfo2'><![if !supportLists]><span lang=EN-US><span style='mso-list:Ignore'>1.<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp; </span></span></span><![endif]><span lang=EN-US>Step one<o:p></o:p></span></p>
<p class=MsoListParagraphCxSpLast style='text-indent:-18.0pt;mso-list:l1 level1 lfo2'><![if !supportLists]><span lang=EN-US><span style='mso-list:Ignore'>2.<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp; </span></span></span><![endif]><span lang=EN-US>Step two<o:p></o:p></span></p>
<p class=MsoNormal><span lang=EN-US>See <a href="https://near.org/">near.org</a>.<o:p></o:p></span></p>
<p class=MsoNormal><span lang=EN-US><img width=320 height=180 src="file:///C:/Users/me/AppData/Local/Temp/msohtmlclip1/01/clip_image001.png" alt="Chart"></span></p>
<!--EndFragment--></body></html>`

function pasteInto(html: string) {
  const editor = new Editor({ element: null, extensions: getExtensions(), content: '' })
  editor.commands.insertContent(htmlForPaste(html))
  return editor
}
const types = (nodes: JSONContent[] = []) => nodes.map((node) => node.type)
function marksOf(json: JSONContent, text: string): string[] {
  let found: string[] | null = null
  const walk = (node: JSONContent) => {
    if (found) return
    if (node.type === 'text' && node.text?.includes(text)) found = (node.marks ?? []).map((mark) => mark.type).sort()
    node.content?.forEach(walk)
  }
  walk(json)
  return found ?? ['<missing>']
}
function allTypes(json: JSONContent): Set<string> {
  const set = new Set<string>()
  const walk = (node: JSONContent) => { if (node.type) set.add(node.type)
    node.content?.forEach(walk) }
  walk(json)
  return set
}

describe('pasting from Google Docs', () => {
  it('becomes editable headings, paragraphs, marks, lists, images and tables, never a raw HTML block', () => {
    const editor = pasteInto(GOOGLE_DOCS)
    const json = editor.getJSON()
    expect(allTypes(json).has('rawHtmlBlock')).toBe(false)
    expect(types(json.content)).toEqual(['heading', 'paragraph', 'bulletList', 'paragraph', 'table'])
    expect(json.content?.[0].attrs?.level).toBe(2)
    expect(marksOf(json, 'Own your data')).toEqual([])
    expect(marksOf(json, 'Agents')).toEqual(['bold'])
    expect(marksOf(json, ' that act for you should ')).toEqual([])
    expect(marksOf(json, 'answer')).toEqual(['italic'])
    expect(marksOf(json, ' to you')).toEqual(['underline'])
    expect(marksOf(json, ', always')).toEqual(['strike'])
    // A Docs link keeps its address but not the span's underline styling.
    expect(marksOf(json, 'the blog')).toEqual(['link'])
    expect(editor.getHTML()).toContain('href="https://near.org/blog"')
    // The nested list moved into its parent item.
    const list = json.content?.[2]
    expect(types(list?.content)).toEqual(['listItem', 'listItem'])
    expect(types((list?.content?.[0] as JSONContent | undefined)?.content)).toEqual(['paragraph', 'bulletList'])
    expect(editor.getText()).toContain('Nested')
    // The googleusercontent image is a normal image node.
    expect(json.content?.[3].content?.[0]).toMatchObject({ type: 'image', attrs: { src: 'https://lh7-rt.googleusercontent.com/docsz/AD_4nXexample?key=abc' } })
    expect(marksOf(json, 'Cell B')).toEqual(['bold'])
    const html = editor.getHTML()
    expect(html).not.toMatch(/docs-internal-guid|dir="ltr"|font-weight|font-size|aria-level/)
    editor.destroy()
  })

  it('cleans the clipboard markup itself', () => {
    const cleaned = cleanPastedHtml(GOOGLE_DOCS)
    expect(cleaned).not.toMatch(/<b |<span|style=|<colgroup|Apple-interchange-newline|<meta|<div/)
    expect(cleaned.startsWith('<h2>')).toBe(true)
  })
})

describe('pasting from Microsoft Word', () => {
  it('becomes editable nodes: headings, marks, real lists, links; drops Office artefacts', () => {
    const editor = pasteInto(WORD)
    const json = editor.getJSON()
    expect(allTypes(json).has('rawHtmlBlock')).toBe(false)
    expect(types(json.content)).toEqual(['heading', 'paragraph', 'paragraph', 'bulletList', 'orderedList', 'paragraph'])
    expect(json.content?.[0].attrs?.level).toBe(1)
    expect(editor.getText()).not.toMatch(/·|Style Definitions|mso-|AllowPNG/)
    expect(marksOf(json, 'Revenue')).toEqual(['bold'])
    expect(marksOf(json, 'costs')).toEqual(['italic'])
    expect(marksOf(json, 'Bold by style')).toEqual(['bold'])
    expect(marksOf(json, 'underlined')).toEqual(['underline'])
    const bullets = json.content?.[3]
    expect(types(bullets?.content)).toEqual(['listItem', 'listItem'])
    expect(types((bullets?.content?.[0] as JSONContent | undefined)?.content)).toEqual(['paragraph', 'bulletList'])
    expect(editor.getText()).toContain('Sub point')
    expect(types(json.content?.[4].content)).toEqual(['listItem', 'listItem'])
    expect(editor.getText()).toContain('Step two')
    expect(editor.getHTML()).toContain('<a target="_blank" rel="noopener noreferrer nofollow" href="https://near.org/">near.org</a>')
    // Word's local temp-file image cannot load: it is dropped rather than inserted broken.
    expect(allTypes(json).has('image')).toBe(false)
    expect(editor.getHTML()).not.toMatch(/Mso|lang=|o:p|class=/)
    editor.destroy()
  })
})

describe('paste vs stored HTML', () => {
  it('keeps stored unmodeled markup as a raw block but pastes the same markup as editable text', () => {
    const html = '<p class="legacy" id="intro">Styled <span class="x">intro</span></p>'
    const stored = new Editor({ element: null, extensions: getExtensions(), content: htmlForEditor(html) })
    expect(types(stored.getJSON().content)).toEqual(['rawHtmlBlock'])
    const pasted = pasteInto(html)
    expect(types(pasted.getJSON().content)).toEqual(['paragraph'])
    expect(pasted.getText()).toBe('Styled intro')
    stored.destroy()
    pasted.destroy()
  })

  it('keeps ProseMirror clipboard context and turns allowed iframes into embeds', () => {
    expect(htmlForPaste('<ul data-pm-slice="1 1 []"><li><p>One</p></li></ul>')).toContain('data-pm-slice="1 1 []"')
    const editor = pasteInto('<p>Watch:</p><iframe src="https://www.youtube.com/embed/abcdefghijk"></iframe><iframe src="https://evil.test/x"></iframe>')
    expect(types(editor.getJSON().content)).toEqual(['paragraph', 'embedBlock'])
    editor.destroy()
  })

  it('keeps line breaks between plain lines and highlights as marks', () => {
    const editor = pasteInto('Line one<br>Line two')
    expect(editor.getHTML()).toBe('<p>Line one<br>Line two</p>')
    editor.destroy()
    const marked = new Editor({ element: null, extensions: getExtensions(), content: htmlForEditor('<p>A <mark>key</mark> point</p>') })
    expect(marksOf(marked.getJSON(), 'key')).toEqual(['highlight'])
    expect(marked.getHTML()).toBe('<p>A <mark>key</mark> point</p>')
    marked.destroy()
  })
})
