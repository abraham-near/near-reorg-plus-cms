import type { Metadata } from "next";
import { V7Page } from "@/components/v7/V7Page";

export const metadata: Metadata = {
  title: "Home v7",
  description: "AI is starting to act for you. NEAR keeps your assets, your data, and your intelligence in your hands.",
};

// Home v7 = home v6 at 5316b50, where the next changes go (D153). The hero hands over to the intro with transition I (D121) and the intro is layout G
// (D147), as on v6; their studies stay on /home-v6/transitions and /home-v6/intro
const TX_IN_USE = "i" as const;
const ST_IN_USE = "g" as const;

export default function HomeV7() {
  return <V7Page tx={TX_IN_USE} st={ST_IN_USE} />;
}
