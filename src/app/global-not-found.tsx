import "./globals.css";
import type { Metadata } from "next";
import { fontVariables } from "@/styles/fonts";
import { InlineScript } from "@/components/InlineScript";
import { VERSION_HEAD } from "@/components/shared/version";
import { NotFoundA } from "@/components/notfound/a/NotFoundA";

// THE 404 for any URL no route matches (experimental.globalNotFound in next.config.ts): proposal A, "Lost in the mist" (/404-a). The app has two root
// layouts, (site) and (cms), so there is no single layout to compose a root not-found from; Next renders this file on its own, skipping every layout,
// with a real 404 status. It therefore brings its own document: the same <html>/<head> as (site)/layout.tsx (fonts, global CSS, the data-js and
// data-version scripts), keep the two in step. A notFound() inside the site (an unknown /blog/[slug]) renders the same design via (site)/not-found.tsx.
export const metadata: Metadata = {
  title: "Page not found · NEAR",
  description: "This page doesn’t exist, or it moved. Here’s the way back.",
  icons: { icon: "/brand/icon.svg" },
  robots: { index: false, follow: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <InlineScript html="document.documentElement.setAttribute('data-js','')" />
        <InlineScript html={VERSION_HEAD} />
      </head>
      <body><NotFoundA /></body>
    </html>
  );
}
