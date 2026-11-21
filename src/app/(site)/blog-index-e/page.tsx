import type { Metadata } from "next";
import { connection } from "next/server";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { BlogE } from "@/components/blog/e/BlogE";
import { BlogSwitch } from "@/components/blog/BlogSwitch";
import { livePosts } from "@/components/blog/live";

// The blog index, version E: "Tabs over a grid" (components/blog/e; D221, D240–D244), frozen here when F, the same design with the CMS's 20 newest posts
// hard-coded, became /blog (D254). It reads the CMS's live PUBLIC posts on request, as /blog did, then data.ts's. No canonical: noindex.
export const instant = false;

export const metadata: Metadata = {
  title: "Blog",
  description: "Customer stories, reads and talks from across the NEAR ecosystem.",
};

export default async function BlogIndexE() {
  await connection();
  const live = await livePosts();
  return <><BlogShell home="/"><BlogE live={live} /></BlogShell><BlogSwitch on="e" /></>;
}
