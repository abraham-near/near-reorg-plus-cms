import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { EconomicsA } from "@/components/economics/a/EconomicsA";
import { EconomicsSwitch } from "@/components/economics/EconomicsSwitch";
import { CLOSE, HERO } from "@/components/economics/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/economics: the Economics page, version A (the menu's until Nov 19, 2026; now at /economics-a, X is in the menu): "Ruled grid" (components/economics/a), on v3's shell, closing with the homepage's scene. Copy: components/economics/content.ts.
export const metadata: Metadata = {
  title: "Economics",
  description: HERO.sub,
};

export default function EconomicsAPage() {
  return <><BlogShell home="/"><EconomicsA /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} secondary={CLOSE.secondary} ruled /></BlogShell><EconomicsSwitch on="a" /></>;
}
