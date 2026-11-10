import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/cms/components/auth/AuthForms'
import { safeNext } from '@/cms/lib/safe-next'
import { getSession } from '@/cms/lib/session'

export const metadata: Metadata = { title: 'Sign in' }

type Props = { searchParams: Promise<{ next?: string }> }

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams
  if (await getSession()) redirect(safeNext(next))
  return (
    <>
      <h1 className="mb-6 text-center text-2xl font-bold">Sign in</h1>
      <LoginForm next={next} />
    </>
  )
}
