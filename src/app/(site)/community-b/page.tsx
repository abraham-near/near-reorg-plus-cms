import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { CommunityB } from "@/components/community/b/CommunityB";
import { CommunitySwitch } from "@/components/community/CommunitySwitch";
import { CLOSE, HERO } from "@/components/community/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/community, version B: "Drawn" (components/community/b), on v3's shell, closing with the homepage's scene. Copy: components/community/content.ts.
export const metadata: Metadata = {
  title: "Community",
  description: HERO.sub,
};

export default function CommunityBPage() {
  return <><BlogShell home="/"><CommunityB /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} secondary={CLOSE.secondary} newsletter={CLOSE.newsletter} /></BlogShell><CommunitySwitch on="b" /></>;
}
