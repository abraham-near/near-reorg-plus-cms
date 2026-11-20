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
    note: "MVP (X, the Nov 19 review): D simplified, mostly copy, the plinth beside the hero, then one continuous ruled grid with spacer rows: the five stats, revenue as sixteen weekly bars beside network health, Go deeper with its hub, SVRN and the ETPs.",
    tags: ["MVP", "Continuous grid", "Weekly bars"], img: "/index/analytics.webp",
  },
  {
    id: "economics", href: "/economics", name: "Economics",
    note: "MVP (X, the Nov 19 review): an isometric beside the hero (fees running into the token), the foundation, the loop and the one asset on the ruled grid, the loop drawn as four isometric stations that light as you scroll, the two products on a dark band.",
    tags: ["MVP", "Isometric", "Ruled grid"], img: "/index/economics.webp",
  },
  {
    id: "history", href: "/history", name: "History",
    note: "MVP (X, the Nov 19 review): a type-only hero, a plain Origin, the years as a short sideways story after the homepage's rail (pinned, three at a time: the year on show at the centre with its text, its neighbours faint), Today on the ruled grid.",
    tags: ["MVP", "Sideways rail", "Ruled grid"], img: "/index/history.webp",
  },
  {
    id: "community", href: "/community", name: "Community",
    note: "MVP (X, the Nov 19 review): C made more typographic, an isometric drawing of crews joined by threads in the hero, the figures, channels and ways framed by the homepage's grid, the Legion on the dark band, the channels with the site's dot icons.",
    tags: ["MVP", "Typographic", "Dot icons"], img: "/index/community.webp",
  },
  {
    id: "solutions", href: "/solutions", name: "Solutions",
    note: "MVP (X, the Nov 19 review): a calm hero beside B's hub, then one continuous ruled grid with spacer rows: the proof strip, the solutions, Confidential Intents as a dark band off the grid, the builders, the grid running down into the close.",
    tags: ["MVP", "Continuous grid", "Dark band"], img: "/index/solutions.webp",
  },
  {
    id: "research", href: "/research", name: "Research",
    note: "MVP (X, the Nov 19 review): A without the grid by the header, B's paper stack as the hero's placeholder drawing, the catalogue in two columns with a topic filter, keep reading on the same grid, the grid running into the homepage's close.",
    tags: ["MVP", "Catalogue", "Topic filter"], img: "/index/research.webp",
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
