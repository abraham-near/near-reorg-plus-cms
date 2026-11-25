// The final pages, listed at /index: one card per page of the site as it ships, at the address it ships at. Explorations and other versions go in
// ../extra/pages.ts (/extra) instead; when one of them is chosen, it moves here (see README.md, "Pages: /index and /extra").
//
// To add or update a page: an entry below, and its 1200×750 picture in public/index/ (`npm run capture -- <href> public/index/<id>.webp`, with the dev
// server running). href is where the card leads; path is the address shown on the card when it differs (a page with no fixed address of its own).
export type Final = { id: string; href: string; path?: string; name: string; note: string; tags: string[]; img: string };

export const FINALS: Final[] = [
  {
    id: "home", href: "/", name: "Homepage · v10",
    note: "Home v10, \"Stack second\" (Lawrence's branch Stack-Second): \"NEAR is private\" and a word that cycles until it rests on \"by design\", then the NEAR Stack and Real Usage straight after the hero, then the rail (\"AI is the frontend…\") and the same lower page as v8 and v9.",
    tags: ["Cycling hero", "Stack second", "Lit matte Stack"], img: "/index/home.webp",
  },
  {
    id: "home-v7", href: "/home-v7", name: "Home v7",
    note: "The homepage before v8 and v9: G1's time-lapse film as the hero under its traced layer, the intro through the grid, the rail, the Stack in lit matte, proof and Go deeper.",
    tags: ["Scroll-scrubbed film", "Tracked vectors", "Lit matte Stack"], img: "/index/home-v7.webp",
  },
  {
    id: "blog", href: "/blog", name: "Blog",
    note: "Version E: the heading, the lead post (always on screen), then All, Blog, Press and Watch as large words over tag pills you can combine (NEAR AI, NEAR Intents, near.com and NEAR Protocol first). Posts sit on the homepage's ruled cards with their date and tags, nine at a time. The CMS's posts first. The previous blog (direction J) is at /blog-index-a on /extra.",
    tags: ["CMS posts", "Blog / Press / Watch", "Tags", "Ruled cards"], img: "/index/blog.webp",
  },
  {
    id: "post", href: "/post-b", path: "/blog/<slug>", name: "Blog post",
    note: "Cover (layout B): the photo fills the first screen, then the article with a drop cap and pictures that leave the column. Every CMS post at /blog/<slug> uses it (a video post opens in the video layout, /post-v); this card opens the sample article.",
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
    id: "protocol", href: "/protocol", name: "Protocol",
    note: "The final page (Nov 25, 2026), a mix of the Vercel page and version B after the team's Figma collage: the isometric hero and its index, the figures, B's pinned dark chapter for Nightshade 3.0 and dynamic resharding, Speed, Private Shard, a dark run for quantum security, Chain Signatures and developers, then the AI layer, NEAR One, Secure NEAR and Go deeper. B is at /protocol-b on /extra.",
    tags: ["Iso hero", "Pinned chapter", "Dark run"], img: "/index/protocol.webp",
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
