"use client";

import { useHeroTx, track, span, ease, pageMargin, inks, canvasLoop, rule, cross } from "./common";

// H · Into the grid, fine (D111): B kept as it is (the page's grid draws over the film, the margins close, each cell fills with paper from its
// foot, from the dark forest to the misty sky, the plexus staying in the open cells to the end; the empty grid draws back off), with a layer of
// small, fine vector marks: the page's grid (rules, +, 24 px padding, labels, the green line) with print marks added, so the hand-over reads as
// a sheet being ruled up and put away rather than a wipe:
//   - ruler ticks along each rule, eight to a cell (so they meet each + and are symmetric in every cell), 3 px, behind each rule's head;
//   - in each cell, four 8 px crop corners at the 24 px padding, which open as the cell's turn comes (the cell is framed, then put away),
//     and, once it is paper, a two-digit number by its lower-left corner: its place in the order it was put away (01 first), in the labels' face;
//   - a hairline on the paper's leading edge as a cell fills;
//   - the proof strip's green line along the first row's rule as the last cells close, under the + (as on the strip).
// The marks are gone, cell by cell, as the intro's first line enters; then the rules draw off. One canvas over the stage, redrawn only
// when the scroll moves; no film sampling (the film and the plexus show through wherever the canvas is clear).
const COLS = 5, ROWS = 3, PAD = 24, TICKS = 8;

