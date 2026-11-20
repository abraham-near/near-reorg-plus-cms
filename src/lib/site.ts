// The site's address and whether search engines may index it. Both are read at build time (the pages are prerendered), so a change to either
// variable needs a new deploy (Railway redeploys on a variable change).
//   SITE_INDEXABLE=true   the launch switch: the final pages become indexable (meta robots, X-Robots-Tag, robots.txt, sitemap). Unset (any preview,
//                         this Railway URL): nothing is indexed (D74: a confidential work in progress).
//   SITE_ORIGIN           the public address for canonical URLs, Open Graph and the sitemap (https://near.org at launch). Falls back to CMS_ORIGIN,
//                         then Railway's own domain, then localhost.

export const indexable = () => process.env.SITE_INDEXABLE === "true";

export function siteOrigin(): URL {
  const railway = process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "";
  for (const v of [process.env.SITE_ORIGIN, process.env.CMS_ORIGIN, railway]) {
    if (!v) continue;
    try { return new URL(v); } catch { /* next */ }
  }
  return new URL("http://localhost:3000");
}

/** Never indexed, even at launch: the explorations and their lists, the work copy of the homepage, the CMS. Same patterns as next.config.ts headers() */
export const NEVER_INDEXED = ["/admin", "/api", "/cms", "/extra", "/index", "/home-v", "/post-a", "/post-b", "/post-c", "/post-d", "/post-v", "/blog-index-", "/analytics-", "/community-", "/history-", "/economics-", "/solutions-", "/research-", "/brand-", "/protocol-", "/foundation"];

/** a page's Open Graph: Next replaces the layout's openGraph with a page's own, so every page starts from the same base (the picture comes from
 *  app/(site)/opengraph-image.jpg unless the page has one) */
export const og = (o: { title?: string; description?: string; url: string }) => ({ type: "website" as const, siteName: "NEAR", locale: "en_US", ...o });
