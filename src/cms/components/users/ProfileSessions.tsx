'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Monitor } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/cms/components/ui/badge'
import { Button } from '@/cms/components/ui/button'
import { adminFetch } from '@/cms/lib/client'
import type { ProfileSession } from '@/cms/lib/people/sessions'
import { formatAdminDate } from '@/cms/lib/utils'

export default function ProfileSessions({ sessions }: { sessions: ProfileSession[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function revoke(id?: string) {
    setBusy(id ?? 'others')
    setError('')
    try {
      const response = await adminFetch<{ current?: boolean }>(id ? `/api/admin/sessions/${encodeURIComponent(id)}` : '/api/admin/sessions', { method: 'DELETE' })
      if (response.current) {
        router.replace('/admin/login')
        router.refresh()
        return
      }
      toast.success(id ? 'Session signed out' : 'Other sessions signed out')
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not revoke the session.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <section aria-labelledby="sessions-heading" className="space-y-5 rounded-xl border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 id="sessions-heading" className="text-lg font-semibold">Active sessions</h2>
          <p className="text-sm text-muted-foreground">Sign out a device you no longer use or recognize.</p>
        </div>
        <Button variant="outline" disabled={busy !== null || !sessions.some((session) => !session.current)} onClick={() => revoke()}>
          {busy === 'others' ? 'Signing out…' : 'Sign out all others'}
        </Button>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {sessions.length === 0 ? <p className="text-sm text-muted-foreground">No active sessions remain. Sign in again to continue.</p> : (
        <ul className="divide-y">
          {sessions.map((session) => (
            <li key={session.id} className="flex flex-wrap items-start gap-4 py-5 first:pt-0 last:pb-0">
              <Monitor aria-hidden="true" className="mt-1 size-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{session.ip ?? 'IP unavailable'}</span>
                  {session.current && <Badge variant="secondary">Current session</Badge>}
                </div>
                <p className="break-all text-sm text-muted-foreground">{session.userAgent ?? 'Unknown browser or device'}</p>
                <dl className="space-y-1 text-xs text-muted-foreground">
                  <div><dt className="inline">Created: </dt><dd className="inline">{formatAdminDate(session.createdAt)}</dd></div>
                  <div><dt className="inline">Last seen: </dt><dd className="inline">{formatAdminDate(session.lastSeenAt)}</dd></div>
                </dl>
              </div>
              <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => revoke(session.id)} aria-label={session.current ? 'Sign out this session' : `Sign out session from ${session.ip ?? 'unknown IP'} created ${formatAdminDate(session.createdAt)}`}>
                {busy === session.id ? 'Signing out…' : session.current ? 'Sign out here' : 'Sign out'}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
