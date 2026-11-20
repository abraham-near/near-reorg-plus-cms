import type { Metadata } from "next";
import { og } from "@/lib/site";

// The site's first page is home v10 (/home-v10, "Stack second": v8's cycling hero, then the Stack and Real Usage, then the rail; since Nov 20, 2026), the
// same page at both addresses: whatever changes there shows here. Home v7 stays at /home-v7 (on /index); v9 (the still headline, the homepage before)
// is at /home-v9 and v8 (the cycling word) at /home-v8, both on /extra. The index of pages is /index
export { default } from "./home-v10/page";

const TITLE = "NEAR is private, by design";   // v10's hero: "NEAR is private" + the cycling word that rests on "by design"
const DESCRIPTION = "One account, any chain, private by design. NEAR encrypts your prompts and transactions so you and your agents can think and trade in confidence.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: og({ title: TITLE, description: DESCRIPTION, url: "/" }),
};
