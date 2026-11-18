import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { HistoryA } from "@/components/history/a/HistoryA";
import { HistorySwitch } from "@/components/history/HistorySwitch";
import { HERO } from "@/components/history/content";

// near.org/history (History), version A: "Ruled grid" (components/history/a), on v3's shell. Copy: components/history/content.ts.
export const metadata: Metadata = {
  title: "History",
  description: HERO.sub,
};

export default function HistoryAPage() {
  return <><BlogShell home="/"><HistoryA /></BlogShell><HistorySwitch on="a" /></>;
}
