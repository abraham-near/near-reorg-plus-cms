import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { CommunityC } from "@/components/community/c/CommunityC";
import { CommunitySwitch } from "@/components/community/CommunitySwitch";
import { HERO } from "@/components/community/content";

// near.org/community, version C: "Editorial" (components/community/c), on v3's shell. Copy: components/community/content.ts.
export const metadata: Metadata = {
  title: "Community",
  description: HERO.sub,
};

export default function CommunityCPage() {
  return <><BlogShell home="/"><CommunityC /></BlogShell><CommunitySwitch on="c" /></>;
}
