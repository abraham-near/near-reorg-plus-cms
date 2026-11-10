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

const ICON = 'w-4 h-4'

// One short list: the core of the CMS and nothing else.
const NAV: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard className={ICON} />, permission: 'admin:access', exact: true },
  { href: '/admin/posts', label: 'Posts', icon: <FileText className={ICON} />, permission: 'content:read' },
  { href: '/admin/media', label: 'Media', icon: <ImageIcon className={ICON} />, permission: 'content:read', exact: true },
  { href: '/admin/categories', label: 'Categories & Tags', icon: <Tag className={ICON} />, permission: 'taxonomy:manage', exact: true },
  { href: '/admin/users', label: 'Users', icon: <Users className={ICON} />, permission: 'user:manage', exact: true },
  { href: '/admin/settings', label: 'Settings', icon: <Settings className={ICON} />, permission: 'admin:access' },
]

type Props = { children: ReactNode; role: string; userName: string; permissions: Permission[] }

export function AdminSidebar({ children, role, userName, permissions }: Props) {
  const pathname = usePathname()
  const [stored, setStored] = useStoredValue('sidebar-collapsed')
  const collapsed = stored === 'true'
  const setCollapsed = (update: (v: boolean) => boolean) => setStored(String(update(collapsed)))
  const { isDirty, requestNavigation } = useNavigationGuard()
  const allowed = new Set(permissions)

  const navLink = ({ href, label, icon, exact }: NavItem) => {
    const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
    return (
      <SidebarTooltip key={href} label={label} collapsed={collapsed}>
        <Link
          href={href}
          aria-current={active ? 'page' : undefined}
          onClick={(e) => {
            if (isDirty) {
              e.preventDefault()
              requestNavigation(href)
            }
          }}
          className={`flex items-center rounded-xl transition-all ${collapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2.5'} ${
            active ? 'bg-secondary text-secondary-foreground' : 'hover:bg-secondary/50 hover:text-secondary-foreground'
          }`}
        >
          <span className="opacity-70">{icon}</span>
          {collapsed ? <span className="sr-only">{label}</span> : <span>{label}</span>}
        </Link>
      </SidebarTooltip>
    )
  }

  return (
    <div className="admin-wrapper dark flex h-screen bg-background text-foreground">
      <aside className={`${collapsed ? 'w-16' : 'w-64'} flex shrink-0 flex-col border-r border-border bg-card transition-all duration-200`}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2 border-b border-border py-3">
            <CmsMark className="h-5 w-5" />
            <button
              onClick={() => setCollapsed((v) => !v)}
              aria-label="Expand sidebar"
              className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex h-[73px] items-center justify-between border-b border-border px-6">
            <span className="flex items-center gap-2 font-semibold">
              <CmsMark className="h-5 w-5" /> NEAR CMS
            </span>
            <button
              onClick={() => setCollapsed((v) => !v)}
              aria-label="Collapse sidebar"
              className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>
        )}

        <nav aria-label="CMS" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV.filter((item) => allowed.has(item.permission)).map(navLink)}
        </nav>

        <div className={`space-y-3 border-t border-border ${collapsed ? 'p-2' : 'p-4'}`}>
          <SidebarProfileMenu userName={userName} role={role} collapsed={collapsed} canConnectClaude={allowed.has('apitoken:manage')} />
        </div>
      </aside>

      <main id="admin-main" className="flex-1 overflow-auto bg-background">
        <div className="p-8">{children}</div>
      </main>

    </div>
  )
}
