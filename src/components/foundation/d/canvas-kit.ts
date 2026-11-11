// Version D's canvas hand: the rail illustrations' isometric grammar (public/v1/vig2: white tops, light grey sides, #111 outlines, one emerald accent),
// drawn with Canvas 2D for the two live scenes (hero.ts, devolve.ts). Projection, as everywhere on the site: x' = (x − y)·cos30°, y' = (x + y)·sin30° − z
// (x runs right-down, y left-down, z up). Every shape is anchored on the screen point of its footprint's centre at z = 0; k = css px per world unit.
export const C = Math.cos(Math.PI / 6), S = 0.5;
export const INK = "#111111", SIDE_R = "#ECECEC", SIDE_L = "#F5F5F5", TOP = "#FFFFFF", GREEN = "#00DC8D", PAPER = "#F5F4F1";
export type Pal = { top: string; l: string; r: string; ink: string };
export const LIGHT: Pal = { top: TOP, l: SIDE_L, r: SIDE_R, ink: INK };
export const DARK: Pal = { top: "#2E2E2E", l: "#1C1C1C", r: "#161616", ink: INK };

export const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const o3 = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const oBack = (t: number) => { t = clamp(t); const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
export const io = (t: number) => { t = clamp(t); return t * t * (3 - 2 * t); };
/** a seeded generator (mulberry32) */
export const rng = (a: number) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

type Ctx = CanvasRenderingContext2D;
const poly = (c: Ctx, p: number[], fill: string, ink: string) => {
  c.beginPath(); c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.closePath();
  c.fillStyle = fill; c.fill(); c.strokeStyle = ink; c.stroke();
};

/** a box: footprint w × d centred on (ox, oy), from z0 up h; its two visible sides and its top, outlined */
export function box(c: Ctx, ox: number, oy: number, k: number, w: number, d: number, h: number, z0: number, pal: Pal = LIGHT, topFill?: string) {
  const hx = w / 2, hy = d / 2, z1 = z0 + h;
  const X = (x: number, y: number) => ox + (x - y) * C * k, Y = (x: number, y: number, z: number) => oy + ((x + y) * S - z) * k;
  poly(c, [X(hx, -hy), Y(hx, -hy, z1), X(hx, hy), Y(hx, hy, z1), X(hx, hy), Y(hx, hy, z0), X(hx, -hy), Y(hx, -hy, z0)], pal.r, pal.ink);
  poly(c, [X(-hx, hy), Y(-hx, hy, z1), X(hx, hy), Y(hx, hy, z1), X(hx, hy), Y(hx, hy, z0), X(-hx, hy), Y(-hx, hy, z0)], pal.l, pal.ink);
  poly(c, [X(-hx, -hy), Y(-hx, -hy, z1), X(hx, -hy), Y(hx, -hy, z1), X(hx, hy), Y(hx, hy, z1), X(-hx, hy), Y(-hx, hy, z1)], topFill || pal.top, pal.ink);
}
/** a flat square on a plane at height z (an inset on a top face) */
export function quad(c: Ctx, ox: number, oy: number, k: number, x: number, y: number, w: number, d: number, z: number, fill: string, ink = INK) {
  const X = (a: number, b: number) => ox + (a - b) * C * k, Y = (a: number, b: number) => oy + ((a + b) * S - z) * k;
  poly(c, [X(x, y), Y(x, y), X(x + w, y), Y(x + w, y), X(x + w, y + d), Y(x + w, y + d), X(x, y + d), Y(x, y + d)], fill, ink);
}
/** a short cylinder standing at (ox, oy) on z0: radius r, height h */
export function cyl(c: Ctx, ox: number, oy: number, k: number, r: number, h: number, z0: number, side = SIDE_R, top = TOP, ink = INK) {
  const rx = r * Math.SQRT2 * C * k, ry = r * Math.SQRT2 * S * k, yb = oy - z0 * k, yt = yb - h * k;
  c.beginPath(); c.moveTo(ox - rx, yt); c.lineTo(ox - rx, yb); c.ellipse(ox, yb, rx, ry, 0, Math.PI, 0, true); c.lineTo(ox + rx, yt); c.closePath();
  c.fillStyle = side; c.fill(); c.strokeStyle = ink; c.stroke();
  c.beginPath(); c.ellipse(ox, yt, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = top; c.fill(); c.stroke();
}
/** a person, as simple shapes: a cylinder body and a round head */
export function person(c: Ctx, ox: number, oy: number, k: number, z0: number, green = false, ink = INK) {
  cyl(c, ox, oy, k, 2.3, 6.2, z0, SIDE_R, TOP, ink);
  const hr = 2.15 * k, hy = oy - (z0 + 6.2 + 3.1) * k;
  c.beginPath(); c.arc(ox, hy, hr, 0, Math.PI * 2); c.fillStyle = green ? GREEN : TOP; c.fill(); c.strokeStyle = ink; c.stroke();
}
/** an iso ring on the floor (a ping): radius r (world units) */
export function ring(c: Ctx, ox: number, oy: number, k: number, r: number, z = 0) {
  c.beginPath(); c.ellipse(ox, oy - z * k, r * Math.SQRT2 * C * k, r * Math.SQRT2 * S * k, 0, 0, Math.PI * 2); c.stroke();
}

/** a canvas sized to its box at a capped device pixel ratio; returns the 2d context, scaled to css px */
export function fit(cv: HTMLCanvasElement, w: number, h: number, maxDpr = 2) {
  const dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
  const W = Math.max(1, Math.round(w * dpr)), H = Math.max(1, Math.round(h * dpr));
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  const c = cv.getContext("2d")!; c.setTransform(dpr, 0, 0, dpr, 0, 0); c.lineJoin = "round"; c.lineCap = "round";
  return { c, dpr };
}
