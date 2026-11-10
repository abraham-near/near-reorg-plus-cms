'use client'

import { useEffect, useState } from 'react'
import { type Editor, useEditorState } from '@tiptap/react'
import { Button } from '@/cms/components/ui/button'
import { Input } from '@/cms/components/ui/input'
import { findTextMatches, findReplaceKey } from '../extensions/FindReplace'

export function FindReplaceBar({ editor, onClose }: { editor: Editor,onClose: () => void }) {
  const [find, setFind] = useState('')
  const [replace, setReplace] = useState('')
  const [matchCase, setMatchCase] = useState(false)
  const state = useEditorState({ editor, selector: ({ editor: current }) => ({ doc: current.state.doc, from: current.state.selection.from, to: current.state.selection.to, editable: current.isEditable }) })
  const matches = findTextMatches(state.doc, find, matchCase)
  useEffect(() => {
    editor.view.dispatch(editor.state.tr.setMeta(findReplaceKey, { query: find, matchCase }))
    return () => { if (!editor.isDestroyed) editor.view.dispatch(editor.state.tr.setMeta(findReplaceKey, { query: '', matchCase: false })) }
  }, [editor, find, matchCase])
  const select = (backwards = false) => {
    const match = backwards ? [...matches].reverse().find((item) => item.to <= state.from) ?? matches.at(-1) : matches.find((item) => item.from >= state.to) ?? matches[0]
    if (match) editor.chain().focus().setTextSelection(match).scrollIntoView().run()
  }
  const replaceMatches = (all: boolean) => {
    const selected = all ? matches : matches.filter((match) => match.from === state.from && match.to === state.to)
    if (!selected.length) { select()
      return }
    const transaction = editor.state.tr
    for (const match of [...selected].reverse()) transaction.insertText(replace, match.from, match.to)
    editor.view.dispatch(transaction)
  }
  return <div className="flex flex-wrap items-center gap-2 border-b p-3" role="search" aria-label="Find and replace">
    <Input className="w-40" aria-label="Find text" value={find} onChange={(event) => setFind(event.target.value)} placeholder="Find text" />
    <Input className="w-40" aria-label="Replacement text" value={replace} onChange={(event) => setReplace(event.target.value)} placeholder="Replace with" />
    <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={matchCase} onChange={(event) => setMatchCase(event.target.checked)} />Match case</label>
    <span className="text-xs text-muted-foreground" aria-live="polite">{matches.length} matches</span>
    <Button type="button" size="sm" variant="outline" disabled={!matches.length} onClick={() => select(true)}>Previous</Button>
    <Button type="button" size="sm" variant="outline" disabled={!matches.length} onClick={() => select()}>Next</Button>
    <Button type="button" size="sm" variant="outline" disabled={!matches.length || !state.editable} onClick={() => replaceMatches(false)}>Replace</Button>
    <Button type="button" size="sm" variant="outline" disabled={!matches.length || !state.editable} onClick={() => replaceMatches(true)}>Replace all</Button>
    <Button type="button" size="sm" variant="ghost" onClick={onClose}>Close</Button>
  </div>
}
