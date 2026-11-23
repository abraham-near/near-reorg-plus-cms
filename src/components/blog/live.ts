// The blog index versions' posts: the CMS's live PUBLIC posts (typed by their category, as /blog does), to list before data.ts's Go deeper items.
import type { Post } from "@/components/v3/blog/data";
import { cardType, postHref } from "@/lib/blog/article";
import { getLivePosts } from "@/lib/blog/posts";

/** a post as the index versions list it: data.ts's Post, plus the CMS's excerpt, publish date and tag names when it has them */
export type BlogItem = Post & { excerpt?: string | null; date?: string; tags?: string[] };

export async function livePosts(): Promise<BlogItem[]> {
  return (await getLivePosts()).map((p) => ({
    id: `cms-${p.slug}`, type: cardType(p), title: p.title, source: p.author, url: postHref(p.slug), pic: p.image?.src ?? null,
    excerpt: p.excerpt, date: p.publishedAt, tags: p.tags.map((t) => t.name),
  }));
}
