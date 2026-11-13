"use client";

import { useHeroTx, track, span, ease, pageMargin, inks, film, canvasLoop, rule, cross } from "./common";

// F · Grid, photo cells (D110): B's grid with more of the lower sections in it. There a photo fills its cell, opens top-down (clip-path inset
// from 100 % at the foot) while it settles from 1.12 to 1, and keeps a little parallax inside the cell; the proof strip's top rule carries one
// green line that draws out from its centre. Here that runs backwards over the film: the ruled grid draws on (verticals from the top, rows from
// the left, the + turning in), the margins close as the grid's frame, then the film breaks into fifteen prints, cell by cell from left to right:
// a 12 px paper border opens inside each cell's rules and the picture pushes in a little (1.06), so the one picture becomes a sheet of photos;
// then each photo closes from its foot up to its top rule, the way they open lower down, from the bottom right to the top left; the green line
// draws out along the first row's rule as the last ones close, and the empty grid draws back off while the intro rises. One canvas, film sampled
// live: the camera keeps moving inside each print.
const COLS = 5, ROWS = 3, GUTTER = 12;   /* px of paper inside each rule once a cell is a print */

export function TxCells({ end }: { pin: number; end: number }) {
  const ref = useHeroTx(({ hero, stage }) => {
    const f = film(stage);
    const c = inks(stage);
    const p = { draw: 0, split: 0, close: 0, off: 0 };

    const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const m = pageMargin(w), cw = (w - 2 * m) / COLS, ch = h / ROWS;
      const xs = Array.from({ length: COLS + 1 }, (_, i) => m + cw * i);
      const ys = [0, ch, 2 * ch, h];

      // 1. the prints (under the rules)
      if (p.split > 0) {
        const fr = f.frame(w, h);
        const band = ease.io(span(p.split, 0, 0.3)) * m;
        ctx.fillStyle = c.paper;
        ctx.fillRect(0, 0, band, h);
        ctx.fillRect(w - band, 0, band, h);
        for (let r = 0; r < ROWS; r++) for (let col = 0; col < COLS; col++) {
          // a cell becomes a print in reading order, left to right, a row at a time (as the proof strip's figures arrive, one cell after another)
          const a = 0.15 + ((r * COLS + col) / (ROWS * COLS - 1)) * 0.55;
          const k = ease.out(span(p.split, a, a + 0.3));
          if (k <= 0) continue;
          const x = xs[col], y = ys[r], cwid = cw, chgt = ys[r + 1] - y;
          ctx.fillStyle = c.paper;
          ctx.fillRect(x, y, cwid, chgt);
          // it closes from its foot up to its top rule (the lower sections' top-down opening, backwards), from the bottom right to the top left
          const ca = ((ROWS - 1 - r) * COLS + (COLS - 1 - col)) / (ROWS * COLS - 1) * 0.72;
          const vis = chgt * (1 - ease.in(span(p.close, ca, ca + 0.28)));
          if (vis < 2 * GUTTER * k + 0.5 || !fr) continue;
          // the print: a paper border opens inside the cell's rules (so the cuts read as the edges of separate photos, not a torn picture)
          // and the picture inside it pushes in a little, about its own centre; nothing shifts, so the ridges stay continuous across the sheet
          const g = GUTTER * k, z = 1 + 0.06 * k;
          ctx.save();
          ctx.beginPath(); ctx.rect(x + g, y + g, cwid - 2 * g, Math.max(0, vis - 2 * g)); ctx.clip();
          ctx.drawImage(fr.src, fr.ox + x / fr.s, fr.oy + y / fr.s, cwid / fr.s, chgt / fr.s, x + (cwid * (1 - z)) / 2, y + (chgt * (1 - z)) / 2, cwid * z, chgt * z);
          ctx.restore();
        }
      }

      // 2. the rules: verticals from the top, left to right; the rows from the left; they draw back off toward where they started
      xs.forEach((x, i) => {
        const k = ease.out(span(p.draw, i * 0.07, i * 0.07 + 0.55)) * (1 - ease.io(span(p.off, 0.1 + i * 0.06, 0.6 + i * 0.06)));
        rule(ctx, c, x, 0, x, h, k);
      });
      [ys[1], ys[2]].forEach((y, i) => {
        const k = ease.out(span(p.draw, 0.2 + i * 0.1, 0.75 + i * 0.1)) * (1 - ease.io(span(p.off, i * 0.08, 0.5 + i * 0.08)));
        rule(ctx, c, xs[0], y, xs[COLS], y, k);
      });
      [ys[1], ys[2]].forEach((y) => xs.forEach((x, i) => {
        cross(ctx, c, x, y, ease.out(span(p.draw, 0.55 + i * 0.05, 0.85 + i * 0.05)) * (1 - span(p.off, 0, 0.35)));
      }));

      // 3. the proof strip's green line: out from the centre along the first row's rule as the last prints close, back in as the grid goes
      const g = ease.out(span(p.close, 0.62, 1)) * (1 - ease.io(span(p.off, 0, 0.45)));
      if (g > 0) {
        const mid = (xs[0] + xs[COLS]) / 2, half = ((xs[COLS] - xs[0]) / 2) * g;
        ctx.fillStyle = c.green;
        ctx.fillRect(mid - half, Math.round(ys[1]) - 0.5, half * 2, 2);
      }
    };

    const stop = canvasLoop(stage, draw, () => `${p.draw.toFixed(4)}|${p.split.toFixed(4)}|${p.close.toFixed(4)}|${p.off.toFixed(4)}|${f.time().toFixed(3)}`, f.read);
    const offs = [
      track(hero, "top -70%", "top -96%", (v) => { p.draw = v; }),
      track(hero, "top -94%", "top -116%", (v) => { p.split = v; }),
      track(hero, "top -116%", `top -${end}%`, (v) => { p.close = v; }),
      track(hero, `top -${end}%`, `top -${end + 40}%`, (v) => { p.off = v; }),
    ];
    return () => { offs.forEach((o) => o()); stop(); };
  });
  return <span ref={ref} hidden />;
}
