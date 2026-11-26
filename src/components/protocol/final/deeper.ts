import "server-only";
// The final Protocol page's Go deeper: the CMS's newest live PUBLIC posts (lib/blog/posts.ts, cached under the CMS's tags), each to its own page
// (/blog/<slug>) with its photo, title and excerpt. Fewer than `n` (or the database out of reach) and the doc's near.org items fill the rest, so the
// section always has its two covers and its rows.
import { postHref } from "@/lib/blog/article";
import { getLivePosts } from "@/lib/blog/posts";
import { DEEPER_ITEMS, type DeeperItem } from "../b/parts";

export async function deeperPosts(n = 5): Promise<DeeperItem[]> {
  let live: DeeperItem[] = [];
  try {
    live = (await getLivePosts()).slice(0, n).map((p) => ({ href: postHref(p.slug), title: p.title, body: p.excerpt?.trim() ?? "", img: p.image?.src ?? null }));
  } catch (e) {
    console.error("[protocol] Go deeper: the CMS posts could not be read; showing the doc's items", e);
  }
  const titles = new Set(live.map((p) => p.title.toLowerCase()));
  return [...live, ...DEEPER_ITEMS.filter((it) => !titles.has(it.title.toLowerCase())).slice(0, Math.max(0, n - live.length))];
}
