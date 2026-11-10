import type { Metadata } from 'next'
import { AcceptInviteForm } from '@/cms/components/auth/AuthForms'
import { sha256 } from '@/cms/lib/crypto'
import { db } from '@/cms/lib/db'

export const metadata: Metadata = { title: 'Accept invitation', referrer: 'no-referrer' }

type Props = { params: Promise<{ token: string }> }

export default async function AcceptInvitePage({ params }: Props) {
  const { token } = await params
  const invite =
    token.length <= 100
      ? await db.invitation.findUnique({ where: { tokenHash: sha256(token) }, select: { email: true, name: true, expiresAt: true, acceptedAt: true } })
      : null
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return <p className="text-center text-sm">This invitation is invalid or has expired. Ask an admin for a new one.</p>
  }
  return (
    <>
      <h1 className="mb-2 text-center text-2xl font-bold">Welcome, {invite.name}</h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">{invite.email}</p>
      <AcceptInviteForm token={token} email={invite.email} />
    </>
  )
}
