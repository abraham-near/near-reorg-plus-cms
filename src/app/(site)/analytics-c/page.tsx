import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { AnalyticsC } from "@/components/analytics/c/AnalyticsC";
import { AnalyticsSwitch } from "@/components/analytics/AnalyticsSwitch";
import { HERO } from "@/components/analytics/content";

// near.org/analytics, version C, "Living network": the doc's lean overview with the iso hand, a living hero and the core stats as a scroll story
// (components/analytics/c), on v3's shell.
export const metadata: Metadata = {
  title: "Analytics",
  description: HERO.sub,
};

export default function AnalyticsCPage() {
  return <><BlogShell home="/home-v5"><AnalyticsC /></BlogShell><AnalyticsSwitch on="c" /></>;
}
