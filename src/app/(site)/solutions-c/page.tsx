import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { SolutionsC } from "@/components/solutions/c/SolutionsC";
import { SolutionsSwitch } from "@/components/solutions/SolutionsSwitch";
import { CLOSE, META } from "@/components/solutions/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/solutions, version C: "Editorial" (components/solutions/c), on v3's shell, closing with the homepage's scene. Copy: components/solutions/content.ts.
export const metadata: Metadata = {
  title: "Solutions",
  description: META.description,
};

export default function SolutionsCPage() {
  return <><BlogShell home="/"><SolutionsC /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} secondary={CLOSE.secondary} /></BlogShell><SolutionsSwitch on="c" /></>;
}
