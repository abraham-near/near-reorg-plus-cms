import type { Metadata } from "next";
import { V4Page } from "@/components/v4/V4Page";

export const metadata: Metadata = {
  title: "Home v4",
  description: "AI is starting to act for you. NEAR keeps your assets, your data, and your intelligence in your hands.",
};

/** the revenue band's first option; /home-v4/a…d show each (./[rev]) */
export default function HomeV4() {
  return <V4Page rev="a" />;
}
