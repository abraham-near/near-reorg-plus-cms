// Economics B, the small pieces every drawing and section uses (after Community B's parts.tsx): a slab (white top, light grey sides, ink hairlines, its
// edges as one path that draws in), a coin, the NEAR token (a coin with the N laid on its face), a person, the arrows and a figure that counts once.
// Drawing classes: .d-e (edges that draw), .d-f (faces that fade in), .d-p (pieces that drop in), .d-o (accents last): kit.ts buildTimeline.
import type { CSSProperties } from "react";
import { LOCKUP_TILE } from "../../v3/proof-deeper/lockup";
import { faces, wire, box, coin, f, onTop, tr, type B6, type V } from "./kit";

export type Tone = "w" | "g" | "on";   // white top · green top · the lit station (pale green top)

/** a box (x, y, w, d, z0, h) as its three faces and its edges */
export function Slab({ b, tone = "w", cls = "", edges = true, style }: { b: B6; tone?: Tone; cls?: string; edges?: boolean; style?: CSSProperties }) {
  const bx = box(...b), fc = faces(bx);
  return (
    <g className={`sl sl--${tone} ${cls}`} style={style}>
      <g className="d-f">
        <polygon className="sl__l" points={fc.left} />
        <polygon className="sl__r" points={fc.right} />
        <polygon className="sl__t" points={fc.top} />
      </g>
      {edges && <path className="sl__e d-e" d={wire(bx)} pathLength={1} />}
    </g>
  );
}

/** a coin standing on world (x, y, z); `g`: its face green */
export function Coin({ x = 0, y = 0, z = 0, r = 9, h = 4, g, cls = "" }: { x?: number; y?: number; z?: number; r?: number; h?: number; g?: boolean; cls?: string }) {
  const c = coin(x, y, z, r, h);
  return (
    <g className={`cn${g ? " cn--g" : ""} ${cls}`}>
      <path className="cn__s" d={c.side} />
      <ellipse className="cn__t" cx={f(c.cx)} cy={f(c.cy)} rx={f(c.rx)} ry={f(c.ry)} />
    </g>
  );
}
/** a stack of n coins */
export function Stack({ x, y, z = 0, n, r = 9, h = 4, g = -1 }: { x: number; y: number; z?: number; n: number; r?: number; h?: number; g?: number }) {
  return <>{Array.from({ length: n }, (_, k) => <Coin key={k} x={x} y={y} z={z + k * h} r={r} h={h} g={k === g} />)}</>;
}

/** the NEAR token: a thick coin, the N laid flat on its face (the client's mark, LOCKUP_TILE: its ink spans 108–459 in its own units) */
export function Token({ x = 0, y = 0, z = 0, r, h, cls = "" }: { x?: number; y?: number; z?: number; r: number; h: number; cls?: string }) {
  const c = coin(x, y, z, r, h), k = (r * 1.04) / 351;
  return (
    <g className={`tk ${cls}`}>
      <path className="tk__s" d={c.side} />
      <ellipse className="tk__t" cx={f(c.cx)} cy={f(c.cy)} rx={f(c.rx)} ry={f(c.ry)} />
      <ellipse className="tk__rim" cx={f(c.cx)} cy={f(c.cy)} rx={f(c.rx * 0.84)} ry={f(c.ry * 0.84)} />
      {/* turned 45° on the face, so its uprights stand upright on screen and the N reads */}
      <path className="tk__n" d={LOCKUP_TILE} transform={`${onTop(x, y, z + h)} rotate(-45) scale(${f(k)}) translate(-283.5 -283.5)`} />
    </g>
  );
}

/** a person: a short cylinder and a head, standing at a screen point; `g`: the green one */
const PW = (() => { const c = coin(0, 0, 0, 7, 15); return { side: c.side, cx: c.cx, cy: c.cy, rx: c.rx, ry: c.ry, hy: c.cy - 7.6, hr: 6.3 }; })();
export function Pawn({ at, g, cls = "" }: { at: V; g?: boolean; cls?: string }) {
  return (
    <g className={`pw${g ? " pw--g" : ""} ${cls}`} transform={tr(at)}>
      <path className="pw__b" d={PW.side} />
      <ellipse className="pw__t" cx={f(PW.cx)} cy={f(PW.cy)} rx={f(PW.rx)} ry={f(PW.ry)} />
      <circle className="pw__h" cx="0" cy={f(PW.hy)} r={f(PW.hr)} />
    </g>
  );
}

export const Arrow = () => (
  <svg className="l-arr" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>
);
export const Ext = ({ className = "eb-ext" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3.5 8.5 8.5 3.5M4.5 3.5h4v4" /></svg>
);

/** a figure that counts up once (kit.ts mountCount): the final value is the text (first paint, reduced motion, screen readers) */
export const Count = ({ v, delay = 0 }: { v: string; delay?: number }) => (
  <span className="cnt" data-count={v} data-delay={delay}>
    <span className="cnt__ghost" aria-hidden="true">{v}</span>
    <span className="cnt__live" aria-hidden="true">{v}</span>
    <span className="sr-only">{v}</span>
  </span>
);
