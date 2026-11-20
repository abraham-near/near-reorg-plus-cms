import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { SolutionsX } from "@/components/solutions/x/SolutionsX";
import { SolutionsSwitch } from "@/components/solutions/SolutionsSwitch";
import { CLOSE, META } from "@/components/solutions/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/solutions, version X: "MVP" (components/solutions/x), version A cleaned after the Nov 19 2026 review, on v3's shell, closing with the
// homepage's scene. Copy: components/solutions/content.ts.
export const metadata: Metadata = {
  title: "Solutions",
  description: META.description,
};

export default function SolutionsXPage() {
  return <><BlogShell home="/"><SolutionsX /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} secondary={CLOSE.secondary} ruled /></BlogShell><SolutionsSwitch on="x" /></>;
}
