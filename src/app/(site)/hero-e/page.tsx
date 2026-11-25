import type { Metadata } from "next";
import { og } from "@/lib/site";
import { V7Page } from "@/components/v7/V7Page";
import { HeroScene } from "@/components/heroes3d/HeroScene";

// Hero study E, "Layers" (components/heroes3d, second round): home v10 whole, with a pinned three.js hero in place of its type-only one: C's layered N on the paper; scrolling lifts the plates apart, darkens the paper and folds each plate into a cube of the Stack's pillar.
export const metadata: Metadata = {
  title: "Hero E · Layers",
  description: "One account, any chain, private by design.",
  openGraph: og({ url: "/hero-e" }),
};

export default function HeroEPage() {
  return <V7Page top="private" stackFirst privHero={<HeroScene v="e" />} />;
}
