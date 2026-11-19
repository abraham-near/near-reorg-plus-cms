// The blog index versions' posts: the CMS's live PUBLIC posts (typed by their category, as /blog does), to list before data.ts's Go deeper items.
import type { Post } from "@/components/v3/blog/data";
import { postHref } from "@/lib/blog/article";
import { getLivePosts } from "@/lib/blog/posts";

/** a post as the index versions list it: data.ts's Post, plus the CMS's excerpt and publish date when it has them */
export type BlogItem = Post & { excerpt?: string | null; date?: string };

// the CMS category picks the type: Press is the stories, Watch the talks, anything else a read
const TYPE: Record<string, Post["type"]> = { press: "story", watch: "watch" };

export async function livePosts(): Promise<BlogItem[]> {
  return (await getLivePosts()).map((p) => ({
    id: `cms-${p.slug}`, type: TYPE[p.category?.slug ?? ""] ?? "read", title: p.title, source: p.author ?? "NEAR blog", url: postHref(p.slug), pic: p.image?.src ?? null,
    excerpt: p.excerpt, date: p.publishedAt,
  }));
}
