import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { FoundationE } from "@/components/foundation/e/FoundationE";
import { FoundationSwitch } from "@/components/foundation/FoundationSwitch";

// near.org/foundation, version E: version B's page with C's columns in a quick, living hero, the pillars on the ruled grid, and C's shrinking
// statement on two lines (components/foundation/e).
export const metadata: Metadata = {
  title: "NEAR Foundation: Stewarding the Open Infrastructure for the Agent Economy",
  description: "NEAR Foundation is a Swiss nonprofit supporting a decentralized ecosystem building NEAR as the open infrastructure for the agent economy.",
};

export default function FoundationEPage() {
  return <><BlogShell home="/home-v5"><FoundationE /></BlogShell><FoundationSwitch on="e" /></>;
}
