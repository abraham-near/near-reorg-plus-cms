import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { FINALS } from "./(site)/index/pages";
import { getLivePosts } from "@/lib/blog/posts";
import { indexable, siteOrigin } from "@/lib/site";

// The sitemap: the final pages (/index's list, the ones with an address of their own) and every live public blog post. Built on request: the CMS's
// database is not reachable at build. Empty until launch (SITE_INDEXABLE, src/lib/site.ts), like robots.txt.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  if (!indexable()) return [];
  const at = (path: string) => new URL(path, siteOrigin()).href;
  const pages: MetadataRoute.Sitemap = FINALS.filter((f) => !f.path).map((f) => ({ url: at(f.href), changeFrequency: f.href === "/blog" ? "daily" : "weekly", priority: f.href === "/" ? 1 : 0.8 }));
  let posts: MetadataRoute.Sitemap = [];
  try {
    posts = (await getLivePosts()).map((p) => ({ url: at(`/blog/${p.slug}`), lastModified: p.publishedAt, changeFrequency: "monthly", priority: 0.6 }));
  } catch (e) { console.error("[sitemap] posts", e); }   /* the pages still go out */
  return [...pages, ...posts];
}
