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
    id: "pages",
    title: "Pages",
    note: "Inner pages of near.org in home v4's design, with the October 2026 copy.",
    pages: [
      { href: "/foundation", n: "A", name: "Foundation · Ruled grid", note: "near.org/foundation: the pillars, the devolution thesis, the Stiftung, the Council, how it operates, the ecosystem, the close.", tags: ["v4 design", "Ruled grid", "Scroll figure"], img: "/extra/foundation.webp" },
      { href: "/foundation-b", n: "B", name: "Foundation · Devolve", note: "The hero's isometric block breaks into the ecosystem as you scroll; a staircase of pillars, a sticky story for how it operates.", tags: ["Iso illustrations", "Pinned hero", "Sticky story"], img: "/extra/foundation-b.webp" },
      { href: "/foundation-c", n: "C", name: "Foundation · The Stiftung", note: "A dark hero: green columns rise on the Foundation's plinth; pillars on a horizontal run, a heading that shrinks, a glass vault.", tags: ["Dark hero", "Horizontal pin", "Iso illustrations"], img: "/extra/foundation-c.webp" },
      { href: "/foundation-d", n: "D", name: "Foundation · People around the world", note: "The world laid flat in dots, places and people linked across it, the Foundation small in Zug; tilting cards, a sliding run of activities.", tags: ["Dot world", "Parallax", "Iso illustrations"], img: "/extra/foundation-d.webp" },
      { href: "/near-foundation", n: "E", name: "Foundation · Living columns", note: "B's page with C's plinth and columns in the hero, alive without scrolling; scrolled, they settle into the pillars' stair, now boxes on the ruled grid. C's \"smaller\" statement on two lines.", tags: ["B + C", "Idle motion", "Ruled stair"], img: "/extra/foundation-e.webp", featured: true },
      { href: "/foundation-f", n: "F", name: "Foundation · Figma", note: "The Figma page (2026_10_Near_Web): the terrace photo hero with two buttons, three pillars on the ruled grid, the mission on a green band, Zug and three facts; then A's Council, operations and ecosystem, and the homepage's close.", tags: ["Figma", "Photo hero", "Green band"], img: "/extra/foundation-f.webp" },
    ],
  },
  {
    id: "analytics",
    title: "Analytics",
    note: "near.org/analytics in the official pages' hand (the homepage, Blog J), two versions of the doc's lean overview; B is /analytics, in the menu. Sample figures: no live feed yet.",
    pages: [
      { href: "/analytics-a", n: "A", name: "Analytics · Overview", note: "The doc read literally on the ruled grid: three core stats, the revenue and status cards side by side, the tools, SVRN and the ETPs. Quiet motion: rows draw in, numbers count up once.", tags: ["Ruled grid", "Top 3 stats", "Quiet"], img: "/extra/analytics-a.webp" },
      { href: "/analytics", n: "B", name: "Analytics · Instrument panel", note: "Mono and tabular: all five stats in a ticker beside the headline, a revenue chart with a crosshair readout, status.near.org-style uptime bars with tooltips, the tools as a dense table.", tags: ["Ticker", "Chart readouts", "Uptime bars"], img: "/extra/analytics-b.webp", featured: true },
    ],
  },
];

export const COUNT = GROUPS.reduce((s, g) => s + g.pages.length, 0);
