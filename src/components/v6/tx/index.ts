import type { ComponentType } from "react";
import { TxLine } from "./TxLine";
import { TxGrid } from "./TxGrid";
import { TxHorizon } from "./TxHorizon";
import { TxPaper } from "./TxPaper";
import { TxHalftone } from "./TxHalftone";
import { TxCells } from "./TxCells";
import { TxMosaic } from "./TxMosaic";
import { TxGridFine } from "./TxGridFine";

// home-v6's hero-to-intro transition studies (D109; F and G, two more takes on B's grid, D110; H, B with fine marks, D111), one page each at /home-v6/<key>; the index is /home-v6/transitions.
// `pin`: the sticky range in % of the screen (the hero is 100 svh + pin). `over`: how far the intro pulls up over the pin's end (% of the screen,
// tx.css), so its first line enters at txEnd() = pin + 28 - over (its N tile sits ~28 % of a screen into it). Each study, and the film, ends there.
export type TxKey = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
export type Tx = { key: TxKey; name: string; note: string; basis: string; refs: { label: string; href: string }[]; pin: number; over: number; C: ComponentType<{ pin: number; end: number }> };

export const TX: Record<TxKey, Tx> = {
  a: {
    key: "a", name: "The line", pin: 200, over: 100, C: TxLine,
    note: "A green thread drops into the film; paper curtains close in from both edges until only the thread is left; its head lands on the intro's N tile, rides up with it and draws back into it.",
    basis: "home-v2's original close-in (D29, D35), re-aimed at v5's N tile.",
    refs: [{ label: "home-v2 original", href: "/home-v2?hero=original" }],
  },
  b: {
    key: "b", name: "Into the grid", pin: 220, over: 110, C: TxGrid,
    note: "The page's ruled grid (margins, five columns, + crosses) draws itself over the film; the margins close, then each cell fills with paper from the dark forest to the misty sky; the empty grid draws back off.",
    basis: "The proof strip / Go deeper / Origin grid lower on the page (v3/proof-deeper), and SVG-mask grid reveals.",
    refs: [{ label: "Codrops · SVG mask transitions on scroll (2026)", href: "https://tympanus.net/codrops/2026/03/11/svg-mask-transitions-on-scroll-with-gsap-and-scrolltrigger/" }],
  },
  c: {
    key: "c", name: "Horizon", pin: 200, over: 115, C: TxHorizon,
    note: "The film closes vertically onto a ridge until it is a slit, the slit becomes a hairline across the screen, the hairline draws in to the page margins with a + at each end and comes to rest above the intro: the horizon becomes the page's first rule.",
    basis: "Clip-to-slit exits and line-draw hand-offs.",
    refs: [
      { label: "scroll-driven-animations.style · image reveal", href: "https://scroll-driven-animations.style/demos/image-reveal/css/" },
      { label: "Codrops · scroll-driven SVG line drawing (2026)", href: "https://tympanus.net/codrops/2026/05/21/creating-scroll-driven-svg-map-animations-with-gsap" },
    ],
  },
  d: {
    key: "d", name: "Paper over", pin: 180, over: 100, C: TxPaper,
    note: "The intro is a sheet of paper with a hairline top edge that slides up over the pinned film; the film keeps running beneath it and drifts up a little slower, so the picture slides away under the words.",
    basis: "Layered pinning: the next section scrolls over a pinned hero.",
    refs: [{ label: "GSAP · layered pinning", href: "https://codepen.io/GreenSock/pen/VwbywPd" }],
  },
  e: {
    key: "e", name: "Halftone", pin: 220, over: 100, C: TxHalftone,
    note: "A hard front sweeps down the screen and turns the film into a halftone of ink dots on paper, still moving with the camera; then a second hard front of paper wipes the dots away from the top and leaves the paper for the intro.",
    basis: "Ordered-dither and halftone dissolves; the dots rhyme with the plexus.",
    refs: [
      { label: "Codrops · real-time dithering shader (2025)", href: "https://tympanus.net/codrops/2025/06/04/building-a-real-time-dithering-shader/" },
    ],
  },
  f: {
    key: "f", name: "Grid · photo cells", pin: 240, over: 118, C: TxCells,
    note: "The grid draws on and the film breaks into fifteen prints, cell by cell: a paper border opens inside each cell's rules and the picture pushes in, so one picture becomes a sheet of photos. Then each print closes from its foot to its top rule, the way photos open lower down, and the proof strip's green line draws out along the first rule.",
    basis: "Go deeper and Origin's photos in their cells (fill, top-down opening, 1.12 → 1, parallax) and the proof strip's green line (v3/proof-deeper).",
    refs: [{ label: "The grid on /home-v6 (proof strip, Go deeper, Origin)", href: "/home-v6" }],
  },
  g: {
    key: "g", name: "Grid · mosaic", pin: 240, over: 110, C: TxMosaic,
    note: "The grid draws on, then the film is cut into flat tiles of its own colours at 20 columns, 10 and finally the grid's 5, each step a hard cut, the ridges still drifting in the blocks. The five-column tiles are then put away darkest first, so it ends on the mist.",
    basis: "The grid's five columns and soft inner rules (v3/proof-deeper); pixel-step dissolves, stepped to the grid.",
    refs: [{ label: "The grid on /home-v6 (proof strip, Go deeper, Origin)", href: "/home-v6" }],
  },
  h: {
    key: "h", name: "Into the grid · fine", pin: 230, over: 110, C: TxGridFine,
    note: "B as it is, with fine print marks added to the grid: ruler ticks, eight to a cell, riding behind each rule; crop corners opening in each cell as its turn comes; a hairline on the paper's leading edge; once a cell is paper, a two-digit number for its place in the order; the proof strip's green line under the + as the last cells close. The marks leave before the intro arrives.",
    basis: "B, with print marks (ticks, crop corners, order numbers) added to the page's grid (v3/proof-deeper: 1 px rules, the +, 24 px padding, the labels' face, the green line).",
    refs: [{ label: "The grid on /home-v6 (proof strip, Go deeper, Origin)", href: "/home-v6" }],
  },
};
export const txEnd = (t: Tx) => t.pin + 28 - t.over;
export const TX_KEYS = Object.keys(TX) as TxKey[];
