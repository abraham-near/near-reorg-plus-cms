import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { SolutionsB } from "@/components/solutions/b/SolutionsB";
import { SolutionsSwitch } from "@/components/solutions/SolutionsSwitch";
import { CLOSE, META } from "@/components/solutions/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/solutions, version B: "Drawn" (components/solutions/b), on v3's shell and its ruled grid, closing with the homepage's scene. Copy:
// components/solutions/content.ts.
export const metadata: Metadata = {
  title: "Solutions",
  description: META.description,
};

export default function SolutionsBPage() {
  return <><BlogShell home="/"><SolutionsB /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} secondary={CLOSE.secondary} ruled /></BlogShell><SolutionsSwitch on="b" /></>;
}
