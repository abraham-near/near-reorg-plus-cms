// [[TBD: graphic by Ali]] placeholder: D's "Go deeper" drawing (../d/Scenes.tsx ToolsHub), kept as is (the page's second and last drawing).
// Analytics X, Go deeper's drawing: the network at the centre, eight instruments around it on cartesian traces; the tool you point at in the list lights
// its instrument and trace. Decorative (aria-hidden): the list beside it carries the meaning. motion.ts builds it and runs signals out from the hub.
import type { ReactNode } from "react";
import { P, f, line, vbox, box, corners, dots, onTop, type V } from "./kit";
import { Slab, type B6 } from "./parts";

type W2 = [number, number];
const floorLine = (ps: W2[], z = 0) => line(...ps.map(([x, y]) => P(x, y, z)));
const cornersOf = (b: B6) => corners(box(...b));

/** a point a fraction u along a floor polyline (world) */
export function alongW(ps: W2[], u: number): W2 {
  const L = ps.slice(1).map((p, i) => Math.hypot(p[0] - ps[i][0], p[1] - ps[i][1])), tot = L.reduce((a, b) => a + b, 0);
  let d = Math.max(0, Math.min(1, u)) * tot;
  for (let i = 0; i < L.length; i++) { if (d <= L[i] || i === L.length - 1) { const k = L[i] ? Math.min(1, d / L[i]) : 0; return [ps[i][0] + (ps[i + 1][0] - ps[i][0]) * k, ps[i][1] + (ps[i + 1][1] - ps[i][1]) * k]; } d -= L[i]; }
  return ps[ps.length - 1];
}

const R = 132;
export const SPOKES: { at: W2; path: W2[]; h: number }[] = [
  { at: [0, -R], path: [[0, -24], [0, -R + 16]], h: 26 }, { at: [R * 0.72, -R * 0.72], path: [[16, -24], [16, -R * 0.72], [R * 0.72 - 16, -R * 0.72]], h: 18 },
  { at: [R, 0], path: [[24, 0], [R - 16, 0]], h: 30 }, { at: [R * 0.72, R * 0.72], path: [[24, 16], [R * 0.72, 16], [R * 0.72, R * 0.72 - 16]], h: 22 },
  { at: [0, R], path: [[0, 24], [0, R - 16]], h: 16 }, { at: [-R * 0.72, R * 0.72], path: [[-16, 24], [-16, R * 0.72], [-R * 0.72 + 16, R * 0.72]], h: 28 },
  { at: [-R, 0], path: [[-24, 0], [-R + 16, 0]], h: 20 }, { at: [-R * 0.72, -R * 0.72], path: [[-24, -16], [-R * 0.72, -16], [-R * 0.72, -R * 0.72 + 16]], h: 24 },
];
const HUB: B6 = [-24, -24, 48, 48, 0, 34];
const thAll: V[] = SPOKES.flatMap((s) => cornersOf([s.at[0] - 16, s.at[1] - 16, 32, 32, 0, s.h]));
const VB = vbox(thAll, 8);

export function ToolsHub({ on }: { on: number | null }) {
  const nodes = SPOKES.map((s, i) => ({ s, i })).sort((a, b) => a.s.at[0] + a.s.at[1] - (b.s.at[0] + b.s.at[1]));
  const items: { key: number; node: ReactNode }[] = [
    ...nodes.map(({ s, i }) => ({ key: s.at[0] + s.at[1], node: (
      <g key={i} className={`anx-th-node${on === i ? " is-on" : ""}`}>
        <Slab b={[s.at[0] - 16, s.at[1] - 16, 32, 32, 0, s.h]} />
        <path className="anx-th-glyph d-o" d="M6,22v-6M12,22v-11M18,22v-8M24,22v-14" transform={onTop(s.at[0] - 16, s.at[1] - 16, s.h)} />
      </g>) })),
    { key: 0.5, node: <g key="hub"><Slab b={HUB} tone="g" /></g> },
  ].sort((a, b) => a.key - b.key);
  return (
    <svg className="anx-svg anx-th" viewBox={VB.s} data-draw="self" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="anx-th-g" cx="50%" cy="55%" r="52%"><stop offset="0.4" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <mask id="anx-th-m" maskUnits="userSpaceOnUse" x={VB.x} y={VB.y} width={VB.w} height={VB.h}><rect x={VB.x} y={VB.y} width={VB.w} height={VB.h} fill="url(#anx-th-g)" /></mask>
      </defs>
      <path className="anx-dots d-floor" d={dots(-R - 40, -R - 40, R + 40, R + 40, 22)} mask="url(#anx-th-m)" />
      <g className="anx-th-traces d-o">{SPOKES.map((s, i) => <path key={i} className={on === i ? "is-on" : ""} d={floorLine(s.path)} />)}</g>
      <g className="anx-th-sigs">{SPOKES.map((s, i) => { const p = P(...s.path[0]); return <circle key={i} r="3" transform={`translate(${f(p[0])} ${f(p[1])})`} />; })}</g>
      {items.map((it) => it.node)}
    </svg>
  );
}
