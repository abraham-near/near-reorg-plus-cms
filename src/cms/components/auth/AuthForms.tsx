'use client'

import { type FormEvent, type ReactNode, useState } from 'react'
import Link from 'next/link'
import { AdminApiError, adminFetch } from '@/cms/lib/client'
import { safeNext } from '@/cms/lib/safe-next'

const INPUT =
  'w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
const BUTTON =
  'w-full rounded-lg bg-primary py-2 font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50'


function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      {children}
    </label>
  )
}

function useSubmit(action: () => Promise<void>) {
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setPending(true)
    try {
      await action()
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setPending(false)
    }
  }
  return { error, pending, onSubmit }
}

function ErrorBox({ message }: { message: string }) {
  if (!message) return null
  return (
    <div role="alert" className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-400/40 dark:bg-red-500/10 dark:text-red-300">
      {message}
    </div>
  )
}

export function LoginForm({ next }: { next?: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [failures, setFailures] = useState(0)
  const { error, pending, onSubmit } = useSubmit(async () => {
    try {
      await adminFetch('/api/admin/auth/login', { method: 'POST', json: { email, password } })
    } catch (err) {
      setFailures((n) => n + 1)
      throw err
    }
    window.location.href = safeNext(next)
  })
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <ErrorBox message={error} />
      {failures >= 2 && (
        <p className="text-sm text-muted-foreground">
          Still not working? If you joined recently, check your inbox for a confirmation email first. Otherwise,{' '}
          <Link href="/admin/forgot-password" className="underline">reset your password</Link>.
        </p>
      )}
      <Field label="Email">
        <input className={INPUT} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@near.org" />
      </Field>
      <Field label="Password">
        <input className={INPUT} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <button type="submit" disabled={pending} className={BUTTON}>
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="text-center">
        <Link href="/admin/forgot-password" className="text-sm text-muted-foreground hover:underline">
          Forgot your password?
        </Link>
      </p>
    </form>
  )
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const { error, pending, onSubmit } = useSubmit(async () => {
    await adminFetch('/api/admin/auth/forgot-password', { method: 'POST', json: { email } })
    setSent(true)
  })
  if (sent) {
    return (
      <div className="space-y-4 text-center text-sm">
        <p>If that address has an account, a reset link is on its way. The link expires in 1 hour.</p>
        <Link href="/admin/login" className="text-muted-foreground hover:underline">
          Back to sign in
        </Link>
      </div>
    )
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <ErrorBox message={error} />
      <Field label="Email">
        <input className={INPUT} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <button type="submit" disabled={pending} className={BUTTON}>
        {pending ? 'Sending…' : 'Send reset link'}
      </button>
      <p className="text-center">
        <Link href="/admin/login" className="text-sm text-muted-foreground hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  )
}

function NewPasswordForm({ endpoint, token, submitLabel, done }: { endpoint: string; token: string; submitLabel: string; done: () => void }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const { error, pending, onSubmit } = useSubmit(async () => {
    if (password !== confirm) throw new AdminApiError(400, 'Passwords do not match')
    await adminFetch(endpoint, { method: 'POST', json: { token, password } })
    done()
  })
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <ErrorBox message={error} />
      <Field label="New password (12+ characters)">
        <input className={INPUT} type="password" autoComplete="new-password" minLength={12} required value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <Field label="Confirm password">
        <input className={INPUT} type="password" autoComplete="new-password" minLength={12} required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </Field>
      <button type="submit" disabled={pending} className={BUTTON}>
        {pending ? 'Saving…' : submitLabel}
      </button>
    </form>
  )
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [done, setDone] = useState(false)
  if (done) {
    return (
      <div className="space-y-4 text-center text-sm">
        <p>Password updated. Every other session was signed out.</p>
        <Link href="/admin/login" className="text-muted-foreground hover:underline">
          Sign in
        </Link>
      </div>
    )
  }
  return <NewPasswordForm endpoint="/api/admin/auth/reset-password" token={token} submitLabel="Set new password" done={() => setDone(true)} />
}

export function AcceptInviteForm({ token, email }: { token: string; email: string }) {
  // Explicit confirmation step before the password form: the invitee checks the address is theirs.
  const [confirmed, setConfirmed] = useState(false)
  if (!confirmed) {
    return (
      <div className="space-y-4">
        <p className="text-center text-sm">
          Confirm that <strong>{email}</strong> is your email address and that you want a NEAR CMS account.
        </p>
        <button type="button" className={BUTTON} onClick={() => setConfirmed(true)}>
          Yes, this is my email
        </button>
        <p className="text-center text-sm text-muted-foreground">Not you? Close this page and ignore the email.</p>
      </div>
    )
  }
  return (
    <NewPasswordForm
      endpoint="/api/admin/auth/accept-invite"
      token={token}
      submitLabel="Create account"
      done={() => {
        window.location.href = '/admin/dashboard'
      }}
    />
  )
}

export function VerifyEmailForm({ token }: { token: string }) {
  const [done, setDone] = useState(false)
  const { error, pending, onSubmit } = useSubmit(async () => {
    await adminFetch('/api/admin/auth/verify-email', { method: 'POST', json: { token } })
    setDone(true)
  })
  if (done) {
    return (
      <div className="space-y-4 text-center text-sm">
        <p>Email confirmed. You can sign in now.</p>
        <Link href="/admin/login" className="text-muted-foreground hover:underline">
          Sign in
        </Link>
      </div>
    )
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <ErrorBox message={error} />
      <button type="submit" disabled={pending} className={BUTTON}>
        {pending ? 'Confirming…' : 'Confirm email'}
      </button>
    </form>
  )
}
