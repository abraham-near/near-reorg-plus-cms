import { describe, expect, it } from 'vitest'
import { cleanFilename, sanitizeSvg, sniff } from '@/cms/lib/media'

const b = (...bytes: number[]) => Buffer.from([...bytes, ...new Array(32).fill(0)])

describe('sniff', () => {
  it('detects by magic bytes, not by extension', () => {
    expect(sniff(b(0xff, 0xd8, 0xff, 0xe0), 'photo.png')?.ext).toBe('jpg')
    expect(sniff(b(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a), 'x.jpg')?.ext).toBe('png')
    expect(sniff(Buffer.from('%PDF-1.7 rest'), 'doc.pdf')?.ext).toBe('pdf')
    expect(sniff(Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 ')]), 'a.webp')?.ext).toBe('webp')
    expect(sniff(Buffer.concat([Buffer.alloc(4), Buffer.from('ftypisom'), Buffer.alloc(8)]), 'v.mp4')?.ext).toBe('mp4')
  })
  it('rejects HTML or scripts disguised as images', () => {
    expect(sniff(Buffer.from('<html><script>alert(1)</script></html>'), 'x.png')).toBeNull()
    expect(sniff(Buffer.from('<html><body>hi</body></html>'), 'x.svg')).toBeNull()
    expect(sniff(Buffer.from('#!/bin/sh\nrm -rf /'), 'x.csv')).not.toBeNull() // CSV is text; it is served as attachment
    expect(sniff(Buffer.from('MZ\x90\x00'), 'x.exe')).toBeNull()
  })
  it('accepts real SVG only with .svg extension', () => {
    expect(sniff(Buffer.from('<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg"></svg>'), 'a.svg')?.ext).toBe('svg')
    expect(sniff(Buffer.from('<svg></svg>'), 'a.txt')).toBeNull()
  })
  it('zip-based office docs keep their extension; anything else zip is zip', () => {
    const zip = b(0x50, 0x4b, 0x03, 0x04)
    expect(sniff(zip, 'deck.pptx')?.ext).toBe('pptx')
    expect(sniff(zip, 'evil.html')?.ext).toBe('zip')
  })
})

describe('sanitizeSvg', () => {
  it('strips scripts, handlers and external refs', () => {
    const out = sanitizeSvg('<svg xmlns="http://www.w3.org/2000/svg" onload="x()"><script>alert(1)</script><a href="javascript:x"><circle r="2"/></a><foreignObject><div>hi</div></foreignObject></svg>')
    expect(out).not.toMatch(/script|onload|javascript|foreignObject/i)
    expect(out).toContain('circle')
  })
})

describe('cleanFilename', () => {
  it('drops paths and control characters', () => {
    expect(cleanFilename('../../etc/passwd')).toBe('passwd')
    expect(cleanFilename('a\u0000b.png')).toBe('ab.png')
    expect(cleanFilename('')).toBe('file')
  })
})
