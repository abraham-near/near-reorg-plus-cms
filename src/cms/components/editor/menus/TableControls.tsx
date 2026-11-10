'use client'

import type { Editor } from '@tiptap/core'
import { Button } from '@/cms/components/ui/button'

export function TableControls({ editor }: { editor: Editor }) {
  const actions = [
    { label: 'Row above', run: () => editor.chain().focus().addRowBefore().run() },
    { label: 'Row below', run: () => editor.chain().focus().addRowAfter().run() },
    { label: 'Column before', run: () => editor.chain().focus().addColumnBefore().run() },
    { label: 'Column after', run: () => editor.chain().focus().addColumnAfter().run() },
    { label: 'Delete row', run: () => editor.chain().focus().deleteRow().run() },
    { label: 'Delete column', run: () => editor.chain().focus().deleteColumn().run() },
    { label: 'Header row', run: () => editor.chain().focus().toggleHeaderRow().run() },
    { label: 'Header column', run: () => editor.chain().focus().toggleHeaderColumn().run() },
    { label: 'Merge cells', run: () => editor.chain().focus().mergeCells().run(), disabled: !editor.can().mergeCells() },
    { label: 'Split cell', run: () => editor.chain().focus().splitCell().run(), disabled: !editor.can().splitCell() },
    { label: 'Delete table', run: () => editor.chain().focus().deleteTable().run() },
  ]
  return <div className="flex flex-wrap gap-1 border-b p-2" role="toolbar" aria-label="Table controls">{actions.map((action) => <Button key={action.label} type="button" size="sm" variant="outline" disabled={action.disabled} onMouseDown={(event) => event.preventDefault()} onClick={action.run}>{action.label}</Button>)}</div>
}
