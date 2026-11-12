import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/cms/components/ui/button'
import { DashboardGreeting } from '@/cms/components/dashboard/DashboardGreeting'
import { UpNext } from '@/cms/components/dashboard/UpNext'
import { CardCaption, ContinueWriting, QuickActions, TeamActivity, YourDrafts, cardClass } from '@/cms/components/dashboard/TodayCards'
import { apiTokensEnabled } from '@/cms/lib/api-tokens/auth'
import { requirePagePermission } from '@/cms/lib/auth'
import { can } from '@/cms/lib/permissions'
import { getDashboard } from '@/cms/lib/people/dashboard'

// Reads the session (cookie + database) before rendering: this page blocks by design (src/app/(cms)/layout.tsx).
export const instant = false

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const { user } = await requirePagePermission('admin:access')
  const { denied } = await searchParams
  const data = await getDashboard(user)
  const canWrite = can(user.role, 'post:write')
  const firstName = user.name?.trim().split(/\s+/)[0] || user.email.split('@')[0]
  return (
    <div className="flex flex-col gap-[22px]">
      {denied && <p role="status" className="rounded-lg border bg-[var(--warning-bg)] p-3 text-sm text-[var(--warning-fg)]">Your role does not have access to that page.</p>}
      <header data-tour-id="dashboard" className="flex flex-wrap items-end gap-4">
        <DashboardGreeting firstName={firstName} />
        <span className="flex-1" />
        {canWrite && <Button asChild><Link href="/admin/posts/new"><Plus />New post</Link></Button>}
      </header>

      <QuickActions canWrite={canWrite} canUpload={can(user.role, 'media:upload')} claude={can(user.role, 'apitoken:manage') && apiTokensEnabled()} />

      <div className="flex flex-wrap items-start gap-5">
        <div className="flex min-w-0 flex-[2_1_520px] flex-col gap-5">
          <ContinueWriting draft={data.continueWriting} canWrite={canWrite} />
          {data.continueWriting && <YourDrafts drafts={data.drafts} />}
        </div>
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
          <section aria-labelledby="up-next" className={cardClass} style={{ animationDelay: '60ms' }}>
            <CardCaption className="mb-3"><span id="up-next">Up next</span></CardCaption>
            <UpNext posts={data.scheduled} />
          </section>
          {data.activity && <TeamActivity items={data.activity} />}
        </div>
      </div>
    </div>
  )
}
