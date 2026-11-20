import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { HistoryC } from "@/components/history/c/HistoryC";
import { HistorySwitch } from "@/components/history/HistorySwitch";
import { CLOSE, HERO } from "@/components/history/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/history: the History page, version C (the menu's until Nov 19, 2026; now at /history-c, X is in the menu): "Editorial" (components/history/c), on v3's shell, closing with the homepage's scene. Copy: components/history/content.ts.
export const metadata: Metadata = {
  title: "History",
  description: HERO.sub,
};

export default function HistoryCPage() {
  return <><BlogShell home="/"><HistoryC /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} secondary={CLOSE.secondary} /></BlogShell><HistorySwitch on="c" /></>;
}
