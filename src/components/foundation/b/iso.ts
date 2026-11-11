// Foundation B's isometric hand, after the rail's (public/v1/vig2/*.svg) and Revenue A's (v4/revenue/a/IsoBuyback.tsx): 2:1 isometric, white tops, light grey
// sides, #111 hairlines, a dotted floor, one green accent. Pure geometry, shared by every drawing on the page and by their motion.
// World: x runs right-down, y left-down, z up. Projection: x' = (x − y)·cos30°, y' = (x + y)·sin30° − z (one unit = `u` screen units).
export const C = Math.cos(Math.PI / 6), S = 0.5;
export type V = [number, number];
export const P = (x: number, y: number, z = 0): V => [(x - y) * C, (x + y) * S - z];
export const f = (n: number) => (Math.abs(n) < 0.005 ? "0" : n.toFixed(2));
/** points for a <polygon>, scaled by u */
export const pts = (ps: V[], u = 1) => ps.map(([a, b]) => `${f(a * u)},${f(b * u)}`).join(" ");
/** a path through points, scaled by u */
export const line = (ps: V[], u = 1, close = false) => "M" + ps.map(([a, b]) => `${f(a * u)},${f(b * u)}`).join("L") + (close ? "Z" : "");

export const INK = "#111111", TOP = "#FFFFFF", SIDE_R = "#E8E8E6", SIDE_L = "#F2F2F0", GREEN = "#00DC8D", PAPER = "#F5F4F1";

/** a box's three visible faces (its top, its x = max side, its y = max side) as polygon points */
export function box(x0: number, y0: number, z0: number, dx: number, dy: number, dz: number, u = 1) {
  const x1 = x0 + dx, y1 = y0 + dy, z1 = z0 + dz;
  return {
    t: pts([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], u),
    r: pts([P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0), P(x1, y0, z0)], u),
    l: pts([P(x0, y1, z1), P(x1, y1, z1), P(x1, y1, z0), P(x0, y1, z0)], u),
  };
}
/** the silhouette of a box (its outer outline), for drawing-in */
export function boxOutline(x0: number, y0: number, z0: number, dx: number, dy: number, dz: number, u = 1) {
  const x1 = x0 + dx, y1 = y0 + dy, z1 = z0 + dz;
  return line([P(x0, y0, z1), P(x1, y0, z1), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0), P(x0, y1, z1)], u, true);
}
/** a matrix that maps a flat 2D drawing (a right, b down) onto a face, origin at the face point o (screen units) */
export const onTop = (o: V) => `matrix(${f(C)},${f(S)},${f(-C)},${f(S)},${f(o[0])},${f(o[1])})`;      // a along +x, b along +y
export const onLeft = (o: V) => `matrix(${f(C)},${f(S)},0,1,${f(o[0])},${f(o[1])})`;                 // the y = max face: a along +x, b down
export const onRight = (o: V) => `matrix(${f(C)},${f(-S)},0,1,${f(o[0])},${f(o[1])})`;               // the x = max face: a along −y, b down

/** a lattice of floor dots (one per unit) over [x0, x1] × [y0, y1], as one path of tiny round caps (cheap: one element) */
export function floorDots(x0: number, y0: number, x1: number, y1: number, u = 1, step = 1) {
  let d = "";
  for (let x = x0; x <= x1 + 1e-6; x += step) for (let y = y0; y <= y1 + 1e-6; y += step) { const [a, b] = P(x, y); d += `M${f(a * u)},${f(b * u)}h0`; }
  return d;
}
/** a floor rhombus */
export const floor = (x0: number, y0: number, x1: number, y1: number, u = 1) => pts([P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)], u);

/** a coin (a short cylinder) standing on world (x, y, z): its side path and the top ellipse (cx, cy, rx, ry), r and h in world units */
export function coin(x: number, y: number, z: number, r: number, h: number, u = 1) {
  const [bx, by] = P(x, y, z), rx = r * Math.SQRT2 * C, ry = r * Math.SQRT2 * S;
  const X = bx * u, Y = by * u, RX = rx * u, RY = ry * u, H = h * u;
  return {
    side: `M${f(X - RX)},${f(Y - H)}L${f(X - RX)},${f(Y)}A${f(RX)},${f(RY)} 0 0 0 ${f(X + RX)},${f(Y)}L${f(X + RX)},${f(Y - H)}Z`,
    cx: X, cy: Y - H, rx: RX, ry: RY,
  };
}
export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const ease3 = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const smooth = (a: number, b: number, x: number) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
