import type { Metadata } from "next";
import { og } from "@/lib/site";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { AnalyticsC } from "@/components/analytics/c/AnalyticsC";
import { AnalyticsSwitch } from "@/components/analytics/AnalyticsSwitch";
import { HERO } from "@/components/analytics/content";

// near.org/analytics, version C: "Ruled grid" (components/analytics/c), on v3's shell. Copy and figures: components/analytics/content.ts.
export const metadata: Metadata = {
  title: "Analytics",
  description: HERO.sub,
  alternates: { canonical: "/analytics" },
  openGraph: og({ url: "/analytics" }),
};

export default function AnalyticsPage() {
  return <><BlogShell home="/"><AnalyticsC /></BlogShell><AnalyticsSwitch on="c" /></>;
}
