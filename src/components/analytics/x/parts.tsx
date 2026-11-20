// Analytics X, the small pieces: a slab (white top, light grey sides, ink hairlines; its edges as one path that draws in), the hero's words, the arrows,
// the delta chip and a figure that counts once. Drawing classes: .d-e (edges that draw), .d-f (faces that fade in), .d-o (accents last): kit.ts.
import type { ReactNode } from "react";
import { faces, wire, box } from "./kit";

export type B6 = [number, number, number, number, number, number];

/** a box (x, y, w, d, z0, h) as its three faces and its edges */
export function Slab({ b, tone = "w", cls = "" }: { b: B6; tone?: "w" | "g"; cls?: string }) {
  const bx = box(...b), fc = faces(bx);
  return (
    <g className={`sl sl--${tone} ${cls}`}>
      <g className="d-f">
        <polygon className="sl__l" points={fc.left} />
        <polygon className="sl__r" points={fc.right} />
        <polygon className="sl__t" points={fc.top} />
      </g>
      <path className="sl__e d-e" d={wire(bx)} pathLength={1} />
    </g>
  );
}

/** a line of words, each in its own span (they rise one by one); `accent` names the words set in Kepler */
export function Words({ text, accent = [] }: { text: string; accent?: string[] }) {
  const out: ReactNode[] = [];
  text.split(" ").forEach((w, i) => {
    if (i) out.push(" ");
    out.push(<span key={i} className={`anx-w${accent.includes(w) ? " accent" : ""}`}>{w}</span>);
  });
  return <>{out}</>;
}

export const Arrow = () => (
  <svg className="l-arr" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>
);
export const Ext = ({ className = "anx-ext" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3.5 8.5 8.5 3.5M4.5 3.5h4v4" /></svg>
);

/** "24h ▲ 0.8%": the triangle drawn (the fonts have no ▲), the direction spoken */
export function Delta({ k, v }: { k: string; v: number }) {
  const dir = v > 0 ? "up" : v < 0 ? "down" : "flat";
  return (
    <span className={`anx-d anx-d--${dir}`}>
      <span className="anx-d__k">{k}</span>
      <svg className="anx-d__t" viewBox="0 0 8 8" aria-hidden="true" focusable="false">{dir === "flat" ? <rect x="1" y="3.25" width="6" height="1.5" /> : <path d={dir === "up" ? "M4 1.2 7.2 6.6H.8Z" : "M4 6.8.8 1.4h6.4Z"} />}</svg>
      <span className="sr-only">{dir} </span>
      <span className="anx-d__v">{Math.abs(v).toFixed(1)}%</span>
    </span>
  );
}

/** a figure that counts up once (kit.ts mountCount): the final value is the text (first paint, reduced motion, screen readers) */
export const Count = ({ v, delay = 0 }: { v: string; delay?: number }) => (
  <span className="cnt" data-count={v} data-delay={delay}>
    <span className="cnt__ghost" aria-hidden="true">{v}</span>
    <span className="cnt__live" aria-hidden="true">{v}</span>
    <span className="sr-only">{v}</span>
  </span>
);
