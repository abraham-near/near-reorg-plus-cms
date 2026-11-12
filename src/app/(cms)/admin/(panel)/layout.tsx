import { AdminSidebar } from '@/cms/components/AdminSidebar'
import { ThemedToaster } from '@/cms/components/ThemeProvider'
import { NavigationGuardProvider } from '@/cms/components/NavigationGuardProvider'
import { TooltipProvider } from '@/cms/components/ui/tooltip'
import { requirePagePermission } from '@/cms/lib/auth'
import { PERMISSIONS, can } from '@/cms/lib/permissions'
import { db } from '@/cms/lib/db'

// Every page under (panel) needs a valid session. Pages still check their own specific
// permission with requirePagePermission(...): layouts do not re-run on client navigation.
// Reads the session (cookie + database) before rendering: navigations here block by design.
export const instant = false

export default async function PanelLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user } = await requirePagePermission('admin:access')
  const permissions = PERMISSIONS.filter((p) => can(user.role, p))
  // The sidebar's "Recent drafts": the person's own three latest drafts.
  const recentDrafts = can(user.role, 'post:write')
    ? await db.post.findMany({ where: { status: 'DRAFT', authorId: user.id }, orderBy: { updatedAt: 'desc' }, take: 3, select: { id: true, title: true } })
    : []
  return (
    <TooltipProvider delayDuration={0}>
      <NavigationGuardProvider>
        <AdminSidebar role={user.role} userName={user.name || user.email} permissions={permissions} recentDrafts={recentDrafts}>
          {children}
        </AdminSidebar>
      </NavigationGuardProvider>
      <ThemedToaster />
    </TooltipProvider>
  )
}
