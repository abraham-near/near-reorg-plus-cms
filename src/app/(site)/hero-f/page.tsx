import type { Metadata } from "next";
import { og } from "@/lib/site";
import { V7Page } from "@/components/v7/V7Page";
import { HeroScene } from "@/components/heroes3d/HeroScene";

// Hero study F, "Prism" (components/heroes3d, second round): home v10 whole, with a pinned three.js hero in place of its type-only one: a beam split by the NEAR mark in clear glass into a fan of rays; scrolling rises over it as the Stack's rings open round it.
export const metadata: Metadata = {
  title: "Hero F · Prism",
  description: "One account, any chain, private by design.",
  openGraph: og({ url: "/hero-f" }),
};

export default function HeroFPage() {
  return <V7Page top="private" stackFirst privHero={<HeroScene v="f" />} />;
}
