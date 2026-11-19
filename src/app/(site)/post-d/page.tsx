import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { PostD } from "@/components/v3/post/d/PostD";
import { PostSwitch } from "@/components/v3/post/PostSwitch";
import { ARTICLE } from "@/components/v3/post/article";

// A blog post, layout D (Poster, in the October 2026 Figma's language): v3's header and footer (home v4's), the shared example article
// (components/v3/post/article.ts).
export const metadata: Metadata = { title: `${ARTICLE.title} · Post D`, description: ARTICLE.dek };

export default function PostPageD() {
  return <><BlogShell home="/"><PostD article={ARTICLE} /></BlogShell><PostSwitch on="d" /></>;
}
