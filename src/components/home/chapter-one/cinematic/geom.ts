// Geometry for the cinematic hero's vector layers (lab, /lab/hero-cinematic). Everything is in the photo's own pixels
// (2688 × 1520), so a line drawn on a ridge stays on it at any crop. Ellipses are circles in a plane seen in
// perspective; t runs clockwise on screen from 3 o'clock (t = 90 is the near point of a plane lying flat).
export type Pt = readonly [number, number];
export type Ell = { cx: number; cy: number; rx: number; ry: number; rot?: number };

const rad = (d: number) => (d * Math.PI) / 180;
export const r2 = (n: number) => Math.round(n * 10) / 10;

export function pt(e: Ell, t: number, s = 1): Pt {
  const a = rad(t), r = rad(e.rot ?? 0);
  const x = e.rx * s * Math.cos(a), y = e.ry * s * Math.sin(a);
  return [r2(e.cx + x * Math.cos(r) - y * Math.sin(r)), r2(e.cy + x * Math.sin(r) + y * Math.cos(r))];
}

// The outward normal of the ellipse at t, as a unit vector on screen
function normal(e: Ell, t: number): Pt {
  const a = rad(t), r = rad(e.rot ?? 0);
  const nx = Math.cos(a) / e.rx, ny = Math.sin(a) / e.ry;
  const x = nx * Math.cos(r) - ny * Math.sin(r), y = nx * Math.sin(r) + ny * Math.cos(r);
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
}

// The arc from t0 to t1, sampled finely enough to read as a smooth curve
export function arc(e: Ell, t0: number, t1: number, s = 1): string {
  const n = Math.max(8, Math.ceil(Math.abs(t1 - t0) / 2));
  let d = "";
  for (let i = 0; i <= n; i++) {
    const p = pt(e, t0 + ((t1 - t0) * i) / n, s);
    d += `${i ? "L" : "M"}${p[0]} ${p[1]}`;
  }
  return d;
}

// Ticks along an ellipse every `step` degrees, `len` px out along the normal (negative = inward); every `major`-th tick
// is `majorLen` long
export function ticks(e: Ell, t0: number, t1: number, step: number, len: number, major = 0, majorLen = len, s = 1): string {
  let d = "";
  for (let t = t0, i = 0; t <= t1 + 1e-6; t += step, i++) {
    const p = pt(e, t, s), n = normal(e, t), l = major && i % major === 0 ? majorLen : len;
    d += `M${p[0]} ${p[1]}L${r2(p[0] + n[0] * l)} ${r2(p[1] + n[1] * l)}`;
  }
  return d;
}

export const seg = (a: Pt, b: Pt) => `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`;
export const poly = (ps: readonly Pt[]) => ps.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join("");

// A logarithmic spiral about c: radius r0 at angle a0 (degrees, anticlockwise on screen from 3 o'clock), shrinking by
// `k` per quarter turn as the angle grows, out to angle a1
export function spiral(c: Pt, r0: number, a0: number, a1: number, k = 1.618): string {
  const b = Math.log(k) / (Math.PI / 2);
  let d = "";
  const n = Math.ceil(Math.abs(a1 - a0) / 2);
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n, r = r0 * Math.exp(-b * rad(a - a0));
    d += `${i ? "L" : "M"}${r2(c[0] + r * Math.cos(rad(a)))} ${r2(c[1] - r * Math.sin(rad(a)))}`;
  }
  return d;
}

export function spiralPt(c: Pt, r0: number, a0: number, a: number, k = 1.618): Pt {
  const b = Math.log(k) / (Math.PI / 2), r = r0 * Math.exp(-b * rad(a - a0));
  return [r2(c[0] + r * Math.cos(rad(a))), r2(c[1] - r * Math.sin(rad(a)))];
}

// Each point joins its `k` nearest neighbours within `reach` (a plexus); every pair once
export function nearest(ps: readonly Pt[], k = 2, reach = 400): [number, number][] {
  const out = new Set<string>();
  ps.forEach((p, i) => {
    ps.map((q, j) => [j, Math.hypot(q[0] - p[0], q[1] - p[1])] as const)
      .filter(([j, d]) => j !== i && d <= reach)
      .sort((a, b) => a[1] - b[1])
      .slice(0, k)
      .forEach(([j]) => out.add(i < j ? `${i}-${j}` : `${j}-${i}`));
  });
  return [...out].map((s) => s.split("-").map(Number) as [number, number]);
}

// Point lists from the JSON tracks
export const pts = (a: number[][]): Pt[] => a.map(([x, y]) => [x, y] as const);
