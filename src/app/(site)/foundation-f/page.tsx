import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { FoundationF } from "@/components/foundation/f/FoundationF";
import { FoundationSwitch } from "@/components/foundation/FoundationSwitch";

// near.org/foundation, version F: the Figma page (2026_10_Near_Web, "Foundation / Page · HTML complete"), on v3's shell (components/foundation/f).
export const metadata: Metadata = {
  title: "NEAR Foundation: Stewarding the Open Infrastructure for the Agent Economy",
  description: "NEAR Foundation is a Swiss nonprofit supporting a decentralized ecosystem building NEAR as the open infrastructure for the agent economy.",
};

export default function FoundationFPage() {
  return <><BlogShell home="/home-v5"><FoundationF /></BlogShell><FoundationSwitch on="f" /></>;
}
