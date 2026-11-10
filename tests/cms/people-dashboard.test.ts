import { describe, expect, it } from 'vitest'
import { dashboardPeriods, fillDashboardPeriods } from '@/cms/lib/people/dashboard-periods'

describe('people dashboard periods', () => {
  it('uses twelve UTC months and thirteen Monday-aligned weeks across year boundaries', () => {
    const periods = dashboardPeriods(new Date('2027-01-03T23:59:59Z'))
    expect(periods.monthStart.toISOString()).toBe('2026-02-01T00:00:00.000Z')
    expect(periods.months).toHaveLength(12)
    expect(periods.months.at(-1)?.period).toBe('2027-01-01')
    expect(periods.weeks).toHaveLength(13)
    expect(periods.weeks.at(-1)?.period).toBe('2026-12-28')
    expect(periods.weeks.every(({ period }) => new Date(`${period}T00:00:00Z`).getUTCDay() === 1)).toBe(true)
  })

  it('preserves zero periods and ignores rows outside the window', () => {
    const { months } = dashboardPeriods(new Date('2026-10-15T00:00:00Z'))
    const result = fillDashboardPeriods(months, [{ period: '2026-10-01', count: 7 }, { period: '2023-01-01', count: 99 }])
    expect(result).toHaveLength(12)
    expect(result.at(-1)?.count).toBe(7)
    expect(result.slice(0, -1).every(({ count }) => count === 0)).toBe(true)
  })
})
