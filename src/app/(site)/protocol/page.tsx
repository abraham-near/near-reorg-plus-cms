import type { Metadata } from "next";
import { og } from "@/lib/site";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { ProtocolB } from "@/components/protocol/b/ProtocolB";
import { CLOSE, META } from "@/components/protocol/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/protocol, version B: "The network lives" (components/protocol/b), the one in the menu (/protocol-b redirects here): the doc's page told through one live
// picture of the network (shards as lanes, 600 ms chunks, 1.2 s finality), on v3's shell, closing with the homepage's scene. Copy: components/protocol/content.ts.
export const metadata: Metadata = {
  title: META.title,
  description: META.description,
  alternates: { canonical: "/protocol" },
  openGraph: og({ url: "/protocol" }),
};

export default function ProtocolPage() {
  return <BlogShell home="/"><ProtocolB /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} ruled /></BlogShell>;
}
