import type { Metadata } from "next";
import { og } from "@/lib/site";

// The site's first page is home v11 (/home-v11: v10's "Stack second" with Lawrence's new copy, D251; the working version since Nov 20, 2026), the same
// page at both addresses: whatever changes there shows here. Home v7 stays at /home-v7 (on /index); v10 (Stack second, as Abraham made it the homepage),
// v9 (the still headline) and v8 (the cycling word) are on /extra. The index of pages is /index
export { default } from "./home-v11/page";

const TITLE = "NEAR is private, by design";   // v11's hero (v10's): "NEAR is private" + the cycling word that rests on "by design"
const DESCRIPTION = "One account, any chain, private by design. NEAR encrypts your prompts and transactions so your intelligence and assets belong to you.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: og({ title: TITLE, description: DESCRIPTION, url: "/" }),
};