export function TxGridFine({ end }: { pin: number; end: number }) {
  const ref = useHeroTx(({ hero, stage }) => {
    const c = inks(stage);
    const css = getComputedStyle(stage);
    const SANS = css.getPropertyValue("--font-sans").trim() || "ui-sans-serif, system-ui, sans-serif";
    const MUTED = css.getPropertyValue("--color-muted").trim() || c.ink;
    const p = { draw: 0, clear: 0, off: 0 };
    // a cell's place in the order (bottom right first, top left last, along the diagonals, as B)
    const order: { r: number; col: number; o: number; n: number }[] = [];
    for (let r = 0; r < ROWS; r++) for (let col = 0; col < COLS; col++) order.push({ r, col, o: ((ROWS - 1 - r) + (COLS - 1 - col)) / (ROWS - 1 + COLS - 1), n: 0 });
    [...order].sort((a, b) => a.o - b.o || b.r - a.r || b.col - a.col).forEach((cell, i) => { cell.n = i + 1; });

    const line = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, alpha: number, color = c.ink) => {
      ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.globalAlpha = 1;
    };
    const px = (n: number) => Math.round(n) + 0.5;

    const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const m = pageMargin(w), cw = (w - 2 * m) / COLS, ch = h / ROWS;
      const xs = Array.from({ length: COLS + 1 }, (_, i) => m + cw * i);
      const ys = [0, ch, 2 * ch, h];
      const offAll = span(p.off, 0, 0.35);

      // 1. paper: the margins close in, then each cell fills from its foot (fast at the close: no sliver left under the rule)
      const band = ease.io(span(p.clear, 0, 0.22)) * m;
      ctx.fillStyle = c.paper;
      if (band > 0) { ctx.fillRect(0, 0, band, h); ctx.fillRect(w - band, 0, band, h); }
      for (const cell of order) {
        const a = 0.12 + cell.o * 0.66;
        const k = ease.in(span(p.clear, a, a + 0.22));
        const x = xs[cell.col], y = ys[cell.r], ht = ys[cell.r + 1] - y;
        const front = y + ht * (1 - k);
        if (k > 0) { ctx.fillStyle = c.paper; ctx.fillRect(x, front, cw, y + ht - front); }
        // the leading edge: a hairline across the cell at the paper's front
        if (k > 0.01 && k < 0.995) {
          const fy = px(front);
          line(ctx, x + 1, fy, x + cw, fy, 0.4);
        }
      }

      // 2. the cells' marks: crop corners at the 24 px padding open as the cell's turn comes; once the cell is paper its number is set by the
      //    lower-left corner. They leave cell by cell as the intro's first line enters (whole: a corner under 2 px or a part-glyph is not drawn)
      ctx.font = `500 11px ${SANS}`;
      ctx.textBaseline = "alphabetic";
      if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0.77px";
      for (const cell of order) {
        const a = 0.12 + cell.o * 0.66;
        const out = span(p.off, (1 - cell.o) * 0.25, (1 - cell.o) * 0.25 + 0.15);
        const k = ease.out(span(p.clear, a - 0.1, a + 0.06)) * (1 - ease.in(out));
        const x = xs[cell.col], y = ys[cell.r], ht = ys[cell.r + 1] - y;
        const x1 = px(x + PAD), x2 = px(x + cw - PAD), y1 = px(y + PAD), y2 = px(y + ht - PAD);
        if (k * 8 >= 2) {
          const L = 8 * k;
          for (const [cx, cy, dx, dy] of [[x1, y1, 1, 1], [x2, y1, -1, 1], [x1, y2, 1, -1], [x2, y2, -1, -1]] as const) {
            // over the film until the paper reaches them: ink, with the pale edge the rules have
            line(ctx, cx + 1, cy + 1, cx + dx * L + 1, cy + 1, 0.4, c.onDark); line(ctx, cx + 1, cy + 1, cx + 1, cy + dy * L + 1, 0.4, c.onDark);
            line(ctx, cx, cy, cx + dx * L, cy, 0.55); line(ctx, cx, cy, cx, cy + dy * L, 0.55);
          }
        }
        const paper = span(p.clear, a, a + 0.22) >= 1;
        if (paper && out < 0.5) {
          ctx.fillStyle = MUTED;
          ctx.fillText(String(cell.n).padStart(2, "0"), x1 + 14, y2 + 1);
        }
      }

      // 3. the rules (B's order), with ruler ticks every 24 px riding behind each rule's head
      xs.forEach((x, i) => {
        const k = ease.out(span(p.draw, i * 0.07, i * 0.07 + 0.55)) * (1 - ease.io(span(p.off, 0.1 + i * 0.06, 0.6 + i * 0.06)));
        rule(ctx, c, x, 0, x, h, k);
        const head = h * k, side = i === COLS ? -1 : 1;
        for (let r = 0; r < ROWS; r++) for (let j = 1; j < TICKS; j++) {
          const t = ys[r] + ((ys[r + 1] - ys[r]) * j) / TICKS;
          if (t > head - 2) break;
          line(ctx, px(x), px(t) + 1, px(x + side * 3), px(t) + 1, 0.4, c.onDark); line(ctx, px(x), px(t), px(x + side * 3), px(t), 0.35);
        }
      });
      [ys[1], ys[2]].forEach((y, i) => {
        const k = ease.out(span(p.draw, 0.2 + i * 0.1, 0.75 + i * 0.1)) * (1 - ease.io(span(p.off, i * 0.08, 0.5 + i * 0.08)));
        rule(ctx, c, xs[0], y, xs[COLS], y, k);
        const head = xs[0] + (xs[COLS] - xs[0]) * k;
        for (let col = 0; col < COLS; col++) for (let j = 1; j < TICKS; j++) {
          const t = xs[col] + (cw * j) / TICKS;
          if (t > head - 2) break;
          line(ctx, px(t) + 1, px(y), px(t) + 1, px(y + 3), 0.4, c.onDark); line(ctx, px(t), px(y), px(t), px(y + 3), 0.35);
        }
      });

      // 4. the proof strip's green line along the first row's rule as the last cells close, under the + (as on the strip); it goes back to
      //    the left margin as the grid draws off
      const gIn = ease.out(span(p.clear, 0.78, 1)), gOut = ease.io(span(p.off, 0, 0.4));
      if (gIn > 0 && gOut < 1) {
        const mid = (xs[0] + xs[COLS]) / 2, half = ((xs[COLS] - xs[0]) / 2) * gIn;
        const l = mid - half, r = mid + half, rr = r - (r - xs[0]) * gOut;
        ctx.fillStyle = c.green;
        ctx.fillRect(l, Math.round(ys[1]) - 0.5, Math.max(0, rr - l), 2);
      }

      // 5. the + where rules meet
      [ys[1], ys[2]].forEach((y) => xs.forEach((x, i) => cross(ctx, c, x, y, ease.out(span(p.draw, 0.55 + i * 0.05, 0.85 + i * 0.05)) * (1 - offAll))));
    };

    const stop = canvasLoop(stage, draw, () => `${p.draw.toFixed(4)}|${p.clear.toFixed(4)}|${p.off.toFixed(4)}`);
    const offs = [
      track(hero, "top -66%", "top -100%", (v) => { p.draw = v; }),
      track(hero, "top -100%", `top -${end}%`, (v) => { p.clear = v; }),
      track(hero, `top -${end}%`, `top -${end + 30}%`, (v) => { p.off = v; }),
    ];
    return () => { offs.forEach((o) => o()); stop(); };
  });
  return <span ref={ref} hidden />;
}
