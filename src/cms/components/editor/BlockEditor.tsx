'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react'
import { toast } from 'sonner'
import MediaPickerModal from '@/cms/components/media/MediaPickerModal'
import { uploadMedia } from '@/cms/components/media/upload-client'
import { checkUpload, uploadErrorMessage } from '@/cms/components/media/upload-limits'
import { AdminApiError } from '@/cms/lib/client'
import { safeUrl, sanitizeRichHtml } from '@/cms/lib/sanitize'
import { getExtensions } from './extensions'
import { SlashCommand } from './extensions/SlashCommand'
import { OPEN_IMAGE_PICKER_EVENT } from './extensions/slash-items'
import { imageFilesFrom, uploadImagesAt, type ImageUploadHandlers } from './extensions/ImageUpload'
import { BLOCK_MENU_EVENT, type BlockMenuRequest, type DragHandleStorage } from './extensions/DragHandle'
import { htmlForEditor } from './legacy-html'
import { htmlForPaste } from './paste-html'
import { EDIT_ALT_EVENT } from './node-views/ImageView'
import { BubbleToolbar } from './menus/BubbleToolbar'
import { BlockMenu } from './menus/BlockMenu'
import { FindReplaceBar } from './menus/FindReplaceBar'
import { TableControls } from './menus/TableControls'

export interface BlockEditorProps {
  value: string
  onChange: (html: string) => void
  editable?: boolean
  /** Shown when the body is empty. */
  placeholder?: string
  /** @deprecated The page shows the save state now; kept so older callers still compile. */
  autosaveLabel?: string
  label?: string
  /** Called (debounced) when the word count changes; the page renders it. */
  onWordCount?: (words: number) => void
}

/** Typing stays smooth: the HTML is serialized at most this often (and on blur, ⌘S and unmount). */
const SERIALIZE_DELAY = 300

export function countWords(text: string) {
  const trimmed = text.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}
const wordsOf = (editor: Editor) => countWords(editor.state.doc.textBetween(0, editor.state.doc.content.size, ' ', ' '))

const uploadHandlers: ImageUploadHandlers = {
  check: (file) => checkUpload(file, { imagesOnly: true }),
  upload: async (file) => {
    try {
      const media = await uploadMedia(file, { imagesOnly: true })
      return { url: media.url, alt: media.alt }
    } catch (error) {
      if (error instanceof AdminApiError) throw new Error(uploadErrorMessage(error.status, error.message, file))
      throw error
    }
  },
  onError: (file, message) => toast.error(`Couldn't add “${file.name}”`, { description: message }),
}

