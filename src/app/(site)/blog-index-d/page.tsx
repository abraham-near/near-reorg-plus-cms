import type { Metadata } from "next";
import { connection } from "next/server";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { BlogD } from "@/components/blog/d/BlogD";
import { livePosts } from "@/components/blog/live";

// The blog index, version D: "Lead card + type menu", from Figma 2026_10_Near_Web node 756:41 (components/blog/d). An exploration listed at /extra.
// The CMS's live PUBLIC posts come first, then data.ts's Go deeper items. Rendered on request (the database is not reachable at build), as /blog is.
export const instant = false;

export const metadata: Metadata = {
  title: "Blog",
  description: "Customer stories, reads and talks from across the NEAR ecosystem.",
};

export default async function BlogIndexD() {
  await connection();
  const live = await livePosts();
  return <BlogShell home="/"><BlogD live={live} /></BlogShell>;
}
