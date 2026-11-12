'use client'

import { useNow } from '@/cms/lib/useStoredState'
import { greetingFor } from '@/cms/lib/relative-time'

/**
 * "Wednesday, November 11" and "Good afternoon, Abraham" in the viewer's time zone. The server
 * cannot know it, so the first render keeps the space with an invisible stand-in and the real
 * text fades in right after hydration.
 */
export function DashboardGreeting({ firstName }: { firstName: string }) {
  const now = useNow(60_000)
  const date = now?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  return (
    <div className="min-w-0">
      <p className={now ? 'cms-fade-up text-[13px] text-muted-foreground' : 'invisible text-[13px]'}>{date ?? 'Today'}</p>
      <h1 className="mt-1 text-[28px] font-[650] leading-tight tracking-[-0.01em]">
        <span className={now ? 'cms-fade-up' : 'invisible'}>{now ? greetingFor(now) : 'Welcome back'}</span>, {firstName}
      </h1>
    </div>
  )
}
