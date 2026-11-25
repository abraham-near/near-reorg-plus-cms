import type { Metadata } from "next";
import { og } from "@/lib/site";
import { V7Page } from "@/components/v7/V7Page";
import { HeroScene } from "@/components/heroes3d/HeroScene";

// Hero study C, "The layered N" (components/heroes3d): home v10 whole, with a three.js hero in place of its type-only one: on the paper, isometric: the mark as stacked steel plates on a plate of green glass; a green beam through a layer per word, resting on the floor on "by design"; scrolling lifts the layers apart.
export const metadata: Metadata = {
  title: "Hero C · The layered N",
  description: "One account, any chain, private by design.",
  openGraph: og({ url: "/hero-c" }),
};

export default function HeroCPage() {
  return <V7Page top="private" stackFirst privHero={<HeroScene v="c" />} />;
}
