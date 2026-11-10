import type { Metadata } from 'next'
import { UsersClient } from '@/cms/components/users/UsersClient'
import { requirePagePermission } from '@/cms/lib/auth'
import { listUsers, usersQuerySchema } from '@/cms/lib/people/users'

// Reads the session (cookie + database) before rendering: this page blocks by design (src/app/(cms)/layout.tsx).
export const instant = false

export const metadata: Metadata = { title: 'Users' }

export default async function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requirePagePermission('user:manage')
  const parsed = usersQuerySchema.safeParse(await searchParams)
  const query = parsed.success ? parsed.data : usersQuerySchema.parse({})
  const data = await listUsers(query)
  return <UsersClient data={data} currentUserId={session.user.id} />
}
