import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { uploadMedia } from '@/cms/components/media/upload-client'

// The browser side: videos go up in parts, everything else in one request as before.
type Reply = { status: number; data: unknown }
let log: string[] = []
let answer: (method: string, url: string) => Reply

class FakeXHR {
  upload: { onprogress?: (event: { loaded: number }) => void } = {}
  status = 0
  responseText = ''
  withCredentials = false
  onload?: () => void
  onerror?: () => void
  onabort?: () => void
  private method = ''
  private url = ''
  open(method: string, url: string) { this.method = method; this.url = url }
  setRequestHeader() {}
  abort() { this.onabort?.() }
  send(body: unknown) {
    log.push(`${this.method} ${this.url}${body instanceof Blob && this.method === 'PUT' ? ` (${body.size})` : ''}`)
    queueMicrotask(() => {
      const reply = answer(this.method, this.url)
      this.status = reply.status
      this.responseText = JSON.stringify(reply.data)
      this.onload?.()
    })
  }
}

const globals = globalThis as unknown as Record<string, unknown>
const realFetch = globalThis.fetch
beforeEach(() => {
  log = []
  answer = (method, url) => {
    if (url === '/api/admin/media') return { status: 201, data: { id: 'image' } }
    if (url === '/api/admin/media/uploads') return { status: 201, data: { ticket: 't', partSize: 4, parts: 3 } }
    if (url.startsWith('/api/admin/media/uploads/part')) return { status: 200, data: { ok: true } }
    if (url === '/api/admin/media/uploads/complete') return { status: 201, data: { id: 'video' } }
    return { status: 404, data: { error: `${method} ${url}` } }
  }
  globals.XMLHttpRequest = FakeXHR
  globals.window = { addEventListener() {}, removeEventListener() {}, location: { pathname: '/admin/media', href: '' } }
  globals.fetch = async (url: string) => { log.push(`fetch ${url}`); return new Response('{}') }
})
afterEach(() => { delete globals.XMLHttpRequest; delete globals.window; globalThis.fetch = realFetch })

describe('uploadMedia', () => {
  it('sends a video in parts: start, each part in order, complete', async () => {
    const progress: (number | null)[] = []
    const media = await uploadMedia(new File([new Uint8Array(10)], 'talk.mp4', { type: 'video/mp4' }), { onProgress: (p) => progress.push(p) })
    expect(media).toEqual({ id: 'video' })
    expect(log).toEqual([
      'POST /api/admin/media/uploads',
      'PUT /api/admin/media/uploads/part?n=1 (4)',
      'PUT /api/admin/media/uploads/part?n=2 (4)',
      'PUT /api/admin/media/uploads/part?n=3 (2)',
      'POST /api/admin/media/uploads/complete',
    ])
    expect(progress.at(-1)).toBe(1)
  })
  it('sends an image (or a document) in one request, as before', async () => {
    expect(await uploadMedia(new File([new Uint8Array(10)], 'photo.png', { type: 'image/png' }))).toEqual({ id: 'image' })
    await uploadMedia(new File([new Uint8Array(10)], 'deck.pdf', { type: 'application/pdf' }))
    expect(log).toEqual(['POST /api/admin/media', 'POST /api/admin/media'])
  })
  it('a part that keeps failing drops the upload; one refused for what it is is not retried', async () => {
    const base = answer
    answer = (method, url) => (url.startsWith('/api/admin/media/uploads/part') ? { status: 415, data: { error: 'Unsupported or unrecognized file type' } } : base(method, url))
    await expect(uploadMedia(new File([new Uint8Array(10)], 'fake.mp4'))).rejects.toMatchObject({ status: 415 })
    expect(log).toEqual(['POST /api/admin/media/uploads', 'PUT /api/admin/media/uploads/part?n=1 (4)', 'fetch /api/admin/media/uploads/abort'])
  })
})
