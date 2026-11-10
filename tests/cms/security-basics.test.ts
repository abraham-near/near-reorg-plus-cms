import { describe, expect, it } from 'vitest'
import { safeNext } from '@/cms/lib/safe-next'
import { safeEqual, sign, verifySigned } from '@/cms/lib/crypto'
import { isAllowedEmail } from '@/cms/lib/email-domain'
import { PERMISSIONS, can } from '@/cms/lib/permissions'
import { escapeHtml, isAllowedEmbed, safeUrl, sanitizeRichHtml } from '@/cms/lib/sanitize'

describe('email domain allowlist', () => {
  it.each(['a@near.org', 'A.B@NEARFOUNDATION.COM', ' x@nearsp.com ', 'a@near.foundation'])('accepts %s', (email) => {
    expect(isAllowedEmail(email)).toBe(true)
  })
  it.each([
    'a@gmail.com',
    'a@evilnear.org',
    'a@near.org.evil.com',
    'a@sub.near.org',
    'a@near.org@evil.com',
    '@near.org',
    'near.org',
    '',
  ])('rejects %s', (email) => {
    expect(isAllowedEmail(email)).toBe(false)
  })
})

describe('permissions', () => {
  it('admin has everything', () => {
    for (const p of PERMISSIONS) expect(can('ADMIN', p)).toBe(true)
  })
  it('publisher runs the blog but cannot manage people, delete media, read the audit log or take over locks', () => {
    for (const p of ['media:delete', 'user:manage', 'audit:read', 'lock:override'] as const) {
      expect(can('PUBLISHER', p)).toBe(false)
    }
    for (const p of ['post:write', 'post:publish', 'post:delete', 'taxonomy:manage', 'media:upload'] as const) {
      expect(can('PUBLISHER', p)).toBe(true)
    }
  })
  it('no role means no access', () => {
    expect(can(null, 'admin:access')).toBe(false)
  })
})

describe('safeUrl', () => {
  it.each(['https://near.org', 'http://x.y', 'mailto:a@near.org', 'tel:+1', '/blog/x', '#top'])('keeps %s', (u) => {
    expect(safeUrl(u)).toBe(u)
  })
  it.each(['javascript:alert(1)', ' JaVaScRiPt:alert(1)', 'data:text/html,<script>', 'vbscript:x', '//evil.com', 'ftp://x'])('drops %s', (u) => {
    expect(safeUrl(u)).toBeNull()
  })
})

describe('embeds', () => {
  it('allows known hosts over https only', () => {
    expect(isAllowedEmbed('https://www.youtube-nocookie.com/embed/abc')).toBe(true)
    expect(isAllowedEmbed('http://www.youtube.com/embed/abc')).toBe(false)
    expect(isAllowedEmbed('https://evil.com/?youtube.com')).toBe(false)
    expect(isAllowedEmbed('https://youtube.com.evil.com/embed')).toBe(false)
  })
})

describe('sanitizeRichHtml', () => {
  it('removes scripts, handlers, styles and bad links', () => {
    const out = sanitizeRichHtml(
      '<p onclick="x()" style="color:red">Hi<script>alert(1)</script><a href="javascript:alert(1)">x</a><img src="x" onerror="y()"></p>',
    )
    expect(out).not.toMatch(/script|onclick|onerror|style=|javascript:/i)
    expect(out).toContain('Hi')
  })
  it('keeps allowed iframes sandboxed and drops others', () => {
    const out = sanitizeRichHtml(
      '<iframe src="https://www.youtube-nocookie.com/embed/a"></iframe><iframe src="https://evil.com/x"></iframe>',
    )
    expect(out).toContain('youtube-nocookie.com/embed/a')
    expect(out).toContain('sandbox=')
    expect(out).not.toContain('evil.com')
  })
  it('adds rel to target=_blank links', () => {
    expect(sanitizeRichHtml('<a href="https://x.com" target="_blank">x</a>')).toContain('rel="noopener noreferrer"')
  })
  it('escapeHtml escapes markup', () => {
    expect(escapeHtml('<b a="1">&\'')).toBe('&lt;b a=&quot;1&quot;&gt;&amp;&#39;')
  })
})

describe('signed values', () => {
  it('round-trips and rejects tampering', () => {
    const v = sign('post:123:9999999999', 'preview')
    expect(verifySigned(v, 'preview')).toBe('post:123:9999999999')
    expect(verifySigned(v, 'other-purpose')).toBeNull()
    expect(verifySigned(v.replace('123', '124'), 'preview')).toBeNull()
    expect(verifySigned('nodot', 'preview')).toBeNull()
  })
  it('safeEqual compares by value', () => {
    expect(safeEqual('a', 'a')).toBe(true)
    expect(safeEqual('a', 'ab')).toBe(false)
  })
})

describe('login redirect target', () => {
  it.each([
    [undefined, '/admin/dashboard'],
    ['/admin/posts', '/admin/posts'],
    ['//evil.com', '/admin/dashboard'],
    ['https://evil.com', '/admin/dashboard'],
    ['/blog', '/admin/dashboard'],
    ['/admin/../x', '/admin/dashboard'],
  ])('%s → %s', (input, expected) => {
    expect(safeNext(input)).toBe(expected)
  })
})
