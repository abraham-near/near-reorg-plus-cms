import type { Metadata } from "next";
import { V7Page } from "@/components/v7/V7Page";
import { og } from "@/lib/site";

// The site's first page (since Nov 25, 2026): home v10's cycling hero ("NEAR is private" + the word that rests on "by design") in home v7's order: the
// hero, then the rail ("AI is the frontend…", the side-scrolling section), then the dark Stack, then the lower page (Real Usage leads Go deeper). That
// is V7Page `top` without `stackFirst`, the same page as /home-v8. Home v10 (Stack second) stays at /home-v10, v9 at /home-v9, v7 at /home-v7
export default function Home() {
  return <V7Page top="private" />;
}

const TITLE = "NEAR is private, by design";   // v10's hero: "NEAR is private" + the cycling word that rests on "by design"
const DESCRIPTION = "One account, any chain, private by design. NEAR encrypts your prompts and transactions so you and your agents can think and trade in confidence.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: og({ title: TITLE, description: DESCRIPTION, url: "/" }),
};
