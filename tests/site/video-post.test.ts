import { describe, expect, it } from 'vitest'
import { cardType, toArticle, toMore } from '@/lib/blog/article'
import type { LivePost, PostCard } from '@/lib/blog/posts'
import { safeVideo, videoMime } from '@/lib/blog/video'
import { VIDEO_OUTPUTS } from '../video-outputs'

// Video posts on the site: the stored video checked again, the Watch type in the indexes, the play mark in "more posts".
describe('safeVideo', () => {
  it('accepts every shape the CMS stores, unchanged', () => {
    for (const src of VIDEO_OUTPUTS.files) expect(safeVideo(src)).toEqual({ kind: 'file', src })
    for (const src of VIDEO_OUTPUTS.embeds) expect(safeVideo(src)).toEqual({ kind: 'embed', src })
  })
  it('rebuilds a player URL, keeping only the start time and the private hash', () => {
    expect(safeVideo('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=90&autoplay=1&mute=1')?.src).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=90')
    expect(safeVideo('https://player.vimeo.com/video/76979871?h=abc&autoplay=1')?.src).toBe('https://player.vimeo.com/video/76979871?h=abc')
    expect(safeVideo('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=x')?.src).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
  })
  it.each([null, '', '/cms/a.mov', '/cms/../a.mp4', '/videos/a.mp4', 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'https://www.youtube-nocookie.com/embed/videoseries', 'http://player.vimeo.com/video/1', 'https://player.vimeo.com.evil/video/1',
    'javascript:alert(1)', 'https://evil.example/a.mp4'])('refuses %s', (value) => expect(safeVideo(value)).toBeNull())
  it('gives Open Graph the right type', () => {
    expect(videoMime({ kind: 'embed', src: VIDEO_OUTPUTS.embeds[0] })).toBe('text/html')
    expect(videoMime({ kind: 'file', src: '/cms/a.mp4' })).toBe('video/mp4')
    expect(videoMime({ kind: 'file', src: '/cms/a.webm' })).toBe('video/webm')
  })
})

const card = (over: Partial<PostCard> = {}): PostCard => ({
  slug: 'talk', title: 'A talk', excerpt: null, image: null, publishedAt: '2026-11-19T00:00:00.000Z', author: 'NEAR', category: null, tags: [], video: null, ...over,
})

describe('the blog index type', () => {
  it('a video post is Watch, whatever its category', () => {
    expect(cardType(card({ video: { kind: 'file', src: '/cms/a.mp4' } }))).toBe('watch')
    expect(cardType(card({ video: { kind: 'embed', src: VIDEO_OUTPUTS.embeds[0] }, category: { name: 'Press', slug: 'press' } }))).toBe('watch')
  })
  it('an article keeps its category\'s type', () => {
    expect(cardType(card())).toBe('read')
    expect(cardType(card({ category: { name: 'Press', slug: 'press' } }))).toBe('story')
    expect(cardType(card({ category: { name: 'Watch', slug: 'watch' } }))).toBe('watch')
  })
  it('"more posts" marks a video post with the play mark, and links without ?layout=', () => {
    expect(toMore(card({ video: { kind: 'file', src: '/cms/a.mp4' } }))).toMatchObject({ type: 'watch', href: '/blog/talk' })
    expect(toMore(card())).not.toHaveProperty('type')
  })
  it('the article carries the video to the layout', () => {
    const video = { kind: 'embed' as const, src: VIDEO_OUTPUTS.embeds[0] }
    const post = { ...card({ video }), visibility: 'PUBLIC', updatedAt: '2026-11-19T00:00:00.000Z', metaTitle: null, metaDescription: null, metaImage: null,
      categories: [], tags: [], html: '', sections: [], readMin: 1, summary: '', notes: [], takeaways: [], layout: null } satisfies LivePost
    expect(toArticle(post, []).video).toEqual(video)
  })
})
