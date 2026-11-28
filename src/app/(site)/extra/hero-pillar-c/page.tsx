import type { Metadata } from "next";
import { V7Page } from "@/components/v7/V7Page";
import { HeroPrivate } from "@/components/hero-private/HeroPrivate";
import { PillarFx } from "@/components/hero-private/pillar-c/PillarFx";

// Hero study "Pillar C, three.js with effects": the homepage whole (as /), with HeroPrivate (components/hero-private) in place of its type-only hero. noindex (/extra).
export const metadata: Metadata = { title: "Hero · Pillar C, three.js with effects" };

export default function Page() {
  return <V7Page top="private" privHero={<HeroPrivate fig="pillar" v="c" art={<PillarFx />} />} />;
}
