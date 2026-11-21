import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BlogF } from '@/components/blog/f/BlogF'
import { CMS_POSTS } from '@/components/blog/f/posts'
import type { BlogItem } from '@/components/blog/live'
import { POSTS } from '@/components/v3/blog/data'

// The blog index (/blog, version F; D254, D255): the CMS's 24 newest live PUBLIC posts, hard-coded, then the Go deeper samples less the two that are
// CMS posts; the lead as an editorial opener.
const html = (posts?: BlogItem[]) => renderToStaticMarkup(createElement(BlogF, posts ? { posts } : {}))

describe('blog index F', () => {
  it('hard-codes 24 CMS posts, newest first, each with a date, its own page and a photo on disk; no test post', () => {
    expect(CMS_POSTS).toHaveLength(24)
    const dates = CMS_POSTS.map((p) => p.date!)
    expect([...dates].sort().reverse()).toEqual(dates)
    for (const p of CMS_POSTS) {
      expect(p.url).toBe(`/blog/${p.id.replace(/^cms-/, '')}`)
      expect(existsSync(join(process.cwd(), 'public', p.pic!))).toBe(true)
    }
    expect(CMS_POSTS.some((p) => p.id === 'cms-ai-in-the-front-blockchain')).toBe(false)
  })

  it('leads with the newest CMS post under a Latest kicker, then lists the Go deeper samples less the two that are CMS posts', () => {
    const out = html()
    const lead = out.slice(out.indexOf('bf-lead'), out.indexOf('bf-filters'))
    expect(lead).toContain('>Latest<')
    expect(lead).toContain(CMS_POSTS[0].title)
    expect(lead).toContain(`src="${CMS_POSTS[0].pic}"`)
    expect(out).not.toContain('/images/blog/agent-economy.webp')
    expect(out).not.toContain('/images/blog/ledger.webp')
    expect(out).toContain(`${CMS_POSTS.length + POSTS.length - 2 - 1} posts`)
    expect(out.match(/class="bf-card"/g)).toHaveLength(9)
  })

  it('shows All, Blog, Press and Watch (the samples carry Press and Watch), and pills only for tags some post carries', () => {
    const out = html()
    expect(out.match(/class="bf-tb"/g)).toHaveLength(4)
    expect(out).toContain('>Inside NEAR<')
    const pills = [...out.matchAll(/class="bf-pill"[^>]*>([^<]+)/g)].map((m) => m[1])
    expect(pills).not.toContain('Zebra test tag')
    expect(pills).toContain('Governance')
  })

  it('steps a long title down', () => {
    const long = html([{ ...CMS_POSTS[0], title: 'A'.repeat(80) }])
    expect(long).toContain('data-long="true"')
    expect(html()).not.toContain('data-long')
  })
})

describe('hard-wired articles (D256)', () => {
  it('are the 4 newest CMS posts, with their photos on disk and no /cms/ links left', async () => {
    const { LOCAL_ARTICLES } = await import('@/lib/blog/local-articles')
    expect(LOCAL_ARTICLES.map((a) => `cms-${a.slug}`)).toEqual(CMS_POSTS.slice(0, 4).map((p) => p.id))
    for (const a of LOCAL_ARTICLES) {
      const html = 'html' in a.article.body ? a.article.body.html : ''
      expect(html.length).toBeGreaterThan(3000)
      expect(html).not.toMatch(/["']\/cms\//)
      for (const src of [a.article.hero!.src, ...[...html.matchAll(/<img\b[^>]*?\ssrc="([^"]+)"/g)].map((m) => m[1])]) {
        expect(existsSync(join(process.cwd(), 'public', src))).toBe(true)
      }
    }
  })
})
