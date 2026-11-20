import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { EconomicsX } from "@/components/economics/x/EconomicsX";
import { EconomicsSwitch } from "@/components/economics/EconomicsSwitch";
import { CLOSE, HERO } from "@/components/economics/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/economics, version X: "MVP" (components/economics/x), A made calm after the Nov 19 2026 review, on v3's shell, closing with the homepage's
// scene, the ruled grid running down into it. Copy: components/economics/content.ts.
export const metadata: Metadata = {
  title: "Economics",
  description: HERO.sub,
};

export default function EconomicsXPage() {
  return <><BlogShell home="/"><EconomicsX /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} secondary={CLOSE.secondary} ruled /></BlogShell><EconomicsSwitch on="x" /></>;
}
