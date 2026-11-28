import type { Metadata } from "next";
import { V7Page } from "@/components/v7/V7Page";
import { HeroPrivate } from "@/components/hero-private/HeroPrivate";
import { StackGlass } from "@/components/hero-private/stack-d/StackGlass";

// Hero study "Stack D, privacy through glass": the homepage whole (as /), with HeroPrivate (components/hero-private) in place of its type-only hero.
// The stack drawing (Figma 1123:6508): data enters as lines at the bottom and frosts plate by plate into a green glow. noindex (/extra).
export const metadata: Metadata = { title: "Hero · Stack D" };

export default function Page() {
  return <V7Page top="private" privHero={<HeroPrivate fig="stack" v="d" art={<StackGlass />} />} />;
}
