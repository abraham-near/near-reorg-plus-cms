import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { EconomicsC } from "@/components/economics/c/EconomicsC";
import { EconomicsSwitch } from "@/components/economics/EconomicsSwitch";
import { CLOSE, HERO } from "@/components/economics/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/economics, version C: "Editorial" (components/economics/c), on v3's shell, closing with the homepage's scene. Copy: components/economics/content.ts.
export const metadata: Metadata = {
  title: "Economics",
  description: HERO.sub,
};

export default function EconomicsCPage() {
  return <><BlogShell home="/"><EconomicsC /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} secondary={CLOSE.secondary} /></BlogShell><EconomicsSwitch on="c" /></>;
}
