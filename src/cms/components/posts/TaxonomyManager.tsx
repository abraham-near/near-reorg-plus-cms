'use client'

import { useState, type FormEvent } from 'react'
import { Check, Loader2, Pencil, X } from 'lucide-react'
import { toast } from 'sonner'
import { adminFetch } from '@/cms/lib/client'
import type { TaxonomyItem } from '@/cms/lib/posts/taxonomy'
import { Input } from '@/cms/components/ui/input'
import { Button } from '@/cms/components/ui/button'
import { Label } from '@/cms/components/ui/label'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/cms/components/ui/alert-dialog'

const byName = (a: TaxonomyItem, b: TaxonomyItem) => a.name.localeCompare(b.name)
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Request failed. Please try again.'

function TaxonomySection({ title, singular, apiPath, initialItems }: {
  title: string
  singular: string
  apiPath: string
  initialItems: TaxonomyItem[]
}) {
  const [items, setItems] = useState(initialItems)
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<{ id: string; name: string; slug: string } | null>(null)
  const [editError, setEditError] = useState('')
  const [pendingDelete, setPendingDelete] = useState<TaxonomyItem | null>(null)
  const [busy, setBusy] = useState(false)

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || !newName.trim()) return
    setError('')
    setBusy(true)
    try {
      const created = await adminFetch<TaxonomyItem>(apiPath, {
        method: 'POST', json: { name: newName.trim(), ...(newSlug.trim() ? { slug: newSlug.trim() } : {}) },
      })
      setItems((current) => [...current, created].sort(byName))
      setNewName('')
      setNewSlug('')
      toast.success(`${singular} created`)
    } catch (error) {
      setError(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  async function rename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing || busy) return
    setEditError('')
    setBusy(true)
    try {
      const updated = await adminFetch<TaxonomyItem>(`${apiPath}/${editing.id}`, {
        method: 'PATCH', json: { name: editing.name, slug: editing.slug },
      })
      setItems((current) => current.map((item) => item.id === updated.id ? updated : item).sort(byName))
      setEditing(null)
      toast.success(`${singular} updated`)
    } catch (error) {
      setEditError(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!pendingDelete || busy) return
    setBusy(true)
    try {
      await adminFetch(`${apiPath}/${pendingDelete.id}`, { method: 'DELETE' })
      setItems((current) => current.filter((item) => item.id !== pendingDelete.id))
      setPendingDelete(null)
      toast.success(`${singular} deleted`)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-4" aria-labelledby={`${singular}-heading`}>
      <h2 id={`${singular}-heading`} className="text-xl font-semibold">{title}</h2>
      <form onSubmit={add} className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <Label htmlFor={`${singular}-name`}>New {singular.toLowerCase()} name</Label>
          <Input id={`${singular}-name`} value={newName} onChange={(event) => setNewName(event.target.value)} maxLength={160} required disabled={busy} className="w-64 max-w-full" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${singular}-slug`}>Slug (optional)</Label>
          <Input id={`${singular}-slug`} value={newSlug} onChange={(event) => setNewSlug(event.target.value)} maxLength={120} placeholder="Generated from the name" disabled={busy} className="w-64 max-w-full" />
        </div>
        <Button type="submit" disabled={busy || !newName.trim()}>Add {singular.toLowerCase()}</Button>
      </form>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {items.length === 0 ? <p className="text-sm text-muted-foreground">No {title.toLowerCase()} yet.</p> : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="rounded-lg border border-border bg-card px-4 py-3">
              {editing?.id === item.id ? (
                <form onSubmit={rename} className="space-y-3">
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <Label htmlFor={`name-${item.id}`}>Name</Label>
                      <Input id={`name-${item.id}`} value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} maxLength={160} disabled={busy} required autoFocus />
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <Label htmlFor={`slug-${item.id}`}>Slug</Label>
                      <Input id={`slug-${item.id}`} value={editing.slug} onChange={(event) => setEditing({ ...editing, slug: event.target.value })} maxLength={120} disabled={busy} required />
                    </div>
                    <Button type="submit" size="sm" disabled={busy || !editing.name.trim() || !editing.slug.trim()}><Check className="size-4" /> Save</Button>
                    <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => setEditing(null)}><X className="size-4" /> Cancel</Button>
                  </div>
                  {editError && <p role="alert" className="text-sm text-destructive">{editError}</p>}
                </form>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-medium">{item.name}</p>
                    <p className="break-all font-mono text-xs text-muted-foreground">{item.slug}</p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{item._count.posts} {item._count.posts === 1 ? 'post' : 'posts'}</span>
                  <Button type="button" size="sm" variant="ghost" disabled={busy} aria-label={`Edit ${item.name}`} onClick={() => { setEditing({ id: item.id, name: item.name, slug: item.slug }); setEditError('') }}><Pencil className="size-4" /> Edit</Button>
                  <Button type="button" size="sm" variant="ghost" className="text-destructive" disabled={busy} aria-label={`Delete ${item.name}`} onClick={() => setPendingDelete(item)}>Delete</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => { if (!open && !busy) setPendingDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{pendingDelete?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?._count.posts
                ? `This ${singular.toLowerCase()} will be removed from ${pendingDelete._count.posts} ${pendingDelete._count.posts === 1 ? 'post' : 'posts'}. The posts themselves will remain.`
                : `This ${singular.toLowerCase()} will be permanently deleted.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={(event) => { event.preventDefault(); void remove() }}>
              {busy && <Loader2 className="size-4 animate-spin" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

export function TaxonomyManager({ categories, tags }: { categories: TaxonomyItem[]; tags: TaxonomyItem[] }) {
  return (
    <div className="space-y-12">
      <TaxonomySection title="Categories" singular="Category" apiPath="/api/admin/categories" initialItems={categories} />
      <TaxonomySection title="Tags" singular="Tag" apiPath="/api/admin/tags" initialItems={tags} />
    </div>
  )
}
