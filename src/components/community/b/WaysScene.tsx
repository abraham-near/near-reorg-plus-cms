// Community B, "Bring your ideas to life": one plot of ground that becomes each way to get involved as the four pass by (motion.ts, scrubbed by the
// reading line, as the Foundation's operations scene does):
//   0 host an event: a platform, a banner on two posts, a lectern; the people gather in rows in front of it;
//   1 NEAR on Campus: a hall with its columns, roof and steps; the people walk the lawn in small groups;
//   2 contribute code: blocks stack up into a tower, a green one lands on top; the people stand round it;
//   3 create content: a screen on its stand with a play mark, a camera on a tripod; one person on camera, the rest watching.
// Each piece drops into place as its way arrives and lifts away as the next comes; the people walk (and hop) from one arrangement to the next.
// The geometry is one function of the stage s (−1 empty, 0…3) and a clock t, so the markup (any fixed stage) and the motion draw the same thing.
import type { ReactNode } from "react";
import { P, f, vbox, box, corners, dots, onLeft, lerp, ease3, seg, clamp01, tr, type V } from "./kit";
import { Slab, Pawn } from "./parts";

type B6 = [number, number, number, number, number, number];
type Piece = { b?: B6; tone?: "w" | "g"; node?: ReactNode };
const PLOT: B6 = [8, 8, 226, 226, -14, 14];

const leg = (a: [number, number, number], b: [number, number, number]) => { const p = P(...a), q = P(...b); return `M${f(p[0])},${f(p[1])}L${f(q[0])},${f(q[1])}`; };
const BUILDS: Piece[][] = [
  // 0 · host an event
  [
    { b: [30, 30, 116, 74, 0, 14] },
    { b: [36, 34, 5, 5, 14, 62] }, { b: [134, 34, 5, 5, 14, 62] },
    { b: [36, 35, 103, 3, 54, 22], tone: "g" },
    { b: [104, 64, 12, 10, 14, 17] },
  ],
  // 1 · NEAR on Campus
  [
    { b: [24, 22, 124, 88, 0, 10] },
    { b: [34, 28, 104, 66, 10, 46] },
    { node: <g>{[0, 1, 2, 3].map((i) => <Slab key={i} b={[42 + i * 26, 98, 7, 7, 10, 46]} />)}</g> },
    { b: [28, 24, 116, 88, 56, 8] },
    { b: [62, 42, 48, 44, 64, 6], tone: "g" },
    { b: [56, 110, 60, 10, 0, 6] },
  ],
  // 2 · contribute code
  [
    { b: [46, 40, 66, 66, 0, 22], node: <path className="wy-glyph" d="M14,7l-7,7 7,7M32,7l7,7-7,7M26,4l-6,20" transform={onLeft(46 + 10, 106, 22 - 0.5)} /> },
    { b: [52, 46, 54, 54, 22, 20] },
    { b: [46, 40, 66, 66, 42, 18] },
    { b: [56, 50, 46, 46, 60, 16] },
    { b: [64, 58, 30, 30, 76, 18], tone: "g" },
  ],
  // 3 · create content
  [
    { b: [64, 34, 46, 26, 0, 5] },
    { b: [82, 40, 12, 10, 5, 22] },
    { b: [34, 44, 108, 7, 26, 62], node: <g className="wy-screen" transform={onLeft(42, 51, 82)}><rect x="0" y="0" width="92" height="48" /><path className="wy-play" d="M38,13l18,11-18,11z" /></g> },
    { node: <g><path className="wy-leg" d={leg([152, 120, 40], [138, 128, 0]) + leg([152, 120, 40], [168, 116, 0]) + leg([152, 120, 40], [156, 140, 0])} /><Slab b={[142, 112, 22, 15, 40, 15]} /><Slab b={[130, 116, 12, 7, 44, 7]} tone="g" /></g> },
  ],
];
// the people: where each stands in each way (world x, y on the plot); the first is the green one
const LAYOUT: [number, number][][] = [
  [[85, 140], [40, 136], [62, 136], [108, 136], [130, 136], [52, 166], [96, 168], [140, 166]],
  [[56, 132], [78, 140], [162, 118], [178, 142], [196, 70], [206, 96], [118, 182], [142, 194]],
  (() => { const out: [number, number][] = []; for (let i = 0; i < 8; i++) { const a = (-18 + i * 17) * (Math.PI / 180); out.push([79 + 98 * Math.cos(a), 73 + 98 * Math.sin(a)]); } return out; })(),
  [[96, 104], [40, 162], [68, 172], [98, 178], [128, 172], [180, 160], [58, 204], [116, 210]],
];
export const N_WAYS = BUILDS.length;

