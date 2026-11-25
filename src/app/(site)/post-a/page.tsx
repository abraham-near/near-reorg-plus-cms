import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { PostA } from "@/components/v3/post/a/PostA";
import { ARTICLE } from "@/components/v3/post/article";

// A blog post, layout A (Ruled): v3's header and footer (home v4's), the shared example article (components/v3/post/article.ts).
export const metadata: Metadata = { title: `${ARTICLE.title} · Post A`, description: ARTICLE.dek };

export default function PostPageA() {
  return <BlogShell home="/"><PostA article={ARTICLE} /></BlogShell>;
}
