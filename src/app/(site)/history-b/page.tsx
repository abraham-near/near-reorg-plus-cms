import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { HistoryB } from "@/components/history/b/HistoryB";
import { CLOSE, HERO } from "@/components/history/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/history (History), version B: "Drawn" (components/history/b), on v3's shell, closing with the homepage's scene. Copy: components/history/content.ts.
export const metadata: Metadata = {
  title: "History",
  description: HERO.sub,
};

export default function HistoryBPage() {
  return <BlogShell home="/"><HistoryB /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} secondary={CLOSE.secondary} ruled /></BlogShell>;
}
