// Option D's chart as an isometric scene, in the rail illustrations' grammar (public/v1/vig2: a floor rhombus with a fine dashed grid, extruded blocks with
// white tops and light grey sides, #111 outlines, an emerald accent, a black tag with a green dot). Pure geometry, shared by the markup and the motion.
// World: x = depth (0 = the back wall), y = time (month 0 at the front-left, y = N; the last month at the back-right, y ≈ 0: the run climbs to the right),
// z = height. Projection: x' = (x − y)·cos30°, y' = (x + y)·sin30° − z.
import { REV } from "../data";

export const N = REV.monthly.length;
const C = Math.cos(Math.PI / 6), S = 0.5;
export const D = 2;          // the floor's depth (x)
export const ZW = 3.2;       // the back wall's height = the top tick of both scales
const XC = 1.1, HW = 0.31;   // the columns' centre line (x) and half footprint

const SUM = REV.monthly.reduce((a, b) => a + b, 0), K = (REV.total * 1000) / SUM;   // the months, scaled to add up to the total (the first version's maths)
const MONTHS = REV.monthly.map((v) => v * K);
const maxL = REV.axisL[REV.axisL.length - 1], maxR = REV.axisR[REV.axisR.length - 1] * 1000;
/** each column's full height */
export const COL_H = MONTHS.map((v) => (v / maxL) * ZW);
/** a month's centre along the run */
const yc = (i: number) => N - i - 0.5;

export const P = (x: number, y: number, z: number): [number, number] => [(x - y) * C, (x + y) * S - z];
const f = (n: number) => n.toFixed(3);
const poly = (pts: [number, number][]) => "M" + pts.map(([a, b]) => `${f(a)},${f(b)}`).join("L") + "Z";

// the view box: the drawing plus room for the scales (left, right) and the tag (top)
const PAD_L = 1.7, PAD_R = 2.1, PAD_T = 1.1, PAD_B = 0.25;
export const VX = P(0, N, 0)[0] - PAD_L, VY = -ZW - PAD_T;
export const VW = P(D, 0, 0)[0] + PAD_R - VX, VH = P(D, N, 0)[1] + PAD_B - VY;
/** a world point, as % of the view box (for the HTML labels) */
export const pct = (x: number, y: number, z: number) => { const [a, b] = P(x, y, z); return { left: `${(((a - VX) / VW) * 100).toFixed(3)}%`, top: `${(((b - VY) / VH) * 100).toFixed(3)}%` }; };

// the floor, its grid (fine and dashed), the back wall and its tick lines
export const FLOOR = poly([P(0, 0, 0), P(D, 0, 0), P(D, N, 0), P(0, N, 0)]);
export const GRID = [
  ...Array.from({ length: N - 1 }, (_, i) => [P(0, i + 1, 0), P(D, i + 1, 0)]),
  ...[0.5, 1, 1.5].map((x) => [P(x, 0, 0), P(x, N, 0)]),
].map(([a, b]) => `M${f(a[0])},${f(a[1])}L${f(b[0])},${f(b[1])}`).join("");
export const WALL = poly([P(0, 0, 0), P(0, 0, ZW), P(0, N, ZW), P(0, N, 0)]);
export const WALL_TICKS = REV.axisR.slice(0, -1).map((v) => {
  const z = ((v * 1000) / maxR) * ZW, a = P(0, 0, z), b = P(0, N, z);
  return `M${f(a[0])},${f(a[1])}L${f(b[0])},${f(b[1])}`;
}).join("");
/** the scales: the bars' ($K) on the wall's near edge, the line's ($M) on its far edge */
export const TICKS_L = REV.axisL.map((v) => ({ v, at: pct(0, N, (v / maxL) * ZW) }));
export const TICKS_R = REV.axisR.map((v) => ({ v, at: pct(0, 0, ((v * 1000) / maxR) * ZW) }));

/** a column's three faces at height h: the left (+y) side, the right (+x) side, the top */
export function column(i: number, h: number) {
  const x0 = XC - HW, x1 = XC + HW, y0 = yc(i) - HW, y1 = yc(i) + HW;
  return {
    l: poly([P(x0, y1, 0), P(x1, y1, 0), P(x1, y1, h), P(x0, y1, h)]),
    r: poly([P(x1, y0, 0), P(x1, y1, 0), P(x1, y1, h), P(x1, y0, h)]),
    t: poly([P(x0, y0, h), P(x1, y0, h), P(x1, y1, h), P(x0, y1, h)]),
  };
}

// the cumulative line, on the back wall: from nothing at the front edge, through each month's running total, to the total at the far edge
const RUN: [number, number][] = [[N, 0]];   // [y, z]
MONTHS.reduce((acc, v, i) => { const c = acc + v; RUN.push([yc(i), (c / maxR) * ZW]); return c; }, 0);
RUN.push([0, RUN[RUN.length - 1][1]]);

/** a monotone curve through projected points (x' always grows along the run, so no overshoot: the total only grows) */
export function monotone(p: [number, number][]) {
  const n = p.length;
  if (n < 2) return "";
  const d: number[] = [], m: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((p[i + 1][1] - p[i][1]) / (p[i + 1][0] - p[i][0] || 1e-6));
  m.push(d[0]); for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2); m.push(d[n - 2]);
  for (let i = 0; i < n - 1; i++) { if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; } const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b; if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; } }
  let s = `M${f(p[0][0])},${f(p[0][1])}`;
  for (let i = 0; i < n - 1; i++) { const h = (p[i + 1][0] - p[i][0]) / 3; s += ` C${f(p[i][0] + h)},${f(p[i][1] + m[i] * h)} ${f(p[i + 1][0] - h)},${f(p[i + 1][1] - m[i + 1] * h)} ${f(p[i + 1][0])},${f(p[i + 1][1])}`; }
  return s;
}
/** the line drawn up to a share q (0..1) of the run, and where its head is */
export function line(q: number) {
  const yh = N * (1 - Math.max(0, Math.min(1, q)));
  const pts: [number, number][] = [];
  for (let k = 0; k < RUN.length; k++) {
    const [y, z] = RUN[k];
    if (y >= yh) { pts.push(P(0, y, z)); continue; }
    const [y0, z0] = RUN[k - 1], t = (y0 - yh) / (y0 - y || 1);
    pts.push(P(0, yh, z0 + (z - z0) * t)); break;
  }
  const head = pts[pts.length - 1];
  return { d: monotone(pts), hx: head[0], hy: head[1] };
}
/** the tag's anchor: the line's end */
export const END = pct(0, 0, RUN[RUN.length - 1][1]);

/** the chart's geometry as one object: the iso scene (this file) or the flat chart (./flat.ts, home v5) share this shape, so RevenueD and motion.ts draw either */
export type ChartGeo = {
  COL_H: number[]; VX: number; VY: number; VW: number; VH: number; HEAD_R: number;
  FLOOR: string; GRID: string; WALL: string; WALL_TICKS: string;
  TICKS_L: { v: number; at: { left: string; top: string } }[]; TICKS_R: { v: number; at: { left: string; top: string } }[];
  END: { left: string; top: string };
  column: (i: number, h: number) => { l: string; r: string; t: string };
  line: (q: number) => { d: string; hx: number; hy: number };
};
export const ISO: ChartGeo = { COL_H, VX, VY, VW, VH, HEAD_R: 0.085, FLOOR, GRID, WALL, WALL_TICKS, TICKS_L, TICKS_R, END, column, line };
