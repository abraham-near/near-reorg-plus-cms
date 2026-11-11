import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { BlogD } from "@/components/v3/blog/d/BlogD";

// Blog index, direction D (Newsroom: a search-led front page): v3's header, ruled grid and footer (components/v3/blog).
export const metadata: Metadata = {
  title: "Blog D",
  description: "Customer stories, reads and talks from across the NEAR ecosystem.",
};

export default function BlogPageD() {
  return <BlogShell home="/home-v3"><BlogD /></BlogShell>;
}
