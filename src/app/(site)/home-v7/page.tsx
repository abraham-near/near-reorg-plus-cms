import type { Metadata } from "next";
import { V7Page } from "@/components/v7/V7Page";

export const metadata: Metadata = {
  title: "Home v7",
  description: "AI is starting to act for you. NEAR keeps your assets, your data, and your intelligence in your hands.",
};

// Home v7 = home v6 at 5316b50, where the next changes go (D153). The hero hands over to the intro with transition I (D121) and the intro is layout G
// (D147), as on v6; their studies stay on /home-v6/transitions and /home-v6/intro. The hero is "Stark tower" as a still under "Finance and AI, private by
// default", a placeholder until its motion is made (D178); before it, G1's time-lapse film under its traced layer (D167, still in ./g1).
// Branch NEAR-is-private-CYCLE (D200): the hero and the intro are one type-only section, "NEAR is private" and a cycling word (components/v7/private).
// Branch NEAR-is-privacy-HEADLINE (D202): the same section with one still headline, "NEAR is privacy for onchain capital and the agent economy."

export default function HomeV7() {
  return <V7Page top="privacy" />;
}
