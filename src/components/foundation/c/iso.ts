// Foundation C's isometric hand: home v4's (the rail's vig2 and Revenue A's IsoBuyback): 2:1 isometric, x runs right-down, y left-down, z up.
// Projection: x' = (x − y)·cos30°, y' = (x + y)·sin30° − z. Everything here is pure geometry (strings for SVG), shared by the markup and the motion.
export const C30 = Math.cos(Math.PI / 6);
export type V = [number, number];
export const P = (x: number, y: number, z = 0): V => [(x - y) * C30, (x + y) * 0.5 - z];
export const f = (n: number) => (Math.round(n * 100) / 100).toString();
export const pts = (...ps: V[]) => ps.map((p) => `${f(p[0])},${f(p[1])}`).join(" ");
export const line = (...ps: V[]) => "M" + ps.map((p) => `${f(p[0])},${f(p[1])}`).join("L");

export type Box = { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number };
export const box = (x: number, y: number, w: number, d: number, z0: number, h: number): Box => ({ x0: x, x1: x + w, y0: y, y1: y + d, z0, z1: z0 + h });

/** the three visible faces of a box: top, left (the y = y1 face) and right (the x = x1 face) */
export function faces(b: Box) {
  const { x0, x1, y0, y1, z0, z1 } = b;
  return {
    top: pts(P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)),
    left: pts(P(x0, y1, z1), P(x1, y1, z1), P(x1, y1, z0), P(x0, y1, z0)),
    right: pts(P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0), P(x1, y0, z0)),
  };
}
/** the box's visible edges as one continuous path (one edge retraced), so a dash draws it in one stroke: front foot up, round the faces, over the top */
export function wire(b: Box) {
  const { x0, x1, y0, y1, z0, z1 } = b;
  const A = P(x1, y1, z0), B = P(x1, y1, z1), Cc = P(x0, y1, z1), D = P(x0, y1, z0), E = P(x1, y0, z0), F = P(x1, y0, z1), G = P(x0, y0, z1);
  return line(A, B, Cc, D, A, E, F, B, F, G, Cc);
}
/** the hidden (back) edges of a box: for glass */
export function hidden(b: Box) {
  const { x0, x1, y0, y1, z0, z1 } = b;
  return [line(P(x0, y0, z1), P(x0, y0, z0)), line(P(x0, y0, z0), P(x1, y0, z0)), line(P(x0, y0, z0), P(x0, y1, z0))];
}
/** the box's outline (its silhouette) */
export function outline(b: Box) {
  const { x0, x1, y0, y1, z0, z1 } = b;
  return line(P(x0, y0, z1), P(x1, y0, z1), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0), P(x0, y1, z1)) + "Z";
}
/** a dotted / dashed floor grid over [x0,x1]×[y0,y1] at z, n lines each way */
export function grid(x0: number, x1: number, y0: number, y1: number, z: number, nx: number, ny: number) {
  const out: string[] = [];
  for (let i = 0; i <= nx; i++) { const x = x0 + ((x1 - x0) * i) / nx; out.push(line(P(x, y0, z), P(x, y1, z))); }
  for (let j = 0; j <= ny; j++) { const y = y0 + ((y1 - y0) * j) / ny; out.push(line(P(x0, y, z), P(x1, y, z))); }
  return out;
}
/** a circle lying in the floor plane, projected: an ellipse's radii */
export const ell = (r: number): V => [r * Math.SQRT2 * C30, r * Math.SQRT2 * 0.5];
/** a coin (short cylinder) standing on (x, y, z): its side path and its face ellipse */
export function coin(x: number, y: number, z: number, r: number, h: number) {
  const [bx, by] = P(x, y, z), [rx, ry] = ell(r), ty = by - h;
  return {
    side: `M${f(bx - rx)},${f(ty)}L${f(bx - rx)},${f(by)}A${f(rx)},${f(ry)} 0 0 0 ${f(bx + rx)},${f(by)}L${f(bx + rx)},${f(ty)}Z`,
    cx: bx, cy: ty, rx, ry,
  };
}
/** a viewBox around a set of points, with a margin */
export function vbox(ps: V[], m = 8) {
  let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
  for (const [x, y] of ps) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); }
  return { x: a - m, y: b - m, w: c - a + 2 * m, h: d - b + 2 * m, s: `${f(a - m)} ${f(b - m)} ${f(c - a + 2 * m)} ${f(d - b + 2 * m)}` };
}
export const corners = (b: Box): V[] => [P(b.x0, b.y0, b.z1), P(b.x1, b.y0, b.z1), P(b.x1, b.y1, b.z1), P(b.x0, b.y1, b.z1), P(b.x1, b.y0, b.z0), P(b.x1, b.y1, b.z0), P(b.x0, b.y1, b.z0)];
/** a tiny deterministic random */
export function rng(seed: number) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
/** chip width for a mono caps label at 11.5 px */
export const chipW = (label: string) => 30 + label.length * 7.4;
