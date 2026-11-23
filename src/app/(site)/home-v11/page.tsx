import type { Metadata } from "next";
import { V7Page } from "@/components/v7/V7Page";

export const metadata: Metadata = {
  title: "Home v11",
  description: "One account, any chain, private by design. NEAR encrypts your prompts and transactions so your intelligence and assets belong to you.",
  alternates: { canonical: "/" },   // the homepage's second address (/ re-exports this page): search engines are pointed to /
};

// Home v11 (D251) = home v10 ("Stack second", D239) with Lawrence's new copy: the hero's paragraph (D249) and the rail's "infrastructure" lines (D248, D250).
// It is the homepage and the working version (Lawrence, Nov 20, 2026: "so we keep working on v11"): / re-exports this page. v10 stays as it was, on /extra.
export default function HomeV11() {
  return <V7Page top="private" stackFirst v11 />;
}
