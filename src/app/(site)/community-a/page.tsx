import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { CommunityA } from "@/components/community/a/CommunityA";
import { CLOSE, HERO } from "@/components/community/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/community, version A: "Ruled grid" (components/community/a), on v3's shell, closing with the homepage's scene. Copy: components/community/content.ts.
export const metadata: Metadata = {
  title: "Community",
  description: HERO.sub,
};

export default function CommunityAPage() {
  return <BlogShell home="/"><CommunityA /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} secondary={CLOSE.secondary} newsletter={CLOSE.newsletter} ruled /></BlogShell>;
}
