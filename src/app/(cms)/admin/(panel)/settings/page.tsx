import type { Metadata } from 'next'
import ProfileSettings from '@/cms/components/users/ProfileSettings'
import ProfileSessions from '@/cms/components/users/ProfileSessions'
import ConnectClaude from '@/cms/components/users/ConnectClaude'
import SettingsTabs from '@/cms/components/users/SettingsTabs'
import { SETTINGS_TABS, type SettingsTab } from '@/cms/components/users/settings-tabs'
import { apiTokensEnabled } from '@/cms/lib/api-tokens/auth'
import { requirePagePermission } from '@/cms/lib/auth'
import { cmsOrigin } from '@/cms/lib/email'
import { listOwnApiTokens } from '@/cms/lib/people/api-tokens'
import { can } from '@/cms/lib/permissions'
import { getProfile } from '@/cms/lib/people/profile'
import { listProfileSessions } from '@/cms/lib/people/sessions'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string | string[] }> }) {
  const session = await requirePagePermission('admin:access')
  const canTokens = can(session.user.role, 'apitoken:manage')
  const [profile, sessions, tokens, { tab }] = await Promise.all([
    getProfile(session.user.id), listProfileSessions(session), canTokens ? listOwnApiTokens(session) : Promise.resolve([]), searchParams,
  ])
  const requested = SETTINGS_TABS.find((value) => value === tab)
  const initial: SettingsTab = requested && (requested !== 'claude' || canTokens) ? requested : 'profile'

  return (
    <div className="max-w-4xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Your profile and password, signed-in devices{canTokens ? ', and connecting Claude to the CMS' : ''}.</p>
      </header>
      <SettingsTabs
        initial={initial}
        panels={{
          profile: <><ProfileSettings profile={profile} /><ProfileSessions sessions={sessions} /></>,
          ...(canTokens ? { claude: <ConnectClaude tokens={tokens} enabled={apiTokensEnabled()} cmsOrigin={cmsOrigin()} /> } : {}),
        }}
      />
    </div>
  )
}
