import { Extension } from '@tiptap/core'
import type { Node } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

interface SearchState { query: string,matchCase: boolean,decorations: DecorationSet }
export const findReplaceKey = new PluginKey<SearchState>('findReplace')

export function findTextMatches(doc: Node, query: string, matchCase = false): { from: number,to: number }[] {
  if (!query) return []
  const matches: { from: number,to: number }[] = []
  const term = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(term, matchCase ? 'gu' : 'giu')
  doc.descendants((node, position) => {
    if (!node.isTextblock) return
    const original = node.textBetween(0, node.content.size, '', '\ufffc')
    pattern.lastIndex = 0
    for (const match of original.matchAll(pattern)) {
      matches.push({ from: position + 1 + match.index, to: position + 1 + match.index + match[0].length })
    }
    return false
  })
  return matches
}

export const FindReplace = Extension.create({
  name: 'findReplace',
  addProseMirrorPlugins() { return [new Plugin<SearchState>({
    key: findReplaceKey,
    state: {
      init: () => ({ query: '', matchCase: false, decorations: DecorationSet.empty }),
      apply(transaction, previous, _oldState, nextState) {
        const settings = transaction.getMeta(findReplaceKey) as { query: string,matchCase: boolean } | undefined
        if (!settings && !transaction.docChanged) return previous
        const { query, matchCase } = settings ?? previous
        const matches = findTextMatches(nextState.doc, query, matchCase)
        return { query, matchCase, decorations: DecorationSet.create(nextState.doc, matches.map(({ from, to }) => Decoration.inline(from, to, { class: 'bg-yellow-200 text-black' }))) }
      },
    },
    props: { decorations: (state) => findReplaceKey.getState(state)?.decorations ?? DecorationSet.empty },
  })] },
})
