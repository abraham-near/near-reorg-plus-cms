import type { Metadata } from "next";
import { og } from "@/lib/site";

// The site's first page is home v9 (/home-v9), the same page at both addresses: whatever changes there shows here. Home v7 and v8 stay at their own
// addresses (/home-v7, /home-v8), listed at /index. The index of pages is /index
export { default } from "./home-v9/page";

const TITLE = "NEAR: Privacy for onchain capital and the agent economy";
const DESCRIPTION = "NEAR encrypts your prompts and transactions so you and your agents can think and trade in confidence. One account, any chain, private by design.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: og({ title: TITLE, description: DESCRIPTION, url: "/" }),
};
