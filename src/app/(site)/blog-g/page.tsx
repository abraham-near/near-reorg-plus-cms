import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { BlogG } from "@/components/v3/blog/g/BlogG";

// Blog index, direction G (Feature stream): a sticky picture beside one editorial column, the talks on a dark sideways run; v4's header and footer.
export const metadata: Metadata = {
  title: "Blog G",
  description: "Customer stories, reads and talks from across the NEAR ecosystem.",
};

export default function BlogPageG() {
  return <BlogShell home="/home-v4"><BlogG /></BlogShell>;
}
