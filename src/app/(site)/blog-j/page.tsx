import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { BlogJ } from "@/components/v3/blog/j/BlogJ";

// Blog index, direction J (Reading rail, open): E's structure (counts in the head, a sticky rail of search / type / sort / view beside the feed, pages of six)
// without the ruled grid: open cards on whitespace, one hairline under the head (components/v3/blog/j).
export const metadata: Metadata = {
  title: "Blog J",
  description: "Customer stories, reads and talks from across the NEAR ecosystem.",
};

export default function BlogPageJ() {
  return <BlogShell home="/home-v4"><BlogJ /></BlogShell>;
}
