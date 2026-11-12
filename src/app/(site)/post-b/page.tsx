import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { PostB } from "@/components/v3/post/b/PostB";
import { PostSwitch } from "@/components/v3/post/PostSwitch";
import { ARTICLE } from "@/components/v3/post/article";

// A blog post, layout B (Cover): v3's header and footer (home v4's), the shared example article (components/v3/post/article.ts).
export const metadata: Metadata = { title: `${ARTICLE.title} · Post B`, description: ARTICLE.dek };

export default function PostPageB() {
  return <><BlogShell home="/home-v4"><PostB /></BlogShell><PostSwitch on="b" /></>;
}
