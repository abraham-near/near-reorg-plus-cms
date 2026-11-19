import type { Metadata } from "next";
import { og } from "@/lib/site";

// The site's first page is home v8 (/home-v8, the cycling word; Lawrence, D222), the same page at both addresses: whatever changes there shows here.
// Home v7 stays at /home-v7 (on /index); v9 (the still headline) is archived at /home-v9 (on /extra). The index of pages is /index
export { default } from "./home-v8/page";

const TITLE = "NEAR: Private by design";   // v8's headline (D222)
const DESCRIPTION = "One account, any chain, private by design. NEAR encrypts your prompts and transactions so you and your agents can think and trade in confidence.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: og({ title: TITLE, description: DESCRIPTION, url: "/" }),
};
