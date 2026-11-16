import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  devIndicators: false,
  partialPrefetching: true,
  // app/global-not-found.tsx: one 404 (the site's, /404-a's design) for URLs no route matches. Needed because (site) and (cms) are separate root layouts.
  experimental: { globalNotFound: true },
  // A confidential work in progress: every response asks search engines not to index it (with app/robots.ts).
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] }];
  },
  // Old addresses of pages that moved: Foundation E is the Foundation page now, the blog's directions A–L were removed (J is /blog), and so were homes v1–v6 (v7 is "/") and Analytics C; Analytics B is /analytics
  async redirects() {
    return [
      { source: "/foundation-e", destination: "/near-foundation", permanent: true },
      { source: "/blog-:v([a-l])", destination: "/blog", permanent: true },
      { source: "/analytics-:v(b|c)", destination: "/analytics", permanent: true },
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
