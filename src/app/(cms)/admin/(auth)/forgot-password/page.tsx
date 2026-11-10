import type { Metadata } from 'next'
import { ForgotPasswordForm } from '@/cms/components/auth/AuthForms'

// Reads the session (cookie + database) before rendering: this page blocks by design (src/app/(cms)/layout.tsx).
export const instant = false

export const metadata: Metadata = { title: 'Reset password' }

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="mb-6 text-center text-2xl font-bold">Reset password</h1>
      <ForgotPasswordForm />
    </>
  )
}
