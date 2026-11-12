import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { PostC } from "@/components/v3/post/c/PostC";
import { PostSwitch } from "@/components/v3/post/PostSwitch";
import { ARTICLE } from "@/components/v3/post/article";

// A blog post, layout C (Notebook): v3's header and footer (home v4's), the shared example article (components/v3/post/article.ts).
export const metadata: Metadata = { title: `${ARTICLE.title} · Post C`, description: ARTICLE.dek };

export default function PostPageC() {
  return <><BlogShell home="/home-v4"><PostC /></BlogShell><PostSwitch on="c" /></>;
}
