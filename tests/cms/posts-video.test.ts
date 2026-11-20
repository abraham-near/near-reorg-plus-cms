import { describe, expect, it } from 'vitest'
import { checkUpload, acceptAttribute, uploadLimitLines } from '@/cms/components/media/upload-limits'
import { publishChecks } from '@/cms/components/posts/publish-checks'
import { sniff } from '@/cms/lib/media'
import { postReadiness } from '@/cms/lib/posts/readiness'
import { createPostSchema, updatePostSchema } from '@/cms/lib/posts/schema'
import { assertTokenPostWrite } from '@/cms/lib/posts/token-rules'
import { isCmsVideoUrl, normalizeVideo, videoEmbedUrl } from '@/cms/lib/posts/video'
import { VIDEO_OUTPUTS } from '../video-outputs'

// Video posts on the CMS side: the link parser, the API's validation, the upload limits and the publish checks.
describe('videoEmbedUrl', () => {
  const YT = 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', YT],
    ['https://youtube.com/watch?v=dQw4w9WgXcQ&list=PL1&index=2', YT],
    ['https://m.youtube.com/watch?v=dQw4w9WgXcQ', YT],
    ['https://youtu.be/dQw4w9WgXcQ?si=abc', YT],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', YT],
    ['https://www.youtube.com/live/dQw4w9WgXcQ', YT],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', YT],
    [' https://youtu.be/dQw4w9WgXcQ?t=90 ', `${YT}?start=90`],
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s', `${YT}?start=90`],
    ['https://youtu.be/dQw4w9WgXcQ?t=1h2m3s', `${YT}?start=3723`],
    ['https://vimeo.com/76979871', 'https://player.vimeo.com/video/76979871'],
    ['https://vimeo.com/76979871/abc123def0', 'https://player.vimeo.com/video/76979871?h=abc123def0'],
    ['https://vimeo.com/channels/staffpicks/76979871', 'https://player.vimeo.com/video/76979871'],
    ['https://player.vimeo.com/video/76979871?h=abc123&badge=0', 'https://player.vimeo.com/video/76979871?h=abc123'],
  ])('%s', (input, out) => expect(videoEmbedUrl(input)).toBe(out))

  it('gives back its own output unchanged', () => {
    for (const out of VIDEO_OUTPUTS.embeds) expect(videoEmbedUrl(out)).toBe(out)
  })

  it.each([
    'http://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=short',
    'https://www.youtube.com/embed/videoseries?list=PL123',
    'https://www.youtube.com/playlist?list=PL123',
    'https://evil.example/watch?v=dQw4w9WgXcQ',
    'https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ',
    'https://user:pass@youtube.com/watch?v=dQw4w9WgXcQ',
    'https://vimeo.com/abc',
    'javascript:alert(1)',
    '//youtube.com/watch?v=dQw4w9WgXcQ',
    'not a link',
  ])('refuses %s', (input) => expect(videoEmbedUrl(input)).toBeNull())
})

describe('normalizeVideo', () => {
  it('keeps an uploaded MP4/WebM as it is', () => {
    for (const file of VIDEO_OUTPUTS.files) expect(normalizeVideo(file)).toBe(file)
    expect(isCmsVideoUrl('/cms/a1b2c3.mp4')).toBe(true)
  })
  it.each(['/cms/a.mov', '/cms/a.jpg', '/cms/../a.mp4', '/cms/a/b.mp4', '//evil/a.mp4', '/videos/a.mp4', '/cms/a.mp4?x=1'])('refuses %s', (input) => {
    expect(normalizeVideo(input)).toBeNull()
  })
})

describe('the post schema', () => {
  const base = { title: 'T', slug: 't' }
  it('stores the normalized value, and null for empty or null', () => {
    expect(createPostSchema.parse({ ...base, video: 'https://youtu.be/dQw4w9WgXcQ' }).video).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
    expect(createPostSchema.parse({ ...base, video: '/cms/abc.mp4' }).video).toBe('/cms/abc.mp4')
    expect(createPostSchema.parse({ ...base, video: '' }).video).toBeNull()
    expect(createPostSchema.parse({ ...base, video: '   ' }).video).toBeNull()
    expect(updatePostSchema.parse({ video: null }).video).toBeNull()
    expect('video' in updatePostSchema.parse({ title: 'x' })).toBe(false)
  })
  it('refuses anything else with a clear message', () => {
    const r = updatePostSchema.safeParse({ video: 'https://example.com/clip.mp4' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0]?.path).toEqual(['video'])
    expect(r.error?.issues[0]?.message).toMatch(/YouTube or Vimeo/)
  })
})

