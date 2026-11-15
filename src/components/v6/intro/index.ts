// home-v6's intro layout studies (D144; round 2, D145: from B and C, on a twelve-column grid): the same statement, wipe and marker, laid out six ways; one page each at /home-v6/intro/<key>, the board at
// /home-v6/intro. Styles: ./intro.css (scoped by the section's data-st). `refs`: the real sites each layout draws on (research, D144).
export type StKey = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l";
export type St = { key: StKey; round: 1 | 2; name: string; note: string; basis: string; tag?: string; refs: { label: string; href: string }[] };
export const ST_KEYS: StKey[] = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"];

export const ST: Record<StKey, St> = {
  a: {
    key: "a", round: 1, name: "The mark beside", tag: "Larger NEAR mark",
    note: "The green N tile, nearly three lines tall, stands to the left of the paragraph, its top on the first line's cap height. The text comes down a size (3.5 u) so the tile and the six lines fit one centred column.",
    basis: "A brand element standing in the gutter beside the statement (Pitch's label), here the mark itself, large.",
    refs: [{ label: "Pitch · Why Pitch (label in the gutter, statement in an offset column)", href: "https://pitch.com" }, { label: "Mistral · About (centred, marks above, faint to ink on scroll)", href: "https://mistral.ai/about" }],
  },
  b: {
    key: "b", round: 1, name: "On the grid",
    note: "The lower sections' ruled frame comes up to the intro: a hairline across the page margins with a + at each end and at the first column, the tile on the first of five columns' line, under its +, the paragraph across the other four.",
    basis: "The proof strip / Go deeper grid lower on /home-v6 (v3/proof-deeper), and the grid the hero hands over through (transition I).",
    refs: [{ label: "Pitch · Why Pitch (label in the gutter, statement in an offset column)", href: "https://pitch.com" }, { label: "Daylight · letter (big heading over a column set to the right)", href: "https://daylightcomputer.com" }],
  },
  c: {
    key: "c", round: 1, name: "Lead and follow",
    note: "The first sentence becomes the headline, across the page; the rest follows at reading size in a column from 40 % in. The wipe reads the headline, then the column; the marker ends it.",
    basis: "A big heading over a smaller column set to the right (Daylight), the lead-then-rest split (Attio).",
    refs: [{ label: "Daylight · letter (big heading over a column set to the right)", href: "https://daylightcomputer.com" }, { label: "Attio · Platform (lead in ink, the rest after a break)", href: "https://attio.com" }],
  },
  d: {
    key: "d", round: 1, name: "Centred",
    note: "The tile over a centred paragraph in the six authored lines, held in the middle of the screen.",
    basis: "Centred statements with a mark or label above; Mistral's is the closest to our wipe (faint to ink as you scroll).",
    refs: [{ label: "Mistral · About (centred, marks above, faint to ink on scroll)", href: "https://mistral.ai/about" }, { label: "OpenAI · About (centred mission line)", href: "https://openai.com/about" }, { label: "Attio · Platform (lead in ink, the rest after a break)", href: "https://attio.com" }],
  },
  e: {
    key: "e", round: 1, name: "Full measure",
    note: "A size up (4.55 u), across the page's margins rather than the hero's column, with the tile set into the first line like a drop mark at the cap height.",
    basis: "Wide statements on the page margin (Linear, Anthropic), here a size larger than theirs.",
    refs: [{ label: "Linear · statement on the page margin, lead in ink, rest in grey", href: "https://linear.app" }, { label: "Anthropic · wide hero statement on the page margin", href: "https://www.anthropic.com" }],
  },
  f: {
    key: "f", round: 1, name: "Two tones",
    note: "One wide paragraph on the page margin at the size the reference sites use (3.4 u, 49 px at 1440): the first sentence is wiped to ink and the rest from fainter to grey, so the wipe ends on a lead and a follow; the marker phrase ends in ink on the green.",
    basis: "The most common pattern found: a lead in ink, the rest muted, in one paragraph (Linear, Stripe, Attio).",
    refs: [{ label: "Linear · statement on the page margin, lead in ink, rest in grey", href: "https://linear.app" }, { label: "Stripe · hero, lead dark, rest muted", href: "https://stripe.com" }, { label: "Attio · Platform (lead in ink, the rest after a break)", href: "https://attio.com" }],
  },
  g: {
    key: "g", round: 2, name: "Lead and follow, on twelve columns", tag: "In use on /home-v6",
    note: "C on the page's twelve columns: the lead across all twelve with the tile set into its first line at cap height; the follow at half its size from column 5, its left edge on a column line. Two sizes, 2 : 1. The tile 10 % over the cap height; the layout in use on /home-v6 (D147).",
    basis: "An asymmetric grid: one wide field for the display line, a narrower one for reading; the empty columns 1–4 under the lead hold the step down.",
    refs: [{ label: "Daylight · letter (big heading over a column set to the right)", href: "https://daylightcomputer.com" }, { label: "Attio · Platform (lead in ink, the rest after a break)", href: "https://attio.com" }],
  },
  h: {
    key: "h", round: 2, name: "Headline and deck", tag: "From C",
    note: "The lead as a headline over two lines in columns 1–7; the rest beside it in columns 8–12 at half the size, their cap heights on one line. The tile above the headline, at its cap height.",
    basis: "The editorial headline-and-deck pair: two fields side by side, hung from one line, one size twice the other.",
    refs: [{ label: "Daylight · letter (big heading over a column set to the right)", href: "https://daylightcomputer.com" }],
  },
  i: {
    key: "i", round: 2, name: "On the ruler", tag: "From B",
    note: "B on twelve columns: the rule across is ticked mid-gutter between every two columns, so the grid itself shows; the tile from the first line's cap to the third's baseline; the six authored lines in columns 4–12 behind a column rule.",
    basis: "The grid made visible as a measure (a ruler); the tile and the text each start on a tick.",
    refs: [{ label: "Pitch · Why Pitch (label in the gutter, statement in an offset column)", href: "https://pitch.com" }],
  },
  j: {
    key: "j", round: 2, name: "In ruled cells", tag: "From B",
    note: "A rule above and below make a band of two cells: the N alone in ink (no green square) in columns 1–3, the six lines in 4–12. A + wherever two rules meet. The green is left to the marker.",
    basis: "A table-like frame: fields closed by rules on four sides, as a spec sheet; the mark as a label in its own cell.",
    refs: [{ label: "Pitch · Why Pitch (label in the gutter, statement in an offset column)", href: "https://pitch.com" }],
  },
  k: {
    key: "k", round: 2, name: "Ruled lead and follow", tag: "B + C",
    note: "C's sizes in B's frame: a rule, the lead across all twelve columns, a second rule, then the tile in column 1 and the follow in 5–12 behind a column rule that drops from a + on the second rule.",
    basis: "The headline in its own band; the band under it split into a label column and a text column, all on rules.",
    refs: [{ label: "Daylight · letter (big heading over a column set to the right)", href: "https://daylightcomputer.com" }, { label: "Pitch · Why Pitch (label in the gutter, statement in an offset column)", href: "https://pitch.com" }],
  },
  l: {
    key: "l", round: 2, name: "The margin and the text", tag: "B + C",
    note: "A ruled margin column (columns 1–2) holds the tile, from the lead's first cap height to its second baseline; the lead and the follow hang from column 3, the follow at half the lead's size in eight columns, a reading measure.",
    basis: "The hanging margin of a book or a report: the mark as the margin's label, the text block one clean left edge.",
    refs: [{ label: "Pitch · Why Pitch (label in the gutter, statement in an offset column)", href: "https://pitch.com" }, { label: "Daylight · letter (big heading over a column set to the right)", href: "https://daylightcomputer.com" }],
  },
};
