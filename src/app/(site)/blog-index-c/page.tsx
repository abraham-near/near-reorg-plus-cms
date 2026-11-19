import type { Metadata } from "next";
import { connection } from "next/server";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { BlogC } from "@/components/blog/c/BlogC";
import { BlogSwitch } from "@/components/blog/BlogSwitch";
import { livePosts } from "@/components/blog/live";

// The blog index, version C: "Figma on the homepage grid" (components/blog/c), on v3's shell. An exploration (listed at /extra), so no canonical.
// The CMS's live public posts come first, then the Go deeper items; rendered on request (the database is not reachable at build).
export const instant = false;

export const metadata: Metadata = {
  title: "Blog",
  description: "Customer stories, reads and talks from across the NEAR ecosystem.",
};

export default async function BlogIndexC() {
  await connection();
  const live = await livePosts();
  return <><BlogShell home="/"><BlogC live={live} /></BlogShell><BlogSwitch on="c" /></>;
}
