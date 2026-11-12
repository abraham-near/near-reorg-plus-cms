'use client'

// Navigation is filtered by the permissions the server computed for this user
// (src/cms/lib/permissions.ts), not by role names.
import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  Tag,
  Users,
} from 'lucide-react'
import { CmsMark } from '@/cms/components/CmsMark'
import { SidebarProfileMenu } from '@/cms/components/SidebarProfileMenu'
import { SidebarTooltip } from '@/cms/components/SidebarTooltip'
import { useNavigationGuard } from '@/cms/components/NavigationGuardProvider'
import type { Permission } from '@/cms/lib/permissions'
import { useStoredValue } from '@/cms/lib/useStoredState'

type NavItem = { href: string; label: string; icon: ReactNode; permission: Permission; exact?: boolean }
export type RecentDraft = { id: string; title: string }

const ICON = 'h-4 w-4'

// One short list: the core of the CMS and nothing else.
const NAV: NavItem[] = [
  { href: '/admin/dashboard', label: 'Home', icon: <LayoutDashboard className={ICON} />, permission: 'admin:access', exact: true },
  { href: '/admin/posts', label: 'Posts', icon: <FileText className={ICON} />, permission: 'content:read' },
  { href: '/admin/media', label: 'Media', icon: <ImageIcon className={ICON} />, permission: 'content:read', exact: true },
  { href: '/admin/categories', label: 'Categories & Tags', icon: <Tag className={ICON} />, permission: 'taxonomy:manage', exact: true },
  { href: '/admin/users', label: 'People', icon: <Users className={ICON} />, permission: 'user:manage', exact: true },
  { href: '/admin/settings', label: 'Settings', icon: <Settings className={ICON} />, permission: 'admin:access' },
]

// The post editor draws its own sticky top bar and page margins: no padding around it.
const BARE = /^\/admin\/posts\/(new|[^/]+\/edit)\/?$/

type Props = { children: ReactNode; role: string; userName: string; permissions: Permission[]; recentDrafts?: RecentDraft[] }

export function AdminSidebar({ children, role, userName, permissions, recentDrafts = [] }: Props) {
  const pathname = usePathname()
  const [stored, setStored] = useStoredValue('sidebar-collapsed')
  const collapsed = stored === 'true'
  const setCollapsed = (update: (v: boolean) => boolean) => setStored(String(update(collapsed)))
  const { isDirty, requestNavigation } = useNavigationGuard()
  const allowed = new Set(permissions)
  const bare = BARE.test(pathname)

  const guard = (href: string) => (e: React.MouseEvent) => {
    if (isDirty) {
      e.preventDefault()
      requestNavigation(href)
    }
  }

  const navLink = ({ href, label, icon, exact }: NavItem) => {
    const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
    return (
      <SidebarTooltip key={href} label={label} collapsed={collapsed}>
        <Link
          href={href}
          aria-current={active ? 'page' : undefined}
          onClick={guard(href)}
          className={`flex h-8 items-center rounded-md text-[14px] transition-colors duration-[var(--dur-fast)] ${collapsed ? 'justify-center px-0' : 'gap-2.5 px-2.5'} ${
            active
              ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
              : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
          }`}
        >
          <span className={active ? 'text-sidebar-accent-foreground' : 'text-muted-foreground'}>{icon}</span>
          {collapsed ? <span className="sr-only">{label}</span> : <span className="truncate">{label}</span>}
        </Link>
      </SidebarTooltip>
    )
  }

  const canWrite = allowed.has('post:write')

  return (
    <div className="admin-wrapper flex h-screen bg-background text-foreground">
      <aside
        className={`${collapsed ? 'w-14' : 'w-[232px]'} flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-[var(--dur-base)] ease-[var(--ease-out)]`}
      >
        <div className={`flex h-14 items-center ${collapsed ? 'flex-col justify-center gap-1 pt-2' : 'justify-between px-4'}`}>
          <Link href="/admin/dashboard" onClick={guard('/admin/dashboard')} className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
            <CmsMark className="h-[18px] w-[18px]" />
            {!collapsed && <span>NEAR CMS</span>}
          </Link>
          <button
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="cms-press rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        {canWrite && (
          <div className={collapsed ? 'flex justify-center py-2' : 'px-3 pb-2 pt-1'}>
            <SidebarTooltip label="New post" collapsed={collapsed}>
              <Link
                href="/admin/posts/new"
                onClick={guard('/admin/posts/new')}
                className={`cms-press flex h-8 items-center justify-center gap-2 rounded-md border border-border bg-background text-[13px] font-medium text-foreground shadow-[0_1px_2px_rgb(var(--shadow)/.04)] hover:border-[var(--border-strong)] ${collapsed ? 'w-8' : 'w-full'}`}
              >
                <Plus className="h-4 w-4" />
                {collapsed ? <span className="sr-only">New post</span> : 'New post'}
              </Link>
            </SidebarTooltip>
          </div>
        )}

        <nav aria-label="CMS" className={`flex-1 overflow-y-auto ${collapsed ? 'px-2' : 'px-2.5'} py-2`}>
          <div className="space-y-0.5">{NAV.filter((item) => allowed.has(item.permission)).map(navLink)}</div>

          {!collapsed && recentDrafts.length > 0 && (
            <div className="mt-6">
              <div className="px-2.5 pb-1.5 text-[11px] font-semibold tracking-[.05em] text-muted-foreground">RECENT DRAFTS</div>
              <div className="space-y-0.5">
                {recentDrafts.map((d) => {
                  const href = `/admin/posts/${d.id}/edit`
                  const active = pathname === href
                  return (
                    <Link
                      key={d.id}
                      href={href}
                      onClick={guard(href)}
                      aria-current={active ? 'page' : undefined}
                      className={`block truncate rounded-md px-2.5 py-1.5 text-[13px] transition-colors duration-[var(--dur-fast)] ${
                        active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60'
                      }`}
                    >
                      {d.title || 'Untitled'}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </nav>

        <div className={`border-t border-sidebar-border ${collapsed ? 'p-2' : 'p-3'}`}>
          <SidebarProfileMenu userName={userName} role={role} collapsed={collapsed} canConnectClaude={allowed.has('apitoken:manage')} />
        </div>
      </aside>

      <main id="admin-main" className="flex-1 overflow-auto bg-background">
        {bare ? children : <div className="mx-auto max-w-[1280px] px-8 py-7">{children}</div>}
      </main>
    </div>
  )
}
