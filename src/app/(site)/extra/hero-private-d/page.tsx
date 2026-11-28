import type { Metadata } from "next";
import { V7Page } from "@/components/v7/V7Page";
import { HeroPrivate } from "@/components/hero-private/HeroPrivate";
import { RingGlass } from "@/components/hero-private/d/RingGlass";

// Hero study "Ring D, privacy through glass": the homepage whole (as /), with HeroPrivate (components/hero-private) in place of its type-only hero.
// ?glyph=hex (default) or ?glyph=abstract picks how the data is drawn. noindex (/extra).
export const metadata: Metadata = { title: "Hero · Ring D, privacy through glass" };

export default function Page() {
  return <V7Page top="private" privHero={<HeroPrivate fig="ring" v="d" art={<RingGlass />} />} />;
}
