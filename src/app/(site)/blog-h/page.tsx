import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { BlogH } from "@/components/v3/blog/h/BlogH";

// Blog index, direction H (Chapters): the posts as type in three chapters by format, titles that shrink to labels, a picture that follows the cursor.
export const metadata: Metadata = {
  title: "Blog H",
  description: "Customer stories, reads and talks from across the NEAR ecosystem.",
};

export default function BlogPageH() {
  return <BlogShell home="/home-v4"><BlogH /></BlogShell>;
}
