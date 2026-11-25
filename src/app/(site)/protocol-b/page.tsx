import type { Metadata } from "next";
import { og } from "@/lib/site";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { ProtocolB } from "@/components/protocol/b/ProtocolB";
import { CLOSE, META } from "@/components/protocol/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/protocol, version B: "The network lives" (components/protocol/b), an exploration (listed at /extra; the menu's /protocol until Nov 25, 2026):
// the doc's page told through one live picture of the network (shards as lanes, 600 ms chunks, 1.2 s finality), on v3's shell, closing with the
// homepage's scene. Its chapter, Speed and the lower sections are also the final page's (components/protocol/b/parts.tsx). Copy:
// components/protocol/content.ts.
export const metadata: Metadata = {
  title: "Protocol",
  description: META.description,
  openGraph: og({ url: "/protocol-b" }),
};

export default function ProtocolBPage() {
  return <BlogShell home="/"><ProtocolB /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} ruled /></BlogShell>;
}
