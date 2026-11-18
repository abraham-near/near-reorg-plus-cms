// Analytics D, the section drawings in the iso hand (white tops, light grey sides, ink hairlines, one green). Each markup is its finished frame; motion.ts
// builds it as it arrives and keeps it alive while on screen. All decorative (aria-hidden): the text beside each carries the meaning.
//   · RevenueFlow: fees leave the network block along a dotted trace; at the splitter about five coins in eight turn to the vault (protocol revenue,
//     green top), the rest to the stack beside it;
//   · StatusGrid: the four services as racks on a floor, joined by traces, each with its status lamp pulsing on top;
//   · ToolsHub: the network at the centre, eight instruments around it on cartesian traces; the one you point at in the list lights up;
//   · Vault: a strongbox with a round door (SVRN large, the ETPs & Trusts small, in five proportions).
import type { ReactNode } from "react";
import { P, f, line, vbox, box, corners, dots, onLeft, onTop, type V } from "./kit";
import { Slab, Coin, type B6 } from "./parts";

type W2 = [number, number];
const floorLine = (ps: W2[], z = 0) => line(...ps.map(([x, y]) => P(x, y, z)));
const cornersOf = (b: B6) => corners(box(...b));
function Floor({ x0, y0, x1, y1, step = 18, id }: { x0: number; y0: number; x1: number; y1: number; step?: number; id: string }) {
  return <path className="ad-dots d-floor" d={dots(x0, y0, x1, y1, step)} mask={`url(#${id})`} />;
}
function Fade({ id, vb }: { id: string; vb: ReturnType<typeof vbox> }) {
  return (
    <defs>
      <radialGradient id={`${id}-g`} cx="50%" cy="55%" r="52%"><stop offset="0.4" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
      <mask id={id} maskUnits="userSpaceOnUse" x={vb.x} y={vb.y} width={vb.w} height={vb.h}><rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill={`url(#${id}-g)`} /></mask>
    </defs>
  );
}

/* ───────────────────────── revenue: the flow ───────────────────────── */
const SRC: B6 = [0, 70, 56, 56, 0, 38], SPLIT: B6 = [112, 88, 20, 20, 0, 10];
const VAULT: B6 = [178, 8, 74, 62, 0, 46], REST: B6 = [178, 132, 46, 46, 0, 16];
export const FLOW_A: W2[] = [[56, 98], [122, 98], [122, 39], [178, 39]];
export const FLOW_B: W2[] = [[56, 98], [122, 98], [122, 155], [178, 155]];
export const FLOW_N = 8;   // coins in flight; 5 of 8 turn to the vault (≈ 62%)
export const toVault = (i: number) => i % 8 < 5;
/** a point a fraction u along a floor polyline (world) */
export function alongW(ps: W2[], u: number): W2 {
  const L = ps.slice(1).map((p, i) => Math.hypot(p[0] - ps[i][0], p[1] - ps[i][1])), tot = L.reduce((a, b) => a + b, 0);
  let d = Math.max(0, Math.min(1, u)) * tot;
  for (let i = 0; i < L.length; i++) { if (d <= L[i] || i === L.length - 1) { const k = L[i] ? Math.min(1, d / L[i]) : 0; return [ps[i][0] + (ps[i + 1][0] - ps[i][0]) * k, ps[i][1] + (ps[i + 1][1] - ps[i][1]) * k]; } d -= L[i]; }
  return ps[ps.length - 1];
}
const rvAll: V[] = [...cornersOf(SRC), ...cornersOf(VAULT), ...cornersOf(REST), P(-30, 200), P(280, -20), P(VAULT[0], VAULT[1], 80)];
export const RV_VB = vbox(rvAll, 12);
export function RevenueFlow() {
  const stacks: [number, number, number][] = [[196, 26, 4], [222, 26, 6], [209, 50, 3], [236, 50, 5]];
  return (
    <svg className="ad-svg rv" viewBox={RV_VB.s} data-draw="self" aria-hidden="true" focusable="false">
      <Fade id="rv-m" vb={RV_VB} />
      <Floor x0={-40} y0={-30} x1={290} y1={210} id="rv-m" />
      <g className="ad-trace d-o"><path d={floorLine(FLOW_A)} /><path d={floorLine(FLOW_B)} /></g>
      <Slab b={SRC} />
      <g className="d-o" transform={onLeft(SRC[0] + 10, SRC[1] + SRC[3], SRC[5] - 9)}><path className="ad-rack" d="M0,0h36M0,8h36M0,16h24" /><circle className="ad-led" cx="40" cy="16" r="2.4" /></g>
      <g className="rv-coins">{Array.from({ length: FLOW_N }, (_, i) => { const p = P(...alongW(toVault(i) ? FLOW_A : FLOW_B, 0.15 + (i / FLOW_N) * 0.7)); return <g key={i} className="rv-coin" transform={`translate(${f(p[0])} ${f(p[1])})`}><Coin x={0} y={0} z={0} r={6} h={3} g={toVault(i)} /></g>; })}</g>
      <Slab b={SPLIT} />
      <Slab b={VAULT} tone="g" />
      <g className="d-p">{stacks.map(([x, y, n], s) => <g key={s}>{Array.from({ length: n }, (_, k) => <Coin key={k} x={x} y={y} z={VAULT[5] + k * 4} r={8} h={4} g={k === n - 1 && s === 3} />)}</g>)}</g>
      <Slab b={REST} />
      <g className="d-p">{[0, 1].map((k) => <Coin key={k} x={REST[0] + 23} y={REST[1] + 23} z={REST[5] + k * 4} r={8} h={4} />)}</g>
    </svg>
  );
}

