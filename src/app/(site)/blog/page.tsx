import type { Metadata } from "next";
import { og } from "@/lib/site";
import { connection } from "next/server";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { BlogF } from "@/components/blog/f/BlogF";
import { CMS_POSTS } from "@/components/blog/f/posts";
import { livePosts } from "@/components/blog/live";
import { orLocal } from "@/lib/blog/local";

// The blog index: version F (components/blog/f; D254, D255), version E's "Tabs over a grid" (D221) with the CMS's 24 newest live PUBLIC posts
// hard-coded (components/blog/f/posts.ts, pulled 2026-11-20), then the Go deeper samples (components/v3/blog/data.ts) so Press and Watch show.
// The hard-coded 24 are a stand-in for `next dev` with no database (lib/blog/local.ts, D256): the page reads the CMS's live PUBLIC posts first, and
// in production always uses them, as E did. Rendered on request (the database is not reachable at build). E is at /blog-index-e; direction J at
// /blog-index-a.
export const instant = false;

export const metadata: Metadata = {
  title: "Blog",
  description: "Customer stories, reads and talks from across the NEAR ecosystem.",
  alternates: { canonical: "/blog" },
  openGraph: og({ url: "/blog" }),
};

export default async function BlogIndex() {
  await connection();
  const posts = await orLocal(livePosts, () => CMS_POSTS);
  return <BlogShell home="/"><BlogF posts={posts} /></BlogShell>;
}
