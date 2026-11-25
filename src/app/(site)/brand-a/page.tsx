import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { BrandA } from "@/components/brand/a/BrandA";
import { CLOSE, HERO } from "@/components/brand/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/brand, version A: "Ruled grid" (components/brand/a), on v3's shell, closing with the homepage's scene. Copy: components/brand/content.ts.
export const metadata: Metadata = {
  title: "Brand",
  description: HERO.sub,
};

export default function BrandAPage() {
  return <BlogShell home="/"><BrandA /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} secondary={CLOSE.secondary} ruled /></BlogShell>;
}
