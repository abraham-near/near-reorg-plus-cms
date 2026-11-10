import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { isAllowedEmbed, safeUrl } from '@/cms/lib/sanitize'
import { EmbedBlockView } from '../node-views/EmbedBlockView'

export function embedUrl(value: string): string | null {
  if (!safeUrl(value)) return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return null
    if (['youtube.com', 'www.youtube.com', 'youtu.be'].includes(url.hostname)) {
      const id = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.pathname === '/watch' ? url.searchParams.get('v') : null
      if (id && /^[\w-]{11}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}`
    }
    if (['vimeo.com', 'www.vimeo.com'].includes(url.hostname) && /^\/\d+$/.test(url.pathname)) return `https://player.vimeo.com/video${url.pathname}`
    return isAllowedEmbed(url.href) ? url.href : null
  } catch { return null }
}
export const EmbedBlock = Node.create({
  name: 'embedBlock', group: 'block', atom: true, draggable: true,
  addAttributes() { return { url: { default: '', rendered: false, parseHTML: (element) => element.querySelector('iframe')?.getAttribute('src') ?? '' } } },
  parseHTML() { return [{ tag: 'div[data-type="embed-block"]' }] },
  renderHTML({ node }) {
    const src = embedUrl(String(node.attrs.url))
    return src ? ['div', { 'data-type': 'embed-block', class: 'my-4' }, ['iframe', { src, title: 'Embedded content', class: 'aspect-video w-full', loading: 'lazy', sandbox: 'allow-scripts allow-same-origin allow-presentation allow-popups', referrerpolicy: 'strict-origin-when-cross-origin', allowfullscreen: '' }]] : ['div', { 'data-type': 'embed-block' }]
  },
  addNodeView() { return ReactNodeViewRenderer(EmbedBlockView) },
})
