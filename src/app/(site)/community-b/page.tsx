import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { CommunityB } from "@/components/community/b/CommunityB";
import { CommunitySwitch } from "@/components/community/CommunitySwitch";
import { HERO } from "@/components/community/content";

// near.org/community, version B: "Drawn" (components/community/b), on v3's shell. Copy: components/community/content.ts.
export const metadata: Metadata = {
  title: "Community",
  description: HERO.sub,
};

export default function CommunityBPage() {
  return <><BlogShell home="/"><CommunityB /></BlogShell><CommunitySwitch on="b" /></>;
}
