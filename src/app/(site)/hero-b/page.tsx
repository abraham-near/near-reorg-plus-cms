import type { Metadata } from "next";
import { og } from "@/lib/site";
import { V7Page } from "@/components/v7/V7Page";
import { HeroScene } from "@/components/heroes3d/HeroScene";

// Hero study B, "The display case" (components/heroes3d): home v10 whole, with a three.js hero in place of its type-only one: the NEAR mark in green glass, in a glass case on a concrete plinth, lockers behind; the camera travels in, one locker light per word, the light opens on "by design".
export const metadata: Metadata = {
  title: "Hero B · The display case",
  description: "One account, any chain, private by design.",
  openGraph: og({ url: "/hero-b" }),
};

export default function HeroBPage() {
  return <V7Page top="private" stackFirst privHero={<HeroScene v="b" />} />;
}
