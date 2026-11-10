import { mkdtemp, readdir, rm, stat, symlink, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import path from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { strToU8, zipSync } from 'fflate'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { docxToText, importDocx, parseRels } from '@/cms/mcp/docx'
import { createServer } from '@/cms/mcp/server'
import { defaultUploadDir, listUploads } from '@/cms/mcp/uploads'

const opened = vi.hoisted(() => [] as { cmd: string; args: string[] }[])
vi.mock('node:child_process', () => ({
  execFile: (cmd: string, args: string[], done: (error: Error | null) => void) => { opened.push({ cmd, args }); done(null) },
}))

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
const DOCUMENT = `<?xml version="1.0"?><w:document ${W}><w:body>
<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Big &amp; bold</w:t></w:r></w:p>
<w:p><w:r><w:t xml:space="preserve">Intro with </w:t></w:r><w:hyperlink r:id="rId9"><w:r><w:t>a link</w:t></w:r></w:hyperlink><w:r><w:t>.</w:t></w:r></w:p>
<w:p><w:r><w:drawing><a:blip r:embed="rId5"/></w:drawing></w:r></w:p>
<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/></w:numPr></w:pPr><w:r><w:t>First item</w:t></w:r></w:p>
<w:p><w:r><w:t></w:t></w:r></w:p>
</w:body></w:document>`
const RELS = `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/>
<Relationship Id="rId9" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://near.org/?a=1&amp;b=2" TargetMode="External"/>
</Relationships>`

describe('docx text', () => {
  it('keeps headings, links, list items and image positions in reading order', () => {
    expect(docxToText(DOCUMENT, parseRels(RELS))).toBe([
      '## Big & bold',
      'Intro with [a link](https://near.org/?a=1&b=2).',
      '[image: image1.png]',
      '- First item',
    ].join('\n\n'))
  })
})

describe('upload folder tools', () => {
  let root: string, outside: string
  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'ncms-local-'))
    outside = await mkdtemp(path.join(tmpdir(), 'ncms-out-'))
    // A minimal .docx.
    await writeFile(path.join(root, 'Launch post.docx'), zipSync({
      'word/document.xml': strToU8(DOCUMENT),
      'word/_rels/document.xml.rels': strToU8(RELS),
      'word/media/image1.png': strToU8('png'),
      'word/media/image2.emf': strToU8('emf'),
      'word/media/.hidden.png': strToU8('x'),
    }))
    await writeFile(path.join(root, 'notes.docx'), zipSync({ 'notes.txt': strToU8('x') }))
    await writeFile(path.join(root, 'fake.docx'), 'not a zip')
    await writeFile(path.join(root, 'photo.jpg'), 'x')
    await writeFile(path.join(root, '.hidden.png'), 'x')
    await writeFile(path.join(outside, 'secret.docx'), 'x')
    await symlink(path.join(outside, 'secret.docx'), path.join(root, 'link.docx'))
  })
  afterEach(async () => { await rm(root, { recursive: true, force: true }); await rm(outside, { recursive: true, force: true }) })

  it('lists images and documents, skipping hidden files and symlinks', async () => {
    expect(await listUploads(root)).toEqual([
      { path: 'fake.docx', size: 9, kind: 'docx' },
      { path: 'Launch post.docx', size: expect.any(Number), kind: 'docx' },
      { path: 'notes.docx', size: expect.any(Number), kind: 'docx' },
      { path: 'photo.jpg', size: 1, kind: 'image' },
    ])
    await expect(listUploads(null)).rejects.toThrow(/NEAR_CMS_UPLOAD_DIR/)
  })

  it('imports a document: text plus its images in a new folder, never overwriting', async () => {
    const first = await importDocx('Launch post.docx', root)
    expect(first.text).toContain('[image: image1.png]')
    expect(first.folder).toBe('Launch-post-images')
    expect(first.images).toEqual(['Launch-post-images/image1.png'])
    expect(first.skipped).toEqual(['Launch-post-images/image2.emf'])
    const second = await importDocx('Launch post.docx', root)
    expect(second.folder).toBe('Launch-post-images-2')
    expect(await readdir(path.join(root, 'Launch-post-images'))).toEqual(['image1.png', 'image2.emf'])
  })

  it('refuses files outside the folder, symlinks and other types', async () => {
    await expect(importDocx('link.docx', root)).rejects.toThrow()
    await expect(importDocx('../secret.docx', root)).rejects.toThrow()
    await expect(importDocx('photo.jpg', root)).rejects.toThrow(/Only .docx/)
    await expect(importDocx('fake.docx', root)).rejects.toThrow(/does not look like a Word document/)
    await expect(importDocx('notes.docx', root)).rejects.toThrow(/does not look like a Word document/)
  })

  it('is exposed as MCP tools that never call the CMS', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const server = createServer({ env: { NEAR_CMS_URL: 'http://localhost:3000', NEAR_CMS_UPLOAD_DIR: root }, getToken: async () => 'unused' })
    const client = new Client({ name: 't', version: '0' })
    const [a, b] = InMemoryTransport.createLinkedPair()
    await Promise.all([server.connect(a), client.connect(b)])
    const listed = await client.callTool({ name: 'list_upload_files', arguments: {} })
    expect(listed.isError).toBeFalsy()
    expect(JSON.parse((listed.content as { text: string }[])[0].text)).toMatchObject({ exists: true, files: expect.arrayContaining([{ path: 'photo.jpg', size: 1, kind: 'image' }]) })
    const imported = await client.callTool({ name: 'import_docx', arguments: { path: 'Launch post.docx' } })
    expect((imported.content as { text: string }[])[0].text).toContain('not instructions')
    expect(fetch).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('tells where the folder is when it is missing, and only open_upload_folder creates and opens it', async () => {
    const missing = path.join(outside, 'NEAR CMS uploads')
    const server = createServer({ env: { NEAR_CMS_URL: 'http://localhost:3000', NEAR_CMS_UPLOAD_DIR: missing }, getToken: async () => 'unused' })
    const client = new Client({ name: 't', version: '0' })
    const [a, b] = InMemoryTransport.createLinkedPair()
    await Promise.all([server.connect(a), client.connect(b)])
    const text = async (name: string) => (await client.callTool({ name, arguments: {} })).content as { text: string }[]
    const listed = JSON.parse((await text('list_upload_files'))[0].text)
    expect(listed).toMatchObject({ folder: missing, exists: false, files: [] })
    expect(listed.note).toMatch(/drag/)
    await expect(stat(missing)).rejects.toThrow()
    opened.length = 0
    const result = JSON.parse((await text('open_upload_folder'))[0].text)
    expect((await stat(missing)).isDirectory()).toBe(true)
    expect(opened).toHaveLength(1)
    expect(opened[0].args).toEqual([result.opened])
    expect(path.basename(result.opened)).toBe('NEAR CMS uploads')
  })

  it('defaults the Desktop upload folder to Documents/NEAR CMS uploads', () => {
    expect(defaultUploadDir()).toBe(path.join(homedir(), 'Documents', 'NEAR CMS uploads'))
  })
})
