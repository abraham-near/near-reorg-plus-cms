'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { MailPlus } from 'lucide-react'
import { toast } from 'sonner'
import type { Role } from '@/generated/prisma/client'
import { Badge } from '@/cms/components/ui/badge'
import { Button } from '@/cms/components/ui/button'
import { Input } from '@/cms/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/cms/components/ui/dialog'
import { adminFetch } from '@/cms/lib/client'
import type { UsersData } from '@/cms/lib/people/users'
import { formatAdminDate } from '@/cms/lib/utils'

type User = UsersData['users'][number]
type Invitation = UsersData['invitations'][number]
type Modal = { kind: 'invite'; invitation?: Invitation } | { kind: 'edit'; user: User } | { kind: 'delete'; user: User } | { kind: 'revoke'; invitation: Invitation }
const ROLES: Role[] = ['PUBLISHER', 'ADMIN']
const ROLE_HELP: Record<Role, string> = {
  PUBLISHER: 'Write, schedule, publish and delete posts; upload media; manage categories and tags; connect Claude.',
  ADMIN: 'Everything a Publisher can do, plus managing people and deleting media.',
}
const selectClass = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50'

export function UsersClient({ data, currentUserId }: { data: UsersData; currentUserId: string }) {
  const router = useRouter()
  const [modal, setModal] = useState<Modal | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function open(next: Modal) {
    setError('')
    setModal(next)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!modal || busy) return
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    try {
      if (modal.kind === 'invite') {
        const result = await adminFetch<{ emailSent: boolean }>('/api/admin/users/invite', {
          method: 'POST', json: { name: form.get('name'), email: form.get('email'), role: form.get('role') },
        })
        if (result.emailSent) toast.success('Invitation sent. The link expires in 48 hours.')
        else toast.warning('Invitation saved, but email was not sent. Check email configuration and send a new invitation.')
      } else if (modal.kind === 'edit') {
        const self = modal.user.id === currentUserId
        await adminFetch(`/api/admin/users/${modal.user.id}`, {
          method: 'PATCH', json: {
            name: form.get('name'),
            ...(!self ? { role: form.get('role'), active: form.get('active') === 'on' } : {}),
          },
        })
        toast.success('User updated')
      } else if (modal.kind === 'delete') {
        await adminFetch(`/api/admin/users/${modal.user.id}`, { method: 'DELETE', json: {} })
        toast.success('User deleted. Their content has been kept.')
      } else {
        await adminFetch(`/api/admin/users/invitations/${modal.invitation.id}`, { method: 'DELETE', json: {} })
        toast.success('Invitation revoked')
      }
      setModal(null)
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The change could not be saved. Try again.')
    } finally {
      setBusy(false)
    }
  }

  function pagination(page: number, total: number, kind: 'page' | 'invitePage') {
    const pages = Math.max(1, Math.ceil(total / data.pageSize))
    const href = (next: number) => `/admin/users?${new URLSearchParams({ q: data.query.q, page: String(data.query.page), invitePage: String(data.query.invitePage), [kind]: String(next) })}`
    return (
      <nav aria-label={kind === 'page' ? 'Users pagination' : 'Invitations pagination'} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
        <span className="text-muted-foreground">{total} {kind === 'page' ? 'users' : 'pending invitations'} · Page {page} of {pages}</span>
        <div className="flex gap-2">
          {page > 1 && <Button asChild variant="outline" size="sm"><a href={href(page - 1)}>Previous</a></Button>}
          {page < pages && <Button asChild variant="outline" size="sm"><a href={href(page + 1)}>Next</a></Button>}
        </div>
      </nav>
    )
  }

  const title = modal?.kind === 'invite' ? 'Invite user' : modal?.kind === 'edit' ? 'Edit user' : modal?.kind === 'delete' ? 'Delete user' : 'Revoke invitation'
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2"><h1 className="text-3xl font-bold">Users</h1><p className="text-muted-foreground">Manage access to the NEAR CMS.</p></div>
        <Button onClick={() => open({ kind: 'invite' })}><MailPlus aria-hidden="true" />Invite user</Button>
      </header>
      <section aria-label="CMS users" className="space-y-4">
        <form action="/admin/users" className="flex max-w-lg gap-2">
          <label htmlFor="user-search" className="sr-only">Search users by name or email</label>
          <Input id="user-search" name="q" type="search" maxLength={200} defaultValue={data.query.q} placeholder="Search by name or email" />
          <Button type="submit" variant="outline">Search</Button>
        </form>
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Users, roles and account status</caption>
            <thead className="border-b bg-muted/50 text-muted-foreground"><tr>{['User', 'Role', 'Status', 'Created', 'Last login', 'Actions'].map((heading) => <th key={heading} scope="col" className="px-4 py-3 font-medium">{heading}</th>)}</tr></thead>
            <tbody className="divide-y">
              {data.users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3"><div className="font-medium">{user.name} {user.id === currentUserId && <Badge variant="outline">You</Badge>}</div><div className="text-muted-foreground">{user.email}</div></td>
                  <td className="px-4 py-3"><Badge variant="secondary">{user.role}</Badge></td>
                  <td className="px-4 py-3"><Badge variant={user.active ? 'outline' : 'secondary'}>{!user.active ? 'Inactive' : user.emailVerifiedAt ? 'Active' : 'Unconfirmed'}</Badge></td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatAdminDate(user.createdAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{user.lastLoginAt ? formatAdminDate(user.lastLoginAt) : 'Never'}</td>
                  <td className="px-4 py-3"><div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => open({ kind: 'edit', user })} aria-label={`Edit ${user.name}`}>Edit</Button>{user.id !== currentUserId && <Button variant="ghost" size="sm" className="text-destructive" onClick={() => open({ kind: 'delete', user })} aria-label={`Delete ${user.name}`}>Delete</Button>}</div></td>
                </tr>
              ))}
              {!data.users.length && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No users match this search.</td></tr>}
            </tbody>
          </table>
        </div>
        {pagination(data.query.page, data.total, 'page')}
      </section>
      <section aria-labelledby="pending-invitations" className="space-y-4">
        <div className="space-y-1"><h2 id="pending-invitations" className="text-xl font-semibold">Pending invitations</h2><p className="text-sm text-muted-foreground">Allowed email domains: {data.allowedDomains.join(', ')}. Invitations expire after 48 hours.</p></div>
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Unaccepted invitations that have not expired</caption>
            <thead className="border-b bg-muted/50 text-muted-foreground"><tr>{['Invitee', 'Role', 'Expires', 'Actions'].map((heading) => <th key={heading} scope="col" className="px-4 py-3 font-medium">{heading}</th>)}</tr></thead>
            <tbody className="divide-y">
              {data.invitations.map((invitation) => <tr key={invitation.id}>
                <td className="px-4 py-3"><div className="font-medium">{invitation.name}</div><div className="text-muted-foreground">{invitation.email}</div></td>
                <td className="px-4 py-3"><Badge variant="secondary">{invitation.role}</Badge></td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatAdminDate(invitation.expiresAt)}</td>
                <td className="px-4 py-3"><div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => open({ kind: 'invite', invitation })} aria-label={`Send new invitation to ${invitation.email}`}>Send new invitation</Button><Button variant="ghost" size="sm" className="text-destructive" onClick={() => open({ kind: 'revoke', invitation })} aria-label={`Revoke invitation for ${invitation.email}`}>Revoke</Button></div></td>
              </tr>)}
              {!data.invitations.length && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No pending invitations. Invite a colleague to give them access.</td></tr>}
            </tbody>
          </table>
        </div>
        {pagination(data.query.invitePage, data.invitationTotal, 'invitePage')}
      </section>
      <Dialog open={!!modal} onOpenChange={(open) => { if (!open && !busy) setModal(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>
            {modal?.kind === 'invite' ? 'The invitee will choose their own password. Sending a new invitation revokes previous links.' : modal?.kind === 'edit' ? 'Role changes and deactivation sign this user out of all sessions.' : modal?.kind === 'delete' ? 'This permanently removes the account and its sessions. Posts, pages and other content are kept.' : 'This link will no longer allow the invitee to create an account.'}
          </DialogDescription></DialogHeader>
          {modal && <form onSubmit={submit} className="space-y-4">
            {error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            {(modal.kind === 'invite' || modal.kind === 'edit') && <>
              <div className="space-y-1"><label htmlFor="person-name" className="text-sm font-medium">Name</label><Input id="person-name" name="name" required maxLength={120} defaultValue={modal.kind === 'edit' ? modal.user.name : modal.invitation?.name} /></div>
              {modal.kind === 'invite' ? <div className="space-y-1"><label htmlFor="person-email" className="text-sm font-medium">NEAR email address</label><Input id="person-email" name="email" type="email" required maxLength={254} defaultValue={modal.invitation?.email} aria-describedby="allowed-domains" /><p id="allowed-domains" className="text-xs text-muted-foreground">Allowed: {data.allowedDomains.join(', ')}</p></div> : <p className="break-all text-sm text-muted-foreground">{modal.user.email}</p>}
              <div className="space-y-1"><label htmlFor="person-role" className="text-sm font-medium">Role</label><select id="person-role" name="role" className={selectClass} disabled={modal.kind === 'edit' && modal.user.id === currentUserId} defaultValue={modal.kind === 'edit' ? modal.user.role : modal.invitation?.role ?? 'PUBLISHER'}>{ROLES.map((role) => <option key={role} value={role}>{role}</option>)}</select></div>
              <dl className="space-y-1 text-xs text-muted-foreground">{ROLES.map((role) => <div key={role}><dt className="inline font-medium text-foreground">{role}:</dt> <dd className="inline">{ROLE_HELP[role]}</dd></div>)}</dl>
              {modal.kind === 'edit' && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={modal.user.active} disabled={modal.user.id === currentUserId} />Active account</label>}
              {modal.kind === 'edit' && modal.user.id === currentUserId && <p className="text-sm text-muted-foreground">Your own role and active status cannot be changed here.</p>}
            </>}
            {modal.kind === 'delete' && <p className="break-words text-sm">Delete <strong>{modal.user.name}</strong> ({modal.user.email})?</p>}
            {modal.kind === 'revoke' && <p className="break-words text-sm">Revoke the invitation for <strong>{modal.invitation.email}</strong>?</p>}
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={() => setModal(null)}>Cancel</Button><Button type="submit" disabled={busy} variant={modal.kind === 'delete' || modal.kind === 'revoke' ? 'destructive' : 'default'}>{busy ? 'Saving…' : modal.kind === 'invite' ? 'Send invitation' : modal.kind === 'edit' ? 'Save changes' : modal.kind === 'delete' ? 'Delete user' : 'Revoke invitation'}</Button></div>
          </form>}
        </DialogContent>
      </Dialog>
    </div>
  )
}
