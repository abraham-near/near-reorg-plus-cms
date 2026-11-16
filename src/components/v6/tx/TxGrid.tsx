"use client";

import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useHeroTx, track, overlay, span, ease } from "./common";

// B · Into the grid (D109): the page's ruled grid (the proof strip, Go deeper and Origin lower down: v3/proof-deeper, 1 px rules at the page
// margins, a + where lines meet) draws itself over the moving picture, then the picture is put away cell by cell: the margins close in first, as
// the grid's frame, then each cell fills with paper from its foot to its top rule, from the dark forest (bottom right) to the mist (top left), so the
// last of the film the reader sees is the plexus in the sky. The empty grid then draws back off, the way the rows draw on lower down, and the
// intro rises onto plain paper. Transform only: rules scale from their start, cells scale up from their foot, crosses turn in.
const COLS = 5, ROWS = 3;   /* the proof strip's five columns; three rows to the screen */

export function TxGrid({ end }: { pin: number; end: number }) {
  const ref = useHeroTx(({ hero, stage, W, H }) => {
    const root = overlay(stage, "txg");
    let vlines: HTMLElement[] = [], hlines: HTMLElement[] = [], crosses: HTMLElement[] = [], cells: { el: HTMLElement; order: number }[] = [], bands: HTMLElement[] = [];

    const build = () => {
      root.replaceChildren();
      const w = W(), h = H();
      const m = parseFloat(getComputedStyle(root).getPropertyValue("--txg-m")) || 80;
      const xs = Array.from({ length: COLS + 1 }, (_, i) => Math.round(m + ((w - 2 * m) * i) / COLS));
      const ys = Array.from({ length: ROWS - 1 }, (_, i) => Math.round((h * (i + 1)) / ROWS));
      const add = (cls: string, css: Partial<CSSStyleDeclaration>) => { const e = document.createElement("i"); e.className = cls; Object.assign(e.style, css); root.appendChild(e); return e; };
      // paper first (under the rules): the two margin bands, then the cells; a cell's order runs from the bottom right to the top left
      bands = [add("txg-paper txg-band", { left: "0", width: `${xs[0]}px` }), add("txg-paper txg-band", { left: `${xs[COLS]}px`, width: `${w - xs[COLS]}px` })];
      bands[1].style.transformOrigin = "100% 50%";
      const rowEdges = [0, ...ys, h];
      cells = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const el = add("txg-paper", { left: `${xs[c]}px`, width: `${xs[c + 1] - xs[c]}px`, top: `${rowEdges[r]}px`, height: `${rowEdges[r + 1] - rowEdges[r]}px` });
        cells.push({ el, order: (ROWS - 1 - r) + (COLS - 1 - c) });
      }
      const maxOrder = ROWS - 1 + COLS - 1;
      cells.forEach((c) => { c.order /= maxOrder; });
      vlines = xs.map((x) => add("txg-rule txg-rule--v", { left: `${x}px` }));
      hlines = ys.map((y) => add("txg-rule txg-rule--h", { top: `${y}px`, left: `${xs[0]}px`, width: `${xs[COLS] - xs[0]}px` }));
      crosses = [];
      ys.forEach((y) => xs.forEach((x) => crosses.push(add("txg-x", { left: `${x}px`, top: `${y}px` }))));
      render();
    };

    const p = { draw: 0, clear: 0, off: 0 };
    function render() {
      // 1. the rules draw on: verticals from the top, left to right; horizontals from the left, top to bottom; then the crosses turn in
      vlines.forEach((l, i) => { l.style.transform = `scaleY(${ease.out(span(p.draw, i * 0.07, i * 0.07 + 0.55)) * (1 - ease.io(span(p.off, 0.1 + i * 0.06, 0.6 + i * 0.06)))})`; });
      hlines.forEach((l, i) => { l.style.transform = `scaleX(${ease.out(span(p.draw, 0.2 + i * 0.1, 0.75 + i * 0.1)) * (1 - ease.io(span(p.off, i * 0.08, 0.5 + i * 0.08)))})`; });
      crosses.forEach((x, i) => {
        const k = ease.out(span(p.draw, 0.55 + (i % (COLS + 1)) * 0.05, 0.85 + (i % (COLS + 1)) * 0.05)) * (1 - span(p.off, 0, 0.35));
        x.style.transform = `translate(-50%, -50%) scale(${0.2 + 0.8 * k}) rotate(${(1 - k) * -90}deg)`;
        x.style.opacity = k > 0.02 ? "1" : "0";
      });
      // 2. the margins close in, then each cell fills with paper from its foot, in order
      const band = ease.io(span(p.clear, 0, 0.22));
      bands.forEach((b) => { b.style.transform = `scaleX(${band})`; });
      cells.forEach(({ el, order }) => {
        const a = 0.12 + order * 0.66;
        el.style.transform = `scaleY(${ease.in(span(p.clear, a, a + 0.22))})`;   /* fast at the close: no sliver left under the rule */
      });
    }

    build();
    const offs = [
      track(hero, "top -70%", "top -100%", (v) => { p.draw = v; render(); }),
      track(hero, "top -100%", `top -${end}%`, (v) => { p.clear = v; render(); }),
      track(hero, `top -${end}%`, `top -${end + 42}%`, (v) => { p.off = v; render(); }),
    ];
    ScrollTrigger.addEventListener("refresh", build);
    return () => { offs.forEach((f) => f()); ScrollTrigger.removeEventListener("refresh", build); root.remove(); };
  });
  return <span ref={ref} hidden />;
}
