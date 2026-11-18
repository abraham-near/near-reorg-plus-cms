import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { ResearchB } from "@/components/research/b/ResearchB";
import { ResearchSwitch } from "@/components/research/ResearchSwitch";
import { CLOSE, HERO } from "@/components/research/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/research, version B: "Drawn" (components/research/b), on v3's shell, closing with the homepage's scene. Copy: components/research/content.ts.
export const metadata: Metadata = {
  title: "Research",
  description: HERO.sub,
};

export default function ResearchBPage() {
  return <><BlogShell home="/"><ResearchB /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} secondary={CLOSE.secondary} ruled /></BlogShell><ResearchSwitch on="b" /></>;
}
