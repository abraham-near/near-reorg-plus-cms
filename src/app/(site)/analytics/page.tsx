import type { Metadata } from "next";
import { og } from "@/lib/site";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { AnalyticsX } from "@/components/analytics/x/AnalyticsX";
import { AnalyticsSwitch } from "@/components/analytics/AnalyticsSwitch";
import { HERO } from "@/components/analytics/content";

// near.org/analytics, version X: "MVP", the one in the menu (/analytics-x redirects here), D simplified after the Nov 19 review (components/analytics/x), on v3's shell. Copy and figures: components/analytics/content.ts.
export const metadata: Metadata = {
  title: "Analytics",
  description: HERO.sub,
  alternates: { canonical: "/analytics" },
  openGraph: og({ url: "/analytics" }),
};

export default function AnalyticsPage() {
  return <><BlogShell home="/"><AnalyticsX /></BlogShell><AnalyticsSwitch on="x" /></>;
}
