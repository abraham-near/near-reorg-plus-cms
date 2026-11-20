import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { PostV } from "@/components/v3/post/v/PostV";
import { ARTICLE, type Article } from "@/components/v3/post/article";

// A video post (the CMS's Format: Video), layout V: the shared example article cut to a short text, with one of the homepage's own clips as the
// video (public/videos/home, already in the repo) and the article's photo as its poster. A CMS video post opens in this layout at /blog/[slug].
const VIDEO_ARTICLE: Article = {
  ...ARTICLE,
  body: { blocks: "blocks" in ARTICLE.body ? ARTICLE.body.blocks.filter((b) => b.k === "p").slice(0, 2) : [] },
  sections: [],
  takeaways: ARTICLE.takeaways.slice(0, 2),
  video: { kind: "file", src: "/videos/home/home-hero-clouds-v1.mp4" },
};

export const metadata: Metadata = { title: `${ARTICLE.title} · Post V (video)`, description: ARTICLE.dek };

export default function PostPageV() {
  return <BlogShell home="/"><PostV article={VIDEO_ARTICLE} /></BlogShell>;
}
