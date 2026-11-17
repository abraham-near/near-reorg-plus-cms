// Community B, the Legion: a formation on the dark. People scattered over the ground step up onto a plinth and fall into ranks as the section scrolls in
// (motion.ts, scrubbed); one stands in front, in green, by the flag. The markup is the finished frame (ranks formed: reduced motion, no JS).
// Decorative: the text beside it carries the meaning.
import { P, f, vbox, box, corners, dots, onLeft, rng, lerp, ease3, seg, type V } from "./kit";
import { Slab, Pawn } from "./parts";

const PLINTH: [number, number, number, number, number, number] = [0, 0, 252, 168, 0, 16];
const STEP: [number, number, number, number, number, number] = [96, 168, 60, 26, 0, 8];
const COLS = 7, ROWS = 4;
type Man = { rank: [number, number, number]; from: [number, number]; k: number; g: boolean };
export const MEN: Man[] = (() => {
  const r = rng(7), out: Man[] = [];
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
    const a = r() * Math.PI * 2, d = 120 + r() * 70;
    out.push({ rank: [24 + i * 34, 22 + j * 38, PLINTH[5]], from: [126 + Math.cos(a) * d * 1.15, 84 + Math.sin(a) * d * 0.9], k: 0, g: false });
  }
  out.push({ rank: [126, 181, STEP[5]], from: [126, 280], k: 0, g: true });   // the one in front
  // they arrive back rows first (the ranks fill from the back), the one in front last
  out.forEach((m, n) => { m.k = n === out.length - 1 ? 1 : (ROWS - 1 - Math.floor(n / COLS)) / ROWS + (n % COLS) * 0.012; });
  return out;
})();
/** a person's place at the formation's progress p (0 scattered, 1 in ranks) */
export function placeAt(m: Man, p: number): V {
  const s = 0.04 + m.k * 0.5, e = ease3(seg(p, s, s + 0.42));
  const x = lerp(m.from[0], m.rank[0], e), y = lerp(m.from[1], m.rank[1], e), z = lerp(0, m.rank[2], e) + Math.sin(Math.PI * e) * 16;
  return P(x, y, z);
}
// the flag at the formation's front-left corner: a pole and a green cloth along x
const POLE = { x: 8, y: 160, z0: PLINTH[5], z1: 150 };

const all: V[] = [...corners(box(...PLINTH)), ...MEN.map((m) => P(m.from[0], m.from[1])), P(POLE.x, POLE.y, POLE.z1 + 6)];
export const VB = vbox(all, 6);

export function LegionFormation() {
  const order = MEN.map((m, n) => ({ m, n })).sort((a, b) => a.m.rank[0] + a.m.rank[1] - (b.m.rank[0] + b.m.rank[1]));
  const top = P(POLE.x, POLE.y, POLE.z1), foot = P(POLE.x, POLE.y, POLE.z0);
  return (
    <svg className="cb-svg lg" viewBox={VB.s} data-draw="self" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="lg-fade" cx="50%" cy="55%" r="52%"><stop offset="0.35" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <mask id="lg-mask" maskUnits="userSpaceOnUse" x={VB.x} y={VB.y} width={VB.w} height={VB.h}><rect x={VB.x} y={VB.y} width={VB.w} height={VB.h} fill="url(#lg-fade)" /></mask>
      </defs>
      <path className="cb-dots cb-dots--n d-floor" d={dots(-160, -140, 420, 340, 20)} mask="url(#lg-mask)" />
      <Slab b={PLINTH} tone="n" />
      <g className="lg-grid d-o">
        {Array.from({ length: COLS - 1 }, (_, i) => { const x = 7 + (i + 1) * 34, a = P(x, 4, PLINTH[5]), b = P(x, 164, PLINTH[5]); return <path key={i} d={`M${f(a[0])},${f(a[1])}L${f(b[0])},${f(b[1])}`} />; })}
      </g>
      <Slab b={STEP} tone="n" />
      <path className="lg-pole d-o" d={`M${f(foot[0])},${f(foot[1])}L${f(top[0])},${f(top[1])}`} />
      <g className="lg-flag d-o" transform={onLeft(POLE.x, POLE.y, POLE.z1)}><path d="M0,0h46l-8,13 8,13h-46z" /></g>
      {order.map(({ m, n }) => <Pawn key={n} at={placeAt(m, 1)} g={m.g} night cls="lg-man" i={n} />)}
    </svg>
  );
}
