'use client'

import { createContext, useCallback, useContext, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Navigation inside the posts list (tabs, search, filters, pages) runs in a transition, so the
// table can show skeleton rows while the server renders the next view.

type Nav = { pending: boolean; navigate: (href: string, options?: { replace?: boolean }) => void }

const PostsNavContext = createContext<Nav>({ pending: false, navigate: () => {} })

export function PostsNavProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const navigate = useCallback((href: string, options?: { replace?: boolean }) => {
    startTransition(() => {
      if (options?.replace) router.replace(href, { scroll: false })
      else router.push(href, { scroll: false })
    })
  }, [router])
  const value = useMemo(() => ({ pending, navigate }), [pending, navigate])
  return <PostsNavContext.Provider value={value}>{children}</PostsNavContext.Provider>
}

export const usePostsNav = () => useContext(PostsNavContext)

/** A link that navigates through the list's transition; modified clicks (new tab, etc.) behave as usual. */
export function NavLink({ href, onClick, ...props }: React.ComponentProps<typeof Link> & { href: string }) {
  const { navigate } = usePostsNav()
  return (
    <Link
      href={href}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
        event.preventDefault()
        navigate(href)
      }}
      {...props}
    />
  )
}
