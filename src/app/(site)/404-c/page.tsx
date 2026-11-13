import type { Metadata } from "next";
import { NotFoundC } from "@/components/notfound/c/NotFoundC";

// 404 proposal C · ruled: the blog's ruled grid, one digit per cell, one line, Back home and the blog (components/notfound/c).
export const metadata: Metadata = {
  title: "404 C",
  description: "This page doesn’t exist.",
  robots: { index: false, follow: false },
};

export default function NotFoundPageC() {
  return <NotFoundC />;
}
