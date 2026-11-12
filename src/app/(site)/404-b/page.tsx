import type { Metadata } from "next";
import { NotFoundB } from "@/components/notfound/b/NotFoundB";

// 404 proposal B · "Off the rail": home v5's rail, broken in the middle where the page should be (components/notfound/b).
export const metadata: Metadata = {
  title: "404 B",
  description: "This page isn't on the rail. It may have moved or never existed.",
  robots: { index: false, follow: false },
};

export default function NotFoundPageB() {
  return <NotFoundB />;
}
