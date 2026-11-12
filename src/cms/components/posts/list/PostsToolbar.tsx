'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Plus, Search, X } from 'lucide-react'
import { Button } from '@/cms/components/ui/button'
import { cn } from '@/cms/lib/utils'
import { POST_SORTS, postsHref, type PostSort, type PostTab, type PostsQuery } from '@/cms/lib/posts/list-query'
import { Menu, MenuContent, MenuLabel, MenuRadioGroup, MenuRadioItem, MenuSeparator, MenuTrigger } from './Menu'
import { NavLink, usePostsNav } from './PostsNav'
import type { FilterOption } from './types'

const SEARCH_DELAY_MS = 250

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

/** H1, search (filters as you type, "/" focuses it) and New post. */
export function PostsHeader({ query, canWrite }: { query: PostsQuery; canWrite: boolean }) {
  const { navigate } = usePostsNav()
  const input = useRef<HTMLInputElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [value, setValue] = useState(query.q)
  // The URL is the source of truth. When it changes for another reason than our own typing (Back,
  // a tab, Clear), the box follows it; while typing, our own (older) URL never overwrites the box.
  const [seen, setSeen] = useState(query.q)
  const [sent, setSent] = useState(query.q)
  if (query.q !== seen) {
    setSeen(query.q)
    if (query.q !== sent) { setValue(query.q); setSent(query.q) }
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return
      event.preventDefault()
      input.current?.focus()
      input.current?.select()
    }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(timer.current) }
  }, [])

  function search(next: string, delay = SEARCH_DELAY_MS) {
    setValue(next)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setSent(next.trim())
      navigate(postsHref(query, { q: next.trim() }), { replace: true })
    }, delay)
  }

  return (
    <header className="flex flex-wrap items-center gap-3">
      <h1 className="text-2xl font-[650]">Posts</h1>
      <span className="flex-1" />
      <label className="flex h-[34px] w-full items-center gap-2 rounded-lg border border-input bg-background px-2.5 text-muted-foreground transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20 sm:w-[280px]">
        <Search className="size-4 flex-none" aria-hidden="true" />
        <input
          ref={input}
          type="search"
          value={value}
          maxLength={200}
          aria-label="Search posts"
          aria-keyshortcuts="/"
          placeholder="Search posts"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
          onChange={(event) => search(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') search(value, 0)
            if (event.key === 'Escape') {
              if (value) search('', 0)
              else event.currentTarget.blur()
            }
          }}
        />
        {value
          ? <button type="button" aria-label="Clear search" className="grid size-5 place-items-center rounded text-muted-foreground hover:text-foreground" onClick={() => { search('', 0); input.current?.focus() }}><X className="size-3.5" /></button>
          : <kbd aria-hidden="true" className="rounded border border-input bg-muted px-1.5 font-mono text-[11px] leading-4 text-muted-foreground">/</kbd>}
      </label>
      {canWrite && <Button asChild className="h-[34px]"><Link href="/admin/posts/new"><Plus />New post</Link></Button>}
    </header>
  )
}

const TAB_LABELS: Record<PostTab, string> = { all: 'All', draft: 'Drafts', scheduled: 'Scheduled', published: 'Published', archived: 'Archived' }

/** Status tabs with counts, and Category, Author and Sort menus on the right. */
export function PostsTabs({ query, counts, categories, authors }: {
  query: PostsQuery
  counts: Record<PostTab, number>
  categories: FilterOption[]
  authors: FilterOption[]
}) {
  const { navigate } = usePostsNav()
  const category = categories.find((item) => item.id === query.categoryId)
  const author = authors.find((item) => item.id === query.authorId)
  return (
    <div className="flex flex-wrap items-end gap-x-5 border-b">
      <nav aria-label="Filter by status" className="-mb-px flex gap-5 overflow-x-auto">
        {(Object.keys(TAB_LABELS) as PostTab[]).map((tab) => {
          const active = query.tab === tab
          return (
            <NavLink
              key={tab}
              href={postsHref(query, { tab })}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 whitespace-nowrap border-b-2 px-1 text-[13.5px] transition-colors',
                active ? 'border-foreground font-[550] text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {TAB_LABELS[tab]}
              <span className="rounded-full bg-secondary px-1.5 text-[11.5px] tabular-nums text-secondary-foreground">{counts[tab].toLocaleString()}</span>
            </NavLink>
          )
        })}
      </nav>
      <span className="flex-1" />
      <div className="-mb-px flex gap-4">
        <FilterMenu label="Category" current={category?.name} value={query.categoryId} options={categories} allLabel="All categories" onSelect={(categoryId) => navigate(postsHref(query, { categoryId }))} />
        {authors.length > 1 && <FilterMenu label="Author" current={author?.name} value={query.authorId} options={authors} allLabel="All authors" onSelect={(authorId) => navigate(postsHref(query, { authorId }))} />}
        <Menu>
          <MenuTrigger className={triggerClass(false)}>Sort: {POST_SORTS[query.sort]}<ChevronDown className="size-3.5" aria-hidden="true" /></MenuTrigger>
          <MenuContent>
            <MenuLabel>Sort by</MenuLabel>
            <MenuRadioGroup value={query.sort} onValueChange={(sort) => navigate(postsHref(query, { sort: sort as PostSort }))}>
              {(Object.entries(POST_SORTS) as [PostSort, string][]).map(([key, label]) => <MenuRadioItem key={key} value={key}>{label}</MenuRadioItem>)}
            </MenuRadioGroup>
          </MenuContent>
        </Menu>
      </div>
    </div>
  )
}

const triggerClass = (active: boolean) => cn(
  'inline-flex h-9 items-center gap-1 whitespace-nowrap border-b-2 border-transparent px-1 text-[13.5px] outline-none transition-colors hover:text-foreground focus-visible:text-foreground data-[state=open]:text-foreground',
  active ? 'font-[550] text-foreground' : 'text-muted-foreground',
)

function FilterMenu({ label, current, value, options, allLabel, onSelect }: {
  label: string
  current: string | undefined
  value: string
  options: FilterOption[]
  allLabel: string
  onSelect: (id: string) => void
}) {
  return (
    <Menu>
      <MenuTrigger className={triggerClass(!!current)} aria-label={current ? `${label}: ${current}. Change ${label.toLowerCase()} filter` : `Filter by ${label.toLowerCase()}`}>
        <span className="max-w-40 truncate">{current ? `${label}: ${current}` : label}</span><ChevronDown className="size-3.5" aria-hidden="true" />
      </MenuTrigger>
      <MenuContent className="max-w-72">
        <MenuRadioGroup value={value} onValueChange={onSelect}>
          <MenuRadioItem value="">{allLabel}</MenuRadioItem>
          {options.length > 0 && <MenuSeparator />}
          {options.map((option) => <MenuRadioItem key={option.id} value={option.id}>{option.name}</MenuRadioItem>)}
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  )
}
