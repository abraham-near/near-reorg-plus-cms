'use client'

import { useMemo, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Check, FolderTree, Hash, Loader2, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { adminFetch } from '@/cms/lib/client'
import { cn, slugify } from '@/cms/lib/utils'
import type { TaxonomyItem } from '@/cms/lib/posts/taxonomy'
import { Input } from '@/cms/components/ui/input'
import { Button } from '@/cms/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/cms/components/ui/alert-dialog'

type Kind = 'categories' | 'tags'

const KINDS: Record<Kind, {
  title: string
  singular: string
  apiPath: string
  filterParam: 'categoryId' | 'tagId'
  icon: typeof Hash
  blurb: string
  suggestions: string[]
}> = {
  categories: {
    title: 'Categories', singular: 'Category', apiPath: '/api/admin/categories', filterParam: 'categoryId', icon: FolderTree,
    blurb: 'The main sections of the blog. Most posts belong to one.',
    suggestions: ['News', 'Engineering', 'Ecosystem', 'Research', 'Community'],
  },
  tags: {
    title: 'Tags', singular: 'Tag', apiPath: '/api/admin/tags', filterParam: 'tagId', icon: Hash,
    blurb: 'Specific topics a post touches on. A post can have several.',
    suggestions: ['AI', 'Wallets', 'Chain Signatures', 'Developers', 'Events'],
  },
}

const byName = (a: TaxonomyItem, b: TaxonomyItem) => a.name.localeCompare(b.name)
const byUse = (a: TaxonomyItem, b: TaxonomyItem) => b._count.posts - a._count.posts || byName(a, b)
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Request failed. Please try again.'
const plural = (count: number) => `${count} ${count === 1 ? 'post' : 'posts'}`

/** A stable tint per name, so each item keeps its colour across visits. */
function tintFor(name: string) {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return `var(--tint-${Math.abs(hash) % 6})`
}

function Monogram({ name }: { name: string }) {
  return <span aria-hidden="true" className="grid size-9 flex-none place-items-center rounded-[10px] text-[13px] font-semibold text-foreground" style={{ background: tintFor(name) }}>
    {name.trim().charAt(0).toUpperCase() || '#'}
  </span>
}

export function TaxonomyManager({ categories, tags }: { categories: TaxonomyItem[]; tags: TaxonomyItem[] }) {
  const [tab, setTab] = useState<Kind>('categories')
  const [items, setItems] = useState<Record<Kind, TaxonomyItem[]>>({ categories, tags })
  const tabs = useRef<Record<Kind, HTMLButtonElement | null>>({ categories: null, tags: null })

  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" aria-label="Taxonomy" className="grid gap-5 sm:grid-cols-2"
        onKeyDown={(event) => {
          if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
          event.preventDefault()
          const next: Kind = tab === 'categories' ? 'tags' : 'categories'
          setTab(next)
          tabs.current[next]?.focus()
        }}>
        {(Object.keys(KINDS) as Kind[]).map((kind) => {
          const { title, blurb, icon: Icon } = KINDS[kind]
          const active = tab === kind
          const count = items[kind].length
          return (
            <button
              key={kind}
              ref={(node) => { tabs.current[kind] = node }}
              type="button"
              role="tab"
              id={`tab-${kind}`}
              aria-selected={active}
              aria-controls={`panel-${kind}`}
              tabIndex={active ? 0 : -1}
              onClick={() => setTab(kind)}
              className={cn(
                'flex items-start gap-3.5 rounded-[14px] border p-5 text-left transition-[border-color,background-color,box-shadow] duration-[var(--dur-fast)] focus-visible:outline-2 focus-visible:outline-ring',
                active ? 'border-[var(--accent-border)] bg-[var(--accent-soft)] shadow-[0_0_0_1px_var(--accent-border)]' : 'bg-card hover:border-[var(--border-strong)]',
              )}
            >
              <span className={cn('grid size-10 flex-none place-items-center rounded-[10px]', active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')} aria-hidden="true">
                <Icon className="size-[18px]" strokeWidth={1.9} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className="text-[15px] font-semibold text-foreground">{title}</span>
                  <span className="text-[13px] text-muted-foreground tabular-nums">{count}</span>
                </span>
                <span className="mt-1 block text-[13px] leading-snug text-muted-foreground">{blurb}</span>
              </span>
            </button>
          )
        })}
      </div>

      {(Object.keys(KINDS) as Kind[]).map((kind) => (
        <div key={kind} role="tabpanel" id={`panel-${kind}`} aria-labelledby={`tab-${kind}`} hidden={tab !== kind}>
          {tab === kind && <TaxonomyPanel kind={kind} items={items[kind]} setItems={(update) => setItems((current) => ({ ...current, [kind]: update(current[kind]) }))} />}
        </div>
      ))}
    </div>
  )
}

function TaxonomyPanel({ kind, items, setItems }: {
  kind: Kind
  items: TaxonomyItem[]
  setItems: (update: (items: TaxonomyItem[]) => TaxonomyItem[]) => void
}) {
  const { title, singular, apiPath, filterParam, suggestions } = KINDS[kind]
  const lower = singular.toLowerCase()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'name' | 'use'>('name')
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<{ id: string; name: string; slug: string } | null>(null)
  const [editError, setEditError] = useState('')
  const [pendingDelete, setPendingDelete] = useState<TaxonomyItem | null>(null)
  const [busy, setBusy] = useState(false)

  const max = Math.max(1, ...items.map((item) => item._count.posts))
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const list = needle ? items.filter((item) => item.name.toLowerCase().includes(needle) || item.slug.includes(needle)) : items
    return [...list].sort(sort === 'use' ? byUse : byName)
  }, [items, query, sort])
  const unused = items.filter((item) => item._count.posts === 0).length

  async function rename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing || busy) return
    setEditError('')
    setBusy(true)
    try {
      const updated = await adminFetch<TaxonomyItem>(`${apiPath}/${editing.id}`, { method: 'PATCH', json: { name: editing.name, slug: editing.slug } })
      setItems((current) => current.map((item) => item.id === updated.id ? updated : item))
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
    <section aria-label={title} className="overflow-hidden rounded-[14px] border bg-card">
      <div className="flex flex-wrap items-center gap-3 border-b px-5 py-3.5">
        <label className="flex h-[34px] w-full items-center gap-2 rounded-lg border border-input bg-background px-2.5 text-[13px] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20 sm:w-64">
          <Search className="size-4 flex-none text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">Filter {title.toLowerCase()}</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Filter ${title.toLowerCase()}`} className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground focus-visible:outline-none" />
        </label>
        <label className="flex items-center gap-2 text-[13px] text-muted-foreground">
          Sort
          <select value={sort} onChange={(event) => setSort(event.target.value as 'name' | 'use')} className="h-[34px] rounded-lg border border-input bg-background px-2 text-[13px] text-foreground">
            <option value="name">A–Z</option>
            <option value="use">Most used</option>
          </select>
        </label>
        {unused > 0 && <span className="text-xs text-muted-foreground">{unused} unused</span>}
        <span className="flex-1" />
        {!adding && <Button type="button" size="sm" className="h-[34px]" onClick={() => setAdding(true)}><Plus />New {lower}</Button>}
      </div>

      {adding && <AddRow kind={kind} busy={busy} setBusy={setBusy} onCancel={() => setAdding(false)} onCreated={(created) => setItems((current) => [...current, created])} />}

      {items.length === 0 && !adding ? (
        <EmptyState kind={kind} onPick={() => setAdding(true)} />
      ) : visible.length === 0 && items.length > 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">No {title.toLowerCase()} match &ldquo;{query}&rdquo;.</p>
      ) : (
        <ul>
          {visible.map((item) => (
            <li key={item.id} className="group border-b border-border/70 last:border-0">
              {editing?.id === item.id ? (
                <form onSubmit={rename} className="flex flex-wrap items-end gap-3 bg-muted/40 px-5 py-4">
                  <Field label="Name" id={`name-${item.id}`}>
                    <Input id={`name-${item.id}`} value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} maxLength={160} disabled={busy} required autoFocus
                      onKeyDown={(event) => { if (event.key === 'Escape') setEditing(null) }} />
                  </Field>
                  <Field label="Slug" id={`slug-${item.id}`} hint="Used in links. Changing it breaks old links.">
                    <Input id={`slug-${item.id}`} value={editing.slug} onChange={(event) => setEditing({ ...editing, slug: event.target.value })} maxLength={120} disabled={busy} required className="font-mono text-[13px]"
                      onKeyDown={(event) => { if (event.key === 'Escape') setEditing(null) }} />
                  </Field>
                  <div className="flex gap-2 pb-[22px]">
                    <Button type="submit" size="sm" disabled={busy || !editing.name.trim() || !editing.slug.trim()}>{busy ? <Loader2 className="cms-spin" /> : <Check />}Save</Button>
                    <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => setEditing(null)}>Cancel</Button>
                  </div>
                  {editError && <p role="alert" className="w-full text-sm text-destructive">{editError}</p>}
                </form>
              ) : (
                <div className="flex items-center gap-3.5 px-5 py-3 transition-colors duration-[var(--dur-fast)] hover:bg-muted/40">
                  <Monogram name={item.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">/{item.slug}</p>
                  </div>
                  <div className="hidden w-40 flex-none items-center gap-2.5 sm:flex">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                      <span className="block h-full rounded-full bg-primary/70" style={{ width: `${(item._count.posts / max) * 100}%` }} />
                    </span>
                  </div>
                  {item._count.posts > 0
                    ? <Link href={`/admin/posts?${filterParam}=${encodeURIComponent(item.id)}`} className="w-[68px] flex-none text-right text-[13px] text-muted-foreground tabular-nums hover:text-primary hover:underline" title={`See posts in ${item.name}`}>{plural(item._count.posts)}</Link>
                    : <span className="w-[68px] flex-none text-right text-[13px] text-[var(--text-subtle)]">Unused</span>}
                  <div className="flex flex-none gap-1 opacity-100 transition-opacity duration-[var(--dur-fast)] sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    <button type="button" disabled={busy} aria-label={`Edit ${item.name}`} title="Edit" onClick={() => { setEditing({ id: item.id, name: item.name, slug: item.slug }); setEditError('') }}
                      className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="size-4" /></button>
                    <button type="button" disabled={busy} aria-label={`Delete ${item.name}`} title="Delete" onClick={() => setPendingDelete(item)}
                      className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-4" /></button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && items.length < 3 && !adding && !query && (
        <div className="flex flex-wrap items-center gap-2 border-t bg-muted/30 px-5 py-3 text-[13px] text-muted-foreground">
          Ideas:
          {suggestions.filter((name) => !items.some((item) => item.name.toLowerCase() === name.toLowerCase())).slice(0, 4).map((name) => (
            <QuickAdd key={name} kind={kind} name={name} busy={busy} setBusy={setBusy} onCreated={(created) => setItems((current) => [...current, created])} />
          ))}
        </div>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => { if (!open && !busy) setPendingDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{pendingDelete?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?._count.posts
                ? `It will be removed from ${plural(pendingDelete._count.posts)}. The posts themselves stay.`
                : `This ${lower} isn't used by any post. It will be deleted for good.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={(event) => { event.preventDefault(); void remove() }}>
              {busy && <Loader2 className="cms-spin size-4" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

function Field({ label, id, hint, children }: { label: string; id: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="min-w-[200px] flex-1">
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-secondary-foreground">{label}</label>
      {children}
      <p className="mt-1 h-4 text-[11.5px] text-muted-foreground">{hint}</p>
    </div>
  )
}

function AddRow({ kind, busy, setBusy, onCancel, onCreated }: {
  kind: Kind
  busy: boolean
  setBusy: (busy: boolean) => void
  onCancel: () => void
  onCreated: (item: TaxonomyItem) => void
}) {
  const { singular, apiPath } = KINDS[kind]
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [error, setError] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)
  const autoSlug = slugify(name)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || !name.trim()) return
    setError('')
    setBusy(true)
    try {
      const created = await adminFetch<TaxonomyItem>(apiPath, { method: 'POST', json: { name: name.trim(), ...(slugTouched && slug.trim() ? { slug: slug.trim() } : {}) } })
      onCreated(created)
      toast.success(`${singular} “${created.name}” created`)
      setName('')
      setSlug('')
      setSlugTouched(false)
      nameRef.current?.focus()
    } catch (error) {
      setError(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="cms-fade-up flex flex-wrap items-end gap-3 border-b bg-[var(--accent-soft)] px-5 py-4" onKeyDown={(event) => { if (event.key === 'Escape') onCancel() }}>
      <Field label={`New ${singular.toLowerCase()}`} id={`new-${kind}-name`} hint="Press Enter to add, Esc to close.">
        <Input ref={nameRef} id={`new-${kind}-name`} value={name} onChange={(event) => setName(event.target.value)} maxLength={160} required disabled={busy} autoFocus placeholder={kind === 'categories' ? 'e.g. Engineering' : 'e.g. AI agents'} />
      </Field>
      <Field label="Slug" id={`new-${kind}-slug`} hint={slugTouched ? 'Lowercase letters, numbers and hyphens.' : 'Made from the name. Edit it if you need to.'}>
        <Input id={`new-${kind}-slug`} value={slugTouched ? slug : autoSlug} onChange={(event) => { setSlugTouched(true); setSlug(event.target.value) }} maxLength={120} disabled={busy} placeholder="generated-from-the-name" className="font-mono text-[13px]" />
      </Field>
      <div className="flex gap-2 pb-[22px]">
        <Button type="submit" size="sm" disabled={busy || !name.trim()}>{busy ? <Loader2 className="cms-spin" /> : <Plus />}Add</Button>
        <Button type="button" size="sm" variant="ghost" aria-label="Close" onClick={onCancel}><X /></Button>
      </div>
      {error && <p role="alert" className="w-full text-sm text-destructive">{error}</p>}
    </form>
  )
}

function QuickAdd({ kind, name, busy, setBusy, onCreated }: { kind: Kind; name: string; busy: boolean; setBusy: (busy: boolean) => void; onCreated: (item: TaxonomyItem) => void }) {
  const { singular, apiPath } = KINDS[kind]
  return (
    <button type="button" disabled={busy}
      className="cms-press inline-flex h-7 items-center gap-1 rounded-full border border-dashed border-[var(--border-strong)] bg-background px-2.5 text-xs font-medium text-secondary-foreground hover:border-primary hover:text-primary"
      onClick={async () => {
        setBusy(true)
        try {
          const created = await adminFetch<TaxonomyItem>(apiPath, { method: 'POST', json: { name } })
          onCreated(created)
          toast.success(`${singular} “${created.name}” created`)
        } catch (error) { toast.error(errorMessage(error)) } finally { setBusy(false) }
      }}>
      <Plus className="size-3" />{name}
    </button>
  )
}

function EmptyState({ kind, onPick }: { kind: Kind; onPick: () => void }) {
  const { title, singular, icon: Icon, blurb } = KINDS[kind]
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground" aria-hidden="true"><Icon className="size-6" /></span>
      <p className="mt-4 text-base font-semibold">No {title.toLowerCase()} yet</p>
      <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">{blurb} Create a few and pick them in a post&rsquo;s properties.</p>
      <Button type="button" className="mt-5" onClick={onPick}><Plus />Create the first {singular.toLowerCase()}</Button>
    </div>
  )
}
