import type { Metadata } from "next";
import { fontVariables } from "@/styles/fonts";
import { InlineScript } from "@/components/InlineScript";
import { VERSION_HEAD } from "@/components/shared/version";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "NEAR: Own your world", template: "%s · NEAR" },
  description: "NEAR is open infrastructure for the agent economy: one account across every chain, private AI you can verify, and money that moves at machine speed.",
  icons: { icon: "/brand/icon.svg" },
  robots: { index: false, follow: false },
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
      <body>{children}</body>
    </html>
  );
}
