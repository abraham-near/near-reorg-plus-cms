export type DashboardPeriod = { period: string; label: string; count: number }
export type PeriodCount = { period: string; count: number }

export function dashboardPeriods(now: Date) {
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1))
  const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  weekStart.setUTCDate(weekStart.getUTCDate() - (weekStart.getUTCDay() + 6) % 7 - 12 * 7)
  const months = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + index, 1))
    return {
      period: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' }),
      count: 0,
    }
  })
  const weeks = Array.from({ length: 13 }, (_, index) => {
    const date = new Date(weekStart.getTime() + index * 7 * 86_400_000)
    return {
      period: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
      count: 0,
    }
  })
  return { monthStart, weekStart, months, weeks }
}

export function fillDashboardPeriods(periods: DashboardPeriod[], counts: PeriodCount[]) {
  const byPeriod = new Map(counts.map(({ period, count }) => [period, count]))
  return periods.map((period) => ({ ...period, count: byPeriod.get(period.period) ?? 0 }))
}
