// Perspective geometry for the vector layer (D54): circles in the render's planes drawn as ellipses in the 420 × 315
// box. An ellipse's angle t runs clockwise on screen (t = 90 is the near point when the plane lies flat); `s` scales it
// about its centre, so concentric construction circles, tick rings and orbits stay in the same plane.
export type Ell = { cx: number; cy: number; rx: number; ry: number; rot?: number };
export type Pt = readonly [number, number];

const rad = (d: number) => (d * Math.PI) / 180;
export const f = (n: number) => Math.round(n * 100) / 100;

export function pt(e: Ell, t: number, s = 1): Pt {
  const a = rad(t), r = rad(e.rot ?? 0);
  const x = e.rx * s * Math.cos(a), y = e.ry * s * Math.sin(a);
  return [f(e.cx + x * Math.cos(r) - y * Math.sin(r)), f(e.cy + x * Math.sin(r) + y * Math.cos(r))];
}

// The arc from t0 to t1 (t1 > t0), as a path
export function arc(e: Ell, t0: number, t1: number, s = 1): string {
  const [x0, y0] = pt(e, t0, s), [x1, y1] = pt(e, t1, s);
  return `M${x0} ${y0}A${f(e.rx * s)} ${f(e.ry * s)} ${e.rot ?? 0} ${t1 - t0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
}

// The whole ellipse, scaled
export const ring = (e: Ell, s = 1) => `${arc(e, 0, 180, s)}${arc(e, 180, 360, s).replace(/^M[^A]+/, "")}`;

// Radial ticks between scales s1 and s2 every `step` degrees from t0 to t1 (inclusive); `major` ticks reach s3
export function ticks(e: Ell, t0: number, t1: number, step: number, s1: number, s2: number, major = 0, s3 = s2): string {
  let d = "";
  for (let t = t0, i = 0; t <= t1 + 1e-6; t += step, i++) {
    const a = pt(e, t, s1), b = pt(e, t, major && i % major === 0 ? s3 : s2);
    d += `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`;
  }
  return d;
}

export const add = (a: Pt, b: Pt, k = 1): Pt => [f(a[0] + b[0] * k), f(a[1] + b[1] * k)];
export const seg = (a: Pt, b: Pt) => `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`;

// The direction of travel (degrees on screen) along the ellipse at t, as t increases
export function dir(e: Ell, t: number): number {
  const a = rad(t), r = rad(e.rot ?? 0);
  const dx = -e.rx * Math.sin(a), dy = e.ry * Math.cos(a);
  return f((Math.atan2(dx * Math.sin(r) + dy * Math.cos(r), dx * Math.cos(r) - dy * Math.sin(r)) * 180) / Math.PI);
}

// The arc from t0 back to t1 (t1 < t0, anticlockwise on screen): a path text can ride left to right along a near side
export function back(e: Ell, t0: number, t1: number, s = 1): string {
  const [x0, y0] = pt(e, t0, s), [x1, y1] = pt(e, t1, s);
  return `M${x0} ${y0}A${f(e.rx * s)} ${f(e.ry * s)} ${e.rot ?? 0} ${t0 - t1 > 180 ? 1 : 0} 0 ${x1} ${y1}`;
}
