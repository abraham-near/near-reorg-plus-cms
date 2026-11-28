import type { Metadata } from "next";
import { V7Page } from "@/components/v7/V7Page";
import { HeroPrivate } from "@/components/hero-private/HeroPrivate";
import { RingGl } from "@/components/hero-private/b/RingGl";

// Hero study "Ring B, three.js": the homepage whole (as /), with HeroPrivate (components/hero-private) in place of its type-only hero. noindex (/extra).
export const metadata: Metadata = { title: "Hero · Ring B, three.js" };

export default function Page() {
  return <V7Page top="private" privHero={<HeroPrivate fig="ring" v="b" art={<RingGl />} />} />;
}
