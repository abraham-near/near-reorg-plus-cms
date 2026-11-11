import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { FoundationD } from "@/components/foundation/d/FoundationD";
import { FoundationSwitch } from "@/components/foundation/FoundationSwitch";

// near.org/foundation, version D ("People around the world": the network, light and open), in home v4's design (v3's header and footer);
// copy: near.org-airnauts (3), October 2026.
export const metadata: Metadata = {
  title: "NEAR Foundation: Stewarding the Open Infrastructure for the Agent Economy",
  description: "NEAR Foundation is a Swiss nonprofit supporting a decentralized ecosystem building NEAR as the open infrastructure for the agent economy.",
};

export default function FoundationDPage() {
  return <><BlogShell home="/home-v4"><FoundationD /></BlogShell><FoundationSwitch on="d" /></>;
}
