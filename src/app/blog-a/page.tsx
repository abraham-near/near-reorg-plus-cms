import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { BlogA } from "@/components/v3/blog/a/BlogA";

// Blog index, direction A (Editorial index): v3's header, ruled grid and footer (components/v3/blog).
export const metadata: Metadata = {
  title: "Blog A",
  description: "Customer stories, reads and talks from across the NEAR ecosystem.",
};

export default function BlogPageA() {
  return <BlogShell home="/home-v3"><BlogA /></BlogShell>;
}
