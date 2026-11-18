import type { Metadata } from "next";
import { og } from "@/lib/site";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { FoundationE } from "@/components/foundation/e/FoundationE";

// near.org/foundation: the Foundation page (Foundation E with F's pillars and Council; the other versions were removed). components/foundation/e.
export const metadata: Metadata = {
  title: "NEAR Foundation: Stewarding the Open Infrastructure for the Agent Economy",
  description: "NEAR Foundation is a Swiss nonprofit supporting a decentralized ecosystem building NEAR as the open infrastructure for the agent economy.",
  alternates: { canonical: "/near-foundation" },
  openGraph: og({ url: "/near-foundation" }),
};

export default function FoundationEPage() {
  return <BlogShell home="/"><FoundationE /></BlogShell>;
}
