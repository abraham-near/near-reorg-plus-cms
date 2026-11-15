import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { AnalyticsB } from "@/components/analytics/b/AnalyticsB";
import { AnalyticsSwitch } from "@/components/analytics/AnalyticsSwitch";
import { HERO } from "@/components/analytics/content";

// near.org/analytics, version B: "Instrument panel" (components/analytics/b), on v3's shell. Copy and figures: components/analytics/content.ts.
export const metadata: Metadata = {
  title: "Analytics",
  description: HERO.sub,
};

export default function AnalyticsBPage() {
  return <><BlogShell home="/home-v5"><AnalyticsB /></BlogShell><AnalyticsSwitch on="b" /></>;
}
