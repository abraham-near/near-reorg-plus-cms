// Protocol D · the hero's picture: convergence. Many sources at the edges (agents as rings with a moon, apps as squares, other chains as hexagons:
// told apart by shape, never by a label) send transactions along fine threads that gather into one bundle and meet at a single point: NEAR. There
// they settle into an ordered ledger that runs to the right, a block every 600 ms; a block turns green once it is final (two blocks, 1.2 s, later).
// Drawn on canvas as a function of time (the same moment always draws the same), so the live loop, the reveal and the reduced-motion still frame
// share one path. No text inside the picture: the copy beside it says what it is.
import { clamp01, hash, lerp, smooth } from "./stage";

export type HeroParams = {
  /** 0..1: the threads draw in, then the sources, then the ledger */
  reveal: number;
  /** 0..1, scrubbed as the hero leaves the view: the sources gather in toward the point */
  gather: number;
};

const INK = "38,38,38", GREEN = "0,220,141";
const BLOCK_S = 0.6, FINAL_AFTER = 2;   // a block every 600 ms; final two blocks (1.2 s) later

type Src = { x: number; y: number; kind: 0 | 1 | 2; rate: number; ph: number; size: number };

/** the sources: a scattered fan on the left, denser toward the middle height (stable: same layout every load) */
function sources(n: number): Src[] {
  const out: Src[] = [];
  for (let i = 0; i < n; i++) {
    const u = hash(i, 11), v = hash(i, 23), k = hash(i, 37);
    // x: mostly toward the left edge; y: spread wide, more at the far left (a fan that narrows toward the point)
    const x = 0.02 + Math.pow(u, 1.35) * 0.42;
    const spread = lerp(0.46, 0.2, x / 0.44);
    const y = 0.5 + (v * 2 - 1) * spread;
    out.push({ x, y, kind: (k < 0.36 ? 0 : k < 0.7 ? 1 : 2) as 0 | 1 | 2, rate: 1.6 + hash(i, 41) * 2.8, ph: hash(i, 53) * 9, size: 0.7 + hash(i, 67) * 0.6 });
  }
  return out;
}
const SRC = sources(58), SRC_SLIM = sources(30);

/** the shape of a source (and of what it sends): 0 an agent (a ring with a small moon), 1 an app (a square), 2 a chain (a hexagon) */
function glyph(c: CanvasRenderingContext2D, kind: number, x: number, y: number, r: number, fill: string, stroke: string, lw: number, moon?: number) {
  c.beginPath();
  if (kind === 1) c.rect(x - r * 0.88, y - r * 0.88, r * 1.76, r * 1.76);
  else if (kind === 2) { for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + (i * Math.PI) / 3; const px = x + Math.cos(a) * r * 1.05, py = y + Math.sin(a) * r * 1.05; if (i) c.lineTo(px, py); else c.moveTo(px, py); } c.closePath(); }
  else c.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); }
  if (kind === 0 && moon !== undefined) {
    // an agent: a small moon on its own orbit, always moving (autonomous)
    c.beginPath(); c.arc(x + Math.cos(moon) * r * 1.9, y + Math.sin(moon) * r * 1.9, Math.max(1, r * 0.32), 0, Math.PI * 2); c.fillStyle = stroke || fill; c.fill();
  }
}

/** a point on the cubic thread from a source to the meeting point: it leaves level, bends, and arrives level (so the threads bundle) */
function bez(x0: number, y0: number, x3: number, y3: number, t: number): [number, number] {
  const x1 = lerp(x0, x3, 0.5), y1 = y0, x2 = lerp(x0, x3, 0.72), y2 = y3;
  const m = 1 - t, a = m * m * m, b = 3 * m * m * t, cc = 3 * m * t * t, d = t * t * t;
  return [a * x0 + b * x1 + cc * x2 + d * x3, a * y0 + b * y1 + cc * y2 + d * y3];
}

