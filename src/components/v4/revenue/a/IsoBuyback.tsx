// Revenue A's isometric: fees → buybacks, drawn in the rail's isometric hand (public/v1/vig2/*.svg: a floor rhombus with a fine dashed grid, plates with
// white tops and light grey sides, #111 outlines, coins as short cylinders, a dashed arc, black chips with a green dot and mono caps).
// The scene: two plates (the network) hold the fee coins; one fee coin hops along the dashed arc onto a stack of coins (the buybacks), and the stack's
// top coin lifts off up a dotted line and fades (bought back, out of circulation). This file only draws the resting frame (the markup is the reduced-motion
// state); ./iso-motion.ts brings it in and runs the loop. Projection: x' = (x − y)·cos30°, y' = (x + y)·sin30° − z (x runs right-down, y left-down, z up).
import { useId } from "react";

const C = Math.cos(Math.PI / 6), S = 0.5;
type V = [number, number];
const P = (x: number, y: number, z = 0): V => [(x - y) * C, (x + y) * S - z];
const f = (n: number) => n.toFixed(2);
const poly = (...ps: V[]) => ps.map((p) => `${f(p[0])},${f(p[1])}`).join(" ");

const INK = "#111111", SIDE_R = "#ECECEC", SIDE_L = "#F5F5F5";
const W_FLOOR = 0.77, W_PLATE = 0.96, W_COIN = 0.9;

// the world (units ≈ px at a 390 px wide art)
const X = 250, Y = 190;                                   // the floor
const PLATES: [number, number][] = [[0, 14], [32, 46]];  // the network: two plates (z from, z to), separated like the rail's stacks
const PX0 = 16, PX1 = 138, PY0 = 66, PY1 = 174;          // their footprint
const R = 16, H = 7;                                      // a coin: radius, thickness
const TOP = PLATES[1][1];                                 // the upper plate's top
const FEES: [number, number][] = [[44, 146], [64, 94]];  // the fee coins that stay on the plate
const HOP: [number, number] = [112, 122];                  // the fee coin that hops (on the plate)
const SX = 218, SY = 42, SN = 4;                          // the stack, on the floor: SN coins
const LIFT = 58;                                          // how far the bought-back coin rises (screen units)

const RX = R * Math.SQRT2 * C, RY = R * Math.SQRT2 * S;   // a circle in the floor plane, projected: an ellipse
/** a coin standing on (x, y, z): its side (grey), its face (white or emerald) and the face's inner ring */
function Coin({ x, y, z, face = "#FFFFFF", cls }: { x: number; y: number; z: number; face?: string; cls?: string }) {
  const [bx, by] = P(x, y, z), ty = by - H;
  return (
    <g className={cls}>
      <path d={`M${f(bx - RX)},${f(ty)} L${f(bx - RX)},${f(by)} A${f(RX)},${f(RY)} 0 0 0 ${f(bx + RX)},${f(by)} L${f(bx + RX)},${f(ty)} Z`} fill={SIDE_R} stroke={INK} strokeWidth={W_COIN} strokeLinejoin="round" />
      <ellipse cx={f(bx)} cy={f(ty)} rx={f(RX)} ry={f(RY)} fill={face} stroke={INK} strokeWidth={W_COIN} />
      <ellipse cx={f(bx)} cy={f(ty)} rx={f(RX * 0.62)} ry={f(RY * 0.62)} fill="none" stroke={INK} strokeWidth={W_COIN} />
    </g>
  );
}

/** a plate: its two visible sides (light greys) and its white top, outlined */
function Plate({ z0, z1 }: { z0: number; z1: number }) {
  return (
    <g className="rva-iso-plate">
      <polygon points={poly(P(PX1, PY0, z1), P(PX1, PY1, z1), P(PX1, PY1, z0), P(PX1, PY0, z0))} fill={SIDE_R} stroke={INK} strokeWidth={W_PLATE} strokeLinejoin="round" />
      <polygon points={poly(P(PX0, PY1, z1), P(PX1, PY1, z1), P(PX1, PY1, z0), P(PX0, PY1, z0))} fill={SIDE_L} stroke={INK} strokeWidth={W_PLATE} strokeLinejoin="round" />
      <polygon points={poly(P(PX0, PY0, z1), P(PX1, PY0, z1), P(PX1, PY1, z1), P(PX0, PY1, z1))} fill="#FFFFFF" stroke={INK} strokeWidth={W_PLATE} strokeLinejoin="round" />
    </g>
  );
}

/** a chip: black, a green dot, mono caps */
function Chip({ x, y, label }: { x: number; y: number; label: string }) {
  const w = chipW(label), h = 24;
  return (
    <g className="rva-iso-chip" data-cx={f(x + w / 2)} data-cy={f(y + h / 2)}>
      <rect x={f(x)} y={f(y)} width={f(w)} height={h} fill={INK} />
      <circle className="rva-iso-dot" cx={f(x + 13)} cy={f(y + h / 2)} r={4.3} fill="#00DC8D" />
      <text x={f(x + 25)} y={f(y + h / 2 + 4.1)} className="rva-iso-t">{label}</text>
    </g>
  );
}

