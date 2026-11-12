import { describe, expect, it } from 'vitest'
import { hasPostFilters, parsePostsQuery, postsHref } from '@/cms/lib/posts/list-query'

describe('posts list query', () => {
  it('reads tabs, filters and pages, and accepts older links', () => {
    expect(parsePostsQuery({})).toEqual({ q: '', tab: 'all', categoryId: '', tagId: '', authorId: '', sort: 'updatedAt', page: 1 })
    expect(parsePostsQuery({ status: 'draft' }).tab).toBe('draft')
    expect(parsePostsQuery({ status: 'PUBLISHED' }).tab).toBe('published')
    expect(parsePostsQuery({ scheduled: 'true', status: 'DRAFT' }).tab).toBe('scheduled')
    expect(parsePostsQuery({ status: 'nope', sort: 'password', page: '-4' })).toMatchObject({ tab: 'all', sort: 'updatedAt', page: 1 })
    expect(parsePostsQuery({ page: '999999999', q: ['a', 'b'] })).toMatchObject({ page: 100_000, q: '' })
    expect(parsePostsQuery({ q: 'x'.repeat(500) }).q).toHaveLength(200)
  })

  it('builds canonical links and resets the page on any other change', () => {
    const query = parsePostsQuery({ q: 'agents', status: 'draft', authorId: 'u1', sort: 'title', page: '3' })
    expect(postsHref(query)).toBe('/admin/posts?q=agents&status=draft&authorId=u1&sort=title')
    expect(postsHref(query, { page: 4 })).toBe('/admin/posts?q=agents&status=draft&authorId=u1&sort=title&page=4')
    expect(postsHref(query, { tab: 'all', q: '  ', authorId: '', sort: 'updatedAt' })).toBe('/admin/posts')
    expect(hasPostFilters(query)).toBe(true)
    expect(hasPostFilters(parsePostsQuery({ status: 'archived' }))).toBe(false)
  })
})
