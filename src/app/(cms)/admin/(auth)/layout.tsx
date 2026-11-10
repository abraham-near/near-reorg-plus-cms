import { CmsMark } from '@/cms/components/CmsMark'

// Reads the session (cookie + database) before rendering: navigations here block by design.
export const instant = false

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="admin-wrapper dark flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-lg bg-card p-8 text-foreground shadow-lg">
        <p className="mb-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <CmsMark className="h-4 w-4" /> NEAR CMS
        </p>
        {children}
      </div>
    </div>
  )
}
