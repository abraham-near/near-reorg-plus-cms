import { describe, expect, it } from 'vitest'
import { calendarDayDiff, formatFullDate, formatRelativeTime, greetingFor } from '@/cms/lib/relative-time'
import { postReadiness } from '@/cms/lib/posts/readiness'
import { countWords, htmlToText, textSnippet, textTail } from '@/cms/lib/posts/text'
import { activitySentence, buildActivity, initialsOf, type ActivityEntry } from '@/cms/lib/people/activity'

const tz = 'America/Mexico_City' // UTC-6, no daylight saving
const now = new Date('2026-11-11T20:00:00Z') // Wed Nov 11, 2:00 PM local

describe('relative time', () => {
  it('words recent past dates', () => {
    expect(formatRelativeTime('2026-11-11T19:59:40Z', now, tz)).toBe('Just now')
    expect(formatRelativeTime('2026-11-11T19:58:00Z', now, tz)).toBe('2 min ago')
    expect(formatRelativeTime('2026-11-11T18:30:00Z', now, tz)).toBe('1 h ago')
    expect(formatRelativeTime('2026-11-11T05:30:00Z', now, tz)).toBe('Yesterday') // 23:30 on Nov 10 local
    expect(formatRelativeTime('2026-11-02T18:00:00Z', now, tz)).toBe('Nov 2')
    expect(formatRelativeTime('2025-12-24T18:00:00Z', now, tz)).toBe('Dec 24, 2025')
  })

  it('treats small clock skew as now and words the future as a schedule', () => {
    expect(formatRelativeTime('2026-11-11T20:00:30Z', now, tz)).toBe('Just now')
    expect(formatRelativeTime('2026-11-11T20:05:00Z', now, tz)).toBe('in 5 min')
    expect(formatRelativeTime('2026-11-11T23:00:00Z', now, tz)).toBe('Today · 5:00 PM')
    expect(formatRelativeTime('2026-11-12T15:00:00Z', now, tz)).toBe('Tomorrow · 9:00 AM')
    expect(formatRelativeTime('2026-11-13T16:00:00Z', now, tz)).toBe('Nov 13 · 10:00 AM')
  })

  it('compares calendar days in the given time zone', () => {
    expect(calendarDayDiff('2026-11-12T05:00:00Z', now, tz)).toBe(0)
    expect(calendarDayDiff('2026-11-12T05:00:00Z', now, 'UTC')).toBe(1)
    expect(formatRelativeTime('not a date', now, tz)).toBe('—')
  })

  it('gives a full date for tooltips and a greeting by local hour', () => {
    expect(formatFullDate('2026-11-02T18:05:00Z', tz)).toBe('Monday, November 2, 2026 at 12:05 PM')
    expect(greetingFor(new Date('2026-11-11T14:00:00Z'), tz)).toBe('Good morning')
    expect(greetingFor(now, tz)).toBe('Good afternoon')
    expect(greetingFor(new Date('2026-11-12T02:00:00Z'), tz)).toBe('Good evening')
    expect(greetingFor(new Date('2026-11-11T09:00:00Z'), tz)).toBe('Good evening') // 3 AM
  })
})

describe('post text and readiness', () => {
  it('turns sanitized HTML into words', () => {
    const text = htmlToText('<h2>Hello&nbsp;world</h2><p>Agents ask&#39;s &amp; <strong>don&#x27;t</strong> — take.</p><script>x()</script>')
    expect(text).toBe("Hello world Agents ask's & don't — take.")
    expect(countWords(text)).toBe(6)
    expect(htmlToText(null)).toBe('')
  })

  it('shortens text at word boundaries', () => {
    const text = 'One two three four five six seven eight nine ten'
    expect(textSnippet(text, 20)).toBe('One two three four…')
    expect(textTail(text, 20)).toBe('…seven eight nine ten')
    expect(textTail('short', 20)).toBe('short')
  })

  it('counts the five checks', () => {
    const empty = postReadiness({ title: '', excerpt: ' ', categoryCount: 0, featuredImage: null, wordCount: 0 })
    expect(empty.ready).toBe(0)
    expect(empty.total).toBe(5)
    const some = postReadiness({ title: 'Intents, explained', excerpt: 'Say what you want.', categoryCount: 1, featuredImage: null, wordCount: 149 })
    expect(some.ready).toBe(3)
    expect(some.checks.filter((check) => !check.ok).map((check) => check.key)).toEqual(['cover', 'length'])
    expect(postReadiness({ title: 'T', excerpt: 'E', categoryCount: 2, featuredImage: '/cms/a.jpg', wordCount: 150 }).ready).toBe(5)
  })
})

