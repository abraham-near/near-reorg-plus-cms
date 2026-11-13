import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { ConsentForm } from '@/cms/components/oauth/ConsentForm'
import { hmac } from '@/cms/lib/crypto'
import { mcpEnabled } from '@/cms/lib/oauth/config'
import { pendingAuthorization } from '@/cms/lib/oauth/flow'
import { can } from '@/cms/lib/permissions'
import { getSession } from '@/cms/lib/session'

// Reads the session (cookie + database) before rendering: this page blocks by design (src/app/(cms)/layout.tsx).
export const instant = false

export const metadata: Metadata = { title: 'Connect Claude' }

type Props = { searchParams: Promise<{ req?: string }> }

/** The "Allow Claude to use your CMS account?" screen of the connector's sign-in. */
export default async function ConsentPage({ searchParams }: Props) {
  // Read the request first: the page then renders per request (a feature check alone would be baked at build).
  const { req } = await searchParams
  const session = await getSession()
  if (!mcpEnabled()) notFound()
  if (!session) redirect(`/admin/login?next=${encodeURIComponent(`/admin/oauth/consent?req=${req ?? ''}`)}`)
  const pending = await pendingAuthorization(req)
  if (!pending) {
    return (
      <>
        <h1 className="mb-3 text-center text-xl font-bold">This link expired</h1>
        <p className="text-center text-sm text-muted-foreground">Go back to Claude and click Connect again.</p>
      </>
    )
  }
  const redirectHost = new URL(pending.redirectUri).host
  return (
    <ConsentForm
      requestId={req!}
      csrf={hmac(`${session.id}:${req}`, 'oauth-consent')}
      clientName={pending.clientName}
      redirectHost={redirectHost}
      local={/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(redirectHost)}
      account={{ name: session.user.name, email: session.user.email }}
      scopes={pending.scopes}
      allowed={can(session.user.role, 'apitoken:manage')}
    />
  )
}
