"use client";

import { useHeroTx, track, span, ease, pageMargin, inks, film, canvasLoop, rule, cross } from "./common";

// G · Grid, mosaic (D110): the film is resolved into the page's grid. The grid's five columns draw on over the picture (near-square cells: as many
// rows as fit the screen whole, so no tile hangs past its foot); then, with hard cuts and no blending, the picture becomes a mosaic of flat tiles at 20 columns, 10 and
// finally the grid's own 5 (the margins having closed first): each tile is the mean colour of the film under it, sampled live, so the ridges keep drifting as ever coarser
// blocks, and each step's finer lines sit inside the grid's (soft rules at 7 %, the grid at 24 %). Then the
// five-column tiles are put away one by one, the darkest first (the forest goes, the mist is the last), each dropping from its top rule to its
// foot, and the empty grid draws back off as the intro rises. After pixel-step dissolves, cut to the grid instead of a pixel square. One canvas.
const LEVELS = [20, 10, 5];   /* columns across the page's frame: each a subdivision of the grid's five, so every line lands on a finer one */

export function TxMosaic({ end }: { pin: number; end: number }) {
  const ref = useHeroTx(({ hero, stage }) => {
    const f = film(stage);
    const c = inks(stage);
    const sample = document.createElement("canvas");
    const sctx = sample.getContext("2d", { willReadFrequently: true })!;
    sctx.imageSmoothingQuality = "high";
    const p = { draw: 0, mos: 0, clear: 0, off: 0 };
    let ranks: number[] | null = null;   /* the five-column tiles in order of darkness, fixed when they start to go (so the order doesn't jitter) */

    // the tiles' colours: the film under the frame, scaled down to one pixel per tile (in two steps, so each pixel is close to its tile's mean)
    const tiles = (w: number, h: number, m: number, cols: number, rows: number) => {
      const fr = f.frame(w, h);
      if (!fr) return null;
      sample.width = Math.min(320, cols * 8); sample.height = Math.min(320, rows * 8);
      sctx.drawImage(fr.src, fr.ox + m / fr.s, fr.oy, (w - 2 * m) / fr.s, h / fr.s, 0, 0, sample.width, sample.height);
      sctx.drawImage(sample, 0, 0, sample.width, sample.height, 0, 0, cols, rows);
      return sctx.getImageData(0, 0, cols, rows).data;
    };

    const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const m = pageMargin(w), t0 = (w - 2 * m) / 5;
      const R0 = Math.max(1, Math.round(h / t0)), h0 = h / R0;   /* the grid's rows: as many near-squares as fit the screen whole */
      const xs = Array.from({ length: 6 }, (_, i) => m + t0 * i);
      const ys = Array.from({ length: R0 - 1 }, (_, i) => h0 * (i + 1));

      if (p.mos <= 0 && p.draw > 0.6) {
        const band = ease.io(span(p.draw, 0.6, 1)) * m;   /* the margins close over the film as the grid finishes drawing: its frame */
        ctx.fillStyle = c.paper; ctx.fillRect(0, 0, band, h); ctx.fillRect(w - band, 0, band, h);
      }
      if (p.mos > 0) {
        const li = Math.min(LEVELS.length - 1, Math.floor(p.mos * LEVELS.length));
        const cols = LEVELS[li], rows = R0 * (cols / 5), t = (w - 2 * m) / cols, th = h / rows;
        const data = tiles(w, h, m, cols, rows);
        ctx.fillStyle = c.paper;
        ctx.fillRect(0, 0, w, h);   /* the margins (closed already, below): paper */
        if (data) {
          const last = li === LEVELS.length - 1;
          if (last && p.clear > 0 && !ranks) {
            const lum = Array.from({ length: cols * rows }, (_, i) => 0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]);
            const order = lum.map((_, i) => i).sort((a, b) => lum[a] - lum[b]);   /* darkest first: the forest goes, the mist is the last */
            ranks = []; order.forEach((tile, n) => { ranks![tile] = n / Math.max(1, order.length - 1); });
          }
          if (p.clear <= 0) ranks = null;
          for (let r = 0; r < rows; r++) for (let col = 0; col < cols; col++) {
            const i = r * cols + col, x = m + col * t, y = r * th;
            let top = 0;
            if (last && ranks) {
              const a = ranks[i] * 0.72;
              top = th * ease.in(span(p.clear, a, a + 0.28));   /* paper drops in from the tile's top rule */
              if (top >= th - 0.5) continue;
            }
            ctx.fillStyle = `rgb(${data[i * 4]} ${data[i * 4 + 1]} ${data[i * 4 + 2]})`;
            // a hair over each edge, so neighbouring tiles meet without a seam
            ctx.fillRect(Math.floor(x), Math.floor(y + top), Math.ceil(t + 1), Math.ceil(th - top + 1));
          }
          // the step's own lines, soft, inside the grid's (none at the last step: those are the grid's)
          if (!last) {
            ctx.globalAlpha = 0.07; ctx.strokeStyle = c.ink; ctx.lineWidth = 1; ctx.beginPath();
            for (let col = 1; col < cols; col++) { const x = Math.round(m + col * t) + 0.5; ctx.moveTo(x, 0); ctx.lineTo(x, h); }
            for (let r = 1; r < rows; r++) { const y = Math.round(r * th) + 0.5; ctx.moveTo(m, y); ctx.lineTo(w - m, y); }
            ctx.stroke(); ctx.globalAlpha = 1;
          }
        }
      }

      // the grid: verticals from the top, left to right; rows from the left; + turning in where they meet; back off as the intro rises
      xs.forEach((x, i) => rule(ctx, c, x, 0, x, h, ease.out(span(p.draw, i * 0.07, i * 0.07 + 0.55)) * (1 - ease.io(span(p.off, 0.1 + i * 0.06, 0.6 + i * 0.06)))));
      ys.forEach((y, i) => rule(ctx, c, xs[0], y, xs[5], y, ease.out(span(p.draw, 0.2 + i * 0.1, 0.75 + i * 0.1)) * (1 - ease.io(span(p.off, i * 0.08, 0.5 + i * 0.08)))));
      ys.forEach((y) => xs.forEach((x, i) => cross(ctx, c, x, y, ease.out(span(p.draw, 0.55 + i * 0.05, 0.85 + i * 0.05)) * (1 - span(p.off, 0, 0.35)))));
    };

    const stop = canvasLoop(stage, draw, () => `${p.draw.toFixed(4)}|${p.mos.toFixed(4)}|${p.clear.toFixed(4)}|${p.off.toFixed(4)}|${f.time().toFixed(3)}`, f.read);
    const offs = [
      track(hero, "top -70%", "top -92%", (v) => { p.draw = v; }),
      track(hero, "top -95%", "top -125%", (v) => { p.mos = v; }),
      track(hero, "top -125%", `top -${end}%`, (v) => { p.clear = v; }),
      track(hero, `top -${end}%`, `top -${end + 40}%`, (v) => { p.off = v; }),
    ];
    return () => { offs.forEach((o) => o()); stop(); };
  });
  return <span ref={ref} hidden />;
}
