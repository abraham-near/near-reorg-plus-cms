'use client'

import { useState } from 'react'
import { NodeViewWrapper, useEditorState, type NodeViewProps } from '@tiptap/react'
import { embedUrl } from '../extensions/EmbedBlock'

export function EmbedBlockView({ node, editor, updateAttributes, deleteNode }: NodeViewProps) {
  const editable = useEditorState({ editor, selector: ({ editor: current }) => current.isEditable })
  const [editing, setEditing] = useState(!node.attrs.url)
  const [input, setInput] = useState(String(node.attrs.url))
  const [error, setError] = useState('')
  const src = embedUrl(String(node.attrs.url))
  const save = () => {
    const url = embedUrl(input)
    if (!url) { setError('Enter an HTTPS URL from an allowed embed provider.')
      return }
    updateAttributes({ url })
      setEditing(false)
      setError('')
  }
  return <NodeViewWrapper className="my-4 rounded-lg border p-3" contentEditable={false}>
    {editing && editable ? <div className="space-y-2">
      <label className="block text-sm">Embed URL<input aria-label="Embed URL" className="mt-1 block w-full rounded border bg-background p-2" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault()
        save() } }} /></label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <button type="button" className="mr-3 underline" onClick={save}>Apply</button><button type="button" className="underline" onClick={deleteNode}>Remove embed</button>
    </div> : <>
      {src && <iframe src={src} title="Embedded content" className="aspect-video w-full" sandbox="allow-scripts allow-same-origin allow-presentation allow-popups" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />}
      {editable && <div className="mt-2 flex gap-4 text-sm"><button type="button" className="underline" onClick={() => { setInput(String(node.attrs.url))
        setEditing(true) }}>Change URL</button><button type="button" className="underline" onClick={deleteNode}>Remove embed</button></div>}
    </>}
  </NodeViewWrapper>
}
