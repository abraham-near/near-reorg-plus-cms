// Option D's chart, flat (home v5): the same figures as ./iso.ts in two dimensions, in the same hand (#111 hairlines, white bars, the emerald line, the black
// tag). Time runs left to right, one unit per month: the months as bars on the left scale ($K), their running total as the line on the right scale ($M).
// Same shape as iso.ts's ISO (ChartGeo), so RevenueD and motion.ts build it the same way (bars rising month by month, the line drawing along them).
import { REV } from "../data";
import { monotone, type ChartGeo } from "./iso";

const N = REV.monthly.length;
const PH = N * 0.6;                  // the plot's height, in month widths
const BW = 0.3;                      // a bar's half width
const SUM = REV.monthly.reduce((a, b) => a + b, 0), K = (REV.total * 1000) / SUM;
const MONTHS = REV.monthly.map((v) => v * K);
const maxL = REV.axisL[REV.axisL.length - 1], maxR = REV.axisR[REV.axisR.length - 1] * 1000;

const P = (t: number, z: number): [number, number] => [t, -z];
const f = (n: number) => n.toFixed(3);
const seg = (a: [number, number], b: [number, number]) => `M${f(a[0])},${f(a[1])}L${f(b[0])},${f(b[1])}`;
const rect = (x0: number, x1: number, h: number) => `M${f(x0)},0L${f(x1)},0L${f(x1)},${f(-h)}L${f(x0)},${f(-h)}Z`;

const PAD_L = 1.75, PAD_R = 2.05, PAD_T = 1.15, PAD_B = 0.35;
const VX = -PAD_L, VY = -PH - PAD_T, VW = N + PAD_L + PAD_R, VH = PH + PAD_T + PAD_B;
const pct = (t: number, z: number) => { const [a, b] = P(t, z); return { left: `${(((a - VX) / VW) * 100).toFixed(3)}%`, top: `${(((b - VY) / VH) * 100).toFixed(3)}%` }; };

const COL_H = MONTHS.map((v) => (v / maxL) * PH);
// the line: from nothing at the left edge, through each month's running total (at the bar's centre), and it stops there, on the last month: a running total
// only climbs, so no flat run out to the right edge (design review 12 Nov: "cut it where the dot is")
const RUN: [number, number][] = [[0, 0]];   // [t, z]
MONTHS.reduce((acc, v, i) => { const c = acc + v; RUN.push([i + 0.5, (c / maxR) * PH]); return c; }, 0);
const T_END = RUN[RUN.length - 1][0];

function line(q: number) {
  const th = T_END * Math.max(0, Math.min(1, q));
  const pts: [number, number][] = [];
  for (let k = 0; k < RUN.length; k++) {
    const [t, z] = RUN[k];
    if (t <= th) { pts.push(P(t, z)); continue; }
    const [t0, z0] = RUN[k - 1], u = (th - t0) / (t - t0 || 1);
    pts.push(P(th, z0 + (z - z0) * u)); break;
  }
  const head = pts[pts.length - 1];
  return { d: monotone(pts), hx: head[0], hy: head[1] };
}

export const FLAT: ChartGeo = {
  COL_H, VX, VY, VW, VH, HEAD_R: 0.11,
  // the frame: the plot's box (light); the baseline in ink; the right scale's ticks dashed across; a faint dashed line between months
  WALL: `M0,0L0,${f(-PH)}L${N},${f(-PH)}L${N},0`,
  WALL_TICKS: REV.axisR.slice(0, -1).map((v) => { const z = ((v * 1000) / maxR) * PH; return seg(P(0, z), P(N, z)); }).join(""),
  FLOOR: seg(P(0, 0), P(N, 0)),
  GRID: Array.from({ length: N - 1 }, (_, i) => seg(P(i + 1, 0), P(i + 1, -0.14))).join(""),
  TICKS_L: REV.axisL.map((v) => ({ v, at: pct(0, (v / maxL) * PH) })),
  TICKS_R: REV.axisR.map((v) => ({ v, at: pct(N, ((v * 1000) / maxR) * PH) })),
  END: pct(T_END, RUN[RUN.length - 1][1]),
  column: (i, h) => ({ l: "", r: "", t: rect(i + 0.5 - BW, i + 0.5 + BW, h) }),
  line,
};
