import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { ResearchC } from "@/components/research/c/ResearchC";
import { CLOSE, HERO } from "@/components/research/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/research, version C: "Editorial" (components/research/c), on v3's shell, closing with the homepage's scene. Copy: components/research/content.ts.
export const metadata: Metadata = {
  title: "Research",
  description: HERO.sub,
};

export default function ResearchCPage() {
  return <BlogShell home="/"><ResearchC /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} secondary={CLOSE.secondary} /></BlogShell>;
}