describe('uploads', () => {
  const MB = 1024 * 1024
  it('caps videos at 100 MB (sent in parts)', () => {
    expect(checkUpload({ name: 'a.mp4', size: 100 * MB })).toBeNull()
    expect(checkUpload({ name: 'a.mp4', size: 100 * MB + 1 })).toMatch(/Too large/)
  })
  it('the video picker takes MP4 and WebM only', () => {
    expect(checkUpload({ name: 'a.mp4', size: MB }, { videosOnly: true })).toBeNull()
    expect(checkUpload({ name: 'a.webm', size: MB }, { videosOnly: true })).toBeNull()
    expect(checkUpload({ name: 'a.mov', size: MB }, { videosOnly: true })).toMatch(/MOV/)
    expect(checkUpload({ name: 'a.pdf', size: MB }, { videosOnly: true })).toMatch(/MP4 or WebM/)
    expect(checkUpload({ name: 'a.jpg', size: MB }, { videosOnly: true })).toMatch(/MP4 or WebM/)
    expect(acceptAttribute('video').split(',')).toEqual(['.mp4', 'video/mp4', '.webm', 'video/webm'])
    expect(uploadLimitLines('video')[0]).toBe('MP4 or WebM · up to 100 MB')
  })
  it('an iPhone HEIC photo is not taken for an MP4', () => {
    const ftyp = (brand: string) => Buffer.concat([Buffer.alloc(4), Buffer.from(`ftyp${brand}`), Buffer.alloc(8)])
    expect(sniff(ftyp('heic'), 'IMG_1.heic')).toBeNull()
    expect(sniff(ftyp('mif1'), 'IMG_1.mp4')).toBeNull()
    expect(sniff(ftyp('isom'), 'clip.mp4')?.ext).toBe('mp4')
  })
})

describe('publish checks and readiness', () => {
  const input = { title: 'A talk', excerpt: 'About it', categoryNames: ['Watch'], featuredImage: '/cms/c.webp', body: '' }
  const by = (video?: 'ok' | 'missing' | 'invalid' | 'broken') => publishChecks({ ...input, video })
  it('an article keeps its six checks', () => {
    expect(by().map((c) => c.key)).toEqual(['title', 'summary', 'category', 'cover', 'alt', 'length'])
    expect(by().find((c) => c.key === 'length')?.ok).toBe(false)
  })
  it('a video post checks its video and needs no word count', () => {
    expect(by('ok').map((c) => [c.key, c.ok])).toEqual([['video', true], ['title', true], ['summary', true], ['category', true], ['cover', true], ['alt', true], ['length', true]])
    expect(by('missing')[0]).toMatchObject({ ok: false, title: 'Video format but no video' })
    expect(by('invalid')[0]).toMatchObject({ ok: false, title: 'Video link not recognised' })
    expect(by('broken')[0]).toMatchObject({ ok: false, title: 'Video file missing' })
  })
  it('the dashboard counts a video draft as long enough', () => {
    const draft = { title: 'T', excerpt: 'S', categoryCount: 1, featuredImage: '/cms/c.webp', wordCount: 0 }
    expect(postReadiness(draft).ready).toBe(4)
    expect(postReadiness({ ...draft, hasVideo: true }).ready).toBe(5)
  })
})

describe('API tokens and the video', () => {
  const live = { status: 'PUBLISHED' as const, slug: 's', publishedAt: new Date('2020-01-01'), body: '', video: '/cms/a.mp4' }
  it('cannot take the video from a post with no text', () => {
    expect(() => assertTokenPostWrite({ video: null }, live)).toThrow(/leave the post empty/)
    expect(() => assertTokenPostWrite({ video: null }, { ...live, status: 'DRAFT' })).toThrow(/leave the post empty/)
    expect(() => assertTokenPostWrite({ video: null, body: '' }, live)).toThrow(/leave the post empty/)
  })
  it('can when the post keeps its text, or swap the video', () => {
    expect(() => assertTokenPostWrite({ video: null }, { ...live, body: '<p>Text</p>' })).not.toThrow()
    expect(() => assertTokenPostWrite({ video: null, body: '<p>New text</p>' }, live)).not.toThrow()
    expect(() => assertTokenPostWrite({ video: 'https://player.vimeo.com/video/1' }, live)).not.toThrow()
    expect(() => assertTokenPostWrite({ title: 'x' }, live)).not.toThrow()
  })
})
