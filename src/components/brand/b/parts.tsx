// Brand B, the small pieces every drawing and section uses (after Economics B's parts.tsx): a slab (white top, light grey sides, ink hairlines, its edges
// as one path that draws in), a person, and the line icons (arrow, download, tick, cross).
// Drawing classes: .d-e (edges that draw), .d-f (faces that fade in), .d-p (pieces that drop in), .d-o (accents last): kit.ts buildTimeline.
import type { CSSProperties } from "react";
import { faces, wire, box, f, P, type B6, type V } from "./kit";

export type Tone = "w" | "g";   // white top · green top

/** a box (x, y, w, d, z0, h) as its three faces and its edges; `fill` paints it in one colour (its sides darker), for the colour stack */
export function Slab({ b, tone = "w", cls = "", edges = true, style, fill }: { b: B6; tone?: Tone; cls?: string; edges?: boolean; style?: CSSProperties; fill?: [string, string, string] }) {
  const bx = box(...b), fc = faces(bx);
  return (
    <g className={`sl sl--${tone} ${cls}`} style={style}>
      <g className="d-f">
        <polygon className="sl__l" points={fc.left} style={fill && { fill: fill[1] }} />
        <polygon className="sl__r" points={fc.right} style={fill && { fill: fill[2] }} />
        <polygon className="sl__t" points={fc.top} style={fill && { fill: fill[0] }} />
      </g>
      {edges && <path className="sl__e d-e" d={wire(bx)} pathLength={1} />}
    </g>
  );
}

/** a person: a short cylinder and a head, standing on world (x, y, z); `g`: the green one */
export function Pawn({ x, y, z = 0, g, cls = "" }: { x: number; y: number; z?: number; g?: boolean; cls?: string }) {
  const [bx, by] = P(x, y, z), rx = 7 * Math.SQRT2 * 0.866, ry = 7 * Math.SQRT2 * 0.5, ty = by - 15;
  const side = `M${f(bx - rx)},${f(ty)}L${f(bx - rx)},${f(by)}A${f(rx)},${f(ry)} 0 0 0 ${f(bx + rx)},${f(by)}L${f(bx + rx)},${f(ty)}Z`;
  return (
    <g className={`pw${g ? " pw--g" : ""} ${cls}`}>
      <path className="pw__b" d={side} />
      <ellipse className="pw__t" cx={f(bx)} cy={f(ty)} rx={f(rx)} ry={f(ry)} />
      <circle className="pw__h" cx={f(bx)} cy={f(ty - 7.6)} r="6.3" />
    </g>
  );
}

/** a screen point as cx / cy */
export const at = (v: V) => ({ cx: f(v[0]), cy: f(v[1]) });

export const Arrow = () => (
  <svg className="l-arr" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>
);
export const Down = () => (
  <svg className="bb-ico" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 2.5v8.5M3.8 7 8 11.2 12.2 7M3 13.5h10" /></svg>
);
export const Copy = () => (
  <svg className="bb-ico" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M5.5 5.5h7v7h-7zM10.5 5.5v-2h-7v7h2" /></svg>
);
/** the badge on a do (a tick on green) or a don't (a cross on ink) */
export const Mark = ({ ok }: { ok: boolean }) => (
  <svg className={`bb-mk ${ok ? "bb-mk--ok" : "bb-mk--no"}`} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
    <circle cx="10" cy="10" r="9" />
    <path d={ok ? "M5.8 10.2l2.8 2.8 5.6-5.8" : "M6.6 6.6l6.8 6.8M13.4 6.6l-6.8 6.8"} />
  </svg>
);
