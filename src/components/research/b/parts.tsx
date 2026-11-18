// Research B, the small pieces every drawing uses (after Economics B's parts.tsx): a slab (white top, light grey sides, ink hairlines, its edges as one
// path that draws in), a glass box (its back edges faint, its faces a breath of white), lines of text laid on a sheet, a frame that gives every cover the
// same scale, and the arrows. Drawing classes: .d-floor (the dotted floor), .d-e (edges that draw), .d-f (faces that fade in), .d-p (pieces that drop
// in), .d-o (accents last): kit.ts buildTimeline.
import type { CSSProperties, ReactNode } from "react";
import { faces, wire, box, f, line, P, onTop, type B6, type V } from "./kit";

export type Tone = "w" | "g" | "lit" | "glass";   // white top · green · pale green top · glass

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

/** a glass box's hidden edges (the three that meet at its back corner), drawn faint before whatever sits inside it */
export function backEdges(b: B6) {
  const { x0, x1, y0, y1, z0, z1 } = box(...b);
  return line(P(x0, y0, z1), P(x0, y0, z0), P(x1, y0, z0)) + line(P(x0, y0, z0), P(x0, y1, z0));
}

/** lines of text laid flat on a top face: `rows` lines from (x, y) at height z, `w` long, `gap` apart; the first `head` of them a heading (short, heavy) */
export function Text({ x, y, z, w, rows, gap = 5, head = 0, cls = "" }: { x: number; y: number; z: number; w: number; rows: number; gap?: number; head?: number; cls?: string }) {
  let d = "", hd = "";
  for (let i = 0; i < rows; i++) {
    // the last line of a paragraph runs short, every fourth
    const len = i < head ? w * 0.62 : (i - head) % 4 === 3 ? w * 0.58 : w;
    const s = `M0,${f(i * gap)}h${f(len)}`;
    if (i < head) hd += s; else d += s;
  }
  return (
    <g className={`tx ${cls}`} transform={onTop(x, y, z)}>
      {hd && <path className="tx__h" d={hd} />}
      <path className="tx__l" d={d} />
    </g>
  );
}

/** an svg of a fixed `w` × `h` (in drawing units) centred on the drawing's points: every cover drawn at one scale */
export function Frame({ ps, w, h, cls, draw = "", children }: { ps: V[]; w: number; h: number; cls: string; draw?: "" | "self"; children: ReactNode }) {
  let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
  for (const [x, y] of ps) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); }
  const cx = (a + c) / 2, cy = (b + d) / 2;
  return (
    <svg className={`rb-svg ${cls}`} viewBox={`${f(cx - w / 2)} ${f(cy - h / 2)} ${f(w)} ${f(h)}`} data-draw={draw} aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

export const Arrow = () => (
  <svg className="rb-arr" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>
);
export const Ext = () => (
  <svg className="rb-ext" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3.5 8.5 8.5 3.5M4.5 3.5h4v4" /></svg>
);
