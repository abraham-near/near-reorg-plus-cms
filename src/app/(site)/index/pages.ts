// The final pages, listed at /index: one card per page of the site as it ships, at the address it ships at. Explorations and other versions go in
// ../extra/pages.ts (/extra) instead; when one of them is chosen, it moves here (see README.md, "Pages: /index and /extra").
//
// To add or update a page: an entry below, and its 1200×750 picture in public/index/ (`npm run capture -- <href> public/index/<id>.webp`, with the dev
// server running). href is where the card leads; path is the address shown on the card when it differs (a page with no fixed address of its own).
export type Final = { id: string; href: string; path?: string; name: string; note: string; tags: string[]; img: string };

export const FINALS: Final[] = [
  {
    id: "home", href: "/", name: "Homepage · v9",
    note: "Home v9: one type-only section, \"NEAR is privacy for onchain capital and the agent economy.\", then the rail with the signed identity, the Stack in lit matte, Origin, Go deeper, the voices one at a time and the mailboxes. Also at /home-v9.",
    tags: ["Type-only hero", "Black-and-white photos", "Lit matte Stack"], img: "/index/home.webp",
  },
  {
    id: "home-v8", href: "/home-v8", name: "Home v8",
    note: "Home v9 with \"NEAR is private\" and a word that cycles (AI, money, markets… cross-chain) until it rests on \"by design\", and the intro's paragraph under it.",
    tags: ["Type-only hero", "Cycling word"], img: "/index/home-v8.webp",
  },
  {
    id: "home-v7", href: "/home-v7", name: "Home v7",
    note: "The homepage before v9: G1's time-lapse film as the hero under its traced layer, the intro through the grid, the rail, the Stack in lit matte, proof and Go deeper.",
    tags: ["Scroll-scrubbed film", "Tracked vectors", "Lit matte Stack"], img: "/index/home-v7.webp",
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
    note: "Ruled grid (Analytics C): the homepage's ruled grid and Blog J's ruled hero, the five core stats, revenue and network health side by side, the tools, SVRN and the ETPs. Sample figures until the live feed lands.",
    tags: ["Ruled grid", "Homepage hand", "Sample figures"], img: "/index/analytics.webp",
  },
  {
    id: "economics", href: "/economics", name: "Economics",
    note: "Ruled grid (Economics A): the four structural facts as the proof strip, the loop drawn as four cells and a ring that lights step by step as you scroll, the two revenue sources, one asset on the dark band, the homepage's close.",
    tags: ["Ruled grid", "Scroll diagram", "Homepage close"], img: "/index/economics.webp",
  },
  {
    id: "history", href: "/history", name: "History",
    note: "Editorial (History C): huge years, the black-and-white whiteboard opening the origin essay, a sticky year that rolls as each milestone passes, the stack on a dark band, the homepage's close.",
    tags: ["Editorial", "Sticky year", "Homepage close"], img: "/index/history.webp",
  },
  {
    id: "community", href: "/community", name: "Community",
    note: "Drawn (Community B): NEAR Foundation's isometric hand, the community as line drawings (people, places, events) that build as you scroll, then the homepage's close with the newsletter. Sample figures and events until the Luma feed is in.",
    tags: ["Iso drawings", "Foundation hand", "Homepage close"], img: "/index/community.webp",
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
