import type { Metadata } from "next";
import { og } from "@/lib/site";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { ProtocolA } from "@/components/protocol/a/ProtocolA";
import { CLOSE, META } from "@/components/protocol/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/protocol, version A: "The stack builds" (components/protocol/a). An exploration for /extra: the hero's drawing builds and, pinned, plays
// Built for AI scale; the rest on the homepage's ruled grid, closing with the homepage's scene. Copy: components/protocol/content.ts.
export const metadata: Metadata = {
  title: "Protocol",
  description: META.description,
  openGraph: og({ url: "/protocol-a" }),
};

export default function ProtocolAPage() {
  return <BlogShell home="/"><ProtocolA /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} ruled /></BlogShell>;
}
