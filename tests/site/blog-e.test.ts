import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BlogE } from '@/components/blog/e/BlogE'
import type { BlogItem } from '@/components/blog/live'
import { POSTS } from '@/components/v3/blog/data'

// The blog index (/blog, version E, D221): the CMS's posts lead, with their own photo, date and excerpt; data.ts's items follow in black and white.
const cms = (over: Partial<BlogItem>): BlogItem => ({
  id: 'cms-test-post', type: 'read', title: 'Test post title', source: 'Test author', url: '/blog/test-post', pic: '/cms/test.webp',
  excerpt: 'Test excerpt.', date: '2026-11-03T12:00:00.000Z', ...over,
})
const html = (live: BlogItem[] = []) => renderToStaticMarkup(createElement(BlogE, { live }))

describe('blog index E', () => {
  it('leads with the newest CMS post: its photo, excerpt and UTC date', () => {
    const out = html([cms({})])
    const lead = out.slice(out.indexOf('be-lead'), out.indexOf('be-bar'))
    expect(lead).toContain('Test post title')
    expect(lead).toContain('src="/cms/test.webp"')
    expect(lead).toContain('Test excerpt.')
    expect(lead).toContain('<time dateTime="2026-11-03T12:00:00.000Z">Nov 3, 2026</time>')
    expect(lead).toContain('href="/blog/test-post"')
    expect(lead).not.toContain('target="_blank"')
  })

  it('gives a CMS post without a photo an empty frame, not a broken image', () => {
    const out = html([cms({ pic: null })])
    expect(out).not.toContain('src="null"')
    expect(out).toContain('<span class="be-pic be-lead__pic"></span>')
  })

  it("shows data.ts's items in black and white, without dates, external links in a new tab", () => {
    const out = html()
    expect(out).toContain(`src="/images/blog/${POSTS[0].id}.webp"`)
    expect(out).not.toContain('<time')
    expect(out).toContain('target="_blank"')
  })

  it('counts every post on the tabs and shows nine cards before Show more', () => {
    const out = html([cms({}), cms({ id: 'cms-2', type: 'watch' })])
    const all = POSTS.length + 2
    expect(out).toContain(`All<sup>${all}</sup>`)
    expect(out).toContain(`Watch<sup>${POSTS.filter((p) => p.type === 'watch').length + 1}</sup>`)
    expect(out.match(/class="be-card"/g)).toHaveLength(9)
    expect(out).toContain(`${all - 1} posts`)
    expect(out).toContain('Show more')
  })
})
