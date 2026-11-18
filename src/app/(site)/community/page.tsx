import type { Metadata } from "next";
import { og } from "@/lib/site";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { CommunityB } from "@/components/community/b/CommunityB";
import { CommunitySwitch } from "@/components/community/CommunitySwitch";
import { CLOSE, HERO } from "@/components/community/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/community: the Community page, version B: "Drawn" (components/community/b), on v3's shell, closing with the homepage's scene. Copy: components/community/content.ts.
export const metadata: Metadata = {
  title: "Community",
  description: HERO.sub,
  alternates: { canonical: "/community" },
  openGraph: og({ url: "/community" }),
};

export default function CommunityPage() {
  return <><BlogShell home="/"><CommunityB /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} secondary={CLOSE.secondary} newsletter={CLOSE.newsletter} /></BlogShell><CommunitySwitch on="b" /></>;
}
