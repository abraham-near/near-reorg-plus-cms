import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { BlogC } from "@/components/v3/blog/c/BlogC";

// Blog index, direction C (Archive): v3's header, ruled grid and footer (components/v3/blog).
export const metadata: Metadata = {
  title: "Blog C",
  description: "Customer stories, reads and talks from across the NEAR ecosystem.",
};

export default function BlogPageC() {
  return <BlogShell home="/home-v3"><BlogC /></BlogShell>;
}
