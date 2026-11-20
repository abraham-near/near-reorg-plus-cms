import type { Metadata } from "next";
import { og } from "@/lib/site";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { ProtocolC } from "@/components/protocol/c/ProtocolC";
import { ProtocolSwitch } from "@/components/protocol/ProtocolSwitch";
import { CLOSE, META } from "@/components/protocol/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/protocol, version C: "Lateral chapter" (components/protocol/c), an exploration (listed at /extra): B's layout with a drawing of its own for
// each idea and no words inside the drawings, the hero as the network in dots, the dark chapter read sideways; on v3's shell, closing with the homepage's
// scene. Copy: components/protocol/content.ts.
export const metadata: Metadata = {
  title: META.title,
  description: META.description,
  openGraph: og({ url: "/protocol-c" }),
};

export default function ProtocolCPage() {
  return <><BlogShell home="/"><ProtocolC /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} ruled /></BlogShell><ProtocolSwitch on="c" /></>;
}
