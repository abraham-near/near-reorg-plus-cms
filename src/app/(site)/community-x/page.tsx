import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { CommunityX } from "@/components/community/x/CommunityX";
import { CommunitySwitch } from "@/components/community/CommunitySwitch";
import { CLOSE, HERO } from "@/components/community/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/community, version X: "MVP" (components/community/x), C made more typographic after the Nov 19, 2026 review; on v3's shell, closing with the
// homepage's scene. Copy: components/community/content.ts (the doc).
export const metadata: Metadata = {
  title: "Community",
  description: HERO.sub,
};

export default function CommunityXPage() {
  return <><BlogShell home="/"><CommunityX /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} secondary={CLOSE.secondary} newsletter={CLOSE.newsletter} /></BlogShell><CommunitySwitch on="x" /></>;
}
