'use client'

import { useEffect, useRef, useState } from 'react'
import { NodeViewWrapper, useEditorState, type NodeViewProps } from '@tiptap/react'
import { safeUrl } from '@/cms/lib/sanitize'

/** Event a caller dispatches on the editor DOM to open the alt editor of the image just inserted. */
export const EDIT_ALT_EVENT = 'cms:edit-image-alt'

/**
 * Inline image with an "Alt" control when selected: publishing checks for alt text, so a missing
 * description is flagged right on the image.
 */
export function ImageView({ node, editor, selected, updateAttributes, getPos }: NodeViewProps) {
  const editable = useEditorState({ editor, selector: ({ editor: current }) => current.isEditable })
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  // Enter/Escape close the editor and refocus the text, which blurs the input: ignore that blur.
  const closing = useRef(false)
  const alt = String(node.attrs.alt ?? '')
  const src = safeUrl(node.attrs.src)

  const open = () => {
    closing.current = false
    setDraft(alt)
    setEditing(true)
  }
  useEffect(() => {
    const onRequest = (event: Event) => {
      const pos = (event as CustomEvent<{ pos: number }>).detail?.pos
      if (typeof getPos === 'function' && getPos() === pos) {
        closing.current = false
        setDraft(String(node.attrs.alt ?? ''))
        setEditing(true)
      }
    }
    const dom = editor.view.dom
    dom.addEventListener(EDIT_ALT_EVENT, onRequest)
    return () => dom.removeEventListener(EDIT_ALT_EVENT, onRequest)
  }, [editor, getPos, node.attrs.alt])
  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const close = (save: boolean) => {
    if (closing.current) return
    closing.current = true
    if (save) updateAttributes({ alt: draft.trim() })
    setEditing(false)
    editor.commands.focus()
  }

  return (
    <NodeViewWrapper as="span" className={`cms-image ${selected ? 'is-selected' : ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- user content at its stored URL */}
      {src ? <img src={src} alt={alt} title={node.attrs.title ?? undefined} draggable={false} /> : <span className="cms-image-missing">Image unavailable</span>}
      {editable && (selected || editing || !alt) && (
        <span className="cms-image-tools" contentEditable={false}>
          {editing ? (
            <span className="cms-image-alt-editor cms-pop" style={{ '--origin': 'top left' } as React.CSSProperties}>
              <input
                ref={inputRef}
                aria-label="Alt text: describe the image for people who can't see it"
                placeholder="Describe the image (leave empty if decorative)"
                value={draft}
                maxLength={500}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  event.stopPropagation()
                  if (event.key === 'Enter') { event.preventDefault()
                    close(true) }
                  if (event.key === 'Escape') { event.preventDefault()
                    close(false) }
                }}
                onBlur={() => close(true)}
              />
            </span>
          ) : (
            <button
              type="button"
              className={`cms-image-alt-button ${alt ? '' : 'is-missing'}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={open}
              title={alt ? `Alt text: ${alt}` : 'Add alt text'}
            >{alt ? 'Alt' : 'Add alt'}</button>
          )}
        </span>
      )}
    </NodeViewWrapper>
  )
}
