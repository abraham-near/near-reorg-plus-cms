// Solutions B, the small pieces every drawing uses (after Economics B's parts.tsx): a slab (white top, light grey sides, ink hairlines, its edges one path
// that draws in), a glass box (the enclave: see-through faces, its back edges dashed), a coin and a stack, the NEAR token, an agent (a small cube with
// its antenna and green lamp), a vault (a box with its round door on the front face), a padlock laid on a face, the arrows and a figure that counts once.
// Drawing classes: .d-e (edges that draw), .d-f (faces that fade in), .d-p (pieces that drop in), .d-o (accents last): kit.ts buildTimeline.
import type { CSSProperties, ReactNode } from "react";
import { LOCKUP_TILE } from "../../v3/proof-deeper/lockup";
import { faces, wire, box, coin, f, line, P, onTop, onLeft, tr, type B6, type V } from "./kit";

export type Tone = "w" | "g" | "lit";   // white top · green top · pale green top

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

/** a glass box: its back edges dashed (drawn first: `Glass.Back`), then whatever stands inside, then its see-through faces and front edges */
function GlassBack({ b }: { b: B6 }) {
  const { x0, x1, y0, y1, z0, z1 } = box(...b);
  return <path className="gl__h d-o" d={line(P(x0, y0, z1), P(x0, y0, z0), P(x1, y0, z0)) + line(P(x0, y0, z0), P(x0, y1, z0))} />;
}
function GlassFront({ b }: { b: B6 }) {
  const bx = box(...b), fc = faces(bx);
  return (
    <g className="gl">
      <g className="d-f"><polygon className="gl__l" points={fc.left} /><polygon className="gl__r" points={fc.right} /><polygon className="gl__t" points={fc.top} /></g>
      <path className="gl__e d-e" d={wire(bx)} pathLength={1} />
    </g>
  );
}
export const Glass = { Back: GlassBack, Front: GlassFront };

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
/** a stack of n coins; `g`: the index of the green one (−1: none) */
export function Stack({ x, y, z = 0, n, r = 9, h = 4, g = -1, cls = "" }: { x: number; y: number; z?: number; n: number; r?: number; h?: number; g?: number; cls?: string }) {
  return <>{Array.from({ length: n }, (_, k) => <Coin key={k} x={x} y={y} z={z + k * h} r={r} h={h} g={k === g} cls={cls} />)}</>;
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

/** an agent: a small cube, its antenna and a green lamp on top (`lamp`: the lamp's world point, for the lines that reach it) */
export const lamp = (x: number, y: number, s: number, ant = 12): [number, number, number] => [x, y, s + ant];
export function Agent({ x, y, s = 14, ant = 12, cls = "" }: { x: number; y: number; s?: number; ant?: number; cls?: string }) {
  const top = P(x, y, s), tip = P(x, y, s + ant);
  return (
    <g className={`ag ${cls}`}>
      <Slab b={[x - s / 2, y - s / 2, s, s, 0, s]} />
      <path className="ag__ant" d={`M${f(top[0])},${f(top[1])}V${f(tip[1])}`} />
      <circle className="ag__dot" cx={f(tip[0])} cy={f(tip[1])} r="2.8" />
    </g>
  );
}

/** a vault: a box with its round door (rim, wheel, spokes) on the front-left face and a green lamp; `b`: the box */
export function Vault({ b, door = 0.34 }: { b: B6; door?: number }) {
  const [x, y, w, d, z0, h] = b, r = Math.min(w, h) * door;
  return (
    <g className="vt">
      <Slab b={b} />
      <g className="vt__door" transform={onLeft(x, y + d, z0 + h)}>
        <circle cx={f(w / 2)} cy={f(h / 2)} r={f(r)} />
        <circle cx={f(w / 2)} cy={f(h / 2)} r={f(r * 0.72)} />
        <path d={`M${f(w / 2 - r * 0.5)},${f(h / 2)}h${f(r)}M${f(w / 2)},${f(h / 2 - r * 0.5)}v${f(r)}`} />
        <circle className="vt__hub" cx={f(w / 2)} cy={f(h / 2)} r={f(r * 0.16)} />
      </g>
      <circle className="vt__lamp" transform={onLeft(x, y + d, z0 + h)} cx={f(w - 6)} cy="6" r="2.4" />
    </g>
  );
}

/** a padlock drawn flat on a face (the matrix from onLeft / onRight), its body's top centre at (a, b) in the face's units */
export function Padlock({ m, a, b, s = 1, cls = "" }: { m: string; a: number; b: number; s?: number; cls?: string }) {
  return (
    <g className={`pl ${cls}`} transform={`${m} translate(${f(a)} ${f(b)}) scale(${f(s)})`}>
      <path className="pl__sh" d="M-4.5,0V-5A4.5,4.5 0 0 1 4.5,-5V0" />
      <rect className="pl__b" x="-7" y="0" width="14" height="11" rx="1.2" />
      <circle className="pl__k" cx="0" cy="4.4" r="1.6" />
      <path className="pl__k" d="M0,5.6V8.2" />
    </g>
  );
}

export const Arrow = () => (
  <svg className="l-arr" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>
);
export const Ext = ({ className = "sb-ext" }: { className?: string }) => (
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

/** a group placed at a screen point (the moving pieces: a coin, a note, a signal) */
export const At = ({ p, cls, children }: { p: V; cls?: string; children: ReactNode }) => <g className={cls} transform={tr(p)}>{children}</g>;
