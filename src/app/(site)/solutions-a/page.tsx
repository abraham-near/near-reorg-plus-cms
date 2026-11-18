import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { SolutionsA } from "@/components/solutions/a/SolutionsA";
import { SolutionsSwitch } from "@/components/solutions/SolutionsSwitch";
import { CLOSE, META } from "@/components/solutions/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/solutions, version A: "Ruled grid" (components/solutions/a), on v3's shell, closing with the homepage's scene. Copy: components/solutions/content.ts.
export const metadata: Metadata = {
  title: "Solutions",
  description: META.description,
};

export default function SolutionsAPage() {
  return <><BlogShell home="/"><SolutionsA /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} secondary={CLOSE.secondary} ruled /></BlogShell><SolutionsSwitch on="a" /></>;
}
