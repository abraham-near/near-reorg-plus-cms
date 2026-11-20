import type { Metadata } from "next";
import { og } from "@/lib/site";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { EconomicsX } from "@/components/economics/x/EconomicsX";
import { EconomicsSwitch } from "@/components/economics/EconomicsSwitch";
import { CLOSE, HERO } from "@/components/economics/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/economics, version X: "MVP", the one in the menu (/economics-x redirects here) (components/economics/x), A made calm after the Nov 19 2026 review, on v3's shell, closing with the homepage's
// scene, the ruled grid running down into it. Copy: components/economics/content.ts.
export const metadata: Metadata = {
  title: "Economics",
  description: HERO.sub,
  alternates: { canonical: "/economics" },
  openGraph: og({ url: "/economics" }),
};

export default function EconomicsPage() {
  return <><BlogShell home="/"><EconomicsX /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} secondary={CLOSE.secondary} ruled /></BlogShell><EconomicsSwitch on="x" /></>;
}
