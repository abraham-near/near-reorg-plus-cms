import { Node } from '@tiptap/core'
import { sanitizeRichHtml } from '@/cms/lib/sanitize'
import { rawHtmlBlockView } from '../node-views/RawHtmlBlockView'

export const RawHtmlBlock = Node.create({
  name: 'rawHtmlBlock', group: 'block', atom: true, draggable: true,
  addAttributes() { return { content: { default: '', rendered: false } } },
  parseHTML() { return [
    { tag: 'div[data-type="raw-html"]', getAttrs: (element) => ({ content: element.getAttribute('data-content') ?? element.innerHTML }) },
    ...['figure', 'figcaption', 'iframe', 'video'].map((tag) => ({ tag, priority: 1000, getAttrs: (element: HTMLElement) => ({ content: element.outerHTML }) })),
  ] },
  renderHTML({ node }) {
    const template = document.createElement('template')
    template.innerHTML = sanitizeRichHtml(String(node.attrs.content))
    if (template.content.childNodes.length === 1 && template.content.firstElementChild) return template.content.firstElementChild
    const wrapper = document.createElement('div')
    wrapper.append(template.content)
    return wrapper
  },
  addNodeView() { return rawHtmlBlockView },
})
