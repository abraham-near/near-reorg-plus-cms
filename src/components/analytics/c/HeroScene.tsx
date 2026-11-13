// Analytics C's hero drawing: the network, alive. A stepped plinth carries nine shard plates (3 × 3); blocks land on them, a plate flashes as it
// commits one and a green receipt arcs to a neighbour; a status beacon at the side pulses with the network's health. The markup is the still frame
// (reduced motion, and before the motion mounts): three blocks resting, one receipt arc. motion.ts runs it, leans it to the pointer and spreads the
// plates as the hero scrolls away. Decorative: the hero's text says what it shows.
import { Bx, Chip, Dots, S, f, seg, topPts, GREEN, INK, type B6, type V } from "./kit";
import { STATUS } from "../content";

export const U = 25;
const GROUND: B6 = [-0.7, -0.7, 0, 14.6, 14.6, 0.3];
const BASE: B6 = [0, 0, 0.3, 13.2, 13.2, 0.5];
const PZ = 0.8, PH = 0.5, PS = 3.2, PM = 0.9, PG = 0.9, BZ = PZ + PH, BS = 1.5;
export const PLATES = Array.from({ length: 9 }, (_, k) => {
  const c = k % 3, r = Math.floor(k / 3), x = PM + c * (PS + PG), y = PM + r * (PS + PG);
  return { k, c, r, b: [x, y, PZ, PS, PS, PH] as B6, blk: [x + (PS - BS) / 2, y + (PS - BS) / 2, BZ, BS, BS, BS] as B6, mid: S(x + PS / 2, y + PS / 2, BZ, U) };
});
const ORDER = PLATES.slice().sort((a, b) => a.c + a.r - (b.c + b.r) || a.c - b.c);
// the receipts' routes: every pair of neighbours
export const PAIRS: [number, number][] = [[0, 1], [1, 2], [3, 4], [4, 5], [6, 7], [7, 8], [0, 3], [3, 6], [1, 4], [4, 7], [2, 5], [5, 8]];
const arc = (a: V, b: V) => {
  const lift = 2.4 * U;
  return `M${f(a[0])},${f(a[1])}C${f(a[0])},${f(a[1] - lift)} ${f(b[0])},${f(b[1] - lift)} ${f(b[0])},${f(b[1])}`;
};
// the still frame: blocks rest on these plates, and this receipt is shown
const STILL_BLOCKS = new Set([1, 4, 6]), STILL_ARC = 3;
// the lanes between the plates, on the base's top
const SEAMS = [PM + PS + PG / 2, PM + 2 * PS + PG * 1.5];
// the beacon, beside the plinth
const BEACON: B6 = [15.75, -2.05, 0.3, 0.9, 0.9, 4.4], PED: B6 = [15.4, -2.4, 0, 1.6, 1.6, 0.3];
export const BEACON_TOP = S(BEACON[0] + 0.45, BEACON[1] + 0.45, BEACON[2] + BEACON[5], U);
const ring = (r: number) => ({ rx: r * Math.SQRT2 * Math.cos(Math.PI / 6) * U, ry: r * Math.SQRT2 * 0.5 * U });

