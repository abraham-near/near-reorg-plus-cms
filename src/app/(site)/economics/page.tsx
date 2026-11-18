import type { Metadata } from "next";
import { og } from "@/lib/site";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { EconomicsA } from "@/components/economics/a/EconomicsA";
import { EconomicsSwitch } from "@/components/economics/EconomicsSwitch";
import { CLOSE, HERO } from "@/components/economics/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/economics: the Economics page, version A: "Ruled grid" (components/economics/a), on v3's shell, closing with the homepage's scene. Copy: components/economics/content.ts.
export const metadata: Metadata = {
  title: "Economics",
  description: HERO.sub,
  alternates: { canonical: "/economics" },
  openGraph: og({ url: "/economics" }),
};

export default function EconomicsPage() {
  return <><BlogShell home="/"><EconomicsA /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} secondary={CLOSE.secondary} ruled /></BlogShell><EconomicsSwitch on="a" /></>;
}
