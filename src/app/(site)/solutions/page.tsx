import type { Metadata } from "next";
import { og } from "@/lib/site";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { SolutionsX } from "@/components/solutions/x/SolutionsX";
import { CLOSE, META } from "@/components/solutions/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/solutions, version X: "MVP", the one in the menu (/solutions-x redirects here) (components/solutions/x), version A cleaned after the Nov 19 2026 review, on v3's shell, closing with the
// homepage's scene. Copy: components/solutions/content.ts.
export const metadata: Metadata = {
  title: "Solutions",
  description: META.description,
  alternates: { canonical: "/solutions" },
  openGraph: og({ url: "/solutions" }),
};

export default function SolutionsPage() {
  return <BlogShell home="/"><SolutionsX /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} secondary={CLOSE.secondary} ruled /></BlogShell>;
}