export function HeroScene() {
  const ok = STATUS.health === "ok";
  const vbX = S(-0.7, 13.9, 0, U)[0] - 18, vbR = S(16.2, -1.6, 0, U)[0] + 78, vbT = -3.4 * U, vbB = S(13.9, 13.9, 0, U)[1] + 22;
  const vb = `${f(vbX)} ${f(vbT)} ${f(vbR - vbX)} ${f(vbB - vbT)}`;
  const r1 = ring(0.7), chipAt = S(3, 13.9, 0.15, U), lead = [chipAt, [chipAt[0] - 30, chipAt[1] + 40] as V];
  const bt = BEACON_TOP, statusAt: V = [bt[0] - 132, bt[1] - 46];
  return (
    <svg className="anc-hs" viewBox={vb} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="anc-hs-fade" cx="50%" cy="58%" r="55%">
          <stop offset="0.4" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id="anc-hs-mask" maskUnits="userSpaceOnUse" x={f(vbX)} y={f(vbT)} width={f(vbR - vbX)} height={f(vbB - vbT)}>
          <rect x={f(vbX)} y={f(vbT)} width={f(vbR - vbX)} height={f(vbB - vbT)} fill="url(#anc-hs-fade)" />
        </mask>
      </defs>
      <g className="anc-h-l0" data-depth="0.35">
        <g mask="url(#anc-hs-mask)"><Dots x0={-4} y0={-4} x1={19} y1={18} u={U} o={0.42} /></g>
        <Bx b={GROUND} u={U} cls="anc-h-ground" />
        <Bx b={BASE} u={U} cls="anc-h-base" />
        <g className="anc-h-seams" fill="none" stroke={INK} strokeOpacity={0.4} strokeDasharray="2 4">
          {SEAMS.map((s) => <path key={`x${s}`} d={seg(S(s, 0.25, PZ, U), S(s, 12.95, PZ, U))} />)}
          {SEAMS.map((s) => <path key={`y${s}`} d={seg(S(0.25, s, PZ, U), S(12.95, s, PZ, U))} />)}
        </g>
        <path className="anc-h-lead" d={seg(lead[0], lead[1])} fill="none" stroke={INK} strokeOpacity={0.5} strokeDasharray="2 2" />
      </g>
      <g className="anc-h-l1" data-depth="0.7">
        {ORDER.map((p) => (
          <g key={p.k} className="anc-h-plate" data-k={p.k}>
            <g className="anc-h-lift">
              <Bx b={p.b} u={U} />
              <polygon className="anc-h-flash" points={topPts(p.b, U)} fill={GREEN} stroke={INK} opacity={0} />
              <Bx b={p.blk} u={U} cls={`anc-h-blk${STILL_BLOCKS.has(p.k) ? " is-still" : ""}`} top={p.k === 4 ? GREEN : undefined} />
            </g>
          </g>
        ))}
        <Bx b={PED} u={U} cls="anc-h-ped" />
        <Bx b={BEACON} u={U} top={ok ? GREEN : INK} cls="anc-h-beacon" />
      </g>
      <g className="anc-h-l2" data-depth="1">
        <g className="anc-h-arcs" fill="none">
          {PAIRS.map(([a, b], i) => (
            <path key={i} className={`anc-h-arc${i === STILL_ARC ? " is-still" : ""}`} d={arc(PLATES[a].mid, PLATES[b].mid)} data-i={i} />
          ))}
        </g>
        <circle className="anc-h-dot" r={4.2} cx={f(PLATES[PAIRS[STILL_ARC][1]].mid[0])} cy={f(PLATES[PAIRS[STILL_ARC][1]].mid[1])} fill={GREEN} stroke={INK} />
        <g className="anc-h-rings" fill="none" stroke={ok ? GREEN : INK}>
          {[0, 1, 2].map((i) => <ellipse key={i} className="anc-h-ring" cx={f(bt[0])} cy={f(bt[1])} rx={f(r1.rx)} ry={f(r1.ry)} data-i={i} />)}
        </g>
        <path className="anc-h-lead" d={seg([bt[0], bt[1] - 6], [statusAt[0] + 60, statusAt[1] + 11])} fill="none" stroke={INK} strokeOpacity={0.5} strokeDasharray="2 2" />
      </g>
      <g className="anc-h-l3" data-depth="1.25">
        <Chip at={[lead[1][0] - 80, lead[1][1]]} label="Mainnet" />
        <Chip at={statusAt} label={ok ? "Operational" : "Investigating"} dot={ok ? GREEN : "#F5F4F1"} cls="anc-h-status" />
        <g className="anc-h-tip" opacity={0}>
          <rect x={-40} y={-11} width={80} height={22} />
          <text x={0} y={4} textAnchor="middle">SHARD 0</text>
        </g>
      </g>
    </svg>
  );
}
