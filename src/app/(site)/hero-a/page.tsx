import type { Metadata } from "next";
import { og } from "@/lib/site";
import { V7Page } from "@/components/v7/V7Page";
import { HeroScene } from "@/components/heroes3d/HeroScene";

// Hero study A, "Light room" (components/heroes3d): home v10 whole, with a three.js hero in place of its type-only one: standing light tubes in a hazy room with a wet floor; they flicker on with the cycling words and the green one comes on with "by design".
export const metadata: Metadata = {
  title: "Hero A · Light room",
  description: "One account, any chain, private by design.",
  openGraph: og({ url: "/hero-a" }),
};

export default function HeroAPage() {
  return <V7Page top="private" stackFirst privHero={<HeroScene v="a" />} />;
}
