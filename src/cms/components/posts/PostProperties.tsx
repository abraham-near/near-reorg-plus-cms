'use client'

import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AlignLeft, ArrowDown, ArrowUp, CalendarDays, Check, CircleDot, Eye, Hash, Link2, Plus, Tag, TriangleAlert, X } from 'lucide-react'
import { Popover } from 'radix-ui'
import { cn } from '@/cms/lib/utils'
import { SITE_HOST } from './PublishDialog'
import type { TaxonomyOption } from './types'

export type DisplayStatus = 'Draft' | 'Scheduled' | 'Published' | 'Archived'
type Visibility = 'PUBLIC' | 'UNLISTED'

const STATUS_VARS: Record<DisplayStatus, string> = { Draft: 'draft', Scheduled: 'scheduled', Published: 'published', Archived: 'archived' }
export function PostStatusChip({ status, className }: { status: DisplayStatus; className?: string }) {
  const key = STATUS_VARS[status]
  return <span className={cn('inline-flex h-6 items-center gap-1.5 rounded-md px-2 text-[13px] font-medium', className)} style={{ background: `var(--status-${key}-bg)`, color: `var(--status-${key}-fg)` }}>
    <span aria-hidden className="size-1.5 rounded-full" style={{ background: `var(--status-${key})` }} />{status}
  </span>
}

/** A borderless textarea that grows with its content (field-sizing where supported, height otherwise). */
export const AutoTextarea = forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(function AutoTextarea({ className, value, ...props }, ref) {
  const inner = useRef<HTMLTextAreaElement>(null)
  useImperativeHandle(ref, () => inner.current!)
  useLayoutEffect(() => {
    const el = inner.current
    if (!el || CSS.supports?.('field-sizing', 'content')) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])
  return <textarea ref={inner} rows={1} value={value} className={cn('block w-full resize-none overflow-hidden border-0 bg-transparent p-0 [field-sizing:content] focus-visible:outline-none', className)} {...props} />
})

const portalContainer = () => typeof document === 'undefined' ? undefined : document.querySelector<HTMLElement>('.admin-wrapper') ?? undefined
function PopoverPanel({ children, label, className }: { children: React.ReactNode; label: string; className?: string }) {
  return <Popover.Portal container={portalContainer()}>
    <Popover.Content aria-label={label} align="start" sideOffset={6} className={cn('cms-pop z-50 w-72 rounded-[10px] border border-[#e9e9e6] bg-popover p-1.5 text-popover-foreground shadow-[0_12px_30px_rgba(15,15,15,.12)] [--origin:var(--radix-popover-content-transform-origin)]', className)}>{children}</Popover.Content>
  </Popover.Portal>
}

const valueButton = 'cms-press -mx-1.5 flex min-h-[30px] max-w-full items-center gap-1.5 rounded-md px-1.5 text-left hover:bg-muted disabled:cursor-default disabled:hover:bg-transparent'
const rowClass = 'grid grid-cols-[112px_minmax(0,1fr)] items-center gap-2 min-h-[34px] text-sm sm:grid-cols-[140px_minmax(0,1fr)]'
function Key({ icon: Icon, children, htmlFor }: { icon: typeof Tag; children: React.ReactNode; htmlFor?: string }) {
  const Tagname = htmlFor ? 'label' : 'span'
  return <Tagname htmlFor={htmlFor} className="flex items-center gap-2 text-muted-foreground"><Icon className="size-4 flex-none" strokeWidth={1.75} aria-hidden />{children}</Tagname>
}
const chip = 'inline-flex h-6 items-center gap-1 rounded-md bg-secondary px-2 text-[13px] text-secondary-foreground'

export type PostPropertiesProps = {
  status: DisplayStatus
  editable: boolean
  manageTaxonomy: boolean
  categories: TaxonomyOption[]
  tags: TaxonomyOption[]
  categoryIds: string[]
  onCategoryIds: (ids: string[]) => void
  categoryOpen: boolean
  onCategoryOpenChange: (open: boolean) => void
  tagIds: string[]
  onTagIds: (ids: string[]) => void
  dateLabel: React.ReactNode
  onOpenDate?: () => void
  slug: string
  onSlug: (slug: string) => void
  /** The post has been live: changing its URL breaks existing links. */
  wasLive: boolean
  savedSlug: string | null
  visibility: Visibility
  onVisibility: (value: Visibility) => void
  excerpt: string
  onExcerpt: (value: string) => void
  excerptRef: React.Ref<HTMLTextAreaElement>
  onNavigate: (event: { preventDefault: () => void }) => void
}

