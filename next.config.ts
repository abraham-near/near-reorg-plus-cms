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
    return ["/admin/:path*", "/api/:path*", "/cms/:path*", "/extra", "/index", "/home-v:n", "/post-:v(a|b|c)", "/analytics-:v", "/community-:v", "/history-:v", "/economics-:v", "/solutions-:v", "/research-:v", "/brand-:v", "/foundation-:v"]
      .map((source) => ({ source, headers: noindex }));
  },
  // Old addresses of pages that moved: Foundation E is the Foundation page now (/near-foundation; versions A–D and F were removed), the blog's directions A–L were removed (J is /blog), and so were homes v1–v6 (v7 is "/") and the first Analytics C; Analytics C is /analytics (B is back at /analytics-b), Economics A is /economics, History C is /history (it was /about; A and B are /history-a, -b), Community B is /community
  async redirects() {
    return [
      { source: "/foundation", destination: "/near-foundation", permanent: true },
      { source: "/foundation-:v([a-f])", destination: "/near-foundation", permanent: true },
      { source: "/blog-:v([a-l])", destination: "/blog", permanent: true },
      { source: "/analytics-c", destination: "/analytics", permanent: true },
      { source: "/economics-a", destination: "/economics", permanent: true },
      { source: "/about", destination: "/history", permanent: true },
      { source: "/about-c", destination: "/history", permanent: true },
      { source: "/about-:v(a|b)", destination: "/history-:v", permanent: true },
      { source: "/community-b", destination: "/community", permanent: true },
      { source: "/home-v:v([1-6])", destination: "/", permanent: true },
      { source: "/home-v:v([1-6])/:path*", destination: "/", permanent: true },
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
