import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { AnalyticsX } from "@/components/analytics/x/AnalyticsX";
import { AnalyticsSwitch } from "@/components/analytics/AnalyticsSwitch";
import { HERO } from "@/components/analytics/content";

// near.org/analytics, version X: "MVP", D simplified after the Nov 19 review (components/analytics/x), on v3's shell. Copy and figures: components/analytics/content.ts.
export const metadata: Metadata = {
  title: "Analytics",
  description: HERO.sub,
};

export default function AnalyticsXPage() {
  return <><BlogShell home="/"><AnalyticsX /></BlogShell><AnalyticsSwitch on="x" /></>;
}
