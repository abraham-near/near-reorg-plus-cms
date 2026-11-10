'use client'

import type { ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/cms/components/ui/tabs'
import { SETTINGS_TABS, type SettingsTab } from '@/cms/components/users/settings-tabs'

const LABELS: Record<SettingsTab, string> = { profile: 'Profile', claude: 'Claude' }

/** Settings split in tabs; the active one is kept in ?tab= so links (profile menu) open it. */
export default function SettingsTabs({ initial, panels }: { initial: SettingsTab; panels: Partial<Record<SettingsTab, ReactNode>> }) {
  const router = useRouter()
  const pathname = usePathname()
  const tabs = SETTINGS_TABS.filter((tab) => panels[tab])

  return (
    <Tabs
      defaultValue={initial}
      onValueChange={(tab) => router.replace(tab === 'profile' ? pathname : `${pathname}?tab=${tab}`, { scroll: false })}
    >
      <TabsList aria-label="Settings sections">
        {tabs.map((tab) => <TabsTrigger key={tab} value={tab}>{LABELS[tab]}</TabsTrigger>)}
      </TabsList>
      {tabs.map((tab) => <TabsContent key={tab} value={tab}>{panels[tab]}</TabsContent>)}
    </Tabs>
  )
}
