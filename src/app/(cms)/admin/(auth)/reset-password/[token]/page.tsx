import type { Metadata } from 'next'
import { ResetPasswordForm } from '@/cms/components/auth/AuthForms'

// Reads the session (cookie + database) before rendering: this page blocks by design (src/app/(cms)/layout.tsx).
export const instant = false

export const metadata: Metadata = { title: 'Choose a new password', referrer: 'no-referrer' }

type Props = { params: Promise<{ token: string }> }

export default async function ResetPasswordPage({ params }: Props) {
  const { token } = await params
  return (
    <>
      <h1 className="mb-6 text-center text-2xl font-bold">Choose a new password</h1>
      <ResetPasswordForm token={token} />
    </>
  )
}
