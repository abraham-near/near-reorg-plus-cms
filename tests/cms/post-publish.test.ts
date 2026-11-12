import { describe, expect, it } from 'vitest'
import { countWords, imagesMissingAlt, plainText, publishChecks, readingMinutes, snippet } from '@/cms/components/posts/publish-checks'
import { addDays, formatOffset, formatScheduleLabel, formatUtcLine, monthCells, relativeTime, utcToZoned, zoneLabel, zoneOffsetMinutes, zonedToUtc } from '@/cms/components/posts/schedule-time'

describe('publish checks', () => {
  it('counts words across blocks and entities', () => {
    expect(plainText('<h2>One</h2><p>two&nbsp;three</p><ul><li>four</li><li>five</li></ul>')).toBe('One two three four five')
    expect(countWords('<p>Hello <strong>big</strong> world</p><p>again</p>')).toBe(4)
    expect(countWords('')).toBe(0)
    expect(readingMinutes(0)).toBe(1)
    expect(readingMinutes(221)).toBe(2)
  })

  it('finds images without alt text (missing or empty)', () => {
    expect(imagesMissingAlt('<p>none</p>')).toEqual({ total: 0, missing: 0 })
    expect(imagesMissingAlt('<img src="/a.png" alt="A cat"><img src="/b.png"><img alt="" src="/c.png"><img src=\'/d\' alt=\'D\'>')).toEqual({ total: 4, missing: 2 })
    expect(imagesMissingAlt('<img data-alt="x" src="/a.png">').missing).toBe(1)
  })

  it('builds the checklist with warnings, never errors', () => {
    const body = `<p>${'word '.repeat(160)}</p><img src="/a.png">`
    const checks = publishChecks({ title: 'Hello', excerpt: '', categoryNames: ['Ecosystem'], featuredImage: '', body })
    expect(checks.map((c) => [c.key, c.ok])).toEqual([['title', true], ['summary', false], ['category', true], ['cover', false], ['alt', false], ['length', true]])
    expect(checks.find((c) => c.key === 'alt')?.title).toBe('1 image without alt text')
    expect(checks.filter((c) => !c.ok).every((c) => c.action)).toBe(true)
    expect(publishChecks({ title: ' ', excerpt: 'x', categoryNames: [], featuredImage: '/a.png', body: '<p>short</p>' }).find((c) => c.key === 'length')?.ok).toBe(false)
  })

  it('makes a search snippet', () => {
    expect(snippet('<p>abc</p>')).toBe('abc')
    expect(snippet(`<p>${'a'.repeat(200)}</p>`)).toHaveLength(160)
  })
})

describe('schedule time zones', () => {
  it('converts wall-clock time in a zone to the UTC instant', () => {
    expect(zonedToUtc('2026-11-13', '10:00', 'America/Mexico_City').toISOString()).toBe('2026-11-13T16:00:00.000Z')
    expect(zonedToUtc('2026-11-13', '10:00', 'UTC').toISOString()).toBe('2026-11-13T10:00:00.000Z')
    expect(zonedToUtc('2026-07-01', '09:30', 'Europe/Lisbon').toISOString()).toBe('2026-07-01T08:30:00.000Z')
    expect(zonedToUtc('2026-01-15', '09:30', 'Asia/Kolkata').toISOString()).toBe('2026-01-15T04:00:00.000Z')
    // New York in summer (EDT) and winter (EST)
    expect(zonedToUtc('2026-07-01', '12:00', 'America/New_York').toISOString()).toBe('2026-07-01T16:00:00.000Z')
    expect(zonedToUtc('2026-12-01', '12:00', 'America/New_York').toISOString()).toBe('2026-12-01T17:00:00.000Z')
  })

  it('round-trips through utcToZoned, across DST changes', () => {
    for (const [date, time, zone] of [['2026-03-08', '03:30', 'America/New_York'], ['2026-11-01', '00:30', 'America/Los_Angeles'], ['2026-10-25', '12:00', 'Europe/Lisbon']] as const) {
      expect(utcToZoned(zonedToUtc(date, time, zone), zone)).toEqual({ date, time })
    }
  })

  it('formats offsets and labels', () => {
    expect(formatOffset(-360)).toBe('UTC−6')
    expect(formatOffset(330)).toBe('UTC+5:30')
    expect(formatOffset(0)).toBe('UTC')
    const at = new Date('2026-11-13T16:00:00Z')
    expect(zoneOffsetMinutes(at, 'America/Mexico_City')).toBe(-360)
    expect(zoneLabel('America/Mexico_City', at)).toBe('Mexico City (UTC−6)')
    expect(formatScheduleLabel(at, 'America/Mexico_City')).toBe('Fri, Nov 13 · 10:00 AM')
    expect(formatUtcLine(at)).toBe('Fri 16:00 UTC')
  })

  it('builds month grids and relative times', () => {
    const november = monthCells(2026, 11)
    expect(november[0]).toEqual({ date: '2026-11-01', day: 1 }) // Nov 1 2026 is a Sunday
    expect(november.filter(Boolean)).toHaveLength(30)
    expect(monthCells(2026, 12).slice(0, 2)).toEqual([null, null])
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    const now = new Date('2026-11-11T12:00:00Z')
    expect(relativeTime(new Date('2026-11-11T11:59:40Z'), now)).toBe('just now')
    expect(relativeTime(new Date('2026-11-11T11:55:00Z'), now)).toBe('5 min ago')
    expect(relativeTime(new Date('2026-11-11T09:00:00Z'), now)).toBe('3 h ago')
  })
})
