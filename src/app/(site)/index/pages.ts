// The final pages, listed at /index: one card per page of the site as it ships, at the address it ships at. Explorations and other versions go in
// ../extra/pages.ts (/extra) instead; when one of them is chosen, it moves here (see README.md, "Pages: /index and /extra").
//
// To add or update a page: an entry below, and its 1200×750 picture in public/index/ (`npm run capture -- <href> public/index/<id>.webp`, with the dev
// server running). href is where the card leads; path is the address shown on the card when it differs (a page with no fixed address of its own).
export type Final = { id: string; href: string; path?: string; name: string; note: string; tags: string[]; img: string };

export const FINALS: Final[] = [
  {
    id: "home", href: "/", name: "Homepage",
    note: "Home v7: G1's time-lapse film as the hero under its traced layer, the spread wordmark header, the intro through the grid, the rail, the Stack in lit matte, proof and Go deeper.",
    tags: ["Scroll-scrubbed film", "Tracked vectors", "Lit matte Stack"], img: "/index/home.webp",
  },
  {
    id: "blog", href: "/blog", name: "Blog",
    note: "Reading rail, open (direction J): search, type, sort and view in a sticky rail beside the feed; one lead post, then a grid of eighteen or a list. The CMS's posts first.",
    tags: ["CMS posts", "Blog / Press / Watch", "Grid / list"], img: "/index/blog.webp",
  },
  {
    id: "post", href: "/post-b", path: "/blog/<slug>", name: "Blog post",
    note: "Cover (layout B): the photo fills the first screen, then the article with a drop cap and pictures that leave the column. Every CMS post at /blog/<slug> uses it; this card opens the sample article.",
    tags: ["Cover", "CMS article", "Layout B"], img: "/index/post.webp",
  },
  {
    id: "foundation", href: "/near-foundation", name: "NEAR Foundation",
    note: "Foundation E with two sections of F: C's plinth and columns alive in the hero, F's pillars with their icons, the \"smaller\" statement, the glass Stiftung, F's Council on the dark, how it operates.",
    tags: ["Iso hero", "Ruled stair", "Scroll motion"], img: "/index/foundation.webp",
  },
  {
    id: "analytics", href: "/analytics", name: "Analytics",
    note: "Instrument panel (Analytics B): the five core stats in a ticker beside the headline, revenue, network health and the tools, mono and tabular. Sample figures until the live feed lands.",
    tags: ["Ticker", "Ruled grid", "Sample figures"], img: "/index/analytics.webp",
  },
  {
    id: "contact", href: "/contact", name: "Contact",
    note: "A short about, the form (name, email, topic, message; checked in place, nothing is sent yet) and NEAR's social links.",
    tags: ["About", "Form", "Social links"], img: "/index/contact.webp",
  },
  {
    id: "404", href: "/this-page-does-not-exist", path: "any unknown address", name: "Not found",
    note: "Lost in the mist (404 A): the forest under a drifting fog, a mist-grey 404 and the way back home or to the blog. Every address no page matches shows it.",
    tags: ["404", "Forest", "Fog"], img: "/index/404.webp",
  },
];
