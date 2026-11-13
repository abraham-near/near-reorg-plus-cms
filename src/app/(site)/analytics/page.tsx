import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { AnalyticsA } from "@/components/analytics/a/AnalyticsA";
import { AnalyticsSwitch } from "@/components/analytics/AnalyticsSwitch";
import { HERO } from "@/components/analytics/content";

// near.org/analytics, version A · Overview: the doc's lean page on the homepage's ruled grid, in Blog J's hand (components/analytics/a).
export const metadata: Metadata = {
  title: "Analytics",
  description: HERO.sub,
};

export default function AnalyticsPage() {
  return <><BlogShell home="/home-v5"><AnalyticsA /></BlogShell><AnalyticsSwitch on="a" /></>;
}
