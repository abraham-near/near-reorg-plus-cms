import { Extension, type Editor } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

/*
 * Uploading images show as inline skeleton widgets (decorations, never document content), so a save
 * during an upload cannot store a placeholder. Each widget is replaced by the image once its upload
 * finishes, or removed when it fails.
 */

type Action = { add: { id: string; pos: number; name: string } } | { remove: string }
export const imageUploadKey = new PluginKey<DecorationSet>('imageUpload')

function widget(name: string) {
  const element = document.createElement('span')
  element.className = 'cms-upload-placeholder cms-skeleton'
  element.setAttribute('role', 'status')
  element.setAttribute('aria-label', `Uploading ${name}`)
  const label = document.createElement('span')
  label.textContent = `Uploading ${name}…`
  element.append(label)
  return element
}

export const ImageUpload = Extension.create({
  name: 'imageUpload',
  addProseMirrorPlugins() {
    return [new Plugin<DecorationSet>({
      key: imageUploadKey,
      state: {
        init: () => DecorationSet.empty,
        apply(tr, set) {
          let next = set.map(tr.mapping, tr.doc)
          const action = tr.getMeta(imageUploadKey) as Action | undefined
          if (action && 'add' in action) {
            next = next.add(tr.doc, [Decoration.widget(action.add.pos, () => widget(action.add.name), { id: action.add.id, side: 1 })])
          } else if (action && 'remove' in action) {
            next = next.remove(next.find(undefined, undefined, (spec) => spec.id === action.remove))
          }
          return next
        },
      },
      props: { decorations: (state) => imageUploadKey.getState(state) },
    })]
  },
})

function placeholderPos(editor: Editor, id: string): number | null {
  const found = imageUploadKey.getState(editor.state)?.find(undefined, undefined, (spec) => spec.id === id)
  return found?.length ? found[0].from : null
}

export interface UploadedImage { url: string; alt?: string | null }
export interface ImageUploadHandlers {
  /** Returns why a file cannot be uploaded (shown to the user), or null. */
  check: (file: File) => string | null
  upload: (file: File) => Promise<UploadedImage>
  onError: (file: File, message: string) => void
}

/** Uploads image files and inserts them at `pos` (in order), showing a skeleton for each meanwhile. */
export async function uploadImagesAt(editor: Editor, files: File[], pos: number, handlers: ImageUploadHandlers) {
  const accepted: { file: File; id: string }[] = []
  for (const file of files) {
    const problem = handlers.check(file)
    if (problem) { handlers.onError(file, problem)
      continue }
    const id = `upload-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
    accepted.push({ file, id })
    const at = Math.max(0, Math.min(pos, editor.state.doc.content.size))
    editor.view.dispatch(editor.state.tr.setMeta(imageUploadKey, { add: { id, pos: at, name: file.name } }))
  }
  for (const { file, id } of accepted) {
    try {
      const { url, alt } = await handlers.upload(file)
      if (editor.isDestroyed) return
      const at = placeholderPos(editor, id)
      const tr = editor.state.tr.setMeta(imageUploadKey, { remove: id })
      editor.view.dispatch(tr)
      if (at === null) continue
      editor.chain().insertContentAt(at, { type: 'image', attrs: { src: url, alt: alt ?? '' } }).run()
    } catch (error) {
      if (editor.isDestroyed) return
      editor.view.dispatch(editor.state.tr.setMeta(imageUploadKey, { remove: id }))
      handlers.onError(file, error instanceof Error ? error.message : 'Upload failed. Please retry.')
    }
  }
}

/** Image files in a clipboard or drop, ignoring Office's picture-of-the-selection when HTML is there too. */
export function imageFilesFrom(data: DataTransfer | null, { ignoreWhenHtml = false } = {}): File[] {
  if (!data) return []
  const files = [...data.files].filter((file) => file.type.startsWith('image/') || /\.(jpe?g|png|gif|webp|avif|svg)$/i.test(file.name))
  if (!files.length) return []
  if (ignoreWhenHtml) {
    // Word and Docs put a rendered picture of the selection next to the HTML: paste the HTML.
    const html = data.getData('text/html')
    if (html && html.replace(/<img[^>]*>/gi, '').replace(/<[^>]+>/g, '').replace(/&nbsp;|\s/g, '').length > 0) return []
  }
  return files
}
