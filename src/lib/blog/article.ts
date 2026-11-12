// A live CMS post as the post layouts' Article (components/v3/post/article.ts), and the helpers the blog's pages share (dates, sharing fallbacks).
import type { Article, MorePost } from "@/components/v3/post/article";
import type { LivePost, PostCard } from "./posts";

export const BLOG_HREF = "/blog";
/** the layout a post opens in without ?layout= (B, Cover); the others are ?layout=a / ?layout=c */
export const DEFAULT_LAYOUT = "b";
export const postHref = (slug: string, layout = DEFAULT_LAYOUT) => `${BLOG_HREF}/${slug}${layout === DEFAULT_LAYOUT ? "" : `?layout=${layout}`}`;

/** "November 12, 2026" (UTC, so server and browser agree) */
export const longDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "N";

/** what a share card shows: metaTitle → title, metaDescription → excerpt → the body's opening, metaImage → featuredImage */
export const shareOf = (p: LivePost) => ({
  title: p.metaTitle || p.title,
  description: p.metaDescription || p.excerpt || p.summary,
  image: p.metaImage || p.image?.src || null,
});

/** a post card as the layouts' "more posts"; `layout` keeps the reader in the layout they are comparing */
export const toMore = (p: PostCard, layout = DEFAULT_LAYOUT): MorePost => ({
  key: p.slug, title: p.title, href: postHref(p.slug, layout), img: p.image?.src ?? null,
  label: p.category?.name ?? "Blog", source: longDate(p.publishedAt),
});

export function toArticle(p: LivePost, more: PostCard[], layout = DEFAULT_LAYOUT): Article {
  const author = p.author || "NEAR";
  return {
    category: p.category?.name ?? "",
    type: "",
    title: p.title,
    dek: p.excerpt ?? "",
    author: { name: author, role: "", initials: initials(author), bio: "" },
    date: longDate(p.publishedAt),
    dateIso: p.publishedAt.slice(0, 10),
    tags: p.tags.map((t) => ({ name: t.name, href: "" })),
    hero: p.image ? { src: p.image.src, alt: p.image.alt, w: p.image.w ?? undefined, h: p.image.h ?? undefined } : null,
    takeaways: [],
    body: { html: p.html },
    sections: p.sections,
    readMin: p.readMin,
    more: more.map((m) => toMore(m, layout)),
    blogHref: BLOG_HREF,
  };
}
