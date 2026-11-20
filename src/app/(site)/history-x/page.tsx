import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { HistoryX } from "@/components/history/x/HistoryX";
import { HistorySwitch } from "@/components/history/HistorySwitch";
import { CLOSE, HERO } from "@/components/history/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/history (History), version X: "MVP" (components/history/x; A's ruled grid with C's rolling year, after the Nov 19 2026 review), on v3's shell,
// closing with the homepage's scene, the ruled grid running down into it. Copy: components/history/content.ts.
// [[TBD: graphic by Ali]] the closing scene's meadow (CloseScene's default photo) is the homepage's, a placeholder here.
export const metadata: Metadata = {
  title: "History",
  description: HERO.sub,
};

export default function HistoryXPage() {
  return <><BlogShell home="/"><HistoryX /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} secondary={CLOSE.secondary} ruled /></BlogShell><HistorySwitch on="x" /></>;
}
