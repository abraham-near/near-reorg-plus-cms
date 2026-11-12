import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { BlogI } from "@/components/v3/blog/i/BlogI";

// Blog index, direction I (Atlas): the posts as prints of different sizes and depths over fields of dots, a dock with the filters and a list view.
export const metadata: Metadata = {
  title: "Blog I",
  description: "Customer stories, reads and talks from across the NEAR ecosystem.",
};

export default function BlogPageI() {
  return <BlogShell home="/home-v4"><BlogI /></BlogShell>;
}