export function createHero() {
  return (c: CanvasRenderingContext2D, w: number, h: number, t: number, p: HeroParams) => {
    const slim = w < 640, src = slim ? SRC_SLIM : SRC;
    const s = Math.min(1.25, Math.max(0.62, w / 1280));            // the drawing's scale (glyphs, blocks)
    const X = w * (slim ? 0.5 : 0.56), Y = h * 0.5;                   // the meeting point
    const g = smooth(p.gather) * 0.32;
    const revThreads = smooth(p.reveal / 0.55), revSrc = smooth((p.reveal - 0.2) / 0.5), revLedger = smooth((p.reveal - 0.45) / 0.55);

    // the paper's dots, quiet, under everything
    c.fillStyle = `rgba(${INK},0.13)`;
    const step = 22 * s;
    for (let yy = step / 2; yy < h; yy += step) for (let xx = step / 2; xx < w; xx += step) c.fillRect(xx - 0.6, yy - 0.6, 1.2, 1.2);

    const pos = src.map((q) => {
      const sx = slim ? q.x * 0.98 : q.x, x0 = lerp(sx * w, X, g), y0 = lerp(q.y * h, Y, g * 0.9);
      return [x0, y0] as [number, number];
    });

    // 1 · the threads: hairlines that gather into one bundle at the point (they draw in from the sources)
    c.lineWidth = 1;
    src.forEach((q, i) => {
      const [x0, y0] = pos[i], n = 28, upto = Math.round(n * revThreads);
      if (!upto) return;
      c.beginPath();
      for (let k = 0; k <= upto; k++) { const [px, py] = bez(x0, y0, X, Y, k / n); if (k) c.lineTo(px, py); else c.moveTo(px, py); }
      c.strokeStyle = `rgba(${INK},${0.05 + 0.08 * q.size})`; c.stroke();
    });

    // 2 · what the sources send: each a small copy of its source's shape, easing along the thread, shrinking as it joins the bundle
    if (revSrc > 0.6) {
      const k = clamp01((revSrc - 0.6) / 0.4);
      src.forEach((q, i) => {
        const [x0, y0] = pos[i], travel = 2.2 + q.size * 0.6;
        for (let j = 0; j < 3; j++) {
          const life = (t + q.ph + j * q.rate) % (q.rate * 3);
          if (life > travel) continue;
          const u = life / travel, e = u * u * (3 - 2 * u), [px, py] = bez(x0, y0, X, Y, e);
          const r = lerp(3.2, 1.6, e) * s * q.size;
          glyph(c, q.kind, px, py, r, `rgba(${INK},${0.82 * k * (u < 0.92 ? 1 : (1 - u) / 0.08)})`, "", 0);
        }
      });
    }

    // 3 · the sources
    src.forEach((q, i) => {
      const a = clamp01(revSrc * 1.6 - (i % 9) * 0.07);
      if (a <= 0) return;
      const [x0, y0] = pos[i], r = (q.kind === 0 ? 6 : 5.4) * s * q.size;
      c.globalAlpha = a * (0.55 + 0.45 * clamp01((q.size - 0.7) / 0.5));
      glyph(c, q.kind, x0, y0, r, "#fff", `rgba(${INK},0.9)`, 1.1, t * (0.5 + q.size * 0.4) + q.ph);
      c.globalAlpha = 1;
    });

    // 4 · the ledger: one ordered row of blocks leaving the point, a block every 600 ms; green once final
    if (revLedger > 0) {
      const bw = 54 * s, bh = 40 * s, gap = 10 * s, pitch = bw + gap;
      const ly = Y - bh / 2, n = Math.ceil((w - X) / pitch) + 2, now = t / BLOCK_S, k0 = Math.floor(now);
      const finalX = X + 22 * s + pitch * (FINAL_AFTER + 1) + gap;   // a block is out of the slot one pitch on; final two blocks after that
      // the rail under it: ink up to the final point, green after
      const railY = Y + bh / 2 + 10 * s, railEnd = lerp(X, w, revLedger);
      c.lineWidth = 1;
      c.beginPath(); c.moveTo(X + 22 * s, railY); c.lineTo(Math.min(finalX, railEnd), railY); c.strokeStyle = `rgba(${INK},0.3)`; c.stroke();
      if (railEnd > finalX) { c.beginPath(); c.moveTo(finalX, railY); c.lineTo(railEnd, railY); c.strokeStyle = `rgba(${GREEN},1)`; c.lineWidth = 1.5; c.stroke(); }
      // the blocks come out of the point as from a slot (clipped at it), one pitch every 600 ms
      const base = X + 22 * s;
      c.save(); c.beginPath(); c.rect(base, 0, w - base, h); c.clip();
      for (let j = 0; j < n; j++) {
        const id = k0 - j, age = now - id;                     // in blocks
        if (age < 0) continue;
        const bx = base + (age - 1) * pitch + gap;
        if (bx > railEnd + 2) continue;
        const fade = clamp01((w - bx - bw) / (pitch * 2.5));
        const fin = smooth(clamp01((bx - finalX) / (pitch * 0.35) + 1));
        const wNow = bw;
        c.globalAlpha = fade * revLedger;
        c.fillStyle = fin > 0 ? `rgba(${GREEN},${0.14 * fin})` : "#fff";
        c.fillRect(bx, ly, wNow, bh);
        if (fin > 0) { c.fillStyle = "#fff"; c.globalAlpha = fade * revLedger * (1 - fin); c.fillRect(bx, ly, wNow, bh); c.globalAlpha = fade * revLedger; }
        c.lineWidth = 1;
        c.strokeStyle = fin > 0.5 ? `rgba(0,150,96,${0.9})` : `rgba(${INK},0.85)`;
        c.strokeRect(bx + 0.5, ly + 0.5, wNow - 1, bh - 1);
        // its transactions, packed in order (more arrive while it forms)
        const count = 6 + Math.floor(hash(id, 7) * 7), shown = count;
        const cols = 4, dx = (wNow - 10 * s) / cols, dy = (bh - 10 * s) / 3;
        for (let m = 0; m < shown; m++) {
          const cx = bx + 5 * s + dx * ((m % cols) + 0.5), cy = ly + 5 * s + dy * (Math.floor(m / cols) + 0.5);
          glyph(c, Math.floor(hash(id, m, 3) * 3), cx, cy, 2.1 * s, fin > 0.5 ? "rgba(0,119,79,0.95)" : `rgba(${INK},0.8)`, "", 0);
        }
        c.globalAlpha = 1;
      }
      c.restore();
      // the point itself: where every thread meets; a ring that breathes on each block
      const beat = 1 - clamp01((now - k0) / 0.5);
      c.beginPath(); c.arc(X, Y, (11 + beat * 7) * s, 0, Math.PI * 2); c.strokeStyle = `rgba(${INK},${0.12 + beat * 0.3})`; c.lineWidth = 1; c.stroke();
      c.beginPath(); c.arc(X, Y, 7.5 * s, 0, Math.PI * 2); c.fillStyle = "#fff"; c.fill(); c.strokeStyle = `rgba(${INK},0.9)`; c.lineWidth = 1.2; c.stroke();
      c.beginPath(); c.arc(X, Y, 3.4 * s, 0, Math.PI * 2); c.fillStyle = `rgba(${INK},1)`; c.fill();
    }
  };
}
