import type { MetadataRoute } from "next";
import { NEVER_INDEXED, indexable, siteOrigin } from "@/lib/site";

// D74: until launch the site is a confidential work in progress, so nothing on it may be crawled, wherever it is hosted (a preview link included);
// with the meta robots (site layout) and the X-Robots-Tag header (next.config.ts). At launch, SITE_INDEXABLE=true (src/lib/site.ts) opens the final pages
// and lists the sitemap; the explorations, the CMS and the API stay out.
export default function robots(): MetadataRoute.Robots {
  if (!indexable()) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/", disallow: NEVER_INDEXED }, sitemap: new URL("/sitemap.xml", siteOrigin()).href };
}
