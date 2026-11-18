import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { EconomicsB } from "@/components/economics/b/EconomicsB";
import { EconomicsSwitch } from "@/components/economics/EconomicsSwitch";
import { CLOSE, HERO } from "@/components/economics/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/economics, version B: "Drawn" (components/economics/b), on v3's shell, closing with the homepage's scene. Copy: components/economics/content.ts.
export const metadata: Metadata = {
  title: "Economics",
  description: HERO.sub,
};

export default function EconomicsBPage() {
  return <><BlogShell home="/"><EconomicsB /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} secondary={CLOSE.secondary} ruled /></BlogShell><EconomicsSwitch on="b" /></>;
}
