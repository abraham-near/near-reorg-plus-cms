// Option C's chart maths, in unit space (x 0..1 across the plot, y 0..1 up the scale), so the dot drawings (./dots.ts) can map them to any cell size.
// Same reading as the first version (../Revenue.tsx): the monthly bars scaled to add up to the total, the cumulative line through each month's centre,
// a monotone curve (no overshoot: the total only grows).
import { REV } from "../data";

export const N = REV.monthly.length;
const SUM = REV.monthly.reduce((a, b) => a + b, 0);
/** each month's revenue, $K, scaled so the months add up to the total */
export const MONTHS = REV.monthly.map((v) => (v * REV.total * 1000) / SUM);
export const MAX_L = REV.axisL[REV.axisL.length - 1];          // the bars' scale, $K
export const MAX_R = REV.axisR[REV.axisR.length - 1] * 1000;   // the line's scale, $K
/** a month's centre on 0..1 (x = 0 is the start: nothing yet) */
export const xAt = (i: number) => (i + 1) / (N + 1);

/** the cumulative points, [x, y] on 0..1 */
export const CUM: [number, number][] = (() => {
  const p: [number, number][] = [[0, 0]];
  let c = 0;
  MONTHS.forEach((v, i) => { c += v; p.push([xAt(i), c / MAX_R]); });
  p.push([1, c / MAX_R]);
  return p;
})();

/** Fritsch–Carlson tangents (scale-free, so the unit-space tangents hold once the curve is stretched to its cell) */
const TAN: number[] = (() => {
  const p = CUM, n = p.length, d: number[] = [], m: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((p[i + 1][1] - p[i][1]) / (p[i + 1][0] - p[i][0]));
  m.push(d[0]);
  for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2);
  m.push(d[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return m;
})();

/** the curve, densely sampled in pixels (w × h, y down) */
export function curve(w: number, h: number, per = 28): [number, number][] {
  const p = CUM, out: [number, number][] = [];
  for (let i = 0; i < p.length - 1; i++) {
    const [x0, y0] = p[i], [x1, y1] = p[i + 1], dx = x1 - x0, m0 = TAN[i] * dx, m1 = TAN[i + 1] * dx;
    for (let k = i ? 1 : 0; k <= per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      const y = (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * m1;
      out.push([(x0 + dx * t) * w, h - y * h]);
    }
  }
  return out;
}

/** points every `step` px along a polyline (its arc length), the last point always included */
export function along(pts: [number, number][], step: number): [number, number][] {
  const out: [number, number][] = [pts[0]];
  let need = step;
  for (let i = 1; i < pts.length; i++) {
    let [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    let seg = Math.hypot(bx - ax, by - ay);
    while (seg >= need) {
      const t = need / seg; ax += (bx - ax) * t; ay += (by - ay) * t;
      out.push([ax, ay]); seg -= need; need = step;
    }
    need -= seg;
  }
  const last = pts[pts.length - 1], tail = out[out.length - 1];
  if (Math.hypot(last[0] - tail[0], last[1] - tail[1]) > step * 0.45) out.push(last); else out[out.length - 1] = last;
  return out;
}
