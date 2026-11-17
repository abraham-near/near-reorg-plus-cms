import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { CommunityA } from "@/components/community/a/CommunityA";
import { CommunitySwitch } from "@/components/community/CommunitySwitch";
import { HERO } from "@/components/community/content";

// near.org/community, version A: "Ruled grid" (components/community/a), on v3's shell. Copy: components/community/content.ts.
export const metadata: Metadata = {
  title: "Community",
  description: HERO.sub,
};

export default function CommunityAPage() {
  return <><BlogShell home="/"><CommunityA /></BlogShell><CommunitySwitch on="a" /></>;
}
