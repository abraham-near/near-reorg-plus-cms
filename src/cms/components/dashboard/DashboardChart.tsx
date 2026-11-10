'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/cms/components/ui/card'
import { useHydrated } from '@/cms/lib/useStoredState'
import type { DashboardPeriod } from '@/cms/lib/people/dashboard-periods'

export function DashboardChart({ title, description, data }: { title: string; description: string; data: DashboardPeriod[] }) {
  const hydrated = useHydrated()
  const total = data.reduce((sum, period) => sum + period.count, 0)
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description} · {total.toLocaleString()} total</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-60 min-w-0" role="img" aria-label={`${title}: ${data.map((period) => `${period.label}: ${period.count}`).join(', ')}`}>
          {hydrated ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -20 }} accessibilityLayer>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} minTickGap={16} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'var(--muted)' }} contentStyle={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)', borderColor: 'var(--border)', borderRadius: 8 }} />
                <Bar name="Count" dataKey="count" fill="var(--primary)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-full animate-pulse rounded-md bg-muted/40 motion-reduce:animate-none" />}
        </div>
        {total === 0 && <p className="mt-2 text-sm text-muted-foreground">No activity in this period.</p>}
      </CardContent>
    </Card>
  )
}
