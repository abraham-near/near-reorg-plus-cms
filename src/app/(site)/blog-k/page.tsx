import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { BlogK } from "@/components/v3/blog/k/BlogK";

// Blog index, direction K (By format, open): Blog F's structure (a typeahead search, then a layout per format: stories in alternating rows, a talk player
// with its playlist, the read, All posts with Grid / List) without the ruled grid: an invisible column grid, space and type (components/v3/blog/k).
export const metadata: Metadata = {
  title: "Blog K",
  description: "Customer stories, reads and talks from across the NEAR ecosystem.",
};

export default function BlogPageK() {
  return <BlogShell home="/home-v4"><BlogK /></BlogShell>;
}
