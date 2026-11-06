import type { MetadataRoute } from "next";

// D74: the site is a confidential work in progress, so nothing on it may be crawled or indexed, wherever it is hosted
// (a preview link included). With the X-Robots-Tag header in next.config.ts. Revisit only at launch.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