/** the scene at stage s and clock t: each piece's drop and opacity, each person's place */
export function geo(s: number, t: number) {
  const pieces = BUILDS.map((pcs, k) => {
    const v = clamp01(1 - Math.abs(s - k) / 0.62), a = clamp01((v - 0.12) / 0.88), leaving = s > k;
    return pcs.map((_, j) => {
      const st = (j / pcs.length) * 0.55, e = ease3(seg(a, st, st + 0.45));
      return { y: (1 - e) * (leaving ? -34 : -46), o: e };
    });
  });
  const k0 = Math.max(0, Math.min(N_WAYS - 1, Math.floor(s))), u = s < 0 ? 0 : s - k0;
  const people = LAYOUT[0].map((_, i) => {
    const A = LAYOUT[k0][i], B = LAYOUT[Math.min(N_WAYS - 1, k0 + 1)][i];
    const e = ease3(seg(u, 0.12 + i * 0.035, 0.66 + i * 0.035));
    const z = Math.sin(Math.PI * e) * 9 + (t ? Math.max(0, Math.sin(t * 2.2 + i * 0.9)) * 1.4 : 0);
    return { p: P(lerp(A[0], B[0], e), lerp(A[1], B[1], e), z), o: s < -0.4 ? 0 : clamp01((s + 0.4) / 0.4) };
  });
  return { pieces, people };
}

const all: V[] = [...corners(box(...PLOT)), P(0, 0, 110), P(240, 8, 20), P(8, 240, 0)];
export const VB = vbox(all, 14);

export function WaysScene({ stage, className = "", draw }: { stage: number; className?: string; draw?: boolean }) {
  const g = geo(stage, 0);
  return (
    <svg className={`cb-svg wy ${className}`} viewBox={VB.s} data-stage={stage} data-draw={draw ? "" : undefined} aria-hidden="true" focusable="false">
      <path className="cb-dots" d={dots(-40, -40, 280, 280, 20)} />
      <Slab b={PLOT} edges={false} cls="wy-plot" />
      <g className="wy-builds">
        {BUILDS.map((pcs, k) => (
          <g key={k} className="wy-b" data-k={k}>
            {pcs.map((pc, j) => (
              <g key={j} className="wy-pc" transform={`translate(0 ${f(g.pieces[k][j].y)})`} opacity={f(g.pieces[k][j].o)}>
                {pc.b && <Slab b={pc.b} tone={pc.tone} edges={false} />}
                {pc.node}
              </g>
            ))}
          </g>
        ))}
      </g>
      <g className="wy-people">
        {g.people.map((pp, i) => (
          <g key={i} className="wy-pw" opacity={f(pp.o)}><Pawn at={pp.p} g={i === 0} cls="" /></g>
        ))}
      </g>
    </svg>
  );
}

/** the elements the motion repaints, and the painter */
export function collect(svg: SVGSVGElement) {
  return {
    pieces: [...svg.querySelectorAll<SVGGElement>(".wy-b")].map((b) => [...b.querySelectorAll<SVGGElement>(":scope > .wy-pc")]),
    people: [...svg.querySelectorAll<SVGGElement>(".wy-pw")].map((w) => ({ w, pw: w.querySelector<SVGGElement>(".pw")! })),
  };
}
export function paint(el: ReturnType<typeof collect>, g: ReturnType<typeof geo>) {
  el.pieces.forEach((pcs, k) => pcs.forEach((pc, j) => { const q = g.pieces[k][j]; pc.setAttribute("transform", `translate(0 ${f(q.y)})`); pc.setAttribute("opacity", f(q.o)); }));
  el.people.forEach((p, i) => { p.pw.setAttribute("transform", tr(g.people[i].p)); p.w.setAttribute("opacity", f(g.people[i].o)); });
}
