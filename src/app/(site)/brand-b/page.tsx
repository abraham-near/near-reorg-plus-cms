import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { BrandB } from "@/components/brand/b/BrandB";
import { CLOSE, HERO } from "@/components/brand/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/brand, version B: "Drawn" (components/brand/b), on v3's shell, closing with the homepage's scene. Copy: components/brand/content.ts.
export const metadata: Metadata = {
  title: "Brand",
  description: HERO.sub,
};

export default function BrandBPage() {
  return <BlogShell home="/"><BrandB /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} secondary={CLOSE.secondary} ruled /></BlogShell>;
}
