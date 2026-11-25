import type { Metadata } from "next";
import { og } from "@/lib/site";
import { V7Page } from "@/components/v7/V7Page";
import { HeroScene } from "@/components/heroes3d/HeroScene";

// Hero study D, "N of light" (components/heroes3d, second round): home v10 whole, with a pinned three.js hero in place of its type-only one: the NEAR mark as black glass with a green neon outline, drawn by a point of light; each word sends a comet round it; scrolling goes through it to the Stack's pillar.
export const metadata: Metadata = {
  title: "Hero D · N of light",
  description: "One account, any chain, private by design.",
  openGraph: og({ url: "/hero-d" }),
};

export default function HeroDPage() {
  return <V7Page top="private" stackFirst privHero={<HeroScene v="d" />} />;
}
