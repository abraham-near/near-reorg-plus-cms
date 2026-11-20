import type { Metadata } from "next";
import { og } from "@/lib/site";

// The site's first page is home v9 (/home-v9, the still headline; Lawrence, D246), the same page at both addresses: whatever changes there shows here.
// Home v7 stays at /home-v7 (on /index); v8 (the cycling word, the homepage Nov 19–20) is at /home-v8 (on /extra). The index of pages is /index
export { default } from "./home-v9/page";

const TITLE = "NEAR: Privacy for onchain capital and the agent economy";   // v9's headline (D246)
const DESCRIPTION = "NEAR encrypts your prompts and transactions so you and your agents can think and trade in confidence. One account, any chain, private by design.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: og({ title: TITLE, description: DESCRIPTION, url: "/" }),
};
