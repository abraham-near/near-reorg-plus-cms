import type { Metadata } from "next";
import { V7Page } from "@/components/v7/V7Page";
import { HeroPrivate } from "@/components/hero-private/HeroPrivate";
import { PillarSvg } from "@/components/hero-private/pillar-a/PillarSvg";

// Hero study "Pillar A, the Figma vector animated": the homepage whole (as /), with HeroPrivate (components/hero-private) in place of its type-only hero. noindex (/extra).
export const metadata: Metadata = { title: "Hero · Pillar A, the Figma vector animated" };

export default function Page() {
  return <V7Page top="private" privHero={<HeroPrivate fig="pillar" v="a" art={<PillarSvg />} />} />;
}
