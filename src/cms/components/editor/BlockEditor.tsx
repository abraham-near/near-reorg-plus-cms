'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import { Bold, Italic, Underline, Strikethrough, Link2, ImagePlus, Table2, Undo2, Redo2, List, ListOrdered, Quote } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/cms/components/ui/button'
import { Input } from '@/cms/components/ui/input'
import { Label } from '@/cms/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/cms/components/ui/dialog'
import MediaPickerModal from '@/cms/components/media/MediaPickerModal'
import { safeUrl } from '@/cms/lib/sanitize'
import { getExtensions } from './extensions'
import { createSlashCommand, type Insert } from './extensions/SlashCommand'
import { htmlForEditor } from './legacy-html'
import { embedUrl } from './extensions/EmbedBlock'
import { FindReplaceBar } from './menus/FindReplaceBar'
import { TableControls } from './menus/TableControls'

export interface BlockEditorProps {
  value: string
  onChange: (html: string) => void
  editable?: boolean
  placeholder?: string
  autosaveLabel?: string
  label?: string
}

type InsertKind = 'link' | 'embed' | 'image-alt'

/** HTML in, HTML out. */
export default function BlockEditor({ value, onChange, editable = true, placeholder, autosaveLabel, label = 'Post body' }: BlockEditorProps) {
  const id = useId()
  const [mediaOpen, setMediaOpen] = useState(false)
  const [pendingImages, setPendingImages] = useState<string[]>([])
  const [insertKind, setInsertKind] = useState<InsertKind | null>(null)
  const [insertValue, setInsertValue] = useState('')
  const [imageAlt, setImageAlt] = useState('')
  const [showFind, setShowFind] = useState(false)
  // Loading legacy HTML lets extensions normalize the document (tables, footnotes, …), which fires
  // onUpdate without any edit. Changes only propagate once the user has touched the editor, so
  // opening a post never marks it as modified.
  const interacted = useRef(false)
  const markInteracted = () => { interacted.current = true }
  const openInsert = useCallback((kind: Insert) => {
    if (kind === 'image') setMediaOpen(true)
    else { setInsertValue('')
      setInsertKind(kind) }
  }, [])
  const extensions = useMemo(() => [...getExtensions(placeholder), createSlashCommand(openInsert)], [placeholder, openInsert])
  const editor = useEditor({
    extensions,
    content: htmlForEditor(value),
    immediatelyRender: false,
    editable,
    editorProps: {
      attributes: { class: 'prose prose-sm dark:prose-invert max-w-none min-h-80 px-5 py-6 focus:outline-none', 'aria-label': label },
      transformPastedHTML: htmlForEditor,
      handleKeyDown: (_view, event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'f' && !event.shiftKey) { event.preventDefault()
          setShowFind(true)
          return true }
        if (event.key === 'Escape') setShowFind(false)
        return false
      },
    },
    onUpdate: ({ editor: current }) => { if (interacted.current) onChange(current.getHTML()) },
  })
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => current ? {
      bold: current.isActive('bold'), italic: current.isActive('italic'), underline: current.isActive('underline'),
      strike: current.isActive('strike'), table: current.isActive('table'), image: current.isActive('image'),
      heading: current.getAttributes('heading').level ?? 0,
      words: current.getText().trim().split(/\s+/).filter(Boolean).length,
      canUndo: current.can().undo(), canRedo: current.can().redo(),
    } : null,
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(htmlForEditor(value), { emitUpdate: false })
  }, [editor, value])
  useEffect(() => { editor?.setEditable(editable) }, [editor, editable])

  function applyInsert() {
    if (!editor || !editor.isEditable) return
    if (insertKind === 'link') {
      const href = safeUrl(insertValue)
      if (!href && insertValue.trim()) { toast.error('Enter a safe web address or relative path')
        return }
      if (href) editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
      else editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else if (insertKind === 'image-alt') {
      editor.chain().focus().updateAttributes('image', { alt: insertValue }).run()
    } else if (insertKind === 'embed') {
      const url = embedUrl(insertValue.trim())
      if (!url) { toast.error('Use an HTTPS embed URL from YouTube, Vimeo, Luma, Spotify, SoundCloud or Google Docs')
        return }
      editor.chain().focus().insertContent({ type: 'embedBlock', attrs: { url } }).run()
    }
    setInsertKind(null)
  }

  if (!editor) return <div className="min-h-96 animate-pulse rounded-lg border bg-muted/30" aria-label="Loading editor" />
  const marks = [
    { label: 'Bold', icon: Bold, active: state?.bold, run: () => editor.chain().focus().toggleBold().run() },
    { label: 'Italic', icon: Italic, active: state?.italic, run: () => editor.chain().focus().toggleItalic().run() },
    { label: 'Underline', icon: Underline, active: state?.underline, run: () => editor.chain().focus().toggleUnderline().run() },
    { label: 'Strikethrough', icon: Strikethrough, active: state?.strike, run: () => editor.chain().focus().toggleStrike().run() },
  ]
  return (
    <div className="overflow-hidden rounded-lg border bg-card" onPointerDownCapture={markInteracted} onKeyDownCapture={markInteracted} onPasteCapture={markInteracted} onDropCapture={markInteracted}>
      {editable && <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 p-2" role="toolbar" aria-label="Text formatting">
        <select aria-label="Text style" className="h-8 rounded border bg-background px-2 text-sm" value={state?.heading ?? 0} onChange={(event) => {
          const level = Number(event.target.value)
          if (level) editor.chain().focus().setHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run()
          else editor.chain().focus().setParagraph().run()
        }}>
          <option value="0">Paragraph</option>{[2, 3].map((level) => <option key={level} value={level}>Heading {level}</option>)}{state && ![0, 2, 3].includes(state.heading) && <option value={state.heading}>Heading {state.heading}</option>}
        </select>
        {marks.map((item) => <Button key={item.label} type="button" size="icon-sm" variant={item.active ? 'secondary' : 'ghost'} title={item.label} aria-label={item.label} aria-pressed={!!item.active} onClick={item.run}><item.icon /></Button>)}
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Link" title="Link" onClick={() => { setInsertValue(editor.getAttributes('link').href ?? '')
          setInsertKind('link') }}><Link2 /></Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Bullet list" title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()}><List /></Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Numbered list" title="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered /></Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Quote" title="Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote /></Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Insert image" title="Insert image" onClick={() => openInsert('image')}><ImagePlus /></Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Insert table" title="Insert table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table2 /></Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => openInsert('embed')}>Embed</Button>
        {state?.image && <Button type="button" variant="outline" size="sm" onClick={() => { setInsertValue(editor.getAttributes('image').alt ?? '')
          setInsertKind('image-alt') }}>Image description</Button>}
        <div className="ml-auto flex gap-1">
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Undo" title="Undo" disabled={!state?.canUndo} onClick={() => editor.chain().focus().undo().run()}><Undo2 /></Button>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Redo" title="Redo" disabled={!state?.canRedo} onClick={() => editor.chain().focus().redo().run()}><Redo2 /></Button>
        </div>
      </div>}
      {showFind && <FindReplaceBar editor={editor} onClose={() => setShowFind(false)} />}
      {editable && state?.table && <TableControls editor={editor} />}
      {editable && <BubbleMenu editor={editor}><div className="flex gap-1 rounded-md border bg-popover p-1">{marks.slice(0, 3).map((item) => <Button key={item.label} type="button" size="icon-sm" variant={item.active ? 'secondary' : 'ghost'} aria-label={item.label} onClick={item.run}><item.icon /></Button>)}</div></BubbleMenu>}
      <EditorContent editor={editor} />
      <div className="flex flex-wrap justify-between gap-2 border-t px-4 py-2 text-xs text-muted-foreground"><span>{state?.words ?? 0} words · Type / for blocks</span><span>{autosaveLabel ?? 'Changes are saved with the post'}</span></div>
      <MediaPickerModal open={mediaOpen} onClose={() => setMediaOpen(false)} onSelect={(url) => {
        const urls = (Array.isArray(url) ? url : [url]).flatMap((item) => { const safe = safeUrl(item)
          return safe ? [safe] : [] })
        setPendingImages(urls)
        setImageAlt('')
        setMediaOpen(false)
      }} />
      <Dialog open={pendingImages.length > 0} onOpenChange={(open) => { if (!open) setPendingImages([]) }}>
        <DialogContent><DialogHeader><DialogTitle>Describe image</DialogTitle><DialogDescription>Describe the image for readers using assistive technology. Leave empty for decorative images.</DialogDescription></DialogHeader>
          <Label htmlFor={`${id}-alt`}>Image description</Label><Input id={`${id}-alt`} value={imageAlt} onChange={(event) => setImageAlt(event.target.value)} />
          <Button type="button" disabled={!editable} onClick={() => {
            if (!editor.isEditable) return
            if (pendingImages[0]) editor.chain().focus().setImage({ src: pendingImages[0], alt: imageAlt }).run()
            setPendingImages([])
          }}>Insert</Button>
        </DialogContent>
      </Dialog>
      <Dialog open={!!insertKind} onOpenChange={(open) => { if (!open) setInsertKind(null) }}>
        <DialogContent><DialogHeader><DialogTitle>{insertKind === 'embed' ? 'Insert an embed' : insertKind === 'image-alt' ? 'Image description' : 'Edit link'}</DialogTitle><DialogDescription>{insertKind === 'embed' ? 'Paste the HTTPS embed URL from an allowed provider.' : insertKind === 'image-alt' ? 'Describe the selected image. Leave blank for decorative images.' : 'Paste a web address or site path. Leave blank to remove the link.'}</DialogDescription></DialogHeader>
          <Label htmlFor={`${id}-insert`}>{insertKind === 'image-alt' ? 'Image description' : 'URL'}</Label>
          <Input id={`${id}-insert`} value={insertValue} onChange={(event) => setInsertValue(event.target.value)} />
          <Button type="button" disabled={!editable} onClick={applyInsert}>Apply</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
