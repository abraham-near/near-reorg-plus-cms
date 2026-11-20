import type { Metadata } from "next";
import { V7Page } from "@/components/v7/V7Page";

export const metadata: Metadata = {
  title: "Home v8",
  description: "One account, any chain, private by design. NEAR encrypts your prompts and transactions so you and your agents can think and trade in confidence.",
  alternates: { canonical: "/" },   // a version of the homepage not chosen: search engines are pointed to /
};

// Home v8 = Lawrence's branch NEAR-is-private-CYCLE (D200): home v7 with the hero and the intro merged into one type-only section, "NEAR is private" and a
// word that cycles to "by design" (components/v7/private), and the lower page of that branch (V7Page `top`). The homepage Nov 19–20 (D222), until Lawrence chose v9 (D246); listed at /extra.
export default function HomeV8() {
  return <V7Page top="private" />;
}
