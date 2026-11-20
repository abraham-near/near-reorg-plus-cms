import type { Metadata } from "next";
import { og } from "@/lib/site";
import { connection } from "next/server";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { BlogE } from "@/components/blog/e/BlogE";
import { livePosts } from "@/components/blog/live";

// The blog index: version E, "Tabs over a grid" (components/blog/e), the one Lawrence chose (D221). Direction J, the previous /blog, is at /blog-index-a.
// The CMS's live PUBLIC posts come first (typed by their category), each with its own photo and its page (/blog/[slug]); then the Go deeper reads,
// stories and talks (components/v3/blog/data.ts). Rendered on request (the database is not reachable at build), the read cached by the CMS's tags.
export const instant = false;

export const metadata: Metadata = {
  title: "Blog",
  description: "Customer stories, reads and talks from across the NEAR ecosystem.",
  alternates: { canonical: "/blog" },
  openGraph: og({ url: "/blog" }),
};

export default async function BlogIndex() {
  await connection();
  const live = await livePosts();
  return <BlogShell home="/"><BlogE live={live} /></BlogShell>;
}
