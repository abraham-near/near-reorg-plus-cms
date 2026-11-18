import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { AnalyticsE } from "@/components/analytics/e/AnalyticsE";
import { AnalyticsSwitch } from "@/components/analytics/AnalyticsSwitch";
import { HERO } from "@/components/analytics/content";

// near.org/analytics, version E: "Editorial" (components/analytics/e), on v3's shell. Copy and figures: components/analytics/content.ts.
export const metadata: Metadata = {
  title: "Analytics",
  description: HERO.sub,
};

export default function AnalyticsEPage() {
  return <><BlogShell home="/"><AnalyticsE /></BlogShell><AnalyticsSwitch on="e" /></>;
}
