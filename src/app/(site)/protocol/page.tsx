import type { Metadata } from "next";
import { og } from "@/lib/site";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { ProtocolFinal } from "@/components/protocol/final/ProtocolFinal";
import { CLOSE, META } from "@/components/protocol/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/protocol, the final page (components/protocol/final, since Nov 25, 2026), the one in the menu: the Vercel page's hero, index, Private Shard,
// dark run and Go deeper, with version B's chapter (Nightshade 3.0 and dynamic resharding on the live lanes), Speed and lower sections, after the team's
// Figma collage; on v3's shell, closing with the homepage's scene. B stays at /protocol-b. Copy: components/protocol/content.ts.
export const metadata: Metadata = {
  title: META.title,
  description: META.description,
  alternates: { canonical: "/protocol" },
  openGraph: og({ url: "/protocol" }),
};

export default function ProtocolPage() {
  return <BlogShell home="/"><ProtocolFinal /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} ruled /></BlogShell>;
}
