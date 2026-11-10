'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/cms/components/ui/button'
import { Input } from '@/cms/components/ui/input'
import { Label } from '@/cms/components/ui/label'
import { adminFetch } from '@/cms/lib/client'

type Profile = { id: string; name: string; email: string; role: string }

export default function ProfileSettings({ profile }: { profile: Profile }) {
  const router = useRouter()
  const [name, setName] = useState(profile.name)
  const [profileBusy, setProfileBusy] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setProfileBusy(true)
    setProfileError('')
    try {
      const updated = await adminFetch<Profile>('/api/admin/profile', { method: 'PATCH', json: { name } })
      setName(updated.name)
      toast.success('Profile updated')
      router.refresh()
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Could not update your profile.')
    } finally {
      setProfileBusy(false)
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordError('')
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }
    setPasswordBusy(true)
    try {
      await adminFetch('/api/admin/profile/password', { method: 'POST', json: { currentPassword, newPassword } })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Password updated. Your other sessions have been signed out.')
      router.refresh()
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Could not change your password.')
    } finally {
      setPasswordBusy(false)
    }
  }

  return (
    <>
      <section aria-labelledby="profile-heading" className="space-y-5 rounded-xl border bg-card p-6">
        <h2 id="profile-heading" className="text-lg font-semibold">Profile</h2>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Email</dt><dd className="break-all">{profile.email}</dd></div>
          <div><dt className="text-muted-foreground">Role</dt><dd className="capitalize">{profile.role.toLowerCase()}</dd></div>
        </dl>
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Name</Label>
            <Input id="profile-name" name="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={100} disabled={profileBusy} />
          </div>
          {profileError && <p role="alert" className="text-sm text-destructive">{profileError}</p>}
          <Button type="submit" disabled={profileBusy || !name.trim()}>{profileBusy ? 'Saving…' : 'Save profile'}</Button>
        </form>
      </section>
      <section aria-labelledby="password-heading" className="space-y-5 rounded-xl border bg-card p-6">
        <div className="space-y-1">
          <h2 id="password-heading" className="text-lg font-semibold">Change password</h2>
          <p id="password-help" className="text-sm text-muted-foreground">Use at least 12 characters. Changing your password signs out all other sessions.</p>
        </div>
        <form onSubmit={changePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current password</Label>
            <Input id="current-password" type="password" name="currentPassword" autoComplete="current-password" required maxLength={200} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} disabled={passwordBusy} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input id="new-password" type="password" name="newPassword" autoComplete="new-password" required minLength={12} maxLength={200} aria-describedby="password-help" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} disabled={passwordBusy} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input id="confirm-password" type="password" name="confirmPassword" autoComplete="new-password" required minLength={12} maxLength={200} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={passwordBusy} />
          </div>
          {passwordError && <p role="alert" className="text-sm text-destructive">{passwordError}</p>}
          <Button type="submit" disabled={passwordBusy}>{passwordBusy ? 'Updating…' : 'Update password'}</Button>
        </form>
      </section>
    </>
  )
}
