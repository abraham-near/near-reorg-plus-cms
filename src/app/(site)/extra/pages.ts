// The extra pages listed at /extra, by group: explorations and the versions that were not chosen. The final pages are listed at /index (../index/pages.ts).
// Add a page here (and its 1200×750 picture in public/extra/: `npm run capture -- <href> public/extra/<name>.webp`) and it shows up at /extra.
// featured: the chosen direction in its group (a badge on the picture); it is also a card at /index.
export type Extra = { href: string; n: string; name: string; note: string; tags: string[]; img: string; featured?: boolean };
export type Group = { id: string; title: string; note: string; pages: Extra[] };

export const GROUPS: Group[] = [
  {
    id: "blog",
    title: "Blog",
    note: "The blog index (near.org/blog), four versions: A is the live /blog; B and D are the October 2026 Figma's two blog frames (2026_10_Near_Web, nodes 980:723 and 756:41); C is B on the homepage's soft ruled grid. All list the CMS's live posts, then the Go deeper reads, stories and talks.",
    pages: [
      { href: "/blog", n: "A", name: "Blog · Reading rail", note: "The live blog (direction J): the ruled head, a sticky rail with search, type, sort and view, the posts as open cards or rows, the state in the URL.", tags: ["Live", "Sticky rail", "Grid or list"], img: "/extra/blog-a.webp", featured: true },
      { href: "/blog-index-b", n: "B", name: "Blog · Figma, featured", note: "Figma node 980:723: the heading with search, type chips, a large featured post beside three numbered rows with thumbnails, then boxed cards three to a row and numbered pages.", tags: ["Figma", "Featured + list", "Boxed cards"], img: "/extra/blog-b.webp" },
      { href: "/blog-index-c", n: "C", name: "Blog · Figma on the grid", note: "B's layout on the homepage's ruled grid, kept light: hairline columns and crosshairs at the joins instead of boxes, open cards in the cells.", tags: ["Figma", "Soft ruled grid", "Homepage hand"], img: "/extra/blog-c.webp" },
      { href: "/blog-index-d", n: "D", name: "Blog · Figma, lead card", note: "Figma node 756:41: a type menu and search over one wide lead card (photo | text), then the type chips, boxed cards three to a row and numbered pages.", tags: ["Figma", "Lead card", "Type menu"], img: "/extra/blog-d.webp" },
    ],
  },
  {
    id: "post",
    title: "Blog post",
    note: "Four layouts for a single post, on v4's header and footer, plus V for video posts. The same example article on AI agents, with the same photos, in each.",
    pages: [
      { href: "/post-a", n: "A", name: "Ruled", note: "The index's ruled grid carried into the article: a row of facts, the photo in its cell, contents | text | margin notes.", tags: ["Ruled grid", "Sticky contents", "Margin notes"], img: "/extra/post-a.webp" },
      { href: "/post-b", n: "B", name: "Cover", note: "A magazine feature: the photo fills the first screen, a drop cap, pictures that leave the column, figures on an ink band, Up next.", tags: ["Full-screen cover", "Reading line", "Footnotes"], img: "/extra/post-b.webp", featured: true },
      { href: "/post-c", n: "C", name: "Notebook", note: "A reference read: split opening, a sticky rail with contents that fill as you read, time left and the takeaways; boxed notes.", tags: ["Split hero", "Progress rail", "Docs feel"], img: "/extra/post-c.webp" },
      { href: "/post-v", n: "V", name: "Video", note: "A video post (the CMS's Format: Video): A's ruled grid kept simple, the video edge to edge where the photo goes (an uploaded MP4 or a YouTube/Vimeo player), a short text, Keep watching and reading. Shown as Watch in the blog index.", tags: ["Video", "Ruled grid", "CMS Format: Video"], img: "/extra/post-v.webp" },
      { href: "/post-d", n: "D", name: "Poster", note: "The October 2026 Figma's blog in a post: the cover as a poster (title, kicker and logo set on the photo, boxed in white), mono labels with the green square, takeaways and figures in white boxes, Keep reading as the index's boxed cards.", tags: ["Figma", "Poster cover", "Boxed cards"], img: "/extra/post-d.webp" },
    ],
  },
  {
    id: "analytics",
    title: "Analytics",
    note: "near.org/analytics in the official pages' hand (the homepage, Blog J), five versions of the doc's lean overview; C is /analytics, in the menu. Sample figures: no live feed yet.",
    pages: [
      { href: "/analytics-a", n: "A", name: "Analytics · Overview", note: "The doc read literally on the ruled grid: three core stats, the revenue and status cards side by side, the tools, SVRN and the ETPs. Quiet motion: rows draw in, numbers count up once.", tags: ["Ruled grid", "Top 3 stats", "Quiet"], img: "/extra/analytics-a.webp" },
      { href: "/analytics-b", n: "B", name: "Analytics · Instrument panel", note: "Mono and tabular: all five stats in a ticker beside the headline, a revenue chart with a crosshair readout, status.near.org-style uptime bars with tooltips, the tools as a dense table.", tags: ["Ticker", "Chart readouts", "Uptime bars"], img: "/extra/analytics-b.webp" },
      { href: "/analytics", n: "C", name: "Analytics · Ruled grid", note: "The homepage's ruled grid and Blog J's ruled hero: the doc's page as rows of cells with crosshairs, mono labels and the Kepler accent; revenue and network health side by side on the paper.", tags: ["Ruled grid", "Homepage hand"], img: "/extra/analytics-c.webp", featured: true },
      { href: "/analytics-d", n: "D", name: "Analytics · Drawn", note: "NEAR Foundation's isometric hand: the numbers and the products told with line drawings that build as you scroll.", tags: ["Iso drawings", "Foundation hand"], img: "/extra/analytics-d.webp" },
      { href: "/analytics-e", n: "E", name: "Analytics · Editorial", note: "The homepage's big type and dark bands (the Stack, the Council): a calm editorial read with one dark band for the network.", tags: ["Editorial", "Dark band"], img: "/extra/analytics-e.webp" },
    ],
  },
  {
    id: "community",
    title: "Community",
    note: "near.org/community from the October 2026 doc (Revamp: Layout & Copy), three versions in the official pages' hand. Sample figures and events until the real ones and the Luma feed are in. B is /community, in the menu.",
    pages: [
      { href: "/community-a", n: "A", name: "Community · Ruled grid", note: "The homepage's ruled grid and Blog J's ruled hero: stats, events, the Legion, socials and the ways in as rows of cells with crosshairs.", tags: ["Ruled grid", "Homepage hand"], img: "/extra/community-a.webp" },
      { href: "/community", n: "B", name: "Community · Drawn", note: "NEAR Foundation's isometric hand: the community as line drawings (people, places, events) that build as you scroll.", tags: ["Iso drawings", "Foundation hand"], img: "/extra/community-b.webp", featured: true },
      { href: "/community-c", n: "C", name: "Community · Editorial", note: "The homepage's big type, photos that bleed and a dark band for the Legion: a warm editorial page.", tags: ["Editorial", "Dark band"], img: "/extra/community-c.webp" },
    ],
  },
  {
    id: "history",
    title: "History",
    note: "near.org/history (History, \"From 2017 to now\" in the menu), three versions in the official pages' hand. The October 2026 doc has no copy for it: the timeline is near.org/roadmap-history's milestones, the rest adapted from the doc's Anthem Video beats (components/history/content.ts). C is /about, in the menu.",
    pages: [
      { href: "/history-a", n: "A", name: "History · Ruled grid", note: "The homepage's ruled grid and Blog J's ruled hero: an index of years, then the timeline as a ledger of entries in four chapters, with a green marker that runs down it as you read.", tags: ["Ruled grid", "Ledger", "Homepage hand"], img: "/extra/history-a.webp" },
      { href: "/history-b", n: "B", name: "History · Drawn", note: "NEAR Foundation's isometric hand: ten years as line drawings that build as you scroll, a road of years climbing to now, and today's stack on the dark.", tags: ["Iso drawings", "Foundation hand", "Timeline"], img: "/extra/history-b.webp" },
      { href: "/history", n: "C", name: "History · Editorial", note: "The homepage's big type: the bw whiteboard bleeding into the origin essay, a sticky year that rolls as each milestone passes, the stack on a dark band.", tags: ["Editorial", "Sticky year", "Dark band"], img: "/extra/history.webp", featured: true },
    ],
  },
  {
    id: "economics",
    title: "Economics",
    note: "near.org/economics from the October 2026 doc, three versions in the official pages' hand. Copy verbatim (components/economics/content.ts); no moving figures, by the doc's design: live numbers stay at revenue.near.org. A is /economics, in the menu.",
    pages: [
      { href: "/economics", n: "A", name: "Economics · Ruled grid", note: "The homepage's ruled grid: the four facts as the proof strip, the loop drawn as four cells and a ring that lights step by step as you scroll, one asset on the dark band.", tags: ["Ruled grid", "Scroll diagram", "Proof strip"], img: "/extra/economics-a.webp", featured: true },
      { href: "/economics-b", n: "B", name: "Economics · Drawn", note: "NEAR Foundation's isometric hand: the economy as a machine, a flywheel that builds station by station as the four steps scroll past, the facts on plinths, two engines feeding the loop.", tags: ["Iso drawings", "Foundation hand", "Flywheel"], img: "/extra/economics-b.webp" },
      { href: "/economics-c", n: "C", name: "Economics · Editorial", note: "The homepage's big type: the four facts as large figures, the loop as a held dark band where a dot travels a ring as each step comes up.", tags: ["Editorial", "Pinned loop", "Dark band"], img: "/extra/economics-c.webp" },
    ],
  },
  {
    id: "solutions",
    title: "Solutions",
    note: "near.org/solutions (Solutions, \"Explore use cases\" in the menu) from the October 2026 doc's Solutions Hub copy, three versions in the official pages' hand. Copy verbatim (components/solutions/content.ts); the logo wall uses the partner files in the repo, the rest set as names until their logos are in.",
    pages: [
      { href: "/solutions-a", n: "A", name: "Solutions · Ruled grid", note: "The homepage's ruled grid as a precise index: the five solutions as ruled rows (number, title, body, builder chips, link) that light as you scroll, Confidential Intents on the dark band, the builders as a ruled logo wall.", tags: ["Ruled grid", "Scroll index", "Logo wall"], img: "/extra/solutions-a.webp" },
      { href: "/solutions-b", n: "B", name: "Solutions · Drawn", note: "NEAR Foundation's isometric hand: each solution a small machine that builds as you scroll (payments crossing chains, agents settling, solvers bidding, a vault rebalancing, an enclave with the host locked out), the private shard under redaction bars.", tags: ["Iso drawings", "Foundation hand", "Builds on scroll"], img: "/extra/solutions-b.webp" },
      { href: "/solutions-c", n: "C", name: "Solutions · Editorial", note: "The homepage's big type and bw photos: the five solutions as chapters whose numeral and title hold while the story passes, the spotlight on a dark band, a quiet logo wall.", tags: ["Editorial", "Sticky chapters", "Dark band"], img: "/extra/solutions-c.webp" },
    ],
  },
  {
    id: "research",
    title: "Research",
    note: "near.org/research (Research, \"White paper and protocol work\" in the menu; near.org/papers redirects here), three versions in the official pages' hand. Hero and paper list from the October 2026 doc's Technical Papers note, summaries from the live papers page (components/research/content.ts).",
    pages: [
      { href: "/research-a", n: "A", name: "Research · Ruled grid", note: "The papers as a library catalogue on the ruled grid: topic chips in the hero's bar, one ruled row per paper (number, title and summary, topic, year, source, read).", tags: ["Ruled grid", "Catalogue", "Topic filter"], img: "/extra/research-a.webp" },
      { href: "/research-b", n: "B", name: "Research · Drawn", note: "NEAR Foundation's isometric hand: the four papers drawn as a stack in the hero, then a card grid where each paper's iso cover builds as you scroll, under a topic filter.", tags: ["Iso drawings", "Paper covers", "Topic filter"], img: "/extra/research-b.webp" },
      { href: "/research-c", n: "C", name: "Research · Editorial", note: "A journal and its contents in the homepage's big type: the White Paper as a cover over a bleeding bw photo, the other papers as a ruled list with huge numerals, the user-owned AI papers on the dark band.", tags: ["Editorial", "Contents list", "Dark band"], img: "/extra/research-c.webp" },
    ],
  },
  {
    id: "brand",
    title: "Brand",
    note: "near.org/brand (Brand, \"Logos and guidelines\" in the menu), three versions in the official pages' hand. The doc has no copy for it and near.org/brand is a 404: the copy is adapted from the doc's agency brief (logo, green, fonts, voice), with the site's own palette and the SVGs in public/brand/ (components/brand/content.ts).",
    pages: [
      { href: "/brand-a", n: "A", name: "Brand · Ruled grid", note: "A specimen sheet on the ruled grid: every logo file on its own plate with an SVG download, do/don't drawn on the real marks, swatches that copy their hex, the two faces set large.", tags: ["Ruled grid", "Downloads", "Specimens"], img: "/extra/brand-a.webp" },
      { href: "/brand-b", n: "B", name: "Brand · Drawn", note: "The brand book as a construction drawing: the real mark stands on its tile while its keylines, clear space and dimensions draw themselves as you scroll; colour as an iso stack in proportion, the files as specimen plates.", tags: ["Iso drawings", "Construction", "Scroll-built"], img: "/extra/brand-b.webp" },
      { href: "/brand-c", n: "C", name: "Brand · Editorial", note: "The homepage's big type as a brand book: the logo across the page, the files on paper tiles and ink bands, the palette as full-bleed bands sized by use, giant type specimens and the voice on the dark band.", tags: ["Editorial", "Swatch bands", "Type specimens"], img: "/extra/brand-c.webp" },
    ],
  },
];

export const COUNT = GROUPS.reduce((s, g) => s + g.pages.length, 0);