/* ───────────────────────── network status: racks with lamps ───────────────────────── */
export const NODES: { b: B6 }[] = [
  { b: [0, 0, 54, 54, 0, 44] }, { b: [104, 0, 54, 54, 0, 34] }, { b: [0, 104, 54, 54, 0, 30] }, { b: [104, 104, 54, 54, 0, 40] },
];
export const lampAt = (i: number): V => { const b = NODES[i].b; return P(b[0] + b[2] / 2, b[1] + b[3] / 2, b[5] + 6); };
const stAll: V[] = [...NODES.flatMap((n) => cornersOf(n.b)), P(-30, 190), P(190, -30), ...NODES.map((_, i) => lampAt(i))];
export const ST_VB = vbox(stAll, 18);
export function StatusGrid() {
  const ring: W2[][] = [[[54, 27], [104, 27]], [[27, 54], [27, 104]], [[131, 54], [131, 104]], [[54, 131], [104, 131]]];
  const order = [0, 1, 2, 3];
  return (
    <svg className="ad-svg sg" viewBox={ST_VB.s} data-draw="self" aria-hidden="true" focusable="false">
      <Fade id="sg-m" vb={ST_VB} />
      <Floor x0={-40} y0={-40} x1={200} y1={200} id="sg-m" />
      <g className="ad-trace d-o">{ring.map((r, i) => <path key={i} d={floorLine(r)} />)}</g>
      <g className="sg-pkts">{ring.map((r, i) => { const p = P(...r[0]); return <circle key={i} r="3" transform={`translate(${f(p[0])} ${f(p[1])})`} />; })}</g>
      {order.map((i) => {
        const b = NODES[i].b, lamp = lampAt(i);
        return (
          <g key={i}>
            <Slab b={b} />
            <g className="d-o" transform={onLeft(b[0] + 8, b[1] + b[3], b[5] - 8)}>
              <path className="ad-rack" d={`M0,0h38M0,7h38M0,14h38${b[5] > 36 ? "M0,21h38" : ""}`} />
            </g>
            <g className="sg-lamp d-p" data-i={i}>
              <ellipse className="sg-glow" cx={f(lamp[0])} cy={f(lamp[1])} rx="9" ry="5.2" />
              <Coin x={b[0] + b[2] / 2} y={b[1] + b[3] / 2} z={b[5]} r={7} h={6} g />
            </g>
          </g>
        );
      })}
    </svg>
  );
}

