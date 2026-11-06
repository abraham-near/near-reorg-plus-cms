// Option 3's shared geometry (D72): one camera, written out here in plain maths so the vector layer and the WebGL scene
// agree to the pixel. three's PerspectiveCamera at CAM.pos looking at the origin projects exactly like `project` below,
// and the rotations match three's Object3D (rotX, rotY, rotZ applied innermost first). Units are scene units; the
// projection lands in Orbit's 420 × 315 drawing box. No three.js here: this file also draws the rest state on the server.

export type V3 = readonly [number, number, number];
export type P2 = readonly [number, number];
export type Attrs = Record<string, string>;

export const W = 420, H = 315;
export const rad = (d: number) => (d * Math.PI) / 180;
const r2 = (n: number) => Math.round(n * 100) / 100;

// A studio camera a little above the objects on a very long lens (far back, narrow field), so near and far balls stay
// within a few per cent of each other's size; the field keeps 3.48 units visible at the objects
const DIST = 34;
export const CAM = { fov: (2 * Math.atan(3.4815 / 2 / DIST) * 180) / Math.PI, dist: DIST, el: rad(12) } as const;
export const CAM_POS: V3 = [0, CAM.dist * Math.sin(CAM.el), CAM.dist * Math.cos(CAM.el)];
const TAN = Math.tan(rad(CAM.fov) / 2);
export const FOCAL = H / 2 / TAN; // px per unit at depth 1

// three's rotations: x' = Rx · v and so on
export const rotX = ([x, y, z]: V3, a: number): V3 => [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
export const rotY = ([x, y, z]: V3, a: number): V3 => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];
export const rotZ = ([x, y, z]: V3, a: number): V3 => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), z];
export const add = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

// The camera's basis (three's lookAt: z back toward the camera, x = up × z, y = z × x)
const len = Math.hypot(...CAM_POS);
const BZ: V3 = [CAM_POS[0] / len, CAM_POS[1] / len, CAM_POS[2] / len];
const BX: V3 = (() => { const v: V3 = [BZ[2], 0, -BZ[0]]; const l = Math.hypot(...v); return [v[0] / l, v[1] / l, v[2] / l]; })();
const BY: V3 = [BZ[1] * BX[2] - BZ[2] * BX[1], BZ[2] * BX[0] - BZ[0] * BX[2], BZ[0] * BX[1] - BZ[1] * BX[0]];

// World point → [x, y] in the 420 × 315 box, and its depth (distance in front of the camera)
export function project(p: V3): { p: P2; z: number } {
  const v: V3 = [p[0] - CAM_POS[0], p[1] - CAM_POS[1], p[2] - CAM_POS[2]];
  const z = -dot(v, BZ);
  return { p: [W / 2 + (dot(v, BX) / z) * FOCAL, H / 2 - (dot(v, BY) / z) * FOCAL], z };
}
export const px = (p: V3): P2 => project(p).p;

// An occluding sphere on screen (for lines that pass behind a ball)
export type Disc2 = { c: P2; r: number; z: number; c3: V3; r3: number };
export function sphere(c: V3, r: number): Disc2 {
  const q = project(c);
  return { c: q.p, r: (r * FOCAL) / q.z, z: q.z, c3: c, r3: r };
}
// Behind a ball on screen, or inside it
export const hidden = (p: V3, q: { p: P2; z: number }, occ: Disc2[]) =>
  occ.some((o) => Math.hypot(p[0] - o.c3[0], p[1] - o.c3[1], p[2] - o.c3[2]) < o.r3 ||
    (q.z > o.z && Math.hypot(q.p[0] - o.c[0], q.p[1] - o.c[1]) < o.r + 0.6));

// Sample a 3D curve and build a path, breaking it wherever `keep` says no (behind a plane, behind a ball)
export function curve(fn: (u: number) => V3, n: number, keep: (p: V3, q: { p: P2; z: number }) => boolean = () => true, occ: Disc2[] = []) {
  let d = "", on = false;
  for (let i = 0; i <= n; i++) {
    const p = fn(i / n), q = project(p);
    if (keep(p, q) && !hidden(p, q, occ)) {
      d += `${on ? "L" : "M"}${r2(q.p[0])} ${r2(q.p[1])}`;
      on = true;
    } else on = false;
  }
  return d;
}
export const seg2 = (a: P2, b: P2) => `M${r2(a[0])} ${r2(a[1])}L${r2(b[0])} ${r2(b[1])}`;
export const xf = (p: P2, deg = 0) => `translate(${r2(p[0])} ${r2(p[1])})${deg ? ` rotate(${r2(deg)})` : ""}`;
export const angle = (a: P2, b: P2) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;

// The rest of the vector vocabulary as paths about the origin, placed with `xf`
export const circlePath = (r: number) => `M${-r} 0a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
export const STAR = "M-3 0h6M0 -3v6";
export const SQUARE = "M-1.6 -1.6h3.2v3.2h-3.2z";
export const HEAD = "M0 0l-6-2.3v4.6z";

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const smooth = (u: number) => { const v = clamp(u); return v * v * (3 - 2 * v); };
