import type { Metadata } from "next";
import { V6Page } from "@/components/v6/V6Page";

export const metadata: Metadata = {
  title: "Home v6",
  description: "AI is starting to act for you. NEAR keeps your assets, your data, and your intelligence in your hands.",
};

// The hero hands over to the intro with transition I, "Into the grid · depth" (D121, built on B: D112; the studies are on /home-v6/transitions)
const TX_IN_USE = "i" as const;
// The intro's layout: H, "Headline and deck" (D146, chosen from the studies on /home-v6/intro; styles in components/v6/intro/intro.css)
const ST_IN_USE = "h" as const;

export default function HomeV6() {
  return <V6Page tx={TX_IN_USE} st={ST_IN_USE} />;
}
