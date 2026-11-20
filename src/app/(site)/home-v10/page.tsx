import type { Metadata } from "next";
import { V7Page } from "@/components/v7/V7Page";

export const metadata: Metadata = {
  title: "Home v10",
  description: "One account, any chain, private by design. NEAR encrypts your prompts and transactions so you and your agents can think and trade in confidence.",
  alternates: { canonical: "/" },   // an exploration of the homepage: search engines are pointed to /
};

// Home v10 = Lawrence's branch Stack-Second (D239): home v8 with the Stack and Real Usage moved up, straight after the hero, and the rail ("AI is the
// frontend…") after them; then the lower page as v8's. Listed at /extra.
export default function HomeV10() {
  return <V7Page top="private" stackFirst />;
}
