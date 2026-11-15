"use client";

import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useHeroTx, track, overlay, span, ease, pageMargin, canvasLoop } from "./common";

// I · Into the grid, depth (D121): B (D109, D112) built on for /home-v6, as layers at different depths:
//   - the film (farthest): the camera's pull-back, scrubbed as before, under
//   - the paper: the cells close from their foot exactly as in B, overlapping along the diagonals, bottom right first, top left last (D122);
//   - a faint technical layer: dashed half-cell guides that draw up from the foot and drift up a little; they leave with the grid;
//   - the grid: ONE line (not B's ink + pale edge pair), pale on the forest and dark on the mist and the paper (the line's canvas is blended
//     `difference`, mixed back into what is under it), drawn on a little sooner and slower, faint at first, each head a soft fade, not a cut;
//     ruler ticks ride behind each head; a + turns in where lines meet; a hairline runs on the paper's front as each cell fills. The grid stays
//     over the paper as the film goes, a little mixed back, and held back behind the intro's words; once the film is gone it draws off, each
//     line's end a soft fade again, the verticals rising from the foot (D122);
//   - the intro (nearest): it comes up from the foot while the cells close, faster than the scroll (parallax), and comes to rest higher on the
//     screen (tx.css).
const COLS = 5, ROWS = 3;
const LINE = "#e6f7ef";          /* blended `difference`: near black over mist and paper, pale grey over the forest (the green taken out of it) */

