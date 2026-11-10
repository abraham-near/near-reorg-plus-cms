import 'server-only'
import { audit } from '@/cms/lib/audit'
import { cmsOrigin, postPublishedByTokenEmail, postScheduledByTokenEmail, sendEmail } from '@/cms/lib/email'
import type { SessionUser } from '@/cms/lib/session'
import type { AdminPost } from './select'
import { isLive, isScheduled } from './visibility'

const subject = (text: string) => text.replace(/[\r\n]+/g, ' ').slice(0, 200)

/**
 * A post published or scheduled through an API token goes live without passing through the editor,
 * so its owner gets an email and the audit log a dedicated entry. Edits to a post that was already
 * live are not emailed: the audit log and the revision history keep them.
 */
export async function notifyTokenPublish(previous: AdminPost | null, post: AdminPost, user: SessionUser, req: Request) {
  if (user.via !== 'token') return
  const origin = cmsOrigin()
  const editLink = `${origin}/admin/posts/${post.id}/edit`
  if (isLive(post) && !(previous && isLive(previous))) {
    await audit(user, { action: 'POST_PUBLISHED_VIA_TOKEN', entityType: 'POST', entityId: post.id, entityTitle: post.title, diff: { publishedAt: post.publishedAt?.toISOString() ?? null } }, req)
    await sendEmail(user.email, subject(`Published through your API token: ${post.title}`), postPublishedByTokenEmail(user.name, post.title, `${origin}/admin/posts/${post.id}/preview`, editLink))
      .catch((error) => console.error('[cms] publish notice failed', post.id, error))
    return
  }
  if (!isScheduled(post) || !post.publishedAt) return
  if (previous && isScheduled(previous) && previous.publishedAt?.getTime() === post.publishedAt.getTime()) return
  await audit(user, { action: 'POST_SCHEDULED_VIA_TOKEN', entityType: 'POST', entityId: post.id, entityTitle: post.title, diff: { publishedAt: post.publishedAt.toISOString() } }, req)
  await sendEmail(user.email, subject(`Scheduled through your API token: ${post.title}`), postScheduledByTokenEmail(
    user.name, post.title, post.publishedAt, editLink, `${origin}/admin/posts/${post.id}/preview`,
  )).catch((error) => console.error('[cms] schedule notice failed', post.id, error))
}
