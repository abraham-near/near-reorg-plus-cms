import type { Metadata } from "next";
import { V7Page } from "@/components/v7/V7Page";
import { HeroPrivate } from "@/components/hero-private/HeroPrivate";
import { BoxGlass } from "@/components/hero-private/box-d/BoxGlass";

// Hero study "Box D, privacy through glass": the homepage whole (as /), with HeroPrivate (components/hero-private) in place of its type-only hero:
// the exploded glass box (Figma node 1120:8316) as a vault, its data ASCII (legible outside, soft behind the glass, a glow in the core). noindex (/extra).
export const metadata: Metadata = { title: "Hero · Box D" };

export default function Page() {
  return <V7Page top="private" privHero={<HeroPrivate fig="box" v="d" art={<BoxGlass />} />} />;
}
