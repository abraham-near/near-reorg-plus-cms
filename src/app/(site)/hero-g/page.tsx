import type { Metadata } from "next";
import { og } from "@/lib/site";
import { V7Page } from "@/components/v7/V7Page";
import { HeroScene } from "@/components/heroes3d/HeroScene";

// Hero study G, "Liquid metal" (components/heroes3d, third round): home v10 whole, with a pinned three.js hero in place of its type-only one.
export const metadata: Metadata = {
  title: "Hero G · Liquid metal",
  description: "One account, any chain, private by design.",
  openGraph: og({ url: "/hero-g" }),
};

export default function HeroGPage() {
  return <V7Page top="private" stackFirst privHero={<HeroScene v="g" />} />;
}
