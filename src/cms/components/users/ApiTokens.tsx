'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Badge } from '@/cms/components/ui/badge'
import { Button } from '@/cms/components/ui/button'
import { Input } from '@/cms/components/ui/input'
import { Label } from '@/cms/components/ui/label'
import { adminFetch } from '@/cms/lib/client'
import type { ApiTokenRow } from '@/cms/lib/people/api-tokens'
import { formatAdminDate } from '@/cms/lib/utils'

const EXPIRY = [7, 30, 60, 90] as const
const MAX_ACTIVE = 5
const statusVariant = { active: 'secondary', expired: 'outline', revoked: 'destructive' } as const

/** Step 1 of Settings › Claude: create, copy and revoke personal API tokens. */
export default function ApiTokens({ tokens, enabled }: { tokens: ApiTokenRow[]; enabled: boolean }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [days, setDays] = useState<number>(30)
  const [password, setPassword] = useState('')
  const [secret, setSecret] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const active = tokens.filter((token) => token.status === 'active').length

  useEffect(() => () => setSecret(null), [])

  async function create(event: React.FormEvent) {
    event.preventDefault()
    setBusy('create')
    setError('')
    try {
      const response = await adminFetch<{ token: string }>('/api/admin/tokens', { method: 'POST', json: { name, expiresInDays: days, currentPassword: password } })
      setSecret(response.token)
      setCopied(false)
      setName('')
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the token.')
    } finally {
      setPassword('')
      setBusy(null)
    }
  }

  async function revoke(token?: ApiTokenRow) {
    const message = token ? `Revoke "${token.name}"? Anything using it stops working immediately.` : 'Revoke all your active API tokens? Anything using them stops working immediately.'
    if (!window.confirm(message)) return
    setBusy(token?.id ?? 'all')
    setError('')
    try {
      await adminFetch(token ? `/api/admin/tokens/${encodeURIComponent(token.id)}` : '/api/admin/tokens', { method: 'DELETE', json: {} })
      toast.success(token ? 'Token revoked' : 'All tokens revoked')
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not revoke the token.')
    } finally {
      setBusy(null)
    }
  }

  async function copy() {
    if (!secret) return
    try {
      await navigator.clipboard.writeText(secret)
      setCopied(true)
    } catch {
      toast.error('Could not copy. Select the token and copy it manually.')
    }
  }

  return (
    <section aria-labelledby="tokens-heading" className="space-y-5 rounded-xl border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl space-y-1">
          <h2 id="tokens-heading" className="text-lg font-semibold"><span className="text-muted-foreground">1.</span> Create your API token</h2>
          <p className="text-sm text-muted-foreground">
            The token is how Claude signs in to the CMS as you. Create one per computer, copy it and paste it in step 2. It works only with your account and stops working when it expires or you revoke it.{' '}
            <Link href="/admin/help#api-tokens" className="underline underline-offset-2">Learn more</Link>
          </p>
        </div>
        <Button variant="outline" disabled={busy !== null || active === 0} onClick={() => revoke()}>{busy === 'all' ? 'Revoking…' : 'Revoke all'}</Button>
      </div>

      {!enabled && <p role="status" className="rounded-md border bg-muted/40 p-3 text-sm">API tokens are turned off on this environment. They are enabled after the site switches to the database.</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      {secret && (
        <div role="status" className="space-y-3 rounded-md border border-destructive/50 p-4">
          <p className="text-sm font-semibold text-destructive">Copy it now — you won&apos;t see it again. Never paste it in a chat or commit it.</p>
          <div className="flex flex-wrap gap-2">
            <Input readOnly value={secret} aria-label="New API token" className="min-w-0 flex-1 font-mono" onFocus={(event) => event.currentTarget.select()} />
            <Button type="button" variant="outline" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>
          </div>
          <p className="text-sm text-muted-foreground">Paste it when <code className="font-mono">npm run mcp:cms:login</code> asks. See step 2 below.</p>
          <Button type="button" onClick={() => { setSecret(null); setCopied(false) }}>Done</Button>
        </div>
      )}

      {enabled && !secret && (
        <form onSubmit={create} className="grid gap-4 sm:grid-cols-2" autoComplete="off">
          <div className="space-y-2">
            <Label htmlFor="token-name">Name</Label>
            <Input id="token-name" value={name} maxLength={60} required onChange={(event) => setName(event.target.value)} placeholder="Laptop – Claude Code" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="token-expiry">Expires after</Label>
            <select id="token-expiry" value={days} onChange={(event) => setDays(Number(event.target.value))} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring">
              {EXPIRY.map((value) => <option key={value} value={value}>{value} days</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="token-password">Current password</Label>
            <Input id="token-password" type="password" autoComplete="current-password" value={password} required onChange={(event) => setPassword(event.target.value)} />
          </div>
          <div className="flex items-end gap-3">
            <Button type="submit" disabled={busy !== null || active >= MAX_ACTIVE}>{busy === 'create' ? 'Creating…' : 'Create token'}</Button>
            <span className="text-xs text-muted-foreground">{active} of {MAX_ACTIVE} active tokens</span>
          </div>
        </form>
      )}

      {tokens.length === 0 ? <p className="text-sm text-muted-foreground">You have no API tokens.</p> : (
        <ul className="divide-y">
          {tokens.map((token) => (
            <li key={token.id} className="flex flex-wrap items-start gap-4 py-4 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{token.name}</span>
                  <code className="font-mono text-xs text-muted-foreground">{token.prefix}…</code>
                  <Badge variant={statusVariant[token.status]}>{token.status === 'revoked' && token.revokeReason ? `revoked (${token.revokeReason.toLowerCase()})` : token.status}</Badge>
                </div>
                <dl className="space-y-0.5 text-xs text-muted-foreground">
                  <div><dt className="inline">Created: </dt><dd className="inline">{formatAdminDate(token.createdAt)}</dd></div>
                  <div><dt className="inline">Expires: </dt><dd className="inline">{formatAdminDate(token.expiresAt)}</dd></div>
                  <div><dt className="inline">Last used: </dt><dd className="inline">{token.lastUsedAt ? `${formatAdminDate(token.lastUsedAt)}${token.lastUsedIp ? ` from ${token.lastUsedIp}` : ''}` : 'Never'}</dd></div>
                </dl>
              </div>
              {token.status === 'active' && <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => revoke(token)} aria-label={`Revoke token ${token.name}`}>{busy === token.id ? 'Revoking…' : 'Revoke'}</Button>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
