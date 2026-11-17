'use client'

import { useEffect, useRef, useState } from 'react'
import { NodeViewWrapper, useEditorState, type NodeViewProps } from '@tiptap/react'
import { Trash2 } from 'lucide-react'
import { MAX_FOOTNOTE } from '../extensions/StoryBlocks'

/**
 * A footnote in the text: its number (a CSS counter, so the markers renumber as they move) and, while it is selected or being
 * written, its note in a small box under it. A new, empty note opens with the box focused. The page lists the notes at the end.
 */
export function FootnoteView({ node, editor, selected, updateAttributes, deleteNode }: NodeViewProps) {
  const editable = useEditorState({ editor, selector: ({ editor: current }) => current.isEditable })
  const text = String(node.attrs.text ?? '')
  const [typing, setTyping] = useState(false)
  const [fresh, setFresh] = useState(() => !text)   // just inserted: open and focused
  const box = useRef<HTMLTextAreaElement>(null)
  const open = editable && (selected || typing || fresh)

  useEffect(() => { if (fresh && editable) box.current?.focus() }, [fresh, editable])

  return (
    <NodeViewWrapper as="sup" className={`cms-fn${open ? ' is-open' : ''}`} data-empty={text ? undefined : ''} contentEditable={false}>
      <span className="cms-fn__n" title={text || 'Empty note'} aria-label={text ? `Footnote: ${text}` : 'Footnote (empty)'} />
      {open && (
        <span className="cms-fn__box" role="group" aria-label="Footnote">
          <span className="cms-fn__l">Footnote</span>
          <textarea ref={box} className="cms-fn__text" rows={2} maxLength={MAX_FOOTNOTE} placeholder="The note: a source, a definition, an aside"
            value={text} onChange={(event) => updateAttributes({ text: event.target.value })}
            onFocus={() => setTyping(true)} onBlur={() => { setTyping(false); setFresh(false) }}
            onKeyDown={(event) => {
              // Enter or Esc: done, back to the text after the marker
              if ((event.key === 'Enter' && !event.shiftKey) || event.key === 'Escape') { event.preventDefault(); box.current?.blur(); editor.commands.focus() }
            }} />
          <button type="button" className="cms-fn__x" aria-label="Remove footnote" onMouseDown={(event) => event.preventDefault()} onClick={() => deleteNode()}>
            <Trash2 className="size-3.5" aria-hidden />
          </button>
        </span>
      )}
    </NodeViewWrapper>
  )
}
