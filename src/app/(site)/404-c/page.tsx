import type { Metadata } from "next";
import { NotFoundC } from "@/components/notfound/c/NotFoundC";

// 404 proposal C · typographic: a very large "404" in home v5's hero type on paper, one line, Back home and the blog (components/notfound/c).
export const metadata: Metadata = {
  title: "404 C",
  description: "This page wandered off.",
  robots: { index: false, follow: false },
};

export default function NotFoundPageC() {
  return <NotFoundC />;
}