/* ───────────────────────── go deeper: the hub and its eight instruments ───────────────────────── */
const R = 132;
export const SPOKES: { at: W2; path: W2[]; h: number }[] = [
  { at: [0, -R], path: [[0, -24], [0, -R + 16]], h: 26 }, { at: [R * 0.72, -R * 0.72], path: [[16, -24], [16, -R * 0.72], [R * 0.72 - 16, -R * 0.72]], h: 18 },
  { at: [R, 0], path: [[24, 0], [R - 16, 0]], h: 30 }, { at: [R * 0.72, R * 0.72], path: [[24, 16], [R * 0.72, 16], [R * 0.72, R * 0.72 - 16]], h: 22 },
  { at: [0, R], path: [[0, 24], [0, R - 16]], h: 16 }, { at: [-R * 0.72, R * 0.72], path: [[-16, 24], [-16, R * 0.72], [-R * 0.72 + 16, R * 0.72]], h: 28 },
  { at: [-R, 0], path: [[-24, 0], [-R + 16, 0]], h: 20 }, { at: [-R * 0.72, -R * 0.72], path: [[-24, -16], [-R * 0.72, -16], [-R * 0.72, -R * 0.72 + 16]], h: 24 },
];
const HUB: B6 = [-24, -24, 48, 48, 0, 34];
const thAll: V[] = SPOKES.flatMap((s) => cornersOf([s.at[0] - 16, s.at[1] - 16, 32, 32, 0, s.h]));
export const TH_VB = vbox(thAll, 8);
export function ToolsHub({ on }: { on: number | null }) {
  const nodes = SPOKES.map((s, i) => ({ s, i })).sort((a, b) => a.s.at[0] + a.s.at[1] - (b.s.at[0] + b.s.at[1]));
  const items: { key: number; node: ReactNode }[] = [
    ...nodes.map(({ s, i }) => ({ key: s.at[0] + s.at[1], node: (
      <g key={i} className={`th-node${on === i ? " is-on" : ""}`}>
        <Slab b={[s.at[0] - 16, s.at[1] - 16, 32, 32, 0, s.h]} />
        <path className="th-glyph d-o" d="M6,22v-6M12,22v-11M18,22v-8M24,22v-14" transform={onTop(s.at[0] - 16, s.at[1] - 16, s.h)} />
      </g>) })),
    { key: 0.5, node: (
      <g key="hub" className="th-hub">
        <Slab b={HUB} tone="g" />
      </g>) },
  ].sort((a, b) => a.key - b.key);
  return (
    <svg className="ad-svg th" viewBox={TH_VB.s} data-draw="self" data-on={on ?? undefined} aria-hidden="true" focusable="false">
      <Fade id="th-m" vb={TH_VB} />
      <Floor x0={-R - 40} y0={-R - 40} x1={R + 40} y1={R + 40} step={22} id="th-m" />
      <g className="th-traces d-o">{SPOKES.map((s, i) => <path key={i} className={on === i ? "is-on" : ""} d={floorLine(s.path)} />)}</g>
      <g className="th-sigs">{SPOKES.map((s, i) => { const p = P(...s.path[0]); return <circle key={i} r="3" transform={`translate(${f(p[0])} ${f(p[1])})`} />; })}</g>
      {items.map((it) => it.node)}
    </svg>
  );
}

/* ───────────────────────── the vault ───────────────────────── */
/** a strongbox (w × d × h) on a low plinth, its round door on the face toward the lower left */
export function Vault({ w, d, h, big = false, door = "round" }: { w: number; d: number; h: number; big?: boolean; door?: "round" | "square" }) {
  const body: B6 = [0, 0, w, d, 0, h], base: B6 = [-8, -8, w + 16, d + 16, -8, 8];
  const r = Math.min(w, h) * 0.3, cx = w / 2, cy = h / 2;
  const bolts = Array.from({ length: 8 }, (_, k) => { const a = (k / 8) * Math.PI * 2; return [cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82] as W2; });
  const vb = vbox([...cornersOf(base), ...cornersOf(body), P(-20, d + 30, -8), P(w + 30, -20, -8)], 6);
  return (
    <svg className={`ad-svg vt${big ? " vt--big" : ""}`} viewBox={vb.s} data-draw={big ? "self" : ""} aria-hidden="true" focusable="false">
      <ellipse className="vt-shadow d-floor" cx={f(P(w / 2, d / 2, -8)[0])} cy={f(P(w / 2, d / 2, -8)[1] + 6)} rx={f(w * 0.95)} ry={f(w * 0.3)} />
      <Slab b={base} />
      <Slab b={body} />
      <g className="vt-door d-o" transform={onLeft(0, d, h)}>
        {door === "round"
          ? <><circle cx={f(cx)} cy={f(cy)} r={f(r)} /><circle cx={f(cx)} cy={f(cy)} r={f(r * 0.66)} /></>
          : <><rect x={f(cx - r)} y={f(cy - r)} width={f(r * 2)} height={f(r * 2)} rx="3" /><rect x={f(cx - r * 0.66)} y={f(cy - r * 0.66)} width={f(r * 1.32)} height={f(r * 1.32)} rx="2" /></>}
        {bolts.map(([x, y], k) => <circle key={k} className="vt-bolt" cx={f(x)} cy={f(y)} r={big ? 1.6 : 1.2} />)}
        <g className="vt-dial" data-c={`${f(cx)} ${f(cy)}`}>
          <path d={`M${f(cx - r * 0.5)},${f(cy)}H${f(cx + r * 0.5)}M${f(cx)},${f(cy - r * 0.5)}V${f(cy + r * 0.5)}`} />
          <circle className="vt-hub" cx={f(cx)} cy={f(cy)} r={f(Math.max(2.5, r * 0.16))} />
        </g>
        <rect className="vt-hinge" x="3" y={f(h * 0.2)} width="3" height={f(h * 0.14)} /><rect className="vt-hinge" x="3" y={f(h * 0.66)} width="3" height={f(h * 0.14)} />
      </g>
      <path className="vt-seam d-o" d={line(P(w, 0, h * 0.5), P(w, d, h * 0.5))} />
    </svg>
  );
}
