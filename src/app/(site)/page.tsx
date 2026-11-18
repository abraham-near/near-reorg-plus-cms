import type { Metadata } from "next";
import { og } from "@/lib/site";

// The site's first page is home v7 (/home-v7), the same page at both addresses: whatever changes there shows here. The index of versions moved to /index
export { default } from "./home-v7/page";

export const metadata: Metadata = {
  title: { absolute: "NEAR: Own your world" },
  description: "AI is starting to act for you. NEAR keeps your assets, your data, and your intelligence in your hands.",
  alternates: { canonical: "/" },
  openGraph: og({ title: "NEAR: Own your world", description: "AI is starting to act for you. NEAR keeps your assets, your data, and your intelligence in your hands.", url: "/" }),
};