// the floor: its corners, its dashed grid (one line per path, so they can arrive in turn)
const F0 = P(0, 0), F1 = P(X, 0), F2 = P(X, Y), F3 = P(0, Y);
const GRID: string[] = [];
for (let i = 1; i < 10; i++) { const a = P((X * i) / 10, 0), b = P((X * i) / 10, Y); GRID.push(`M${f(a[0])},${f(a[1])}L${f(b[0])},${f(b[1])}`); }
for (let j = 1; j < 8; j++) { const a = P(0, (Y * j) / 8), b = P(X, (Y * j) / 8); GRID.push(`M${f(a[0])},${f(a[1])}L${f(b[0])},${f(b[1])}`); }

// the hop: from the hopping coin's face (on the plate) to the stack's top face, a cubic arching up
const A0 = P(HOP[0], HOP[1], TOP + H), A1 = P(SX, SY, SN * H);
const ARC = `M${f(A0[0])},${f(A0[1])} C${f(A0[0] + 26)},${f(A0[1] - 74)} ${f(A1[0] - 18)},${f(A1[1] - 92)} ${f(A1[0])},${f(A1[1])}`;
// the way out: a dotted line up from the stack's top
const G0 = P(SX, SY, SN * H), G1: V = [G0[0], G0[1] - LIFT - 14];

// the chips: FEES off the plates' back corner, BUYBACK over the dotted line's top
const chipW = (label: string) => 34 + label.length * 8.1;
const FEES_AT: V = [P(PX0, PY0, TOP)[0] - 100, P(PX0, PY0, TOP)[1] - 42], BUY_AT: V = [G1[0] - chipW("BUYBACK") / 2, G1[1] - 34];
// the art's box (screen units): the floor, the plates' tops, the chips
const VX0 = Math.min(F3[0], FEES_AT[0]) - 8, VX1 = Math.max(F1[0], BUY_AT[0] + chipW("BUYBACK")) + 8, VY0 = Math.min(FEES_AT[1], BUY_AT[1]) - 8;
const VB = { x: VX0, y: VY0, w: VX1 - VX0, h: F2[1] + 8 - VY0 };

export function IsoBuyback() {
  const uid = useId().replace(/:/g, "");
  return (
    <svg className="rva-iso" viewBox={`${f(VB.x)} ${f(VB.y)} ${f(VB.w)} ${f(VB.h)}`} aria-hidden="true" focusable="false"
      data-arc-x0={f(A0[0])} data-arc-y0={f(A0[1])} data-lift={LIFT}>
      <defs>
        <mask id={`rvai${uid}`} maskUnits="userSpaceOnUse" x={f(VB.x)} y={f(VB.y)} width={f(VB.w)} height={f(VB.h)}>
          <path className="rva-iso-am" d={ARC} fill="none" stroke="#fff" strokeWidth={8} pathLength={1} strokeDasharray="1 1" />
        </mask>
      </defs>
      <g className="rva-iso-floor">
        <polygon className="rva-iso-fill" points={poly(F0, F1, F2, F3)} fill="#F5F5F5" />
        <g className="rva-iso-grid" stroke={INK} strokeOpacity={0.6} strokeWidth={0.55} strokeLinecap="round" strokeDasharray="1.1 3.29">
          {GRID.map((d, i) => <path key={i} className="rva-iso-gl" d={d} />)}
        </g>
        <path className="rva-iso-edge" d={`M${poly(F0, F1, F2).replace(/ /g, "L")}`} fill="none" stroke={INK} strokeWidth={W_FLOOR} strokeLinejoin="round" strokeLinecap="round" pathLength={1} />
        <path className="rva-iso-edge" d={`M${poly(F0, F3, F2).replace(/ /g, "L")}`} fill="none" stroke={INK} strokeWidth={W_FLOOR} strokeLinejoin="round" strokeLinecap="round" pathLength={1} />
      </g>
      {PLATES.map(([z0, z1], i) => <Plate key={i} z0={z0} z1={z1} />)}
      {FEES.map(([x, y], i) => <Coin key={i} cls="rva-iso-fee" x={x} y={y} z={TOP} />)}
      {Array.from({ length: SN - 1 }, (_, i) => <Coin key={i} cls="rva-iso-sc" x={SX} y={SY} z={i * H} />)}
      <path className="rva-iso-guide" d={`M${f(G0[0])},${f(G0[1])}L${f(G1[0])},${f(G1[1])}`} stroke={INK} strokeOpacity={0.6} strokeWidth={0.55} strokeLinecap="round" strokeDasharray="1.1 3.29" />
      <path className="rva-iso-arc" d={ARC} fill="none" stroke={INK} strokeWidth={W_COIN} strokeDasharray="3 3" mask={`url(#rvai${uid})`} />
      <Coin cls="rva-iso-sc rva-iso-top" x={SX} y={SY} z={(SN - 1) * H} face="#00DC8D" />
      <Coin cls="rva-iso-fee rva-iso-hop" x={HOP[0]} y={HOP[1]} z={TOP} face="#00DC8D" />
      <Chip x={FEES_AT[0]} y={FEES_AT[1]} label="FEES" />
      <Chip x={BUY_AT[0]} y={BUY_AT[1]} label="BUYBACK" />
    </svg>
  );
}
