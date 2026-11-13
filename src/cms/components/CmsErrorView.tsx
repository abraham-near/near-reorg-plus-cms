'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, FileQuestion } from 'lucide-react'
import { Button } from '@/cms/components/ui/button'

/**
 * What the CMS shows instead of Next's bare "This page couldn't load": what happened, a retry, and
 * a way back to the posts. The error goes to the console so it can be reported.
 */
export function CmsErrorView({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error('[NEAR CMS] page error', error)
  }, [error])
  const digest = typeof error === 'object' && error && 'digest' in error ? String((error as { digest?: unknown }).digest ?? '') : ''
  return (
    <section role="alert" className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-24 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-destructive/10 text-destructive" aria-hidden><AlertTriangle className="size-5" /></span>
      <h1 className="text-lg font-semibold">Something went wrong on this page</h1>
      <p className="text-sm text-muted-foreground">
        Your saved work is safe. Try again; if it keeps happening, reload the page. A browser translator or an extension that edits pages can cause this: turn it off for the CMS.
      </p>
      <div className="mt-2 flex gap-2">
        <Button type="button" onClick={() => retry()}>Try again</Button>
        <Button type="button" variant="outline" asChild><Link href="/admin/posts">Go to posts</Link></Button>
      </div>
      {digest && <p className="mt-2 font-mono text-xs text-muted-foreground">Reference: {digest}</p>}
    </section>
  )
}

export function CmsNotFoundView({ title, detail }: { title: string; detail: string }) {
  return (
    <section className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-24 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground" aria-hidden><FileQuestion className="size-5" /></span>
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="text-sm text-muted-foreground">{detail}</p>
      <Button asChild className="mt-2"><Link href="/admin/posts">Go to posts</Link></Button>
    </section>
  )
}
