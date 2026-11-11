import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { BlogB } from "@/components/v3/blog/b/BlogB";

// Blog index, direction B (Magazine): v3's header, ruled grid and footer (components/v3/blog).
export const metadata: Metadata = {
  title: "Blog B",
  description: "Customer stories, reads and talks from across the NEAR ecosystem.",
};

export default function BlogPageB() {
  return <BlogShell home="/home-v3"><BlogB /></BlogShell>;
}
