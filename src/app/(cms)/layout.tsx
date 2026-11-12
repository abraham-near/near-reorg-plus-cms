import type { Metadata } from 'next'
import '@fontsource-variable/mona-sans'
import './admin.css'
import { THEME_SCRIPT, ThemeProvider } from '@/cms/components/ThemeProvider'

// Root layout for the CMS. Separate from src/app/(site)/layout.tsx so the admin gets none of the
// site's fonts, scripts or styles, and the site none of the admin's.
export const metadata: Metadata = {
  title: { default: 'NEAR CMS', template: '%s · NEAR CMS' },
  robots: { index: false, follow: false },
}

// Every CMS page reads the session cookie and the database before it can render anything useful,
// so it is rendered on request in full (no static shell), and redirect() stays a real 307.
export const instant = false

export default function CmsRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: THEME_SCRIPT may add class="dark" before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased" suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
