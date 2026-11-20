import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BlogE } from '@/components/blog/e/BlogE'
import { TOP_TAGS, tagList } from '@/components/blog/e/tags'
import type { BlogItem } from '@/components/blog/live'
import { POSTS } from '@/components/v3/blog/data'

// The blog index (/blog, version E; D221, rebuilt as A2: D240–D244): the CMS's posts lead, with their own photo, date, excerpt and tags;
// data.ts's items follow in black and white. Types as large words without counts, tag pills led by the four product tags, ruled cards.
const cms = (over: Partial<BlogItem>): BlogItem => ({
  id: 'cms-test-post', type: 'read', title: 'Test post title', source: 'Test author', url: '/blog/test-post', pic: '/cms/test.webp',
  excerpt: 'Test excerpt.', date: '2026-11-03T12:00:00.000Z', tags: [], ...over,
})
const html = (live: BlogItem[] = []) => renderToStaticMarkup(createElement(BlogE, { live }))
const between = (s: string, a: string, b: string) => s.slice(s.indexOf(a), s.indexOf(b, s.indexOf(a)))

describe('blog index E', () => {
  it('leads with the newest CMS post: its photo, excerpt, UTC date and tags', () => {
    const out = html([cms({ tags: ['Privacy'] })])
    const lead = between(out, 'be-lead', 'be-filters')
    expect(lead).toContain('Test post title')
    expect(lead).toContain('src="/cms/test.webp"')
    expect(lead).toContain('Test excerpt.')
    expect(lead).toContain('<time class="be-date" dateTime="2026-11-03T12:00:00.000Z">Nov 3, 2026</time>')
    expect(lead).toContain('<span class="be-ctags"><span>Privacy</span></span>')
    expect(lead).toContain('href="/blog/test-post"')
    expect(lead).not.toContain('target="_blank"')
  })

  it('gives a CMS post without a photo an empty frame, not a broken image', () => {
    const out = html([cms({ pic: null })])
    expect(out).not.toContain('src="null"')
    expect(out).toContain('<span class="be-pic be-lead__pic"></span>')
  })

  it("shows data.ts's items in black and white, with no dates (they have none), external links in a new tab", () => {
    const out = html()
    expect(out).toContain(`src="/images/blog/${POSTS[0].id}.webp"`)
    expect(out).not.toContain('<time')
    expect(out).toContain('target="_blank"')
  })

  it('shows the types without counts, the lead once (never in the grid), and nine cards before Show more', () => {
    const out = html([cms({}), cms({ id: 'cms-2', title: 'Second test post', type: 'watch' })])
    const types = between(out, 'be-types__row', 'be-n')
    expect(types).not.toContain('<sup')
    expect(types.match(/class="be-tb"/g)).toHaveLength(4)
    expect(out.match(/Test post title/g)).toHaveLength(1)
    expect(out.match(/class="be-card"/g)).toHaveLength(9)
    expect(out).toContain(`${POSTS.length + 1} posts`)
    expect(out).toContain('Show more')
  })

  it('leads the tag pills with the four product tags, in order, then the rest', () => {
    const out = html([cms({ tags: ['Zebra test tag'] })])
    const pills = [...between(out, 'be-tags', 'be-grid').matchAll(/class="be-pill"[^>]*>([^<]+)/g)].map((m) => m[1])
    expect(pills.slice(0, 4)).toEqual([...TOP_TAGS])
    expect(pills).toContain('Zebra test tag')
    expect(pills.at(-1)).toBe('Zebra test tag')
  })
})

describe('blog tags', () => {
  it('keeps the four product tags first and merges a CMS tag that differs only in case', () => {
    const list = tagList([['near ai', 'Privacy'], ['Alpha test tag', 'NEAR  Intents']])
    expect(list.slice(0, 4)).toEqual([...TOP_TAGS])
    expect(list.filter((t) => t.toLowerCase().replace(/\s+/g, ' ') === 'near ai')).toHaveLength(1)
    expect(list.filter((t) => t.toLowerCase().replace(/\s+/g, ' ') === 'near intents')).toHaveLength(1)
    expect(list).toContain('Alpha test tag')
  })
})
