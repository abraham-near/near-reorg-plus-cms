import type { Metadata } from 'next'
import { VerifyEmailForm } from '@/cms/components/auth/AuthForms'
import { findVerificationToken } from '@/cms/lib/email-verification'

// Reads the session (cookie + database) before rendering: this page blocks by design (src/app/(cms)/layout.tsx).
export const instant = false

export const metadata: Metadata = { title: 'Confirm email', referrer: 'no-referrer' }

type Props = { params: Promise<{ token: string }> }

export default async function VerifyEmailPage({ params }: Props) {
  const { token } = await params
  const record = await findVerificationToken(token)
  if (!record) {
    return <p className="text-center text-sm">This confirmation link is invalid or has expired. Sign in again to get a new one.</p>
  }
  return (
    <>
      <h1 className="mb-2 text-center text-2xl font-bold">Confirm your email</h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">{record.user.email}</p>
      <VerifyEmailForm token={token} />
    </>
  )
}
