import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { AnalyticsD } from "@/components/analytics/d/AnalyticsD";
import { AnalyticsSwitch } from "@/components/analytics/AnalyticsSwitch";
import { HERO } from "@/components/analytics/content";

// near.org/analytics, version D: "Drawn" (components/analytics/d), on v3's shell. Copy and figures: components/analytics/content.ts.
export const metadata: Metadata = {
  title: "Analytics",
  description: HERO.sub,
};

export default function AnalyticsDPage() {
  return <><BlogShell home="/"><AnalyticsD /></BlogShell><AnalyticsSwitch on="d" /></>;
}
