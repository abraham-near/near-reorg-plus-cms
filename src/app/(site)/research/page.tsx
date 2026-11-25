import type { Metadata } from "next";
import { og } from "@/lib/site";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { ResearchX } from "@/components/research/x/ResearchX";
import { CLOSE, HERO } from "@/components/research/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/research, version X: "MVP", the one in the menu (/research-x redirects here) (components/research/x), A's catalogue made calm after the Nov 19, 2026 review, on v3's shell, closing with the
// homepage's scene. Copy: components/research/content.ts.
export const metadata: Metadata = {
  title: "Research",
  description: HERO.sub,
  alternates: { canonical: "/research" },
  openGraph: og({ url: "/research" }),
};

export default function ResearchPage() {
  return <BlogShell home="/"><ResearchX /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} secondary={CLOSE.secondary} ruled /></BlogShell>;
}
