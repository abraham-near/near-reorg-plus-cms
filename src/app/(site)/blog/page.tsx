import type { Metadata } from "next";
import { connection } from "next/server";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { BlogJ } from "@/components/v3/blog/j/BlogJ";
import type { Post } from "@/components/v3/blog/data";
import { postHref } from "@/lib/blog/article";
import { getLivePosts } from "@/lib/blog/posts";

// The blog index: direction J (Reading rail, open; components/v3/blog/j), the one chosen. The CMS's live PUBLIC posts come first (typed by their category), each with its
// own photo and its page (/blog/[slug]); then the Go deeper reads, stories and talks (components/v3/blog/data.ts).
// Rendered on request (the database is not reachable at build), the read cached by the CMS's tags (lib/blog/posts.ts).
export const instant = false;

// the CMS category picks the index's type: Press is the stories, Watch the talks, anything else Blog
const TYPE: Record<string, Post["type"]> = { press: "story", watch: "watch" };

export const metadata: Metadata = {
  title: "Blog",
  description: "Customer stories, reads and talks from across the NEAR ecosystem.",
};

export default async function BlogIndex() {
  await connection();
  const live: Post[] = (await getLivePosts()).map((p) => ({
    id: `cms-${p.slug}`, type: TYPE[p.category?.slug ?? ""] ?? "read", title: p.title, source: p.author ?? "NEAR blog", url: postHref(p.slug), pic: p.image?.src ?? null,
  }));
  return <BlogShell home="/home-v5"><BlogJ live={live} /></BlogShell>;
}
