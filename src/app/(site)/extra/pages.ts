// The extra pages listed at /extra, by group: explorations and the versions that were not chosen. The final pages are listed at /index (../index/pages.ts).
// Add a page here (and its 1200×750 picture in public/extra/: `npm run capture -- <href> public/extra/<name>.webp`) and it shows up at /extra.
// featured: the chosen direction in its group (a badge on the picture); it is also a card at /index.
export type Extra = { href: string; n: string; name: string; note: string; tags: string[]; img: string; featured?: boolean };
export type Group = { id: string; title: string; note: string; pages: Extra[] };

export const GROUPS: Group[] = [
  {
    id: "post",
    title: "Blog post",
    note: "Three layouts for a single post, on v4's header and footer. The same example article on AI agents, with the same photos, in each.",
    pages: [
      { href: "/post-a", n: "A", name: "Ruled", note: "The index's ruled grid carried into the article: a row of facts, the photo in its cell, contents | text | margin notes.", tags: ["Ruled grid", "Sticky contents", "Margin notes"], img: "/extra/post-a.webp" },
      { href: "/post-b", n: "B", name: "Cover", note: "A magazine feature: the photo fills the first screen, a drop cap, pictures that leave the column, figures on an ink band, Up next.", tags: ["Full-screen cover", "Reading line", "Footnotes"], img: "/extra/post-b.webp", featured: true },
      { href: "/post-c", n: "C", name: "Notebook", note: "A reference read: split opening, a sticky rail with contents that fill as you read, time left and the takeaways; boxed notes.", tags: ["Split hero", "Progress rail", "Docs feel"], img: "/extra/post-c.webp" },
    ],
  },
  {
    id: "analytics",
    title: "Analytics",
    note: "near.org/analytics in the official pages' hand (the homepage, Blog J), two versions of the doc's lean overview; B is /analytics, in the menu. Sample figures: no live feed yet.",
    pages: [
      { href: "/analytics-a", n: "A", name: "Analytics · Overview", note: "The doc read literally on the ruled grid: three core stats, the revenue and status cards side by side, the tools, SVRN and the ETPs. Quiet motion: rows draw in, numbers count up once.", tags: ["Ruled grid", "Top 3 stats", "Quiet"], img: "/extra/analytics-a.webp" },
      { href: "/analytics", n: "B", name: "Analytics · Instrument panel", note: "Mono and tabular: all five stats in a ticker beside the headline, a revenue chart with a crosshair readout, status.near.org-style uptime bars with tooltips, the tools as a dense table.", tags: ["Ticker", "Chart readouts", "Uptime bars"], img: "/extra/analytics-b.webp", featured: true },
      { href: "/analytics-c", n: "C", name: "Analytics · Ruled grid", note: "The homepage's ruled grid and Blog J's ruled hero: the doc's page as rows of cells with crosshairs, mono labels and the Kepler accent.", tags: ["Ruled grid", "Homepage hand"], img: "/extra/analytics-c.webp" },
      { href: "/analytics-d", n: "D", name: "Analytics · Drawn", note: "NEAR Foundation's isometric hand: the numbers and the products told with line drawings that build as you scroll.", tags: ["Iso drawings", "Foundation hand"], img: "/extra/analytics-d.webp" },
      { href: "/analytics-e", n: "E", name: "Analytics · Editorial", note: "The homepage's big type and dark bands (the Stack, the Council): a calm editorial read with one dark band for the network.", tags: ["Editorial", "Dark band"], img: "/extra/analytics-e.webp" },
    ],
  },
  {
    id: "community",
    title: "Community",
    note: "near.org/community from the October 2026 doc (Revamp: Layout & Copy), three versions in the official pages' hand. Sample figures and events until the real ones and the Luma feed are in.",
    pages: [
      { href: "/community-a", n: "A", name: "Community · Ruled grid", note: "The homepage's ruled grid and Blog J's ruled hero: stats, events, the Legion, socials and the ways in as rows of cells with crosshairs.", tags: ["Ruled grid", "Homepage hand"], img: "/extra/community-a.webp" },
      { href: "/community-b", n: "B", name: "Community · Drawn", note: "NEAR Foundation's isometric hand: the community as line drawings (people, places, events) that build as you scroll.", tags: ["Iso drawings", "Foundation hand"], img: "/extra/community-b.webp" },
      { href: "/community-c", n: "C", name: "Community · Editorial", note: "The homepage's big type, photos that bleed and a dark band for the Legion: a warm editorial page.", tags: ["Editorial", "Dark band"], img: "/extra/community-c.webp" },
    ],
  },
];

export const COUNT = GROUPS.reduce((s, g) => s + g.pages.length, 0);
