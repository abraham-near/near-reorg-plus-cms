import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { FoundationB } from "@/components/foundation/b/FoundationB";
import { FoundationSwitch } from "@/components/foundation/FoundationSwitch";

// near.org/foundation, version B ("Devolve"): home v4's design told through its isometric drawings; copy: near.org-airnauts (3), October 2026.
export const metadata: Metadata = {
  title: "NEAR Foundation: Stewarding the Open Infrastructure for the Agent Economy",
  description: "NEAR Foundation is a Swiss nonprofit supporting a decentralized ecosystem building NEAR as the open infrastructure for the agent economy.",
};

export default function FoundationBPage() {
  return <><BlogShell home="/home-v4"><FoundationB /></BlogShell><FoundationSwitch on="b" /></>;
}