/** HTML in, HTML out. A plain page column: the page around it owns the chrome (title, save state, counts). */
export default function BlockEditor({ value, onChange, editable = true, placeholder, label = 'Post body', onWordCount }: BlockEditorProps) {
  const [mediaOpen, setMediaOpen] = useState(false)
  const [showFind, setShowFind] = useState(false)
  const [blockMenu, setBlockMenu] = useState<BlockMenuRequest | null>(null)
  const [linkRequest, setLinkRequest] = useState(0)

  // Loading legacy HTML lets extensions normalize the document (tables, footnotes, …), which fires
  // onUpdate without any edit. Changes only propagate once the user has touched the editor, so
  // opening a post never marks it as modified.
  const interacted = useRef(false)
  const markInteracted = () => { interacted.current = true }
  const editorRef = useRef<Editor | null>(null)
  const onChangeRef = useRef(onChange)
  const onWordCountRef = useRef(onWordCount)
  useEffect(() => {
    onChangeRef.current = onChange
    onWordCountRef.current = onWordCount
  })
  const lastEmitted = useRef<string | null>(null)
  const pending = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastWords = useRef(-1)
  const everFocused = useRef(false)
  const pickerPos = useRef<number | null>(null)

  const reportWords = useCallback((editor: Editor) => {
    const words = wordsOf(editor)
    if (words !== lastWords.current) {
      lastWords.current = words
      onWordCountRef.current?.(words)
    }
  }, [])
  /** Sends the latest HTML now (blur, ⌘S, unmount, or after the debounce). */
  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    const editor = editorRef.current
    if (!editor || editor.isDestroyed) return
    reportWords(editor)
    if (!pending.current) return
    pending.current = false
    const html = editor.getHTML()
    lastEmitted.current = html
    onChangeRef.current(html)
  }, [reportWords])

  const closeBlockMenu = useCallback(() => {
    const editor = editorRef.current
    if (editor && !editor.isDestroyed) (editor.storage as unknown as { dragHandle: DragHandleStorage }).dragHandle.lockedPos = null
    setBlockMenu(null)
  }, [])

  const extensions = useMemo(() => [...getExtensions({ placeholder }), SlashCommand], [placeholder])

  const editor = useEditor({
    extensions,
    content: htmlForEditor(value),
    immediatelyRender: false,
    editable,
    editorProps: {
      attributes: { class: 'cms-editor-body prose max-w-none focus:outline-none', 'aria-label': label, 'aria-multiline': 'true', role: 'textbox' },
      // Pasted HTML is cleaned (Google Docs, Word); stored HTML keeps unmodeled markup (htmlForEditor).
      transformPastedHTML: htmlForPaste,
      handlePaste: (view, event) => {
        const files = imageFilesFrom(event.clipboardData, { ignoreWhenHtml: true })
        const current = editorRef.current
        if (!files.length || !current || !current.isEditable) return false
        event.preventDefault()
        void uploadImagesAt(current, files, view.state.selection.from, uploadHandlers)
        return true
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false
        const files = imageFilesFrom(event.dataTransfer)
        const current = editorRef.current
        if (!files.length || !current || !current.isEditable) return false
        event.preventDefault()
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos ?? view.state.selection.from
        void uploadImagesAt(current, files, pos, uploadHandlers)
        return true
      },
      handleKeyDown: (_view, event) => {
        const mod = event.metaKey || event.ctrlKey
        const key = event.key.toLowerCase()
        if (mod && key === 'f' && !event.shiftKey) { event.preventDefault()
          setShowFind(true)
          return true }
        if (mod && key === 'k') { event.preventDefault()
          setLinkRequest((count) => count + 1)
          return true }
        // Let the page's ⌘S handler see the latest body.
        if (mod && key === 's') flush()
        if (event.key === 'Escape') setShowFind(false)
        return false
      },
    },
    onCreate: ({ editor: created }) => {
      editorRef.current = created
      reportWords(created)
    },
    onFocus: () => { everFocused.current = true },
    onBlur: () => flush(),
    onUpdate: () => {
      if (interacted.current) pending.current = true
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(flush, SERIALIZE_DELAY)
    },
  }, [extensions])
  useEffect(() => {
    editorRef.current = editor
    if (!editor) return
    const dom = editor.view.dom
    // Requests from the slash menu ("Image") and the block handle (⠿), which live outside React.
    const openImagePicker = () => {
      if (!editor.isEditable) return
      // The picker steals focus: remember where the image goes (the cursor, or the end of the body when
      // the editor was never focused).
      pickerPos.current = everFocused.current ? editor.state.selection.from : editor.state.doc.content.size
      setMediaOpen(true)
    }
    const openBlockMenu = (event: Event) => {
      const request = (event as CustomEvent<BlockMenuRequest>).detail
      ;(editor.storage as unknown as { dragHandle: DragHandleStorage }).dragHandle.lockedPos = request.pos
      // One menu at a time: collapse a text selection so the selection menu hides behind the block menu.
      if (!editor.state.selection.empty) editor.commands.setTextSelection(editor.state.selection.to)
      setBlockMenu(request)
    }
    dom.addEventListener(OPEN_IMAGE_PICKER_EVENT, openImagePicker)
    dom.addEventListener(BLOCK_MENU_EVENT, openBlockMenu)
    return () => {
      dom.removeEventListener(OPEN_IMAGE_PICKER_EVENT, openImagePicker)
      dom.removeEventListener(BLOCK_MENU_EVENT, openBlockMenu)
    }
  }, [editor])
  // Deliver the final value when the editor goes away (navigation, remount).
  useEffect(() => () => flush(), [flush])

  const tableActive = useEditorState({ editor, selector: ({ editor: current }) => !!current?.isActive('table') })

  // External value changes (revision restore, save responses). The value we emitted ourselves comes
  // back unchanged, or sanitized by the server: neither must reset the document and move the cursor.
  const sanitizedEmitted = useRef<{ raw: string; safe: string } | null>(null)
  useEffect(() => {
    if (!editor || editor.isDestroyed || value === lastEmitted.current) return
    if (lastEmitted.current !== null) {
      if (sanitizedEmitted.current?.raw !== lastEmitted.current) sanitizedEmitted.current = { raw: lastEmitted.current, safe: sanitizeRichHtml(lastEmitted.current) }
      if (sanitizeRichHtml(value) === sanitizedEmitted.current.safe) return
    }
    // Typing after the last emit is newer than anything coming back from a save.
    if (pending.current) return
    if (sanitizeRichHtml(value) !== sanitizeRichHtml(editor.getHTML())) {
      editor.commands.setContent(htmlForEditor(value), { emitUpdate: false })
      reportWords(editor)
    }
  }, [editor, value, reportWords])
  useEffect(() => { editor?.setEditable(editable) }, [editor, editable])

  const insertPicked = (picked: string | string[]) => {
    setMediaOpen(false)
    if (!editor || !editor.isEditable) return
    const urls = (Array.isArray(picked) ? picked : [picked]).flatMap((item) => { const safe = safeUrl(item)
      return safe ? [safe] : [] })
    if (!urls.length) return
    const at = Math.max(0, Math.min(pickerPos.current ?? editor.state.selection.from, editor.state.doc.content.size))
    markInteracted()
    editor.chain().focus().insertContentAt(at, urls.map((src) => ({ type: 'image', attrs: { src, alt: '' } }))).run()
    // Ask for a description of the (first) new image straight away.
    let imagePos: number | null = null
    editor.state.doc.nodesBetween(Math.max(0, at - 2), Math.min(editor.state.doc.content.size, at + 4), (node, pos) => {
      if (imagePos === null && node.type.name === 'image' && node.attrs.src === urls[0]) imagePos = pos
    })
    if (imagePos !== null) {
      const pos = imagePos
      setTimeout(() => { if (!editor.isDestroyed) editor.view.dom.dispatchEvent(new CustomEvent(EDIT_ALT_EVENT, { detail: { pos } })) }, 60)
    }
  }

  if (!editor) return <div className="cms-skeleton min-h-64 w-full" aria-label="Loading editor" />
  return (
    <div className="cms-editor relative" onPointerDownCapture={markInteracted} onKeyDownCapture={markInteracted} onPasteCapture={markInteracted} onDropCapture={markInteracted}>
      {showFind && <div className="cms-find-bar cms-pop sticky top-2 z-30 mb-3 rounded-lg border bg-popover shadow-sm"><FindReplaceBar editor={editor} onClose={() => { setShowFind(false)
        editor.commands.focus() }} /></div>}
      {editable && tableActive && <div className="mb-2"><TableControls editor={editor} /></div>}
      <EditorContent editor={editor} className="cms-editor-content relative" />
      {editable && <BubbleToolbar editor={editor} linkRequest={linkRequest} />}
      {blockMenu && <BlockMenu editor={editor} pos={blockMenu.pos} anchor={blockMenu.anchor} onClose={closeBlockMenu} />}
      <MediaPickerModal open={mediaOpen} onClose={() => { setMediaOpen(false)
        editor.commands.focus() }} onSelect={insertPicked} />
    </div>
  )
}
