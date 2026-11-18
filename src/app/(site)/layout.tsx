import type { Metadata } from "next";
import { fontVariables } from "@/styles/fonts";
import { InlineScript } from "@/components/InlineScript";
import { VERSION_HEAD } from "@/components/shared/version";
import { indexable, siteOrigin } from "@/lib/site";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "NEAR: Own your world", template: "%s · NEAR" },
  description: "NEAR is open infrastructure for the agent economy: one account across every chain, private AI you can verify, and money that moves at machine speed.",
  icons: { icon: "/brand/icon.svg" },
  metadataBase: siteOrigin(),
  // not indexed until launch (SITE_INDEXABLE, src/lib/site.ts); the explorations set their own noindex in next.config.ts headers()
  robots: indexable() ? { index: true, follow: true } : { index: false, follow: false },
  // shared by every page that has no card of its own (the picture: ./opengraph-image.jpg); a blog post brings its own
  openGraph: { type: "website", siteName: "NEAR", locale: "en_US" },
  twitter: { card: "summary_large_image", site: "@NEARProtocol" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-js is set before first paint, so motion layouts never flash their static fallback (and no-JS stays static).
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <InlineScript html="document.documentElement.setAttribute('data-js','')" />
        {/* data-version (v1 | v2): which homepage direction the shared pieces render in (styles/versions.css). The homes fix their own. */}
        <InlineScript html={VERSION_HEAD} />
      </head>
      {/* suppressHydrationWarning: browser extensions set attributes on <body> before React loads (contenteditable="false" seen on /); it covers
          the body's own attributes only, not its children */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
