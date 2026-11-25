import type { Metadata } from "next";
import { connection } from "next/server";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { BlogJ } from "@/components/v3/blog/j/BlogJ";
import { livePosts } from "@/components/blog/live";

// The blog index, version A: direction J (Reading rail, open; components/v3/blog/j). It was /blog until Lawrence chose E (D221); kept here as an
// exploration, listed at /extra. The CMS's live PUBLIC posts come first, then data.ts's. Rendered on request, as /blog is. No canonical: noindex.
export const instant = false;

export const metadata: Metadata = {
  title: "Blog",
  description: "Customer stories, reads and talks from across the NEAR ecosystem.",
};

export default async function BlogIndexA() {
  await connection();
  const live = await livePosts();
  return <BlogShell home="/"><BlogJ live={live} /></BlogShell>;
}