describe('team activity sentences', () => {
  const base = { userId: 'u-julius', actorName: 'Julius Lee', viaToken: false, entityId: 'p1', postExists: true }
  const at = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60_000)
  const entry = (id: string, fields: Partial<ActivityEntry>): ActivityEntry => ({ ...base, id, action: 'UPDATE', entityType: 'POST', entityTitle: 'Chain signatures', createdAt: at(0), ...fields })

  it('words post actions and links to existing posts', () => {
    const [published, scheduled, archived, deleted] = buildActivity([
      entry('a', { action: 'PUBLISH' }),
      entry('b', { action: 'PUBLISH', entityId: 'p2', entityTitle: 'NEARCON recap', scheduled: true, createdAt: at(30) }),
      entry('c', { action: 'STATUS_CHANGE', entityId: 'p3', entityTitle: 'Office hours', diff: { from: 'PUBLISHED', to: 'ARCHIVED' }, createdAt: at(60) }),
      entry('d', { action: 'DELETE', entityId: 'p4', entityTitle: 'Old news', postExists: false, createdAt: at(90) }),
    ], 'u-me')
    expect(activitySentence(published)).toBe('Julius Lee published Chain signatures')
    expect(published.href).toBe('/admin/posts/p1/edit')
    expect(published.initials).toBe('JL')
    expect(activitySentence(scheduled)).toBe('Julius Lee scheduled NEARCON recap')
    expect(activitySentence(archived)).toBe('Julius Lee archived Office hours')
    expect(activitySentence(deleted)).toBe('Julius Lee deleted Old news')
    expect(deleted.href).toBeNull()
  })

  it('groups uploads by one person within minutes and says "You"', () => {
    const upload = (id: string, file: string, minutesAgo: number, userId = 'u-me'): ActivityEntry =>
      ({ id, userId, actorName: 'Abraham Almazan', viaToken: false, action: 'UPLOAD', entityType: 'MEDIA', entityId: id, entityTitle: file, createdAt: at(minutesAgo) })
    const items = buildActivity([
      upload('1', 'a.jpg', 0), upload('2', 'b.png', 1), upload('3', 'c.webp', 3), upload('4', 'd.jpg', 5), upload('5', 'e.jpg', 6), upload('6', 'f.gif', 8),
      upload('7', 'g.pdf', 40),
      upload('8', 'h.jpg', 41, 'u-julius'),
    ], 'u-me')
    expect(items.map(activitySentence)).toEqual(['You uploaded 6 images', 'You uploaded g.pdf', 'Abraham Almazan uploaded h.jpg'])
    expect(items[0].count).toBe(6)
  })

  it('folds a burst of saves into the action it led to', () => {
    const items = buildActivity([
      entry('1', { action: 'PUBLISH', createdAt: at(0) }),
      entry('2', { action: 'UPDATE', createdAt: at(0) }),
      entry('3', { action: 'UPDATE', createdAt: at(4) }),
      entry('4', { action: 'UPDATE', createdAt: at(8) }),
      entry('5', { action: 'UPDATE', entityId: 'p9', entityTitle: 'Other', createdAt: at(9) }),
      entry('6', { action: 'CREATE', entityId: 'p9', entityTitle: 'Other', createdAt: at(12) }),
    ], 'u-me')
    expect(items.map(activitySentence)).toEqual(['Julius Lee published Chain signatures', 'Julius Lee created Other'])
  })

  it('skips rows it cannot word, notes Claude, and respects the limit', () => {
    const items = buildActivity([
      entry('1', { action: 'LOGIN', entityType: 'AUTH' }),
      entry('2', { action: 'CREATE', viaToken: true, actorName: null, userId: null }),
      ...Array.from({ length: 10 }, (_, index) => entry(`x${index}`, { action: 'DELETE', entityId: `d${index}`, createdAt: at(20 * (index + 1)) })),
    ], 'u-me', 4)
    expect(items).toHaveLength(4)
    expect(activitySentence(items[0])).toBe('Someone created Chain signatures with Claude')
    expect(initialsOf('abraham@near.org')).toBe('AB')
    expect(initialsOf('')).toBe('?')
  })
})
