import type { Metadata } from "next";
import { og } from "@/lib/site";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { HistoryC } from "@/components/history/c/HistoryC";
import { HistorySwitch } from "@/components/history/HistorySwitch";
import { CLOSE, HERO } from "@/components/history/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/history: the History page, version C: "Editorial" (components/history/c), on v3's shell, closing with the homepage's scene. Copy: components/history/content.ts.
export const metadata: Metadata = {
  title: "History",
  description: HERO.sub,
  alternates: { canonical: "/history" },
  openGraph: og({ url: "/history" }),
};

export default function AboutPage() {
  return <><BlogShell home="/"><HistoryC /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} secondary={CLOSE.secondary} /></BlogShell><HistorySwitch on="c" /></>;
}
