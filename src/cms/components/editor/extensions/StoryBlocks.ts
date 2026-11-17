import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { FiguresView } from '../node-views/FiguresView'

// Story blocks: what the post layouts draw beyond plain text (lib/blog/html.ts turns them into the layouts' markup).
//   - Callout: a titled note. Its first paragraph is the title, the rest the text. Stored as <aside data-type="callout">.
//   - Figures: two to four numbers with a label each, and a note for the source or the date. Stored as
//     <figure data-type="figures"><ul><li><strong>$38B+</strong><span>Settled</span></li>…</ul><figcaption>note</figcaption></figure>.
// Pull quotes are blockquotes (a last paragraph that starts with a dash names who said it) and image pairs are two images
// on one line: neither needs a node of its own.

export type Figure = { n: string; l: string }
export const MAX_FIGURES = 4
const clean = (value: unknown, max: number) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max)

/** the figures: at most four, each a short number and a label; `raw` keeps them as typed (spaces too) for the inputs */
export function figuresOf(value: unknown, raw = false): Figure[] {
  if (!Array.isArray(value)) return []
  const f = raw ? (v: unknown, max: number) => String(v ?? '').slice(0, max) : clean
  return value.slice(0, MAX_FIGURES).map((item) => ({ n: f(item?.n, 24), l: f(item?.l, 120) }))
}

export const Callout = Node.create({
  name: 'callout', group: 'block', content: 'paragraph+', defining: true, draggable: true,
  parseHTML() { return [{ tag: 'aside[data-type="callout"]' }, { tag: 'aside[data-callout]' }] },
  renderHTML() { return ['aside', { 'data-type': 'callout' }, 0] },
})

export const FiguresBlock = Node.create({
  name: 'figures', group: 'block', atom: true, draggable: true,
  addAttributes() {
    return {
      items: {
        default: [{ n: '', l: '' }, { n: '', l: '' }], rendered: false,
        parseHTML: (element) => figuresOf([...element.querySelectorAll('li')].map((li) => ({ n: li.querySelector('strong')?.textContent, l: li.querySelector('span')?.textContent }))),
      },
      note: { default: '', rendered: false, parseHTML: (element) => clean(element.querySelector('figcaption')?.textContent, 300) },
    }
  },
  // above the raw HTML block's rule for any <figure> (priority 1000)
  parseHTML() { return [{ tag: 'figure[data-type="figures"]', priority: 1100 }] },
  renderHTML({ node }) {
    const items = figuresOf(node.attrs.items).filter((item) => item.n || item.l)
    const note = clean(node.attrs.note, 300)
    return ['figure', { 'data-type': 'figures' },
      ['ul', {}, ...items.map((item) => ['li', {}, ['strong', {}, item.n], ['span', {}, item.l]])],
      ...(note ? [['figcaption', {}, note]] : [])]
  },
  addNodeView() { return ReactNodeViewRenderer(FiguresView) },
})
