// Analytics C's drawing kit: the repo's iso hand (../../foundation/b/iso.ts: 2:1 isometric, white tops, light grey sides, ink hairlines, a dotted floor,
// one green), as small SVG pieces shared by the hero's network and the five story scenes. Pure markup: motion.ts moves them.
import { useId, type ReactNode } from "react";
import { box, coin, floorDots, P, f, INK, TOP, SIDE_L, SIDE_R, GREEN, type V } from "../../foundation/b/iso";

export { P, f, INK, TOP, SIDE_L, SIDE_R, GREEN, type V };
export type B6 = readonly [number, number, number, number, number, number];
/** build hints read by motion.ts's scene engine: the element appears between scene progress a and b, in mode m (drop / pop / draw / fade / out) */
export type Bld = { a: number; b: number; m: "drop" | "pop" | "draw" | "fade" | "out"; d?: number };
export const bld = (h?: Bld): Record<string, string> =>
  h ? { "data-a": h.a.toFixed(3), "data-b": h.b.toFixed(3), "data-m": h.m, ...(h.d ? { "data-d": String(h.d) } : {}) } : {};

/** a projected world point, in screen units */
export const S = (x: number, y: number, z: number, u: number): V => { const p = P(x, y, z); return [p[0] * u, p[1] * u]; };

/** a box: its three visible faces, ink hairlines */
export function Bx({ b, u, top, cls, h, children }: { b: B6; u: number; top?: string; cls?: string; h?: Bld; children?: ReactNode }) {
  const q = box(b[0], b[1], b[2], b[3], b[4], b[5], u);
  return (
    <g className={cls} {...bld(h)}>
      <polygon points={q.r} fill={SIDE_R} stroke={INK} strokeLinejoin="round" />
      <polygon points={q.l} fill={SIDE_L} stroke={INK} strokeLinejoin="round" />
      <polygon className="anc-top" points={q.t} fill={top || TOP} stroke={INK} strokeLinejoin="round" />
      {children}
    </g>
  );
}
/** a box's top face only (for a flash overlay) */
export const topPts = (b: B6, u: number) => box(b[0], b[1], b[2], b[3], b[4], b[5], u).t;

/** a coin standing on world (x, y, z) */
export function Cn({ x, y, z, r, h, u, face = TOP, cls, bh }: { x: number; y: number; z: number; r: number; h: number; u: number; face?: string; cls?: string; bh?: Bld }) {
  const c = coin(x, y, z, r, h, u);
  return (
    <g className={cls} {...bld(bh)}>
      <path d={c.side} fill={SIDE_R} stroke={INK} strokeLinejoin="round" />
      <ellipse cx={f(c.cx)} cy={f(c.cy)} rx={f(c.rx)} ry={f(c.ry)} fill={face} stroke={INK} />
      <ellipse cx={f(c.cx)} cy={f(c.cy)} rx={f(c.rx * 0.6)} ry={f(c.ry * 0.6)} fill="none" stroke={INK} strokeOpacity={0.7} />
    </g>
  );
}

/** the dotted floor over [x0, x1] × [y0, y1] */
export const Dots = ({ x0, y0, x1, y1, u, step = 1, o = 0.4 }: { x0: number; y0: number; x1: number; y1: number; u: number; step?: number; o?: number }) => (
  <path className="anc-dots" d={floorDots(x0, y0, x1, y1, u, step)} stroke={INK} strokeOpacity={o} strokeLinecap="round" fill="none" />
);

/** a chip: ink, a green dot, mono caps; `at` is its left middle (screen units) */
export const chipW = (label: string) => 28 + label.length * 7.2;
export function Chip({ at, label, cls = "", h, dot = GREEN }: { at: V; label: string; cls?: string; h?: Bld; dot?: string }) {
  const w = chipW(label), hh = 22, [x, y] = at;
  return (
    <g className={`anc-chip ${cls}`} {...bld(h)}>
      <rect x={f(x)} y={f(y - hh / 2)} width={f(w)} height={hh} />
      <circle className="anc-chip__dot" cx={f(x + 11)} cy={f(y)} r={3.6} fill={dot} />
      <text x={f(x + 21)} y={f(y + 4)}>{label.toUpperCase()}</text>
    </g>
  );
}

/** a line between two screen points */
export const seg = (a: V, b: V) => `M${f(a[0])},${f(a[1])}L${f(b[0])},${f(b[1])}`;
/** a polyline through screen points */
export const poly = (ps: V[]) => "M" + ps.map((p) => `${f(p[0])},${f(p[1])}`).join("L");

/** a viewBox around projected world points (each [x, y, z]), with a margin; every scene of the story shares one aspect by padding to it */
export function vbox(ws: [number, number, number][], u: number, m = 16, aspect?: number) {
  const ps = ws.map(([x, y, z]) => S(x, y, z, u));
  let x0 = Math.min(...ps.map((p) => p[0])) - m, x1 = Math.max(...ps.map((p) => p[0])) + m;
  let y0 = Math.min(...ps.map((p) => p[1])) - m, y1 = Math.max(...ps.map((p) => p[1])) + m;
  if (aspect) {
    const w = x1 - x0, h = y1 - y0;
    if (w / h < aspect) { const nw = h * aspect; x0 -= (nw - w) / 2; x1 = x0 + nw; }
    else { const nh = w / aspect; y0 -= (nh - h) / 2; y1 = y0 + nh; }
  }
  return `${f(x0)} ${f(y0)} ${f(x1 - x0)} ${f(y1 - y0)}`;
}

/** a dashed line that draws in: the dashes show through a solid mask stroke the engine draws (a dash pattern and a draw cannot share one path) */
export function DashDraw({ d, h, dash = "3 4", o = 0.55 }: { d: string; h: Bld; dash?: string; o?: number }) {
  const id = "anc-m" + useId().replace(/[^\w-]/g, "");
  return (
    <g>
      <mask id={id} maskUnits="userSpaceOnUse" x={-4000} y={-4000} width={8000} height={8000}>
        <path d={d} fill="none" stroke="#fff" strokeWidth={10} pathLength={1} strokeDasharray="1 1" {...bld(h)} />
      </mask>
      <path d={d} fill="none" stroke={INK} strokeOpacity={o} strokeDasharray={dash} mask={`url(#${id})`} />
    </g>
  );
}
