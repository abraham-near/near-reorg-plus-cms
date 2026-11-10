import type { Status } from '@/generated/prisma/client'
import { hasBody } from './body'
import { HttpError } from '@/cms/lib/http'
import type { PostInput } from './schema'
import { isLive } from './visibility'

// What an API token (Claude) may do to a post, on top of TOKEN_CAP: write drafts, publish now or at
// a set time, and edit live and scheduled posts. Nothing it does is destructive: every save keeps a
// revision a person can restore, and deleting or restoring stays in the editor (service.ts). What
// stays out: changing the public URL or visibility of a published post, emptying a body,
// and editing an archived post's content.
type Previous = { status: Status; slug: string; publishedAt: Date | null; body?: string }

const changed = (input: PostInput) => Object.keys(input).filter((key) => key !== 'expectedUpdatedAt' && input[key as keyof PostInput] !== undefined)

export function assertTokenPostWrite(input: PostInput, previous: Previous | undefined, now = new Date()) {
  if (!previous) return
  // An archived post comes back as a draft or published as it was; its content changes after that.
  if (previous.status === 'ARCHIVED') {
    const keys = changed(input)
    if (keys.some((key) => key !== 'status' && key !== 'publishedAt')) {
      throw new HttpError(403, 'This post is archived. Through an API token you can only move it back to draft or publish it; then edit it.')
    }
    return
  }
  if (previous.status === 'PUBLISHED') {
    const where = isLive(previous, now) ? 'live' : 'scheduled'
    if (input.slug !== undefined && input.slug !== previous.slug) {
      throw new HttpError(403, `This post is ${where}: its URL (slug) can only change in the CMS editor.`)
    }
    if (input.visibility !== undefined) {
      throw new HttpError(403, `This post is ${where}: its visibility can only change in the CMS editor.`)
    }
  }
  if (input.body !== undefined && hasBody(previous.body) && !hasBody(input.body)) {
    throw new HttpError(403, 'Saving would leave the post with an empty body. API tokens cannot remove a post\'s content.')
  }
}

export { isScheduled } from './visibility'
