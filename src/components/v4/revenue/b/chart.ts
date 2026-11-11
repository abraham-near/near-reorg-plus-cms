// Option B's chart and gauge geometry: the same maths as the first version (../Revenue.tsx), kept here so this option stands on its own.
// Bars: each month's net revenue (left scale, $K), scaled so they add up to the total; the line: the running total (right scale, $M), a monotone curve.
import { REV } from "../data";

export const W = 1000, H = 400;
const N = REV.monthly.length;
const SUM = REV.monthly.reduce((a, b) => a + b, 0), K = (REV.total * 1000) / SUM;
export const MONTHS = REV.monthly.map((v) => v * K);
export const maxL = REV.axisL[REV.axisL.length - 1], maxR = REV.axisR[REV.axisR.length - 1] * 1000;
const slot = W / (N + 1);
export const barW = slot * 0.46;
export const xAt = (i: number) => (i + 1) * slot;   // a month's centre (x = 0 is the start: nothing yet)

const pts: [number, number][] = [[0, H]];
MONTHS.reduce((acc, v, i) => { const c = acc + v; pts.push([xAt(i), H - (c / maxR) * H]); return c; }, 0);
export const END = pts[pts.length - 1];   // the last month: the total
pts.push([W, END[1]]);

/** a monotone curve through the points (no overshoot: the total only grows) */
function monotone(p: [number, number][]) {
  const n = p.length, d: number[] = [], m: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((p[i + 1][1] - p[i][1]) / (p[i + 1][0] - p[i][0]));
  m.push(d[0]); for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2); m.push(d[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  let s = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = (p[i + 1][0] - p[i][0]) / 3;
    s += ` C${(p[i][0] + h).toFixed(1)},${(p[i][1] + m[i] * h).toFixed(1)} ${(p[i + 1][0] - h).toFixed(1)},${(p[i + 1][1] - m[i + 1] * h).toFixed(1)} ${p[i + 1][0].toFixed(1)},${p[i + 1][1].toFixed(1)}`;
  }
  return s;
}
export const LINE = monotone(pts);
/** the area under the line, for a faint wash */
export const AREA = `${LINE} L${W},${H} L0,${H} Z`;

// the gauge: a 270° dial open at the foot (135° round the top to 45°), centre (100, 100), radius 78; ticks every tenth outside it
export const ARC = "M44.85,155.15 A78,78 0 1 1 155.15,155.15";
const r2 = (v: number) => Math.round(v * 100) / 100;   // fixed digits: the server and the browser must print the same attribute
const at = (t: number, r: number) => { const a = ((135 + 270 * t) * Math.PI) / 180; return [r2(100 + r * Math.cos(a)), r2(100 + r * Math.sin(a))] as const; };
export const TICKS = Array.from({ length: 11 }, (_, i) => { const [x1, y1] = at(i / 10, 90), [x2, y2] = at(i / 10, i % 5 ? 95 : 98); return { x1, y1, x2, y2, major: i % 5 === 0 }; });
export const MARK = (() => { const t = REV.capture / 100, [x1, y1] = at(t, 66), [x2, y2] = at(t, 98); return { x1, y1, x2, y2 }; })();
