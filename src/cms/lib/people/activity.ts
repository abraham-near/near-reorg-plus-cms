// Audit rows → "Julius published Chain signatures" sentences for the dashboard's Team activity.
// Pure: src/cms/lib/people/dashboard.ts loads the rows, this file words and groups them.

/** Audit actions the dashboard puts into words. Anything else (sign-ins, tokens, people) is left out. */
export const ACTIVITY_ACTIONS = {
  POST: ['CREATE', 'UPDATE', 'PUBLISH', 'STATUS_CHANGE', 'RESTORE', 'DELETE'],
  MEDIA: ['UPLOAD', 'UPDATE', 'REPLACE', 'BULK_DELETE'],
} as const

export type ActivityEntry = {
  id: string
  userId: string | null
  /** Display name of the person, when the account still exists. */
  actorName: string | null
  viaToken: boolean
  action: string
  entityType: string
  entityId: string | null
  entityTitle: string | null
  createdAt: Date | string
  diff?: unknown
  /** POST rows: the post still exists, so the sentence can link to it. */
  postExists?: boolean
  /** POST PUBLISH rows: the publication date was later than the action, so it was a schedule. */
  scheduled?: boolean
}

export type ActivityItem = {
  id: string
  userId: string | null
  actor: string
  initials: string
  viaClaude: boolean
  /** "published", "uploaded 6 images", … */
  verb: string
  /** The post title or file name the verb applies to, if any. */
  object: string | null
  href: string | null
  createdAt: string
  count: number
}

const GROUP_WINDOW_MS = 10 * 60_000
const IMAGE = /\.(jpe?g|png|gif|webp|avif|svg|heic)$/i

export function initialsOf(name: string | null | undefined) {
  const words = (name ?? '').trim().split('@')[0].split(/[\s._-]+/).filter(Boolean)
  if (!words.length) return '?'
  return (words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[words.length - 1][0]).toUpperCase()
}

const diffValue = (diff: unknown, key: string) =>
  diff && typeof diff === 'object' && !Array.isArray(diff) ? (diff as Record<string, unknown>)[key] : undefined

/** The verb for one audit row, or null when the row is not worth showing. */
export function activityVerb(entry: Pick<ActivityEntry, 'action' | 'entityType' | 'diff' | 'scheduled'>): string | null {
  if (entry.entityType === 'POST') {
    switch (entry.action) {
      case 'CREATE': return 'created'
      case 'UPDATE': return 'edited'
      case 'PUBLISH': return entry.scheduled ? 'scheduled' : 'published'
      case 'RESTORE': return 'restored an earlier version of'
      case 'DELETE': return 'deleted'
      case 'STATUS_CHANGE': {
        const to = diffValue(entry.diff, 'to')
        const from = diffValue(entry.diff, 'from')
        if (to === 'ARCHIVED') return 'archived'
        if (to === 'DRAFT') return from === 'ARCHIVED' ? 'unarchived' : 'unpublished'
        return 'changed the status of'
      }
    }
    return null
  }
  if (entry.entityType === 'MEDIA') {
    switch (entry.action) {
      case 'UPLOAD': return 'uploaded'
      case 'UPDATE': return 'updated the details of'
      case 'REPLACE': return 'replaced'
      case 'BULK_DELETE': {
        const ids = diffValue(entry.diff, 'deletedIds')
        const count = Array.isArray(ids) ? ids.length : 0
        return count ? `deleted ${count} ${count === 1 ? 'file' : 'files'}` : null
      }
    }
  }
  return null
}

// When several rows about one post are folded together, the most telling verb wins.
const rank = (verb: string) => verb === 'edited' ? 0 : verb === 'created' ? 1 : 2

type Group = { item: ActivityItem; oldest: number; kind: 'upload' | 'post' | 'other'; files: string[]; entityId: string | null }

/**
 * Words and groups audit rows (newest first). Consecutive uploads by one person within ten minutes
 * become "uploaded 6 images"; a burst of saves on one post becomes one "edited" (or the publish it
 * led to). `currentUserId` reads as "You".
 */
export function buildActivity(entries: ActivityEntry[], currentUserId: string, limit = 6): ActivityItem[] {
  const groups: Group[] = []
  for (const entry of entries) {
    const verb = activityVerb(entry)
    if (!verb) continue
    const at = new Date(entry.createdAt).getTime()
    const last = groups.at(-1)
    const sameActor = last && last.item.userId === entry.userId && last.item.viaClaude === entry.viaToken && last.oldest - at <= GROUP_WINDOW_MS
    const isUpload = entry.entityType === 'MEDIA' && entry.action === 'UPLOAD'
    const isPost = entry.entityType === 'POST'
    if (sameActor && isUpload && last.kind === 'upload') {
      last.files.push(entry.entityTitle ?? '')
      last.oldest = at
      last.item.count = last.files.length
      const images = last.files.every((file) => IMAGE.test(file))
      last.item.verb = `uploaded ${last.files.length} ${images ? 'images' : 'files'}`
      last.item.object = null
      continue
    }
    if (sameActor && isPost && last.kind === 'post' && last.entityId === entry.entityId && entry.entityId
      && (verb === 'edited' || last.item.verb === 'edited' || verb === 'created')) {
      if (rank(verb) > rank(last.item.verb)) last.item.verb = verb
      last.item.count += 1
      last.oldest = at
      continue
    }
    if (groups.length >= limit) break
    const self = !!entry.userId && entry.userId === currentUserId
    const name = entry.actorName?.trim() || 'Someone'
    groups.push({
      kind: isUpload ? 'upload' : isPost ? 'post' : 'other',
      oldest: at,
      files: isUpload ? [entry.entityTitle ?? ''] : [],
      entityId: entry.entityId,
      item: {
        id: entry.id,
        userId: entry.userId,
        actor: self ? 'You' : name,
        initials: initialsOf(name),
        viaClaude: entry.viaToken,
        verb,
        object: verb.startsWith('deleted ') ? null : entry.entityTitle?.trim() || (isPost ? 'Untitled post' : null),
        href: isPost && entry.postExists && entry.entityId && entry.action !== 'DELETE' ? `/admin/posts/${encodeURIComponent(entry.entityId)}/edit` : null,
        createdAt: new Date(entry.createdAt).toISOString(),
        count: 1,
      },
    })
  }
  return groups.map((group) => group.item)
}

/** The whole sentence as plain text, e.g. for screen readers and tests. */
export function activitySentence(item: Pick<ActivityItem, 'actor' | 'verb' | 'object' | 'viaClaude'>) {
  return `${item.actor} ${item.verb}${item.object ? ` ${item.object}` : ''}${item.viaClaude ? ' with Claude' : ''}`
}
