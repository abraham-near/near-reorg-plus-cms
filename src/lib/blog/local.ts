import "server-only";
// Local stand-ins for the CMS (D256). There is no Postgres on this Mac, so every CMS read throws in `next dev`. There, and only there, the blog falls
// back to what is hard-wired: /blog to the 24 newest posts (components/blog/f/posts.ts), /blog/<slug> to the 4 newest articles (./local-articles.ts).
// In production (`next build` / `next start`, Railway) the fallback is off and every read goes to the CMS as before: pushing reconnects it all.
import type { Article } from "@/components/v3/post/article";
import type { PostLayout } from "@/components/v3/post/PostSwitch";
import { BLOG_HREF, longDate, postHref } from "./article";
import { LOCAL_ARTICLES, type LocalArticle } from "./local-articles";

/** true in `next dev` only */
export const LOCAL_FALLBACK = process.env.NODE_ENV !== "production";

/** the CMS read; in dev only, the stand-in when it throws (no database). In production, exactly `read()` */
export async function orLocal<T, L>(read: () => Promise<T>, local: () => L): Promise<T | L> {
  if (!LOCAL_FALLBACK) return read();
  try { return await read(); } catch { return local(); }
}

export const localPost = (slug: string): LocalArticle | null => (LOCAL_FALLBACK && LOCAL_ARTICLES.find((a) => a.slug === slug)) || null;

/** a hard-wired article in `layout`, its "more posts" the other three (newest first), so they open locally too */
export function localArticle(p: LocalArticle, layout: PostLayout): Article {
  const more = LOCAL_ARTICLES.filter((o) => o.slug !== p.slug).slice(0, 3).map((o) => ({
    key: o.slug, title: o.article.title, href: postHref(o.slug, layout), img: o.article.hero?.src ?? null,
    label: o.article.category || "Blog", source: longDate(o.publishedAt),
  }));
  return { ...p.article, more, blogHref: BLOG_HREF };
}
