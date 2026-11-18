// History B ("Drawn"), the small pieces its drawings share, on Community B's kit (../../community/b/kit.ts: Foundation C's 2:1 isometric, x right-down,
// y left-down, z up) and its Slab and Pawn: a drawing's frame, a sheet of paper, a coin, a glass box, a dotted arc, ink laid flat on a face.
// Build classes (kit.ts buildTimeline): .d-floor (fades first), .d-e (edges that draw), .d-f (faces), .d-p (figures that drop in), .d-o (accents last).
import type { ReactNode } from "react";
import { P, f, box, corners, coin, faces, wire, vbox, type V } from "../../community/b/kit";
import { hidden } from "../../foundation/c/iso";
import { Slab } from "../../community/b/parts";

export { P, f, box, corners, vbox, line, arc, along, dots, onTop, onLeft, onRight, tr, type V } from "../../community/b/kit";
export { Slab, Pawn } from "../../community/b/parts";

export type B6 = [number, number, number, number, number, number];
export const cornersOf = (b: B6): V[] => corners(box(...b));

/** a drawing: its viewBox fits the points given (with a margin); data-draw="" builds as it arrives, "self" is built by its section */
export function Drawing({ pts, m = 8, cls = "", self, children }: { pts: V[]; m?: number; cls?: string; self?: boolean; children: ReactNode }) {
  const vb = vbox(pts, m);
  return <svg className={`hb-svg ${cls}`} viewBox={vb.s} data-draw={self ? "self" : ""} aria-hidden="true" focusable="false">{children}</svg>;
}

/** a coin standing on (x, y, z): its side and its face; `g` green */
export function Coin({ x, y, z, r = 9, h = 4, g }: { x: number; y: number; z: number; r?: number; h?: number; g?: boolean }) {
  const c = coin(x, y, z, r, h);
  return (
    <g className={`hb-coin${g ? " hb-coin--g" : ""}`}>
      <path className="hb-coin__s" d={c.side} />
      <ellipse className="hb-coin__t" cx={f(c.cx)} cy={f(c.cy)} rx={f(c.rx)} ry={f(c.ry)} />
    </g>
  );
}

/** a glass box, in two parts so something can sit inside it: its back edges (dashed), then (after the inside) its faces and front edges */
export function GlassBack({ b }: { b: B6 }) {
  return <g className="hb-glass__back d-o">{hidden(box(...b)).map((d, i) => <path key={i} d={d} />)}</g>;
}
export function GlassFront({ b }: { b: B6 }) {
  const bx = box(...b), fc = faces(bx);
  return (
    <g className="hb-glass">
      <g className="d-f"><polygon points={fc.left} /><polygon points={fc.right} /><polygon points={fc.top} /></g>
      <path className="hb-glass__e d-e" d={wire(bx)} pathLength={1} />
    </g>
  );
}

/** a sheet of paper lying on a top face (a thin white slab) */
export const Sheet = ({ b }: { b: B6 }) => <Slab b={b} cls="hb-sheet" />;

/** a small cross, centred on a screen point (a payment that does not get through) */
export const Miss = ({ at, s = 4 }: { at: V; s?: number }) => (
  <path className="hb-miss" d={`M${f(at[0] - s)},${f(at[1] - s)}l${s * 2},${s * 2}M${f(at[0] + s)},${f(at[1] - s)}l${-s * 2},${s * 2}`} />
);

/** a green dot (a signal) at a screen point */
export const Sig = ({ at, r = 3.6 }: { at: V; r?: number }) => <circle className="hb-sig" cx={f(at[0])} cy={f(at[1])} r={r} />;

/** where a world point sits on screen, as numbers for <text> */
export const at = (x: number, y: number, z = 0) => { const p = P(x, y, z); return { x: f(p[0]), y: f(p[1]) }; };
