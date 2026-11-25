import type { Metadata } from "next";
import { og } from "@/lib/site";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { ProtocolD } from "@/components/protocol/d/ProtocolD";
import { CLOSE, META } from "@/components/protocol/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/protocol, version D: "The graphic transforms" (components/protocol/d), an exploration (listed at /extra): B's layout with every picture
// its own idea and none needing a word: convergence in the hero, one isometric model that transforms through the dark chapter as it is scrolled,
// deploy-once for Speed, a seal that becomes each chain's own block for Chain Signatures. On v3's shell, closing with the homepage's scene.
// Copy: components/protocol/content.ts.
export const metadata: Metadata = {
  title: META.title,
  description: META.description,
  openGraph: og({ url: "/protocol-d" }),
};

export default function ProtocolDPage() {
  return <BlogShell home="/"><ProtocolD /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} ruled /></BlogShell>;
}
