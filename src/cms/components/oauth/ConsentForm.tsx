'use client'

import { useState } from 'react'
import { adminFetch } from '@/cms/lib/client'

const SCOPE_TEXT: Record<string, { label: string; detail: string; optional: boolean }> = {
  'cms:read': { label: 'Read posts, categories, tags and media', detail: 'Needed for everything else.', optional: false },
  'cms:write': { label: 'Write drafts', detail: 'Create and edit drafts and scheduled posts, add categories and tags.', optional: true },
  'media:write': { label: 'Add images', detail: 'Upload images (for example from a Google Doc) and describe them.', optional: true },
  'cms:publish': { label: 'Publish, schedule and unpublish', detail: 'Claude asks you before each one.', optional: true },
}

type Props = {
  requestId: string; csrf: string; clientName: string; redirectHost: string; local: boolean
  account: { name: string; email: string }; scopes: string[]; allowed: boolean
}

export function ConsentForm({ requestId, csrf, clientName, redirectHost, local, account, scopes, allowed }: Props) {
  const [kept, setKept] = useState<string[]>(scopes)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function answer(approve: boolean) {
    setPending(true)
    setError('')
    try {
      const { redirectTo } = await adminFetch<{ redirectTo: string }>('/api/oauth/consent', { method: 'POST', json: { req: requestId, csrf, approve, scopes: kept } })
      window.location.assign(redirectTo)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setPending(false)
    }
  }

  if (!allowed) {
    return <p className="text-center text-sm">Your role cannot connect Claude to the CMS. Ask an admin.</p>
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h1 className="text-xl font-bold">Allow {clientName} to use your CMS account?</h1>
        <p className="mt-2 text-sm text-muted-foreground">Signed in as <strong className="text-foreground">{account.name}</strong> ({account.email})</p>
      </div>
      <p className="rounded-md border border-border bg-background/50 p-3 text-sm">
        After you allow it, you go back to <strong>{redirectHost}</strong>.
        {local && <> That is a program on this computer (Claude Code).</>}
        {' '}Only continue if you just clicked <strong>Connect</strong> in Claude.
      </p>
      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-medium">Claude will be able to</legend>
        {scopes.map((scope) => {
          const text = SCOPE_TEXT[scope]
          if (!text) return null
          return (
            <label key={scope} className="flex items-start gap-3 text-sm">
              <input type="checkbox" className="mt-1" checked={kept.includes(scope)} disabled={!text.optional || pending}
                onChange={(e) => setKept((k) => (e.target.checked ? [...k, scope] : k.filter((s) => s !== scope)))} />
              <span><span className="font-medium">{text.label}</span><span className="block text-muted-foreground">{text.detail}</span></span>
            </label>
          )
        })}
      </fieldset>
      <p className="text-xs text-muted-foreground">Claude can never delete anything, manage people or change a published post&apos;s URL. The connection lasts up to 90 days; you can end it any time in Settings › Claude.</p>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={() => answer(false)} disabled={pending} className="flex-1 rounded-lg border border-border py-2 font-medium disabled:opacity-50">Cancel</button>
        <button type="button" onClick={() => answer(true)} disabled={pending} className="flex-1 rounded-lg bg-primary py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">Allow</button>
      </div>
    </div>
  )
}
