import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { BlogE } from "@/components/v3/blog/e/BlogE";

// Blog index, direction E (Reading rail): v3's header, ruled grid and footer (components/v3/blog), a sticky rail of search / filters beside the feed.
export const metadata: Metadata = {
  title: "Blog E",
  description: "Customer stories, reads and talks from across the NEAR ecosystem.",
};

export default function BlogPageE() {
  return <BlogShell home="/home-v3"><BlogE /></BlogShell>;
}
