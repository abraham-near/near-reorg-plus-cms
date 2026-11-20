import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { AnalyticsC } from "@/components/analytics/c/AnalyticsC";
import { AnalyticsSwitch } from "@/components/analytics/AnalyticsSwitch";
import { HERO } from "@/components/analytics/content";

// near.org/analytics, version C (the menu's until Nov 19, 2026; now at /analytics-c, X is in the menu): "Ruled grid" (components/analytics/c), on v3's shell. Copy and figures: components/analytics/content.ts.
export const metadata: Metadata = {
  title: "Analytics",
  description: HERO.sub,
};

export default function AnalyticsCPage() {
  return <><BlogShell home="/"><AnalyticsC /></BlogShell><AnalyticsSwitch on="c" /></>;
}
