import type { Metadata } from "next";
import { og } from "@/lib/site";
import { V7Page } from "@/components/v7/V7Page";
import { HeroScene } from "@/components/heroes3d/HeroScene";

// Hero study H, "Veils" (components/heroes3d, third round): home v10 whole, with a pinned three.js hero in place of its type-only one.
export const metadata: Metadata = {
  title: "Hero H · Veils",
  description: "One account, any chain, private by design.",
  openGraph: og({ url: "/hero-h" }),
};

export default function HeroHPage() {
  return <V7Page top="private" stackFirst privHero={<HeroScene v="h" />} />;
}
