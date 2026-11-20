import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  devIndicators: false,
  partialPrefetching: true,
  // app/global-not-found.tsx: one 404 (the site's, /404-a's design) for URLs no route matches. Needed because (site) and (cms) are separate root layouts.
  experimental: { globalNotFound: true },
  // A confidential work in progress: until launch every response asks search engines not to index it (with app/robots.ts and the site layout's meta
  // robots). At launch (SITE_INDEXABLE=true, src/lib/site.ts) only the explorations, the CMS and the API keep the header (src/lib/site.ts NEVER_INDEXED).
  async headers() {
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }];
    if (process.env.SITE_INDEXABLE !== "true") return [{ source: "/:path*", headers: noindex }];
    return ["/admin/:path*", "/api/:path*", "/cms/:path*", "/extra", "/index", "/home-v:n", "/post-:v(a|b|c|d)", "/blog-index-:v", "/analytics-:v", "/community-:v", "/history-:v", "/economics-:v", "/solutions-:v", "/research-:v", "/brand-:v", "/foundation-:v"]
      .map((source) => ({ source, headers: noindex }));
  },
  // Old addresses of pages that moved: Foundation E is the Foundation page now (/near-foundation; versions A–D and F were removed), the blog's directions A–L were removed (J is /blog), and so were homes v1–v6 (v7 is "/") and the first Analytics C; History was /about (A and B are /history-a, -b). Since Nov 19, 2026 the menu's Analytics, Economics, History, Community, Solutions and Research are the X versions at the plain addresses (/<page>-x leads there); the versions they replaced are back at their letters (Analytics C /analytics-c, Economics A /economics-a, History C /history-c, Community B /community-b)
  async redirects() {
    return [
      { source: "/foundation", destination: "/near-foundation", permanent: true },
      { source: "/foundation-:v([a-f])", destination: "/near-foundation", permanent: true },
      { source: "/blog-:v([a-l])", destination: "/blog", permanent: true },
      { source: "/about", destination: "/history", permanent: true },
      { source: "/about-c", destination: "/history-c", permanent: true },
      { source: "/about-:v(a|b)", destination: "/history-:v", permanent: true },
      // the MVP versions X are the menu's pages now, at the plain addresses; their -x addresses still lead to them (not permanent: still exploring)
      { source: "/:page(analytics|community|history|economics|solutions|research)-x", destination: "/:page", permanent: false },
      // the menu's Brand page isn't built yet: until it is, it shows exploration A (not permanent)
      { source: "/brand", destination: "/brand-a", permanent: false },
      // Protocol B is the menu's page, at /protocol; its letter address still leads there (not permanent: still exploring)
      { source: "/protocol-b", destination: "/protocol", permanent: false },
      { source: "/home-v:v([1-6])", destination: "/", permanent: true },
      { source: "/home-v:v([1-6])/:path*", destination: "/", permanent: true },
      // the previous CMS's post addresses (near.org/blog/<slug>.html), still linked from around the web
      { source: "/blog/:slug([^/.]+)\\.html", destination: "/blog/:slug", permanent: true },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        // Tailwind for global CSS only: CSS Modules (*.module.css) keep their scoped class names.
        condition: { all: [{ not: "foreign" }, { not: { path: /\.module\.css$/ } }] },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
