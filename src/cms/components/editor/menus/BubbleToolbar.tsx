'use client'

import { useEffect, useRef, useState } from 'react'
import { type Editor, useEditorState } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import { NodeSelection, TextSelection } from '@tiptap/pm/state'
import { Bold, Check, ChevronDown, Code, Highlighter, Italic, Link2, Strikethrough, Trash2, Underline } from 'lucide-react'
import { safeUrl } from '@/cms/lib/sanitize'
import { BLOCK_KINDS, blockKind, topLevelBlockAt, turnSelectionInto, type BlockKind } from '../extensions/block-actions'

/** Accepts "near.org/x" as https; refuses anything the sanitizer would strip. */
export function normalizeLinkInput(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(trimmed) && !trimmed.includes(' ')) return safeUrl(`https://${trimmed}`)
  if (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(trimmed)) return `mailto:${trimmed}`
  return /\s/.test(trimmed) ? null : safeUrl(trimmed)
}

function useToolbarState(editor: Editor) {
  return useEditorState({
    editor,
    selector: ({ editor: current }) => {
      const block = topLevelBlockAt(current.state, current.state.selection.from)
      const kind: BlockKind | null = current.isActive('heading', { level: 2 }) ? 'h2' : current.isActive('heading', { level: 3 }) ? 'h3'
        : current.isActive('codeBlock') ? 'code' : current.isActive('taskList') ? 'task' : current.isActive('orderedList') ? 'ordered'
          : current.isActive('bulletList') ? 'bullet' : current.isActive('blockquote') ? 'quote' : block ? blockKind(block.node) : null
      return {
        kind,
        bold: current.isActive('bold'), italic: current.isActive('italic'), underline: current.isActive('underline'),
        strike: current.isActive('strike'), code: current.isActive('code'), highlight: current.isActive('highlight'),
        link: current.isActive('link'), href: (current.getAttributes('link').href as string | undefined) ?? '',
      }
    },
  })
}

/**
 * Selection menu (EditorC): Turn into ▾ · B I U S code · link · highlight. Positioned by Floating UI
 * above the selection, flipping below when it would slide under the page's sticky top bar.
 */
