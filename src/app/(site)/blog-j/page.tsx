import { permanentRedirect } from "next/navigation";

// Blog J became the blog: /blog (app/(site)/blog/page.tsx). Old links land there.
export default function BlogPageJ() {
  permanentRedirect("/blog");
}
