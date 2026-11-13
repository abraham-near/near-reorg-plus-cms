import type { Metadata } from "next";
import { NotFoundA } from "@/components/notfound/a/NotFoundA";
import { RootFlags } from "@/components/notfound/RootFlags";

// The site's 404 when a page calls notFound() (an unknown /blog/[slug]): proposal A, "Lost in the mist" (/404-a), inside the site's root layout.
// URLs that match no route at all get the same design from app/global-not-found.tsx. Next renders this one in the browser (see RootFlags), so
// it sets the <html> attributes NotFoundA's styles need itself.
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function SiteNotFound() {
  return (
    <>
      <RootFlags version="v3" />
      <NotFoundA />
    </>
  );
}
