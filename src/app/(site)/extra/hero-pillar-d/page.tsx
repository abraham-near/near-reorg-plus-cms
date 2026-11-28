import type { Metadata } from "next";
import { V7Page } from "@/components/v7/V7Page";
import { HeroPrivate } from "@/components/hero-private/HeroPrivate";
import { PillarGlass } from "@/components/hero-private/pillar-d/PillarGlass";

// Hero study "Pillar D, privacy through glass": the homepage whole (as /), with HeroPrivate (components/hero-private) in place of its type-only hero.
// `?glyph=hex|abstract` picks the data's glyphs (abstract by default). noindex (/extra).
export const metadata: Metadata = { title: "Hero · Pillar D, privacy through glass" };

export default function Page() {
  return <V7Page top="private" privHero={<HeroPrivate fig="pillar" v="d" art={<PillarGlass />} />} />;
}