export function BubbleToolbar({ editor, linkRequest }: { editor: Editor; linkRequest: number }) {
  const state = useToolbarState(editor)
  const [mode, setMode] = useState<'tools' | 'link' | 'turn'>('tools')
  const [href, setHref] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const openLink = () => {
    setHref(state.href)
    setError('')
    setMode('link')
  }
  // ⌘K from the editor.
  const [lastRequest, setLastRequest] = useState(linkRequest)
  if (lastRequest !== linkRequest) {
    setLastRequest(linkRequest)
    if (!editor.state.selection.empty) openLink()
  }
  useEffect(() => { if (mode === 'link') inputRef.current?.focus() }, [mode])

  const applyLink = () => {
    if (!href.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      setMode('tools')
      return
    }
    const url = normalizeLinkInput(href)
    if (!url) { setError('Enter a web address (https://…), an email or a site path (/blog/…)')
      return }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    setMode('tools')
  }
  const cancel = () => {
    setMode('tools')
    editor.commands.focus()
  }

  const button = (label: string, active: boolean, run: () => void, icon: React.ReactNode, shortcut?: string) => (
    <button type="button" className="cms-bubble-button" aria-label={label} title={shortcut ? `${label} (${shortcut})` : label} aria-pressed={active} data-active={active || undefined}
      onMouseDown={(event) => event.preventDefault()} onClick={run}>{icon}</button>
  )
  const kindLabel = BLOCK_KINDS.find((item) => item.kind === state.kind)?.label ?? 'Turn into'

  return (
    <BubbleMenu
      editor={editor}
      className="cms-pop z-40"
      style={{ '--origin': 'bottom center' } as React.CSSProperties}
      updateDelay={120}
      shouldShow={({ editor: current, element, state: editorState, from, to }) => {
        const { selection } = editorState
        if (!current.isEditable || selection.empty || selection instanceof NodeSelection) return false
        if (!(selection instanceof TextSelection) || current.isActive('codeBlock')) return false
        if (!editorState.doc.textBetween(from, to).trim().length) return false
        return current.view.hasFocus() || element.contains(document.activeElement)
      }}
      options={{
        placement: 'top',
        offset: 8,
        // Room for the post page's sticky header: flip below the selection instead of under it.
        flip: { padding: { top: 72, bottom: 8 } },
        shift: { padding: 8 },
        onHide: () => setMode('tools'),
      }}
    >
      <div role="toolbar" aria-label="Text formatting" className="cms-bubble" onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault()
        cancel() } }}>
        {mode === 'link' ? (
          <div className="flex items-center gap-1 p-0.5">
            <Link2 className="ml-1.5 size-4 flex-none text-muted-foreground" aria-hidden="true" />
            <input
              ref={inputRef}
              aria-label="Link address"
              aria-invalid={!!error || undefined}
              aria-describedby={error ? 'cms-link-error' : undefined}
              className="h-8 w-64 rounded-md bg-transparent px-1.5 text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Paste a link, or type /path"
              value={href}
              onChange={(event) => { setHref(event.target.value)
                setError('') }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') { event.preventDefault()
                  applyLink() }
                if (event.key === 'Escape') { event.preventDefault()
                  event.stopPropagation()
                  cancel() }
              }}
            />
            <button type="button" className="cms-bubble-button px-2 text-xs font-medium" onClick={applyLink}>Apply</button>
            {state.link && <button type="button" className="cms-bubble-button" aria-label="Remove link" title="Remove link" onClick={() => { editor.chain().focus().extendMarkRange('link').unsetLink().run()
              setMode('tools') }}><Trash2 className="size-4" /></button>}
            {error && <p id="cms-link-error" role="alert" className="cms-bubble-error">{error}</p>}
          </div>
        ) : (
          <div className="flex items-center gap-px">
            <div className="relative">
              <button type="button" className="cms-bubble-button gap-1 px-2 text-[13px] font-medium" aria-haspopup="menu" aria-expanded={mode === 'turn'}
                onMouseDown={(event) => event.preventDefault()} onClick={() => setMode(mode === 'turn' ? 'tools' : 'turn')}>
                {kindLabel}<ChevronDown className="size-3" aria-hidden="true" />
              </button>
              {mode === 'turn' && (
                <div role="menu" aria-label="Turn into" className="cms-menu cms-pop absolute top-full left-0 mt-1.5 w-48" style={{ '--origin': 'top left' } as React.CSSProperties}
                  onKeyDown={(event) => {
                    const items = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]')]
                    const index = items.indexOf(document.activeElement as HTMLButtonElement)
                    if (event.key === 'ArrowDown') { event.preventDefault()
                      items[(index + 1) % items.length]?.focus() }
                    if (event.key === 'ArrowUp') { event.preventDefault()
                      items[(index - 1 + items.length) % items.length]?.focus() }
                  }}>
                  {BLOCK_KINDS.map((item) => (
                    <button key={item.kind} type="button" role="menuitemradio" aria-checked={state.kind === item.kind} className="cms-menu-item"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => { turnSelectionInto(editor, item.kind)
                        setMode('tools') }}>
                      {item.label}{state.kind === item.kind && <Check className="ml-auto size-4 text-primary" aria-hidden="true" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="cms-bubble-separator" aria-hidden="true" />
            {button('Bold', state.bold, () => editor.chain().focus().toggleBold().run(), <Bold className="size-4" strokeWidth={2.25} />, '⌘B')}
            {button('Italic', state.italic, () => editor.chain().focus().toggleItalic().run(), <Italic className="size-4" />, '⌘I')}
            {button('Underline', state.underline, () => editor.chain().focus().toggleUnderline().run(), <Underline className="size-4" />, '⌘U')}
            {button('Strikethrough', state.strike, () => editor.chain().focus().toggleStrike().run(), <Strikethrough className="size-4" />, '⌘⇧S')}
            {button('Inline code', state.code, () => editor.chain().focus().toggleCode().run(), <Code className="size-4" />, '⌘E')}
            <span className="cms-bubble-separator" aria-hidden="true" />
            {button(state.link ? 'Edit link' : 'Link', state.link, openLink, <Link2 className="size-4" />, '⌘K')}
            {button('Highlight', state.highlight, () => editor.chain().focus().toggleHighlight().run(), <Highlighter className="size-4" />, '⌘⇧H')}
          </div>
        )}
      </div>
    </BubbleMenu>
  )
}
