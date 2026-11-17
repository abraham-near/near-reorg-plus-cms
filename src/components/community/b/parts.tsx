// Community B, the small pieces every drawing and section uses: a slab (white top, light grey sides, ink hairlines, its edges as one path that draws in),
// a person, the hero's words, the arrows, the "Sample" tag and a figure that counts once. Classes: .d-e (edges that draw), .d-f (faces that fade in),
// .d-p (figures that drop in), .d-o (accents last): kit.ts buildTimeline.
import type { CSSProperties, ReactNode } from "react";
import { faces, wire, box, f, PAWN, tr, type V } from "./kit";

export type Tone = "w" | "g" | "n" | "glass";   // white top · green top · night (on ink) · glass

/** a box (x, y, w, d, z0, h) as its three faces and its edges */
export function Slab({ b, tone = "w", cls = "", edges = true, style }: { b: [number, number, number, number, number, number]; tone?: Tone; cls?: string; edges?: boolean; style?: CSSProperties }) {
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

/** a person standing at a screen point; `g`: the green one; `cls` for its wrapper (motion) */
export function Pawn({ at, g, cls = "", night, i }: { at: V; g?: boolean; cls?: string; night?: boolean; i?: number }) {
  return (
    <g className={`d-p ${cls}`} data-i={i}>
      <g className={`pw${g ? " pw--g" : ""}${night ? " pw--n" : ""}`} transform={tr(at)}>
        <path className="pw__b" d={PAWN.side} />
        <ellipse className="pw__t" cx={f(PAWN.cx)} cy={f(PAWN.cy)} rx={f(PAWN.rx)} ry={f(PAWN.ry)} />
        <circle className="pw__h" cx="0" cy={f(PAWN.hy)} r={f(PAWN.hr)} />
      </g>
    </g>
  );
}

/** a line of words, each in its own span (they rise one by one); `accent` names the words set in Kepler */
export function Words({ text, accent = [] }: { text: string; accent?: string[] }) {
  const out: ReactNode[] = [];
  text.split(" ").forEach((w, i) => {
    if (i) out.push(" ");
    out.push(<span key={i} className={`cb-w${accent.includes(w.replace(/[.,]$/, "")) ? " accent" : ""}`}>{w}</span>);
  });
  return <>{out}</>;
}

export const Arrow = () => (
  <svg className="l-arr" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>
);
export const Ext = ({ className = "cb-ext" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3.5 8.5 8.5 3.5M4.5 3.5h4v4" /></svg>
);

/** the small mark on every figure the doc leaves open */
export const Sample = ({ children = "Sample", title = "Illustrative figure: the real one is not set yet" }: { children?: ReactNode; title?: string }) => (
  <span className="cb-tag" title={title}>{children}</span>
);

/** a figure that counts up once (kit.ts mountCount): the final value is the text (first paint, reduced motion, screen readers) */
export const Count = ({ v, delay = 0 }: { v: string; delay?: number }) => (
  <span className="cnt" data-count={v} data-delay={delay}>
    <span className="cnt__ghost" aria-hidden="true">{v}</span>
    <span className="cnt__live" aria-hidden="true">{v}</span>
    <span className="sr-only">{v}</span>
  </span>
);
