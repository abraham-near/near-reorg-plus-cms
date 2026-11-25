import type { Metadata } from "next";
import { connection } from "next/server";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { BlogB } from "@/components/blog/b/BlogB";
import { livePosts } from "@/components/blog/live";

// The blog index, version B (an exploration, listed at /extra): the Figma frame 980:723, "News and deep dives" (components/blog/b), on v3's shell.
// The CMS's live posts come first, then data.ts's. Rendered on request (the database is not reachable at build), as /blog is. No canonical: noindex.
export const instant = false;

export const metadata: Metadata = {
  title: "Blog",
  description: "Customer stories, reads and talks from across the NEAR ecosystem.",
};

export default async function BlogIndexB() {
  await connection();
  const live = await livePosts();
  return <BlogShell home="/"><BlogB live={live} /></BlogShell>;
}
