import { describe, expect, it } from 'vitest'
import { assertBodyShape, prepareBody } from '@/cms/lib/posts/body'
import { assertTokenPostWrite } from '@/cms/lib/posts/token-rules'
import { createPostSchema } from '@/cms/lib/posts/schema'
import { taxonomyCreateSchema } from '@/cms/lib/posts/taxonomy'
import { HttpError, parseJson, route } from '@/cms/lib/http'
import { stripTags } from '@/cms/lib/sanitize'
import { z } from 'zod'

const status = (fn: () => unknown) => {
  try { fn() } catch (error) { return error instanceof HttpError ? error.status : 'other' }
  return 'ok'
}

describe('post body shape', () => {
  it('rejects deeply nested bodies before sanitizing', () => {
    expect(status(() => assertBodyShape('<div>'.repeat(5000) + 'x' + '</div>'.repeat(5000)))).toBe(400)
  })
  it('accepts normal bodies, void tags and self-closing tags', () => {
    expect(status(() => assertBodyShape('<h2>Hi</h2><p>a<br>b<img src="/cms/a.png"></p><ul><li><p>x</p></li></ul>'))).toBe('ok')
    expect(prepareBody('<p>ok</p>')).toBe('<p>ok</p>')
  })
})

describe('API token rules', () => {
  const now = new Date('2026-11-10T12:00:00Z')
  const past = new Date('2026-11-01T00:00:00Z')
  it('refuses a body that only becomes empty after sanitizing', () => {
    const previous = { status: 'PUBLISHED' as const, slug: 'a', publishedAt: past, body: '<p>text</p>' }
    expect(status(() => assertTokenPostWrite({ body: '<script>x</script>' }, previous, now))).toBe(403)
  })
  it('keeps the URL and visibility of a post that has been live, even after it is unpublished', () => {
    const previous = { status: 'DRAFT' as const, slug: 'a', publishedAt: past, body: '<p>text</p>' }
    expect(status(() => assertTokenPostWrite({ slug: 'b' }, previous, now))).toBe(403)
    expect(status(() => assertTokenPostWrite({ visibility: 'UNLISTED' }, previous, now))).toBe(403)
  })
  it('still lets a token rename a draft that was never published', () => {
    const previous = { status: 'DRAFT' as const, slug: 'a', publishedAt: null, body: '' }
    expect(status(() => assertTokenPostWrite({ slug: 'b' }, previous, now))).toBe('ok')
  })
})

describe('plain text fields', () => {
  it('strips tags without HTML-escaping the text', () => {
    expect(stripTags('Tom & Jerry <3')).toBe('Tom & Jerry <3')
    expect(stripTags('A <b>bold</b> & move')).toBe('A bold & move')
    expect(stripTags('A & B > C')).toBe('A & B > C')
  })
  it('stores titles and taxonomy names as typed', () => {
    expect(createPostSchema.parse({ title: 'Tom & Jerry <3', slug: 'x' }).title).toBe('Tom & Jerry <3')
    expect(createPostSchema.parse({ title: 'Using Vec<u8> in Rust', slug: 'x' }).title).toBe('Using Vec<u8> in Rust')
    expect(createPostSchema.parse({ title: 'Two\r\nlines\u0007', slug: 'x' }).title).toBe('Two lines')
    expect(createPostSchema.parse({ title: 't', slug: 'x', excerpt: 'Para one\nPara two' }).excerpt).toBe('Para one\nPara two')
    expect(taxonomyCreateSchema.parse({ name: '<b>News</b>' }).name).toBe('<b>News</b>')
  })
  it('rejects image URLs that could break out of an attribute', () => {
    expect(createPostSchema.safeParse({ title: 't', slug: 'x', featuredImage: 'https://example.com/a.png" onerror="x' }).success).toBe(false)
    expect(createPostSchema.safeParse({ title: 't', slug: 'x', featuredImage: '/cms/a.png' }).success).toBe(true)
  })
})

describe('request guards', () => {
  const origin = 'http://localhost:3000'
  const req = (body: string, headers: Record<string, string> = {}, url = `${origin}/api/admin/x`) =>
    new Request(url, { method: 'POST', body, headers: { host: 'localhost:3000', origin, 'content-type': 'application/json', ...headers } })
  it('rejects NUL characters with 400 instead of a database error', async () => {
    await expect(parseJson(req(JSON.stringify({ name: 'a\u0000b' })), z.object({ name: z.string() }))).rejects.toMatchObject({ status: 400 })
    const handler = route(async () => new Response('ok'))
    expect((await handler(new Request(`${origin}/api/admin/x?q=%00`, { headers: { host: 'localhost:3000' } }), undefined)).status).toBe(400)
  })
  it('does not let a malformed bearer skip the same-origin check', async () => {
    const handler = route(async () => new Response('ok'), { token: true })
    const response = await handler(req('{}', { origin: 'https://evil.example', authorization: 'Bearer ncms_junk' }), undefined)
    expect(response.status).toBe(401)
  })
  it('ignores X-Forwarded-Host when checking the origin', async () => {
    const handler = route(async () => new Response('ok'))
    const response = await handler(req('{}', { origin: 'https://evil.example', 'x-forwarded-host': 'evil.example' }), undefined)
    expect(response.status).toBe(403)
  })
})
