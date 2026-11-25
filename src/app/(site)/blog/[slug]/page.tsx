import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { PostA } from "@/components/v3/post/a/PostA";
import { PostB } from "@/components/v3/post/b/PostB";
import { PostC } from "@/components/v3/post/c/PostC";
import { PostD } from "@/components/v3/post/d/PostD";
import { PostV } from "@/components/v3/post/v/PostV";
import { DEFAULT_LAYOUT, postHref, shareOf, toArticle } from "@/lib/blog/article";
import { getLivePost, getMorePosts } from "@/lib/blog/posts";
import { siteOrigin } from "@/lib/site";
import { videoMime } from "@/lib/blog/video";

// A post published in the CMS, in one of the post layouts: the one chosen in the CMS (B, Cover, when none), or ?layout=a / b / c / d.
// Rendered on request (the slug and the layout are only known then; the database is not reachable at build), its reads cached by
// the CMS's tags (lib/blog/posts.ts). A slug that is not live gets the not-found page: a 404 in dev; in production Next has already sent the route's
// (empty) prerendered shell, so it is a 200 with noindex, as on the CMS's own [id] pages.
// A video post (the CMS's Format: Video) always opens in PostV, the video layout: no ?layout=.
export const instant = false;

const LAYOUTS = { a: PostA, b: PostB, c: PostC, d: PostD } as const;
type PostLayout = keyof typeof LAYOUTS;
const layoutOf = (v: string | string[] | undefined): PostLayout => (v === "a" || v === "c" || v === "d" ? v : "b");   // B (Cover) unless asked

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getLivePost(slug);
  if (!post) return { title: "Post not found" };
  const share = shareOf(post), url = postHref(post.slug);
  const v = post.video;
  const videos = v ? [v.kind === "embed" ? { url: v.src, type: videoMime(v), width: 1280, height: 720 } : { url: new URL(v.src, siteOrigin()).href, type: videoMime(v) }] : undefined;   // metadataBase does not apply to videos
  const images = share.image ? [{ url: share.image, ...(post.image?.src === share.image && post.image.w && post.image.h ? { width: post.image.w, height: post.image.h } : {}) }] : undefined;
  return {
    metadataBase: siteOrigin(),   // absolute URLs for the share image and canonical (src/lib/site.ts)
    title: share.title,
    description: share.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article", url, title: share.title, description: share.description, images, videos,
      publishedTime: post.publishedAt, modifiedTime: post.updatedAt, authors: [post.author], tags: post.tags.map((t) => t.name),
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
  if (post.video) {
    const more = await getMorePosts(post.slug, post.category?.slug);
    return <BlogShell home="/"><PostV article={toArticle(post, more, DEFAULT_LAYOUT)} /></BlogShell>;
  }
  const own = layoutOf(post.layout ?? undefined);                       // the layout chosen in the CMS (Cover when none)
  const layout = query.layout ? layoutOf(query.layout) : own;
  const more = await getMorePosts(post.slug, post.category?.slug);
  const Post = LAYOUTS[layout];
  return <BlogShell home="/"><Post article={toArticle(post, more, layout)} /></BlogShell>;
}
