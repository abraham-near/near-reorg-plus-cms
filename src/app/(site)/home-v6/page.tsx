import type { Metadata } from "next";
import { V6Page } from "@/components/v6/V6Page";

export const metadata: Metadata = {
  title: "Home v6",
  description: "AI is starting to act for you. NEAR keeps your assets, your data, and your intelligence in your hands.",
};

// The hero hands over to the intro with transition B, "Into the grid" (D112; the studies are on /home-v6/transitions)
const TX_IN_USE = "b" as const;

export default function HomeV6() {
  return <V6Page tx={TX_IN_USE} />;
}
