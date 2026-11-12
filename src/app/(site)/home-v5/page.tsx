import type { Metadata } from "next";
import { V5Page } from "@/components/v5/V5Page";

export const metadata: Metadata = {
  title: "Home v5",
  description: "AI is starting to act for you. NEAR keeps your assets, your data, and your intelligence in your hands.",
};

export default function HomeV5() {
  return <V5Page />;
}
