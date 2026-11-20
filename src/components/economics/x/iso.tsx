// Economics X, the isometric hand its two drawings share (the hero's plinth, the loop): Foundation C's geometry (../../foundation/c/iso.ts: 2:1 iso,
// x right-down, y left-down, z up) and the site's look: white tops, light grey sides, 1 px ink hairlines (non-scaling), one green.
// Drawing classes the build reads (motion.ts): .d-floor (the dotted floor fades in), .d-e (edges that draw), .d-f (faces that fade in), .d-o (accents, last).
import { P, f, box, faces, wire, coin } from "../../foundation/c/iso";

export { P, f, pts, line, box, faces, wire, coin, vbox, corners, type V, type Box } from "../../foundation/c/iso";
export type B6 = [number, number, number, number, number, number];

export const tr = (v: [number, number]) => `translate(${f(v[0])} ${f(v[1])})`;

/** a lattice of floor dots over [x0, x1] × [y0, y1] at z, one path of round caps */
export function dots(x0: number, y0: number, x1: number, y1: number, step: number, z = 0) {
  let d = "";
  for (let x = x0; x <= x1 + 1e-6; x += step) for (let y = y0; y <= y1 + 1e-6; y += step) { const [a, b] = P(x, y, z); d += `M${f(a)},${f(b)}h0`; }
  return d;
}
/** a matrix that lays a flat 2D drawing (a right, b down, in world units) on a top face, origin at world (x, y, z) */
export const onTop = (x: number, y: number, z: number) => { const o = P(x, y, z), C = Math.cos(Math.PI / 6); return `matrix(${f(C)},0.5,${f(-C)},0.5,${f(o[0])},${f(o[1])})`; };

/** a box (x, y, w, d, z0, h) as its three faces and its edges (one path that draws in) */
export function Slab({ b, cls = "" }: { b: B6; cls?: string }) {
  const bx = box(...b), fc = faces(bx);
  return (
    <g className={`ex-sl ${cls}`}>
      <g className="d-f">
        <polygon className="ex-sl__l" points={fc.left} />
        <polygon className="ex-sl__r" points={fc.right} />
        <polygon className="ex-sl__t" points={fc.top} />
      </g>
      <path className="ex-sl__e d-e" d={wire(bx)} pathLength={1} />
    </g>
  );
}

/** a coin standing at world (x, y, z): its side and its face */
export function Coin({ x, y, z, r, h, cls = "" }: { x: number; y: number; z: number; r: number; h: number; cls?: string }) {
  const c = coin(x, y, z, r, h);
  return (
    <g className={`ex-cn ${cls}`}>
      <path className="ex-cn__s" d={c.side} />
      <ellipse className="ex-cn__t" cx={f(c.cx)} cy={f(c.cy)} rx={f(c.rx)} ry={f(c.ry)} />
    </g>
  );
}
