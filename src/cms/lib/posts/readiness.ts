// "N of 5 ready" for a draft: the five things a post needs before it reads well on the blog.
// Pure: the dashboard computes it on the server from the stored post.

export const MIN_READY_WORDS = 150

export type ReadinessInput = {
  title: string | null | undefined
  excerpt: string | null | undefined
  categoryCount: number
  featuredImage: string | null | undefined
  wordCount: number
}

export type ReadinessCheck = { key: 'title' | 'summary' | 'category' | 'cover' | 'length'; label: string; ok: boolean }
export type Readiness = { checks: ReadinessCheck[]; ready: number; total: number }

const filled = (value: string | null | undefined) => !!value && value.trim().length > 0

export function postReadiness(input: ReadinessInput): Readiness {
  const title = (input.title ?? '').trim()
  const checks: ReadinessCheck[] = [
    { key: 'title', label: 'Title', ok: title.length > 0 && title.toLowerCase() !== 'untitled' },
    { key: 'summary', label: 'Summary', ok: filled(input.excerpt) },
    { key: 'category', label: 'Category', ok: input.categoryCount > 0 },
    { key: 'cover', label: 'Cover image', ok: filled(input.featuredImage) },
    { key: 'length', label: `At least ${MIN_READY_WORDS} words`, ok: input.wordCount >= MIN_READY_WORDS },
  ]
  return { checks, ready: checks.filter((check) => check.ok).length, total: checks.length }
}