export function TxDepth({ end }: { pin: number; end: number }) {
  const ref = useHeroTx(({ hero, stage, statement, W, H }) => {
    const p = { draw: 0, clear: 0, off: 0, drift: 0 };
    /* a cell's place in the order: B's diagonals (bottom right first, top left last); each cell's close overlaps the next diagonal's */
    const order = (r: number, c: number) => ((ROWS - 1 - r) + (COLS - 1 - c)) / (ROWS - 1 + COLS - 1);
    const cellK = (o: number) => { const a = 0.12 + o * 0.66; return ease.in(span(p.clear, a, a + 0.22)); };   /* fast at the close: no sliver under the rule */

    // 1. the paper (DOM, transform only, as B): the margins close in, then the cells fill from their foot
    const root = overlay(stage, "txg");
    let cells: { el: HTMLElement; o: number }[] = [], bands: HTMLElement[] = [];
    let G = { xs: [0], ys: [0], w: 0, h: 0 };   /* the cells' geometry on the stage, for the intro's reveal */
    const build = () => {
      root.replaceChildren();
      const w = W(), h = H(), m = pageMargin(w);
      const xs = Array.from({ length: COLS + 1 }, (_, i) => Math.round(m + ((w - 2 * m) * i) / COLS));
      const ys = [0, ...Array.from({ length: ROWS - 1 }, (_, i) => Math.round((h * (i + 1)) / ROWS)), h];
      G = { xs, ys, w, h };
      const add = (cls: string, css: Partial<CSSStyleDeclaration>) => { const e = document.createElement("i"); e.className = cls; Object.assign(e.style, css); root.appendChild(e); return e; };
      bands = [add("txg-paper txg-band", { left: "0", width: `${xs[0]}px` }), add("txg-paper txg-band", { left: `${xs[COLS]}px`, width: `${w - xs[COLS]}px` })];
      bands[1].style.transformOrigin = "100% 50%";
      cells = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++)
        cells.push({ el: add("txg-paper", { left: `${xs[c]}px`, width: `${xs[c + 1] - xs[c]}px`, top: `${ys[r]}px`, height: `${ys[r + 1] - ys[r]}px` }), o: order(r, c) });
      renderPaper();
    };
    function renderPaper() {
      const band = ease.io(span(p.clear, 0, 0.2));
      bands.forEach((b) => { b.style.transform = `scaleX(${band})`; });
      cells.forEach(({ el, o }) => { el.style.transform = `scaleY(${cellK(o)})`; });
    }

    // the grid's geometry for the canvases
    const geo = (w: number, h: number) => {
      const m = pageMargin(w);
      return { xs: Array.from({ length: COLS + 1 }, (_, i) => m + ((w - 2 * m) * i) / COLS), ys: [0, h / 3, (2 * h) / 3, h] };
    };
    const px = (n: number) => Math.round(n) + 0.5;
    /* erase the layer from the foot up to `s` (0 none, 1 all), through a soft band of `band` of the screen: it fades out from the bottom, not a wipe */
    const fadeFromFoot = (ctx: CanvasRenderingContext2D, w: number, h: number, s: number, band = 0.35) => {
      if (s <= 0) return;
      const b = h * band, yf = h + b - s * (h + 2 * b);
      ctx.save(); ctx.globalCompositeOperation = "destination-out";
      const g = ctx.createLinearGradient(0, yf - b, 0, yf); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,1)");
      ctx.fillStyle = g; ctx.fillRect(0, yf - b, w, b); ctx.fillStyle = "#000"; ctx.fillRect(0, yf, w, Math.max(0, h + 40 - yf));
      ctx.restore();
    };
    /* a 1 px line from (x1, y1) toward (x2, y2), drawn to fraction k, its head a soft fade over F px (the fade shortens as the line completes) */
    const seg = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, k: number, a: number, F: number) => {
      if (k <= 0 || a <= 0.004) return;
      const hx = x1 + (x2 - x1) * k, hy = y1 + (y2 - y1) * k, len = Math.hypot(hx - x1, hy - y1); if (len < 1) return;
      const f = Math.min(len, F * Math.min(1, (1 - k) * 3)), g = ctx.createLinearGradient(x1, y1, hx, hy);
      g.addColorStop(0, LINE); g.addColorStop(Math.max(0, 1 - f / len), LINE); g.addColorStop(1, "rgba(230,247,239,0)");
      ctx.globalAlpha = a; ctx.strokeStyle = g; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(hx, hy); ctx.stroke(); ctx.globalAlpha = 1;
    };

    /* the intro's words hold the lines back: under their box (padded, soft edged) the lines are faint, so the grid reads behind the words, not through them */
    const introEl = statement?.querySelector<HTMLElement>(".statement__inner") ?? null;
    const introAt = () => { if (!introEl) return null; const s = stage.getBoundingClientRect(), r = introEl.getBoundingClientRect(); return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height }; };
    const introKey = () => { const r = introAt(); return r ? `${r.y.toFixed(0)}` : ""; };
    const holdBehindIntro = (ctx: CanvasRenderingContext2D, h: number, strength: number) => {
      const r = introAt(); if (!r || r.y >= h || r.y + r.h <= 0) return;
      const pad = 28, off = 1e4, dpr = ctx.getTransform().a;   /* a soft rect: drawn far off the canvas, its blurred shadow (device px) brought back */
      ctx.save(); ctx.globalCompositeOperation = "destination-out";
      ctx.shadowColor = `rgba(0,0,0,${strength})`; ctx.shadowBlur = 36 * dpr; ctx.shadowOffsetX = off * dpr;
      ctx.fillStyle = "#000"; ctx.fillRect(r.x - pad - off, r.y - pad, r.w + 2 * pad, r.h + 2 * pad);
      ctx.restore();
    };

    // 2. the technical layer (behind the grid): dashed half-cell guides, drawn up from the foot as the grid comes on; they leave with the grid, from the foot
    const back = canvasLoop(stage, (ctx, w, h) => {
      const { xs, ys } = geo(w, h);
      const a = 0.2 * ease.io(span(p.draw, 0.4, 1)) * (1 - 0.35 * ease.io1(span(p.clear, 0.2, 0.8))) * (1 - ease.io1(span(p.off, 0, 0.7)));
      if (a <= 0.004) return;
      ctx.save(); ctx.translate(0, -p.drift * h * 0.012);   /* the farthest of the line layers: it drifts the least */
      ctx.setLineDash([2, 6]); ctx.strokeStyle = LINE; ctx.lineWidth = 1; ctx.globalAlpha = a;
      for (let i = 0; i < COLS; i++) {
        const x = px((xs[i] + xs[i + 1]) / 2), k = ease.out(span(p.draw, 0.4 + i * 0.05, 0.9 + i * 0.02));
        if (k > 0) { ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x, h * (1 - k)); ctx.stroke(); }
      }
      for (let r = 0; r < ROWS; r++) {
        const y = px((ys[r] + ys[r + 1]) / 2), k = ease.out(span(p.draw, 0.55 + (ROWS - 1 - r) * 0.08, 1));
        if (k > 0) { ctx.beginPath(); ctx.moveTo(xs[COLS], y); ctx.lineTo(xs[COLS] - (xs[COLS] - xs[0]) * k, y); ctx.stroke(); }
      }
      ctx.restore();
      fadeFromFoot(ctx, w, h, ease.io1(span(p.off, 0, 0.8)), 0.3);
      holdBehindIntro(ctx, h, 1);
    }, () => `${p.draw.toFixed(4)}|${p.clear.toFixed(4)}|${p.off.toFixed(4)}|${p.drift.toFixed(4)}|${introKey()}`, undefined, "txi-cv");

    // 3. the grid: one blended line; ticks behind each head; the + where lines meet; then the paper's fronts. It stays over the paper while the
    //    film goes (a little mixed back), then, the film gone, draws off: each line's end a soft fade, as it came on, the verticals' ends rising
    //    from the foot, the rules' going back to the left, the + turning out; and it fades from the foot as it goes
    const front = canvasLoop(stage, (ctx, w, h) => {
      const { xs, ys } = geo(w, h);
      const A = (0.15 + 0.21 * ease.io(span(p.draw, 0.25, 1)))        /* faint as it comes on, mixed back at its strongest (about B's) */
        * (1 - 0.3 * ease.io1(span(p.clear, 0.1, 0.75)))                 /* a little further back as the cells close */
        * (1 - 0.5 * ease.io1(span(p.off, 0.4, 1)));                     /* and on its way out */
      ctx.save();                                                         /* no drift: it stays in register with the paper's cells */
      if (A > 0.004) {
        xs.forEach((x, i) => {
          const k = ease.io1(span(p.draw, i * 0.07, i * 0.07 + 0.62)) * (1 - ease.io1(span(p.off, i * 0.05, i * 0.05 + 0.7))), X = px(x);
          seg(ctx, X, 0, X, h, k, A, h * 0.22);
          // ruler ticks behind the head, every 24 px, on the inside of the frame
          const head = h * k - h * 0.22 * Math.min(1, (1 - k) * 3), side = i === COLS ? -1 : 1;
          ctx.globalAlpha = A * 0.5; ctx.strokeStyle = LINE; ctx.beginPath();
          for (let t = 24; t < head; t += 24) { ctx.moveTo(X, px(t)); ctx.lineTo(X + side * 3, px(t)); }
          ctx.stroke();
        });
        [ys[1], ys[2]].forEach((y, i) => {
          const k = ease.io1(span(p.draw, 0.22 + i * 0.1, 0.82 + i * 0.1)) * (1 - ease.io1(span(p.off, (1 - i) * 0.08, (1 - i) * 0.08 + 0.65))), Y = px(y);
          seg(ctx, xs[0], Y, xs[COLS], Y, k, A, (xs[COLS] - xs[0]) * 0.16);
          const head = xs[0] + (xs[COLS] - xs[0]) * k - (xs[COLS] - xs[0]) * 0.16 * Math.min(1, (1 - k) * 3);
          ctx.globalAlpha = A * 0.5; ctx.strokeStyle = LINE; ctx.beginPath();
          for (let t = xs[0] + 24; t < head; t += 24) { ctx.moveTo(px(t), Y); ctx.lineTo(px(t), Y + 3); }
          ctx.stroke();
        });
        // the + (9 px), turning in once both lines have passed, turning out from the right as the rules go back to the left
        ctx.fillStyle = LINE;
        [ys[1], ys[2]].forEach((y) => xs.forEach((x, i) => {
          const k = ease.out(span(p.draw, 0.62 + i * 0.05, 0.92 + i * 0.05)) * (1 - ease.io(span(p.off, 0.05 + (COLS - i) * 0.05, 0.4 + (COLS - i) * 0.05))); if (k <= 0.02) return;
          ctx.save(); ctx.translate(Math.round(x) + 0.5, Math.round(y) + 0.5); ctx.rotate(((1 - k) * -90 * Math.PI) / 180); ctx.scale(0.2 + 0.8 * k, 0.2 + 0.8 * k);
          ctx.globalAlpha = Math.min(1, A * 1.3); ctx.fillRect(-4.5, -0.5, 9, 1); ctx.fillRect(-0.5, -4.5, 1, 9); ctx.restore();
        }));
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      fadeFromFoot(ctx, w, h, ease.io1(span(p.off, 0, 0.9)), 0.4);
      // the paper's front: a hairline across each cell as it fills (not drifting: it is the paper's edge)
      ctx.strokeStyle = LINE; ctx.lineWidth = 1;
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const k = cellK(order(r, c)); if (k <= 0.01 || k >= 0.995) continue;
        const y = px(ys[r + 1] - (ys[r + 1] - ys[r]) * k);
        ctx.globalAlpha = 0.3 * Math.min(1, (1 - k) * 4); ctx.beginPath(); ctx.moveTo(xs[c] + 1, y); ctx.lineTo(xs[c + 1], y); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      holdBehindIntro(ctx, h, 0.85);
    }, () => `${p.draw.toFixed(4)}|${p.clear.toFixed(4)}|${p.off.toFixed(4)}|${introKey()}`, undefined, "txi-cv");

    // 4. the intro: up from the foot faster than the scroll while the cells close, settling as it comes to rest (its place: tx.css)
    const inner = introEl;
    const lift = (v: number) => { if (inner) inner.style.translate = v >= 1 ? "" : `0 ${((1 - ease.out(v)) * 10).toFixed(3)}svh`; };
    // ... and it is BEHIND the film: it shows only where the paper is (the closed margins, the filled part of each cell, below the stage), so
    // it is uncovered as the boxes of film wipe away (D122). A clip path in the intro's own box, the union of those rects; none once the film is gone
    const reveal = () => {
      if (!inner) return;
      if (p.clear >= 1) { if (inner.style.clipPath) inner.style.clipPath = ""; return; }
      const s = stage.getBoundingClientRect(), r = inner.getBoundingClientRect(), ox = s.left - r.left, oy = s.top - r.top, BIG = 1e5;
      const rects: number[][] = [[-BIG, oy + G.h, 2 * BIG, BIG]];
      const band = ease.io(span(p.clear, 0, 0.2)), bw = G.w - G.xs[COLS];
      if (band > 0) rects.push([ox, oy, G.xs[0] * band, G.h], [ox + G.w - bw * band, oy, bw * band, G.h]);
      for (let rr = 0; rr < ROWS; rr++) for (let c = 0; c < COLS; c++) {
        const k = cellK(order(rr, c)); if (k <= 0) continue;
        const y0 = G.ys[rr], ht = G.ys[rr + 1] - y0;
        rects.push([ox + G.xs[c], oy + y0 + ht * (1 - k), G.xs[c + 1] - G.xs[c], ht * k + 0.5]);
      }
      inner.style.clipPath = `path("${rects.map(([x, y, w, h]) => `M${x.toFixed(1)} ${y.toFixed(1)}h${w.toFixed(1)}v${h.toFixed(1)}h${(-w).toFixed(1)}Z`).join("")}")`;
    };
    let raf = 0, lastReveal = "";
    const revealLoop = () => { raf = requestAnimationFrame(revealLoop); const k = `${p.clear.toFixed(4)}|${introKey()}|${G.w}|${G.h}`; if (k !== lastReveal) { lastReveal = k; reveal(); } };
    raf = requestAnimationFrame(revealLoop);

    build();
    const offs = [
      track(hero, "top -52%", "top -100%", (v) => { p.draw = v; }),
      track(hero, "top -100%", `top -${end}%`, (v) => { p.clear = v; renderPaper(); reveal(); }),   /* the intro's clip in the same frame as the cells */
      track(hero, `top -${end - 16}%`, `top -${end + 12}%`, (v) => { p.off = v; }),   /* from the foot as the last boxes go, so the lines leave the words sooner (D123) */
      track(hero, "top -96%", `top -${end + 12}%`, (v) => { p.drift = v; }),
      track(hero, "top -112%", `top -${end + 26}%`, lift),
    ];
    ScrollTrigger.addEventListener("refresh", build);
    return () => { offs.forEach((f) => f()); back(); front(); ScrollTrigger.removeEventListener("refresh", build); root.remove(); cancelAnimationFrame(raf); if (inner) { inner.style.translate = ""; inner.style.clipPath = ""; } };
  });
  return <span ref={ref} hidden />;
}
