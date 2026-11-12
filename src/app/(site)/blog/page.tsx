import type { Metadata } from "next";
import { connection } from "next/server";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { BlogLive } from "@/components/v3/blog/live/BlogLive";
import { getLivePosts } from "@/lib/blog/posts";

// The blog's posts from the CMS (live and PUBLIC, newest first) in Blog A's grid: a modest list while the index directions are designed (/blog-a…).
// Rendered on request (the database is not reachable at build), the read cached by the CMS's tags (lib/blog/posts.ts).
export const instant = false;

export const metadata: Metadata = {
  title: "Blog",
  description: "Posts from the NEAR team.",
};

export default async function BlogIndex() {
  await connection();
  const posts = await getLivePosts();
  return <BlogShell home="/home-v4"><BlogLive posts={posts} /></BlogShell>;
}
