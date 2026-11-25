import type { Metadata } from "next";
import { og } from "@/lib/site";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { CommunityX } from "@/components/community/x/CommunityX";
import { CLOSE, HERO } from "@/components/community/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/community, version X: "MVP", the one in the menu (/community-x redirects here) (components/community/x), C made more typographic after the Nov 19, 2026 review; on v3's shell, closing with the
// homepage's scene. Copy: components/community/content.ts (the doc).
export const metadata: Metadata = {
  title: "Community",
  description: HERO.sub,
  alternates: { canonical: "/community" },
  openGraph: og({ url: "/community" }),
};

export default function CommunityPage() {
  return <BlogShell home="/"><CommunityX /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} secondary={CLOSE.secondary} newsletter={CLOSE.newsletter} /></BlogShell>;
}
