import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { PostA } from "@/components/v3/post/a/PostA";
import { PostB } from "@/components/v3/post/b/PostB";
import { PostC } from "@/components/v3/post/c/PostC";
import { PostSwitch, type PostLayout } from "@/components/v3/post/PostSwitch";
import { postHref, shareOf, toArticle } from "@/lib/blog/article";
import { getLivePost, getMorePosts } from "@/lib/blog/posts";

// A post published in the CMS, in one of the post layouts: B (Cover) by default, ?layout=a (Ruled) or ?layout=c (Notebook), with the same pill as
// /post-a…c to switch. Rendered on request (the slug and the layout are only known then; the database is not reachable at build), its reads cached by
// the CMS's tags (lib/blog/posts.ts). A slug that is not live gets the not-found page: a 404 in dev; in production Next has already sent the route's
// (empty) prerendered shell, so it is a 200 with noindex, as on the CMS's own [id] pages.
export const instant = false;

const LAYOUTS = { a: PostA, b: PostB, c: PostC } as const;
const layoutOf = (v: string | string[] | undefined): PostLayout => (v === "a" || v === "c" ? v : "b");   // B (Cover) unless asked

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

/** absolute URLs for the share image and canonical: SITE_ORIGIN, else the CMS's (they are the same app) */
const origin = () => { try { return new URL(process.env.SITE_ORIGIN || process.env.CMS_ORIGIN || "http://localhost:3000"); } catch { return undefined; } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getLivePost(slug);
  if (!post) return { title: "Post not found" };
  const share = shareOf(post), url = postHref(post.slug);
  const images = share.image ? [{ url: share.image, ...(post.image?.src === share.image && post.image.w && post.image.h ? { width: post.image.w, height: post.image.h } : {}) }] : undefined;
  return {
    metadataBase: origin(),
    title: share.title,
    description: share.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article", url, title: share.title, description: share.description, images,
      publishedTime: post.publishedAt, modifiedTime: post.updatedAt, authors: post.author ? [post.author] : undefined, tags: post.tags.map((t) => t.name),
    },
    twitter: { card: images ? "summary_large_image" : "summary", title: share.title, description: share.description, images: images?.map((i) => i.url) },
    // UNLISTED: reachable by its link only
    ...(post.visibility === "UNLISTED" ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function BlogPost({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const post = await getLivePost(slug);
  if (!post) notFound();
  const layout = layoutOf(query.layout);
  const more = await getMorePosts(post.slug, post.category?.slug);
  const Post = LAYOUTS[layout];
  return <><BlogShell home="/home-v4"><Post article={toArticle(post, more, layout)} /></BlogShell><PostSwitch on={layout} base={postHref(post.slug)} fallback="b" /></>;
}