/** Notion-style properties: label with icon on the left, value on the right, click to edit in place. */
export default function PostProperties(props: PostPropertiesProps) {
  const { editable, categories, tags, categoryIds, tagIds, excerptRef } = props
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [tagQuery, setTagQuery] = useState('')
  const name = (list: TaxonomyOption[], id: string) => list.find((item) => item.id === id)?.name ?? 'Unknown'
  function moveCategory(index: number, direction: number) {
    const ids = [...categoryIds]
    const to = index + direction
    if (to < 0 || to >= ids.length) return
    ;[ids[index], ids[to]] = [ids[to], ids[index]]
    props.onCategoryIds(ids)
  }
  const slugChanged = props.savedSlug !== null && props.slug !== props.savedSlug
  const filteredTags = tags.filter((tag) => tag.name.toLowerCase().includes(tagQuery.trim().toLowerCase()))

  return <section aria-label="Post properties" className="flex flex-col gap-0.5 border-b border-[#f1f1ef] pb-4">
    <div className={rowClass}><Key icon={CircleDot}>Status</Key><span><PostStatusChip status={props.status} /></span></div>

    <div className={rowClass}><Key icon={Tag}>Category</Key>
      <Popover.Root open={props.categoryOpen} onOpenChange={props.onCategoryOpenChange}>
        <Popover.Trigger asChild><button type="button" disabled={!editable} className={cn(valueButton, 'flex-wrap py-1')} aria-label={`Categories: ${categoryIds.length ? categoryIds.map((id) => name(categories, id)).join(', ') : 'none'}. Edit`}>
          {categoryIds.length ? categoryIds.map((id, index) => <span key={id} className={cn(chip, index === 0 && 'bg-accent text-accent-foreground')}>{name(categories, id)}</span>) : <span className="text-muted-foreground">Empty</span>}
        </button></Popover.Trigger>
        <PopoverPanel label="Categories">
          {categoryIds.length > 0 && <><p className="px-2 pb-1 pt-1.5 text-xs text-muted-foreground">The first category is the main one.</p>
            <ol className="mb-1">{categoryIds.map((id, index) => <li key={id} className="flex items-center gap-1 rounded-md px-2 py-1 text-[13px] hover:bg-muted">
              <span className="flex-1 truncate">{name(categories, id)}</span>
              <button type="button" className="cms-press grid size-6 place-items-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-40" aria-label={`Move ${name(categories, id)} up`} disabled={index === 0} onClick={() => moveCategory(index, -1)}><ArrowUp className="size-3.5" /></button>
              <button type="button" className="cms-press grid size-6 place-items-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-40" aria-label={`Move ${name(categories, id)} down`} disabled={index === categoryIds.length - 1} onClick={() => moveCategory(index, 1)}><ArrowDown className="size-3.5" /></button>
              <button type="button" className="cms-press grid size-6 place-items-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label={`Remove ${name(categories, id)}`} onClick={() => props.onCategoryIds(categoryIds.filter((item) => item !== id))}><X className="size-3.5" /></button>
            </li>)}</ol></>}
          {categories.some((item) => !categoryIds.includes(item.id)) ? <><p className="border-t border-[#f1f1ef] px-2 pb-1 pt-2 text-xs text-muted-foreground">Add a category</p>
            <ul className="max-h-56 overflow-y-auto">{categories.filter((item) => !categoryIds.includes(item.id)).map((item) => <li key={item.id}>
              <button type="button" className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-[13px] hover:bg-muted focus-visible:bg-muted" onClick={() => props.onCategoryIds([...categoryIds, item.id])}><Plus className="size-3.5 text-muted-foreground" />{item.name}</button>
            </li>)}</ul></> : !categories.length && <p className="px-2 py-2 text-[13px] text-muted-foreground">No categories have been created.</p>}
          {props.manageTaxonomy && <Link href="/admin/categories" onNavigate={props.onNavigate} className="mt-1 block border-t border-[#f1f1ef] px-2 pb-1 pt-2 text-xs text-primary hover:underline">Manage categories and tags</Link>}
        </PopoverPanel>
      </Popover.Root>
    </div>

    <div className={rowClass}><Key icon={Hash}>Tags</Key>
      <span className="flex flex-wrap items-center gap-1.5 py-1">
        {tagIds.map((id) => <span key={id} className={chip}>{name(tags, id)}{editable && <button type="button" aria-label={`Remove tag ${name(tags, id)}`} className="-mr-1 grid size-4 place-items-center rounded text-muted-foreground hover:bg-background hover:text-foreground" onClick={() => props.onTagIds(tagIds.filter((item) => item !== id))}><X className="size-3" /></button>}</span>)}
        {editable ? <Popover.Root onOpenChange={(open) => { if (!open) setTagQuery('') }}>
          <Popover.Trigger asChild><button type="button" className="cms-press inline-flex h-6 items-center gap-1 rounded-md px-2 text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground"><Plus className="size-3.5" />Add</button></Popover.Trigger>
          <PopoverPanel label="Tags">
            <input aria-label="Search tags" autoFocus value={tagQuery} onChange={(event) => setTagQuery(event.target.value)} placeholder="Search tags…" className="mb-1 h-8 w-full rounded-md border border-input bg-background px-2 text-[13px] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20" />
            {tags.length ? <ul className="max-h-60 overflow-y-auto">{filteredTags.map((tag) => {
              const on = tagIds.includes(tag.id)
              return <li key={tag.id}><button type="button" aria-pressed={on} className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-[13px] hover:bg-muted focus-visible:bg-muted" onClick={() => props.onTagIds(on ? tagIds.filter((item) => item !== tag.id) : [...tagIds, tag.id])}>
                <span className={cn('grid size-4 place-items-center rounded border', on ? 'border-primary bg-primary text-primary-foreground' : 'border-input')}>{on && <Check className="size-3" strokeWidth={3} />}</span>{tag.name}
              </button></li>
            })}{!filteredTags.length && <li className="px-2 py-2 text-[13px] text-muted-foreground">No matching tags.</li>}</ul> : <p className="px-2 py-2 text-[13px] text-muted-foreground">No tags have been created.</p>}
            {props.manageTaxonomy && <Link href="/admin/categories" onNavigate={props.onNavigate} className="mt-1 block border-t border-[#f1f1ef] px-2 pb-1 pt-2 text-xs text-primary hover:underline">Manage categories and tags</Link>}
          </PopoverPanel>
        </Popover.Root> : !tagIds.length && <span className="text-muted-foreground">Empty</span>}
      </span>
    </div>

    <div className={rowClass}><Key icon={CalendarDays}>Publish date</Key>
      {props.onOpenDate ? <button type="button" className={cn(valueButton, 'text-left')} disabled={!editable} onClick={props.onOpenDate}>{props.dateLabel}</button> : <span className="min-w-0">{props.dateLabel}</span>}
    </div>

    <div className={rowClass}><Key icon={Eye} htmlFor="post-visibility">Visibility</Key>
      <span><select id="post-visibility" disabled={!editable} value={props.visibility} onChange={(event) => props.onVisibility(event.target.value as Visibility)} className="-mx-1.5 h-[30px] rounded-md border-0 bg-transparent px-1.5 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:hover:bg-transparent">
        <option value="PUBLIC">Public · listed and indexed</option><option value="UNLISTED">Unlisted · link only, hidden from search</option>
      </select></span>
    </div>

    <div className={cn(rowClass, editingSlug !== null && 'items-start pt-1')}><Key icon={Link2} htmlFor={editingSlug !== null ? 'post-slug' : undefined}>URL</Key>
      {editingSlug !== null ? <div className="min-w-0 space-y-1.5">
        <div className="flex items-center rounded-md border border-input bg-background pl-2 font-mono text-[12.5px] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20">
          <span aria-hidden className="text-muted-foreground">{SITE_HOST}/blog/</span>
          <input id="post-slug" autoFocus value={props.slug} maxLength={200} spellCheck={false} onChange={(event) => props.onSlug(event.target.value)}
            onBlur={() => setEditingSlug(null)}
            onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault()
              setEditingSlug(null) } if (event.key === 'Escape') { event.preventDefault()
              props.onSlug(editingSlug)
              setEditingSlug(null) } }}
            className="h-8 min-w-0 flex-1 bg-transparent pr-2 text-foreground outline-none" aria-describedby="post-slug-hint" />
        </div>
        <p id="post-slug-hint" className={cn('flex items-start gap-1.5 text-xs', props.wasLive ? 'text-[var(--warning-fg)]' : 'text-muted-foreground')}>
          {props.wasLive && <TriangleAlert className="mt-px size-3.5 flex-none" aria-hidden />}
          {props.wasLive ? 'This post has been live: links to the old address stop working if you change it.' : 'Lowercase words and numbers separated by hyphens. Enter to confirm, Esc to undo.'}
        </p>
      </div> : <span className="flex min-w-0 items-center gap-2">
        <button type="button" disabled={!editable} onClick={() => setEditingSlug(props.slug)} className={cn(valueButton, 'min-w-0 font-mono text-[12.5px] text-[#4a4a46]')} aria-label={`URL: ${SITE_HOST}/blog/${props.slug}. Edit`}>
          <span className="truncate">{SITE_HOST}/blog/{props.slug || <span className="text-muted-foreground">post-title</span>}</span>
        </button>
        {slugChanged && props.wasLive && <span className="inline-flex flex-none items-center gap-1 rounded-md bg-[var(--warning-bg)] px-1.5 py-0.5 text-xs text-[var(--warning-fg)]"><TriangleAlert className="size-3" aria-hidden />URL changed</span>}
      </span>}
    </div>

    <div className={cn(rowClass, 'items-start')}><span className="pt-[5px]"><Key icon={AlignLeft} htmlFor="post-excerpt">Summary</Key></span>
      <AutoTextarea id="post-excerpt" ref={excerptRef} value={props.excerpt} disabled={!editable} maxLength={10000} onChange={(event) => props.onExcerpt(event.target.value)}
        placeholder="Add a one-line summary for listings and search…" className="-mx-1.5 rounded-md px-1.5 py-[5px] text-sm leading-normal placeholder:text-muted-foreground hover:bg-muted/60 focus-visible:bg-muted/60" />
    </div>
  </section>
}
