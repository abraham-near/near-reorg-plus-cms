// Version D's SVG hand for the static illustrations (pillars, operations, the Council): the rail's isometric grammar (public/v1/vig2, IsoBuyback):
// a floor rhombus with a fine dashed grid, slabs with white tops and light grey sides, #111 outlines, coins as short cylinders, dashed arcs, black chips with
// a green dot and mono caps. Colours come from CSS variables (foundation-d.css: .fd-iso), so the Council can draw the same shapes on ink.
// Projection: x' = (x − y)·cos30°, y' = (x + y)·sin30° − z.
import type { ReactNode } from "react";

export const C = Math.cos(Math.PI / 6), S = 0.5;
export type V = [number, number];
export const P = (x: number, y: number, z = 0): V => [(x - y) * C, (x + y) * S - z];
const f = (n: number) => (Math.round(n * 100) / 100).toString();
export const pts = (...ps: V[]) => ps.map((p) => `${f(p[0])},${f(p[1])}`).join(" ");
export const line = (...ps: V[]) => "M" + ps.map((p) => `${f(p[0])},${f(p[1])}`).join("L");

type G = { cls?: string; style?: React.CSSProperties; children?: ReactNode };

/** a slab: footprint (x, y) w × d, from z up h. tone: light (white top) | ink (the Foundation's) | green (an emerald top) */
export function Box({ x, y, z = 0, w, d, h, tone = "light", cls, style, children }: { x: number; y: number; z?: number; w: number; d: number; h: number; tone?: "light" | "ink" | "green" } & G) {
  const x1 = x + w, y1 = y + d, z1 = z + h;
  return (
    <g className={`i-box i-box--${tone}${cls ? " " + cls : ""}`} style={style}>
      <polygon className="i-r" points={pts(P(x1, y, z1), P(x1, y1, z1), P(x1, y1, z), P(x1, y, z))} />
      <polygon className="i-l" points={pts(P(x, y1, z1), P(x1, y1, z1), P(x1, y1, z), P(x, y1, z))} />
      <polygon className="i-t" points={pts(P(x, y, z1), P(x1, y, z1), P(x1, y1, z1), P(x, y1, z1))} />
      {children}
    </g>
  );
}
/** a flat quad on the plane at z (an inset on a top) */
export function Quad({ x, y, z = 0, w, d, cls = "i-g" }: { x: number; y: number; z?: number; w: number; d: number; cls?: string }) {
  return <polygon className={cls} points={pts(P(x, y, z), P(x + w, y, z), P(x + w, y + d, z), P(x, y + d, z))} />;
}
/** the floor: a rhombus, its fine dashed grid, its outline */
export function Floor({ x = 0, y = 0, w, d, n = 8, cls }: { x?: number; y?: number; w: number; d: number; n?: number; cls?: string }) {
  const sx = w / n, ny = Math.max(1, Math.round(d / sx)), sy = d / ny, g: string[] = [];
  for (let i = 1; i < n; i++) g.push(line(P(x + i * sx, y), P(x + i * sx, y + d)));
  for (let j = 1; j < ny; j++) g.push(line(P(x, y + j * sy), P(x + w, y + j * sy)));
  return (
    <g className={`i-floor${cls ? " " + cls : ""}`}>
      <polygon className="i-fl" points={pts(P(x, y), P(x + w, y), P(x + w, y + d), P(x, y + d))} />
      <path className="i-grid" d={g.join("")} />
      <polygon className="i-edge" points={pts(P(x, y), P(x + w, y), P(x + w, y + d), P(x, y + d))} />
    </g>
  );
}
/** a dotted floor (the home's dots): a lattice of small dots inside the rhombus */
export function DotFloor({ x = 0, y = 0, w, d, step = 8, cls }: { x?: number; y?: number; w: number; d: number; step?: number; cls?: string }) {
  const out: ReactNode[] = [];
  for (let i = 0; i <= w / step; i++) for (let j = 0; j <= d / step; j++) { const [a, b] = P(x + i * step, y + j * step); out.push(<circle key={`${i}-${j}`} cx={f(a)} cy={f(b)} r="0.9" />); }
  return <g className={`i-dots${cls ? " " + cls : ""}`}>{out}</g>;
}
/** a coin (or a short cylinder) standing on (x, y, z): radius r, height h */
export function Coin({ x, y, z = 0, r = 8, h = 3.5, tone = "light", ringed = true, cls, style }: { x: number; y: number; z?: number; r?: number; h?: number; tone?: "light" | "green" | "ink"; ringed?: boolean } & G) {
  const [bx, by] = P(x, y, z), ty = by - h, rx = r * Math.SQRT2 * C, ry = r * Math.SQRT2 * S;
  return (
    <g className={`i-coin i-coin--${tone}${cls ? " " + cls : ""}`} style={style}>
      <path className="i-r" d={`M${f(bx - rx)},${f(ty)}L${f(bx - rx)},${f(by)}A${f(rx)},${f(ry)} 0 0 0 ${f(bx + rx)},${f(by)}L${f(bx + rx)},${f(ty)}Z`} />
      <ellipse className="i-t" cx={f(bx)} cy={f(ty)} rx={f(rx)} ry={f(ry)} />
      {ringed && <ellipse className="i-ln" cx={f(bx)} cy={f(ty)} rx={f(rx * 0.6)} ry={f(ry * 0.6)} />}
    </g>
  );
}
/** a person, as simple shapes: a cylinder body, a round head */
export function Person({ x, y, z = 0, s = 1, green = false, cls, style }: { x: number; y: number; z?: number; s?: number; green?: boolean } & G) {
  const [hx, hy] = P(x, y, z + 9.6 * s);
  return (
    <g className={`i-person${cls ? " " + cls : ""}`} style={style}>
      <Coin x={x} y={y} z={z} r={2.6 * s} h={6.4 * s} ringed={false} />
      <circle className={green ? "i-g" : "i-t"} cx={f(hx)} cy={f(hy)} r={f(2.5 * s)} />
    </g>
  );
}
/** a dashed arc between two screen points, bowed upward by lift */
export function arc(a: V, b: V, lift: number) {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - lift;
  return `M${f(a[0])},${f(a[1])}Q${f(mx)},${f(my)} ${f(b[0])},${f(b[1])}`;
}
/** a chip: a dark tag, a green dot, mono caps (screen position: its top-left) */
export const chipW = (label: string) => 30 + label.length * 7.6;
export function Chip({ at, label, cls }: { at: V; label: string; cls?: string }) {
  const w = chipW(label), h = 22;
  return (
    <g className={`i-chip${cls ? " " + cls : ""}`}>
      <rect className="i-chip__bg" x={f(at[0])} y={f(at[1])} width={f(w)} height={h} />
      <circle className="i-chip__dot" cx={f(at[0] + 12)} cy={f(at[1] + h / 2)} r="3.9" />
      <text className="i-chip__t" x={f(at[0] + 22)} y={f(at[1] + h / 2 + 3.9)}>{label}</text>
    </g>
  );
}
/** the viewBox around a set of screen points, padded */
export function vb(ps: V[], pad = 12) {
  const xs = ps.map((p) => p[0]), ys = ps.map((p) => p[1]);
  const x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad, x1 = Math.max(...xs) + pad, y1 = Math.max(...ys) + pad;
  return `${f(x0)} ${f(y0)} ${f(x1 - x0)} ${f(y1 - y0)}`;
}
