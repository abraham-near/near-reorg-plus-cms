// Option C's dashboard, drawn in dots (canvas 2D, DPR-aware): the monthly bars as columns of ink dots with the cumulative line as emerald dots over them,
// and the capture gauge as rings of dots that light emerald to its share.
// Each draw takes a progress (0..1) so the motion can light them in; 1 is the finished drawing (reduced motion draws only that).
import { REV } from "../data";
import { MAX_L, MAX_R, MONTHS, N, along, curve, xAt } from "./geometry";

export const INK = "#262626", PAPER = "#f5f4f1", EMERALD = "#00dc8d";
const TAU = Math.PI * 2;
const c01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export type Cv = { el: HTMLCanvasElement; ctx: CanvasRenderingContext2D; w: number; h: number };
export function canvas(el: HTMLCanvasElement | null): Cv | null {
  const ctx = el?.getContext("2d");
  return el && ctx ? { el, ctx, w: 0, h: 0 } : null;
}
/** sizes the backing store to the element (DPR, capped at 2); false when it has no size */
export function fit(cv: Cv) {
  const r = cv.el.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.w = r.width; cv.h = r.height;
  if (!cv.w || !cv.h) return false;
  const W = Math.round(cv.w * dpr), H = Math.round(cv.h * dpr);
  if (cv.el.width !== W || cv.el.height !== H) { cv.el.width = W; cv.el.height = H; }
  cv.ctx.setTransform(W / cv.w, 0, 0, H / cv.h, 0, 0);
  return true;
}

/** how far the chart's canvas overhangs its plot (revenue-c.css: .rvc-plot__c) */
export const CHART_PAD = 10;
/** the chart's dot pitch for a plot this wide */
const pitch = (w: number) => (w < 420 ? 5 : w < 640 ? 6 : 8);

/**
 * The chart: each month a column of dot slots (faint), lit in ink up to its revenue (the left scale); the cumulative line (the right scale) as emerald
 * dots at an even step along the monotone curve, each on a paper halo so it reads over the bars; its last dot larger. The right scale's ticks are rows of
 * fine dots. p: the faint slots show, the columns fill from the foot one after another, then the line runs from the start to the total.
 */
export function drawChart(cv: Cv, p: number) {
  const { ctx } = cv, P = CHART_PAD, w = cv.w - P * 2, h = cv.h - P * 2;   // the canvas overhangs the plot by P (CSS) so edge dots are never cut
  ctx.clearRect(0, 0, cv.w, cv.h);
  if (w <= 0 || h <= 0) return;
  ctx.save(); ctx.translate(P, P);
  const g = pitch(w), rows = Math.floor(h / g), slot = w / (N + 1), cols = Math.max(1, Math.min(3, Math.round((slot * 0.42) / g)));

  // the ticks (right scale) and the foot
  const ghost = c01(p * 5);
  ctx.fillStyle = INK;
  ctx.globalAlpha = 0.22 * ghost; ctx.beginPath();
  REV.axisR.forEach((v) => {
    const y = Math.max(1, h - ((v * 1000) / MAX_R) * h);
    for (let x = g / 2; x < w; x += g * 1.5) { ctx.moveTo(x + 0.8, y); ctx.arc(x, y, 0.8, 0, TAU); }
  });
  ctx.fill();

  // the columns: slots, then the lit dots
  const slots = new Path2D(), lit = new Path2D(), rs = g * 0.26, rl = g * 0.36;
  MONTHS.forEach((v, i) => {
    const cx = xAt(i) * w, full = Math.min(rows, Math.round(((v / MAX_L) * h) / g));
    const on = Math.round(full * easeOut(c01((p - 0.04 * i) / 0.42)));
    for (let c = 0; c < cols; c++) {
      const x = cx + (c - (cols - 1) / 2) * g;
      for (let j = 0; j < rows; j++) {
        const y = h - g / 2 - j * g;
        if (j < on) { lit.moveTo(x + rl, y); lit.arc(x, y, rl, 0, TAU); }
        else { slots.moveTo(x + rs, y); slots.arc(x, y, rs, 0, TAU); }
      }
    }
  });
  ctx.globalAlpha = 0.1 * ghost; ctx.fill(slots);
  ctx.globalAlpha = 1; ctx.fill(lit);

  // the line
  const pl = c01((p - 0.38) / 0.62);
  if (pl > 0) {
    const pts = along(curve(w, h), g * 1.05), n = Math.max(1, Math.ceil(pts.length * easeInOut(pl))), re = g * 0.4, halo = re + Math.max(1.5, g * 0.22);
    const shown = pts.slice(0, n);
    ctx.fillStyle = PAPER; ctx.beginPath();
    shown.forEach(([x, y]) => { ctx.moveTo(x + halo, y); ctx.arc(x, y, halo, 0, TAU); });
    ctx.fill();
    ctx.fillStyle = EMERALD; ctx.beginPath();
    shown.forEach(([x, y]) => { ctx.moveTo(x + re, y); ctx.arc(x, y, re, 0, TAU); });
    ctx.fill();
    if (pl >= 1) {   // the total, where the line ends
      const [x, y] = pts[pts.length - 1], R = g * 0.85;
      ctx.fillStyle = PAPER; ctx.beginPath(); ctx.arc(x, y, R + 2, 0, TAU); ctx.fill();
      ctx.fillStyle = EMERALD; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
    }
  }
  ctx.restore();
}

/**
 * The gauge: three rings of dots on a 270° arc open at the foot (from 135° round the top to 45°). The dots up to the capture share light emerald, one
 * after another round the arc; the rest stay faint ink. p: the share they have reached (eased by the caller's tween).
 */
export function drawGauge(cv: Cv, p: number) {
  const { ctx, w, h } = cv;
  ctx.clearRect(0, 0, w, h);
  const s = Math.min(w, h), cx = w / 2, cy = h / 2, gap = s * 0.062, r = Math.max(1.6, s * 0.0155), f = (REV.capture / 100) * p;
  const on = new Path2D(), off = new Path2D();
  const n = Math.round((1.5 * Math.PI * (s / 2 - s * 0.03)) / (gap * 1.08)) + 1;   // one count for every ring: the dots line up along the radii
  for (let k = 0; k < 3; k++) {
    const R = s / 2 - s * 0.03 - k * gap;
    for (let i = 0; i < n; i++) {
      const q = i / (n - 1), a = 0.75 * Math.PI + q * 1.5 * Math.PI, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
      const lit = p > 0 && q <= f + 1e-6, rr = lit ? r * 1.12 : r * 0.82;
      (lit ? on : off).moveTo(x + rr, y); (lit ? on : off).arc(x, y, rr, 0, TAU);
    }
  }
  ctx.fillStyle = INK; ctx.globalAlpha = 0.13; ctx.fill(off);
  ctx.globalAlpha = 1; ctx.fillStyle = EMERALD; ctx.fill(on);
}
