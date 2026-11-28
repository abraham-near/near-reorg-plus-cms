import type { Metadata } from "next";
import { V7Page } from "@/components/v7/V7Page";
import { HeroPrivate } from "@/components/hero-private/HeroPrivate";
import { RingSvg } from "@/components/hero-private/a/RingSvg";

// Hero study "Ring A, the Figma vector animated": the homepage whole (as /), with HeroPrivate (components/hero-private) in place of its type-only hero. noindex (/extra).
export const metadata: Metadata = { title: "Hero · Ring A, the Figma vector animated" };

export default function Page() {
  return <V7Page top="private" privHero={<HeroPrivate fig="ring" v="a" art={<RingSvg />} />} />;
}
