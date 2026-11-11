import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { BlogF } from "@/components/v3/blog/f/BlogF";

// Blog index, direction F (By format): a modest hero with a typeahead search, Browse by format, then each format in its own layout and the full index
// (components/v3/blog/f), in v3's header, ruled grid and footer.
export const metadata: Metadata = {
  title: "Blog F",
  description: "Customer stories, reads and talks from across the NEAR ecosystem.",
};

export default function BlogPageF() {
  return <BlogShell home="/home-v3"><BlogF /></BlogShell>;
}
