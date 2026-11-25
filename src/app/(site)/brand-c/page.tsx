import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { BrandC } from "@/components/brand/c/BrandC";
import { CLOSE, HERO } from "@/components/brand/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/brand, version C: "Editorial" (components/brand/c), on v3's shell, closing with the homepage's scene. Copy: components/brand/content.ts.
export const metadata: Metadata = {
  title: "Brand",
  description: HERO.sub,
};

export default function BrandCPage() {
  return <BlogShell home="/"><BrandC /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} secondary={CLOSE.secondary} /></BlogShell>;
}
