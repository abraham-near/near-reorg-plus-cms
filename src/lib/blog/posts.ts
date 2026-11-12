import "server-only";
// The public blog's reads from the CMS tables, by the contract in src/cms/README.md: a post is live when it is PUBLISHED and its publishedAt has come
// (none counts as now, as the CMS's own isLive); PUBLIC posts are listed, UNLISTED ones are reached by their URL only.
// Every read is cached ("use cache") under the tags the CMS expires on each write (src/cms/lib/cache-tags.ts), so an edit, a publish or a category rename
// shows on the next request. A scheduled post goes live with nothing running at that moment: a read that knows of one keeps its entry only until then.
import { cacheLife, cacheTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { imageUrls, prepareBody, type MediaInfo, type Section } from "./html";

// the CMS's tag strings (the site does not import its file)
const TAG = { posts: "cms:posts", post: (slug: string) => `cms:post:${slug}`, categories: "cms:categories" };

export type Pic = { src: string; w: number | null; h: number | null; alt: string };
export type Term = { name: string; slug: string };
export type PostCard = { slug: string; title: string; excerpt: string | null; image: Pic | null; publishedAt: string; author: string | null; category: Term | null };
export type LivePost = PostCard & {
  visibility: "PUBLIC" | "UNLISTED";
  updatedAt: string;
  metaTitle: string | null; metaDescription: string | null; metaImage: string | null;
  categories: Term[]; tags: Term[];
  html: string; sections: Section[]; readMin: number; summary: string;
};

const liveWhere = (now: Date): Prisma.PostWhereInput => ({ status: "PUBLISHED", OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] });

/** an hour (the CMS expires the tags on every write; this only bounds what no tag covers, like an author's name), or until `next` if that is sooner */
function lifeUntil(next: Date | null | undefined) {
  const s = next ? Math.ceil((next.getTime() - Date.now()) / 1000) : Infinity;
  if (s >= 3600) cacheLife("hours");
  else { const r = Math.max(1, s); cacheLife({ stale: Math.min(300, r), revalidate: r, expire: r + 1 }); }
}

async function mediaFor(urls: string[]): Promise<Record<string, MediaInfo>> {
  const list = [...new Set(urls.filter((u) => u.startsWith("/cms/")))];
  if (!list.length) return {};
  const rows = await db.media.findMany({ where: { url: { in: list } }, select: { url: true, width: true, height: true, alt: true } });
  return Object.fromEntries(rows.map((m) => [m.url, { w: m.width, h: m.height, alt: m.alt }]));
}

const pic = (src: string | null, media: Record<string, MediaInfo>): Pic | null => {
  if (!src || !((src.startsWith("/") && !src.startsWith("//")) || /^https?:\/\//.test(src))) return null;
  const m = media[src];
  return { src, w: m?.w ?? null, h: m?.h ?? null, alt: m?.alt ?? "" };
};

const cardSelect = {
  slug: true, title: true, excerpt: true, featuredImage: true, publishedAt: true, createdAt: true,
  author: { select: { name: true } },
  categories: { orderBy: { position: "asc" }, select: { category: { select: { name: true, slug: true } } } },
} satisfies Prisma.PostSelect;

type CardRow = Prisma.PostGetPayload<{ select: typeof cardSelect }>;
const toCard = (p: CardRow, media: Record<string, MediaInfo>): PostCard => ({
  slug: p.slug, title: p.title, excerpt: p.excerpt, image: pic(p.featuredImage, media),
  publishedAt: (p.publishedAt ?? p.createdAt).toISOString(), author: p.author?.name ?? null, category: p.categories[0]?.category ?? null,
});

/** live PUBLIC posts, newest first (the index and every post's "more posts") */
export async function getLivePosts(): Promise<PostCard[]> {
  "use cache";
  cacheTag(TAG.posts, TAG.categories);
  const now = new Date();
  const [rows, next] = await Promise.all([
    db.post.findMany({ where: { ...liveWhere(now), visibility: "PUBLIC" }, orderBy: [{ publishedAt: "desc" }, { id: "asc" }], take: 200, select: cardSelect }),
    db.post.findFirst({ where: { status: "PUBLISHED", visibility: "PUBLIC", publishedAt: { gt: now } }, orderBy: { publishedAt: "asc" }, select: { publishedAt: true } }),
  ]);
  lifeUntil(next?.publishedAt);
  const media = await mediaFor(rows.flatMap((r) => (r.featuredImage ? [r.featuredImage] : [])));
  return rows.map((r) => toCard(r, media));
}

/** one live post (PUBLIC or UNLISTED) by its slug, its body ready for the layouts; null when there is none (or not yet) */
export async function getLivePost(slug: string): Promise<LivePost | null> {
  "use cache";
  cacheTag(TAG.post(slug), TAG.categories);
  const now = new Date();
  const p = await db.post.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      ...cardSelect, body: true, visibility: true, updatedAt: true, metaTitle: true, metaDescription: true, metaImage: true,
      tags: { orderBy: { name: "asc" }, select: { name: true, slug: true } },
    },
  });
  // scheduled: not there yet, and the entry lasts only until it is
  if (!p || (p.publishedAt && p.publishedAt > now)) { lifeUntil(p?.publishedAt); return null; }
  lifeUntil(null);
  const media = await mediaFor([...imageUrls(p.body), ...(p.featuredImage ? [p.featuredImage] : [])]);
  const body = prepareBody(p.body, media, { dek: p.excerpt ?? "" });
  return {
    ...toCard(p, media),
    visibility: p.visibility, updatedAt: p.updatedAt.toISOString(),
    metaTitle: p.metaTitle, metaDescription: p.metaDescription, metaImage: p.metaImage,
    categories: p.categories.map((c) => c.category), tags: p.tags,
    html: body.html, sections: body.sections, readMin: body.readMin, summary: body.summary,
  };
}

/** up to `n` other live PUBLIC posts: the same category first, then the newest */
export async function getMorePosts(slug: string, category: string | null | undefined, n = 3): Promise<PostCard[]> {
  const others = (await getLivePosts()).filter((p) => p.slug !== slug);
  const same = category ? others.filter((p) => p.category?.slug === category) : [];
  return [...same, ...others.filter((p) => !same.includes(p))].slice(0, n);
}
