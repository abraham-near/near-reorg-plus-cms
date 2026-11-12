// The extra pages listed at /extra, by group. Add a page here (and its 1200×750 capture in public/extra/) and it shows up in the index.
export type Extra = { href: string; n: string; name: string; note: string; tags: string[]; img: string };
export type Group = { id: string; title: string; note: string; pages: Extra[] };

export const GROUPS: Group[] = [
  {
    id: "blog",
    title: "Blog index",
    note: "Six directions for the blog's index page, on v3's header, grid and footer. Same twelve posts in each.",
    pages: [
      { href: "/blog-a", n: "A", name: "Editorial", note: "A large heading, the filters, the lead post large, then cards three to a row and Load more.", tags: ["Featured post", "Cards", "Load more"], img: "/extra/blog-a.webp" },
      { href: "/blog-b", n: "B", name: "Magazine", note: "An issue: the newest post as a cover that opens to the whole screen, then Customer stories and Inside NEAR.", tags: ["Cover bleed", "Sections", "Scroll motion"], img: "/extra/blog-b.webp" },
      { href: "/blog-c", n: "C", name: "Archive", note: "Every post on one numbered list with search and filters; a row fills with ink and the photo beside it swaps.", tags: ["Search", "Dense list", "Hover preview"], img: "/extra/blog-c.webp" },
      { href: "/blog-d", n: "D", name: "Newsroom", note: "A search-led front page: Latest, a row of stories, the talks on a dark band and the full list. Searching swaps it for results.", tags: ["Search first", "Mixed sections", "Dark band"], img: "/extra/blog-d.webp" },
      { href: "/blog-e", n: "E", name: "Reading rail", note: "A sticky rail with search, type, sort and view beside the feed; counts in the hero, pages of six.", tags: ["Sidebar", "Sort + view", "Pagination"], img: "/extra/blog-e.webp" },
      { href: "/blog-f", n: "F", name: "By format", note: "A typeahead search, then a layout per format: stories in alternating rows, a talk player with its playlist, the read.", tags: ["Typeahead", "Per format", "Grid / list"], img: "/extra/blog-f.webp" },
    ],
  },
  {
    id: "post",
    title: "Blog post",
    note: "Three layouts for a single post, on v4's header and footer. The same example article on AI agents, with the same photos, in each.",
    pages: [
      { href: "/post-a", n: "A", name: "Ruled", note: "The index's ruled grid carried into the article: a row of facts, the photo in its cell, contents | text | margin notes.", tags: ["Ruled grid", "Sticky contents", "Margin notes"], img: "/extra/post-a.webp" },
      { href: "/post-b", n: "B", name: "Cover", note: "A magazine feature: the photo fills the first screen, a drop cap, pictures that leave the column, figures on an ink band, Up next.", tags: ["Full-screen cover", "Reading line", "Footnotes"], img: "/extra/post-b.webp" },
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
    ],
  },
  {
    id: "base",
    title: "Base",
    note: "Where new pages start.",
    pages: [
      { href: "/template", n: "T", name: "Page template", note: "The shared header, sections and footer; renders in any direction (the switch at the bottom left).", tags: ["Shared pieces", "v1 / v2 / v3"], img: "/extra/template.webp" },
    ],
  },
];

export const COUNT = GROUPS.reduce((s, g) => s + g.pages.length, 0);
