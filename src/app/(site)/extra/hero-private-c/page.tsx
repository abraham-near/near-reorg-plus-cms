import type { Metadata } from "next";
import { V7Page } from "@/components/v7/V7Page";
import { HeroPrivate } from "@/components/hero-private/HeroPrivate";
import { RingFx } from "@/components/hero-private/c/RingFx";

// Hero study "Ring C, three.js with effects": the homepage whole (as /), with HeroPrivate (components/hero-private) in place of its type-only hero. noindex (/extra).
export const metadata: Metadata = { title: "Hero · Ring C, three.js with effects" };

export default function Page() {
  return <V7Page top="private" privHero={<HeroPrivate fig="ring" v="c" art={<RingFx />} />} />;
}
