import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { ResearchX } from "@/components/research/x/ResearchX";
import { ResearchSwitch } from "@/components/research/ResearchSwitch";
import { CLOSE, HERO } from "@/components/research/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/research, version X: "MVP" (components/research/x), A's catalogue made calm after the Nov 19, 2026 review, on v3's shell, closing with the
// homepage's scene. Copy: components/research/content.ts.
export const metadata: Metadata = {
  title: "Research",
  description: HERO.sub,
};

export default function ResearchXPage() {
  return <><BlogShell home="/"><ResearchX /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} secondary={CLOSE.secondary} ruled /></BlogShell><ResearchSwitch on="x" /></>;
}
