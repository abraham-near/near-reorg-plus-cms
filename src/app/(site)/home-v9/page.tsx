import type { Metadata } from "next";
import { V7Page } from "@/components/v7/V7Page";

export const metadata: Metadata = {
  title: "Home v9",
  description: "NEAR encrypts your prompts and transactions so you and your agents can think and trade in confidence. One account, any chain, private by design.",
  alternates: { canonical: "/" },   // an exploration of the homepage: search engines are pointed to /
};

// Home v9 = Lawrence's branch NEAR-is-privacy-HEADLINE (D202): home v8 with one still headline, "NEAR is privacy for onchain capital and the agent
// economy.", and two sentences under it (components/v7/private), and the lower page of that branch (V7Page `top`). Home v7 (/) is unchanged.
export default function HomeV9() {
  return <V7Page top="privacy" />;
}
