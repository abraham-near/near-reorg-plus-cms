// The posts list's URL: which tab, search, filters, sort and page. Shared by the server page (to
// query) and the client toolbar (to build links), so every view of the list is a shareable URL.

export const POST_TABS = ['all', 'draft', 'scheduled', 'published', 'archived'] as const
export type PostTab = (typeof POST_TABS)[number]

export const POST_SORTS = {
  updatedAt: 'Last edited',
  createdAt: 'Created',
  title: 'Title',
  publishedAt: 'Publish date',
} as const
export type PostSort = keyof typeof POST_SORTS

export type PostsQuery = {
  q: string
  tab: PostTab
  categoryId: string
  tagId: string
  authorId: string
  sort: PostSort
  page: number
}

type Params = Record<string, string | string[] | undefined>

const MAX_PAGE = 100_000

/** Reads the list's query string. Older links (`status=PUBLISHED`, `scheduled=true`) still work. */
export function parsePostsQuery(params: Params): PostsQuery {
  const read = (name: string) => {
    const value = params[name]
    return typeof value === 'string' ? value : ''
  }
  const status = read('status').toLowerCase()
  const tab: PostTab = read('scheduled') === 'true' ? 'scheduled' : (POST_TABS as readonly string[]).includes(status) ? status as PostTab : 'all'
  const sort = read('sort')
  return {
    q: read('q').slice(0, 200),
    tab,
    categoryId: read('categoryId').slice(0, 100),
    tagId: read('tagId').slice(0, 100),
    authorId: read('authorId').slice(0, 100),
    sort: sort in POST_SORTS ? sort as PostSort : 'updatedAt',
    page: Math.min(MAX_PAGE, Math.max(1, Number.parseInt(read('page') || '1', 10) || 1)),
  }
}

/** The list's URL for `query` with `changes` applied. Any change other than the page goes back to page 1. */
export function postsHref(query: PostsQuery, changes: Partial<PostsQuery> = {}) {
  const next = { ...query, ...changes }
  if (!('page' in changes)) next.page = 1
  const params = new URLSearchParams()
  if (next.q.trim()) params.set('q', next.q.trim())
  if (next.tab !== 'all') params.set('status', next.tab)
  if (next.categoryId) params.set('categoryId', next.categoryId)
  if (next.tagId) params.set('tagId', next.tagId)
  if (next.authorId) params.set('authorId', next.authorId)
  if (next.sort !== 'updatedAt') params.set('sort', next.sort)
  if (next.page > 1) params.set('page', String(next.page))
  const search = params.toString()
  return search ? `/admin/posts?${search}` : '/admin/posts'
}

/** True when anything narrows the list besides the tab. */
export const hasPostFilters = (query: PostsQuery) => !!(query.q.trim() || query.categoryId || query.tagId || query.authorId)
