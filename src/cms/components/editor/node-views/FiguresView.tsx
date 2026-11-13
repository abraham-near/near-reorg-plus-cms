'use client'

import { NodeViewWrapper, useEditorState, type NodeViewProps } from '@tiptap/react'
import { Plus, X } from 'lucide-react'
import { MAX_FIGURES, figuresOf, type Figure } from '../extensions/StoryBlocks'

/**
 * The figures band as the Cover layout draws it (ink, large numbers), edited in place: a number and a label per figure,
 * up to four, and one note for the source or the date. Empty figures are left out of the page.
 */
export function FiguresView({ node, editor, updateAttributes }: NodeViewProps) {
  const editable = useEditorState({ editor, selector: ({ editor: current }) => current.isEditable })
  const items = figuresOf(node.attrs.items, true)
  const note = String(node.attrs.note ?? '')
  const set = (next: Figure[]) => updateAttributes({ items: next })
  const edit = (i: number, key: keyof Figure, value: string) => set(items.map((item, j) => (j === i ? { ...item, [key]: value } : item)))

  return (
    <NodeViewWrapper className="cms-figures" contentEditable={false}>
      <span className="cms-figures__tag">Figures</span>
      <div className="cms-figures__row">
        {items.map((item, i) => (
          <div key={i} className="cms-figures__item">
            <input className="cms-figures__n" aria-label={`Figure ${i + 1}: number`} placeholder="$38B+" value={item.n} maxLength={24} disabled={!editable}
              onChange={(event) => edit(i, 'n', event.target.value)} />
            <input className="cms-figures__l" aria-label={`Figure ${i + 1}: label`} placeholder="What it counts" value={item.l} maxLength={120} disabled={!editable}
              onChange={(event) => edit(i, 'l', event.target.value)} />
            {editable && items.length > 1 && (
              <button type="button" className="cms-figures__x" aria-label={`Remove figure ${i + 1}`} onClick={() => set(items.filter((_, j) => j !== i))}><X className="size-3.5" /></button>
            )}
          </div>
        ))}
        {editable && items.length < MAX_FIGURES && (
          <button type="button" className="cms-figures__add" onClick={() => set([...items, { n: '', l: '' }])}><Plus className="size-4" aria-hidden />Add figure</button>
        )}
      </div>
      <input className="cms-figures__note" aria-label="Note: the source or the date of the figures" placeholder="Note: the source, or “as of” a date" value={note} maxLength={300} disabled={!editable}
        onChange={(event) => updateAttributes({ note: event.target.value })} />
    </NodeViewWrapper>
  )
}
