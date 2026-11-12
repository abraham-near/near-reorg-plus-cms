import type { Metadata } from "next";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { BlogL } from "@/components/v3/blog/l/BlogL";

// Blog index, direction L (Front page + archive): E and F in one page, opened up (components/v3/blog/l). F's top (the typeahead, the lead, the talks band),
// E's archive (a slim sticky rail beside every post, six to a page), with no ruled cells, crosshairs or dividers; v3's header and footer.
export const metadata: Metadata = {
  title: "Blog L",
  description: "Customer stories, reads and talks from across the NEAR ecosystem.",
};

export default function BlogPageL() {
  return <BlogShell home="/home-v4"><BlogL /></BlogShell>;
}
