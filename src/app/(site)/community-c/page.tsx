import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { CommunityC } from "@/components/community/c/CommunityC";
import { CLOSE, HERO } from "@/components/community/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/community, version C: "Editorial" (components/community/c), on v3's shell, closing with the homepage's scene. Copy: components/community/content.ts.
export const metadata: Metadata = {
  title: "Community",
  description: HERO.sub,
};

export default function CommunityCPage() {
  return <BlogShell home="/"><CommunityC /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} secondary={CLOSE.secondary} newsletter={CLOSE.newsletter} /></BlogShell>;
}
