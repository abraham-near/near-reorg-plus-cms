import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { ResearchA } from "@/components/research/a/ResearchA";
import { CLOSE, HERO } from "@/components/research/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/research, version A: "Ruled grid" (components/research/a), on v3's shell, closing with the homepage's scene. Copy: components/research/content.ts.
export const metadata: Metadata = {
  title: "Research",
  description: HERO.sub,
};

export default function ResearchAPage() {
  return <BlogShell home="/"><ResearchA /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} secondary={CLOSE.secondary} ruled /></BlogShell>;
}
