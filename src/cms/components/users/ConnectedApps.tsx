'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Badge } from '@/cms/components/ui/badge'
import { Button } from '@/cms/components/ui/button'
import { adminFetch } from '@/cms/lib/client'
import type { ConnectedApp } from '@/cms/lib/people/oauth-grants'
import { formatAdminDate } from '@/cms/lib/utils'

const SCOPE_LABEL: Record<string, string> = { 'cms:read': 'Read', 'cms:write': 'Write drafts', 'media:write': 'Add images', 'cms:publish': 'Publish' }
const statusVariant = { active: 'secondary', expired: 'outline', revoked: 'destructive' } as const

/** The Claude connections made with the connector, and a way to end each one. */
export function ConnectedApps({ connections }: { connections: ConnectedApp[] }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  async function revoke(id: string) {
    setBusy(id)
    try {
      await adminFetch(`/api/admin/oauth-grants/${encodeURIComponent(id)}`, { method: 'DELETE', json: {} })
      toast.success('Connection ended. Claude has to reconnect to use the CMS again.')
      setConfirming(null)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not end the connection')
    } finally {
      setBusy(null)
    }
  }

  if (!connections.length) return <p className="text-sm text-muted-foreground">No connections yet. They appear here after you click Connect in Claude and allow it.</p>
  return (
    <ul className="divide-y rounded-lg border">
      {connections.map((c) => (
        <li key={c.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 font-medium">{c.clientName}<Badge variant={statusVariant[c.status]}>{c.status}</Badge></p>
            <p className="text-xs text-muted-foreground">
              {c.scopes.map((s) => SCOPE_LABEL[s] ?? s).join(' · ')} · connected {formatAdminDate(c.createdAt)}
              {c.lastUsedAt ? ` · last used ${formatAdminDate(c.lastUsedAt)}` : ''}{c.status === 'active' ? ` · until ${formatAdminDate(c.expiresAt)}` : ''}
            </p>
          </div>
          {c.status === 'active' && (confirming === c.id
            ? <span className="flex gap-2"><Button size="sm" variant="destructive" disabled={busy === c.id} onClick={() => revoke(c.id)}>End connection</Button><Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>Keep</Button></span>
            : <Button size="sm" variant="outline" onClick={() => setConfirming(c.id)}>Disconnect</Button>)}
        </li>
      ))}
    </ul>
  )
}

/** A read-only value with a Copy button (the connector URL, the Google account to share Docs with). */
export function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center gap-2">
      <code aria-label={label} className="min-w-0 flex-1 truncate rounded-md border bg-muted px-3 py-2 font-mono text-xs">{value}</code>
      <Button type="button" size="sm" variant="outline" onClick={async () => { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500) }}>
        <span key={copied ? 'done' : 'copy'}>{copied ? 'Copied' : 'Copy'}</span>
      </Button>
    </div>
  )
}
