// Community B, the hero drawing: a map of crews. Six local crews (slabs with their people on them, each with its host in green) and the stage where they
// meet, on a dotted ground; arcs through the air join them, and green signals run along the arcs. motion.ts builds it on arrival, keeps it alive (the
// signals travel, the arcs flow, people breathe) and leans it to the pointer. Decorative: the headline carries the meaning.
import type { ReactNode } from "react";
import { P, f, vbox, spots, arc, dots, onLeft, type V } from "./kit";
import { Slab, Pawn } from "./parts";

type Crew = { x: number; y: number; w: number; d: number; h: number; n: number };
const CREWS: Crew[] = [
  { x: 10, y: 10, w: 72, d: 62, h: 14, n: 3 },     // A · the back
  { x: 330, y: 20, w: 80, d: 60, h: 12, n: 2 },    // B · right
  { x: 384, y: 196, w: 78, d: 82, h: 16, n: 4 },   // C · far right
  { x: 20, y: 250, w: 70, d: 80, h: 14, n: 3 },    // D · far left
  { x: 330, y: 362, w: 90, d: 76, h: 18, n: 5 },   // E · front
  { x: 108, y: 398, w: 80, d: 62, h: 12, n: 3 },   // F · front left
];
// the stage: a platform, a backdrop with its screen, a lectern and the speaker; the audience on the ground in front of it
const ST = { x: 180, y: 140, w: 124, d: 84, h: 18 };
const WALL: [number, number, number, number, number, number] = [ST.x + 8, ST.y + 2, ST.w - 16, 7, ST.h, 66];
const LECTERN: [number, number, number, number, number, number] = [ST.x + 78, ST.y + 36, 12, 10, ST.h, 17];
const SPEAKER: [number, number] = [ST.x + 62, ST.y + 46];
export const AUDIENCE: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) out.push([ST.x + 26 + c * 26 + (r % 2) * 8, ST.y + ST.d + 34 + r * 25]);
  return out;
})();

const top = (c: { x: number; y: number; w: number; d: number; h: number }, lift = 30): [number, number, number] => [c.x + c.w / 2, c.y + c.d / 2, c.h + lift];
const PAIRS: [number, number][] = [[0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [4, 2], [5, 3], [0, 1], [4, 5]];   // 6 = the stage
const places = [...CREWS, ST];
export const ARCS = PAIRS.map(([a, b]) => {
  const A = top(places[a], a === 6 ? 72 : 30), B = top(places[b], b === 6 ? 72 : 30);
  return arc(A, B, Math.hypot(A[0] - B[0], A[1] - B[1]) * 0.3);
});

/** every person in the drawing, in one list (the motion finds them by data-i): the crews', the speaker, the audience */
export const PEOPLE: { at: V; g: boolean; key: number }[] = [
  ...CREWS.flatMap((c) => spots(c.x, c.y, c.w, c.d, c.n).map((s, k) => ({ at: P(s[0], s[1], c.h), g: k === c.n - 1, key: c.x + c.y + c.w / 2 + c.d / 2 + 0.5 + k * 0.01 }))),
  { at: P(SPEAKER[0], SPEAKER[1], ST.h), g: true, key: ST.x + ST.y + 90 },
  ...AUDIENCE.map((a, k) => ({ at: P(a[0], a[1]), g: k === 5, key: a[0] + a[1] })),
];

const GROUND = { x0: -40, y0: -40, x1: 520, y1: 520 };
const all: V[] = [P(GROUND.x0, GROUND.y0), P(GROUND.x1, GROUND.y0), P(GROUND.x0, GROUND.y1), P(GROUND.x1, GROUND.y1), ...ARCS.flatMap((a) => a.ps)];
export const VB = vbox(all, 12);

export function HeroCrews() {
  type Item = { key: number; node: ReactNode };
  const items: Item[] = [
    ...CREWS.map((c, i) => ({ key: c.x + c.y + c.w / 2 + c.d / 2, node: <Slab key={`c${i}`} b={[c.x, c.y, c.w, c.d, 0, c.h]} /> })),
    { key: ST.x + ST.y + ST.w / 2 + ST.d / 2 - 60, node: (
      <g key="stage" className="hc-stage">
        <Slab b={[ST.x, ST.y, ST.w, ST.d, 0, ST.h]} />
        <Slab b={[ST.x + ST.w * 0.3, ST.y + ST.d, ST.w * 0.4, 12, 0, 9]} />
        <Slab b={WALL} />
        {/* the screen on the backdrop's face: a slide, its title bar green */}
        <g className="hc-screen d-o" transform={onLeft(WALL[0] + 8, WALL[1] + WALL[3], WALL[4] + WALL[5] - 8)}>
          <rect x="0" y="0" width={f(WALL[2] - 16)} height="44" />
          <path className="hc-screen__g" d="M8,9h34" />
          <path d={`M8,19h${f(WALL[2] - 40)}M8,26h${f(WALL[2] - 52)}M8,33h${f(WALL[2] - 64)}`} />
        </g>
      </g>) },
    { key: LECTERN[0] + LECTERN[1] + 11, node: <Slab key="lectern" b={LECTERN} /> },
    ...PEOPLE.map((p, i) => ({ key: p.key, node: <Pawn key={`p${i}`} at={p.at} g={p.g} cls="hc-pw" i={i} /> })),
  ].sort((a, b) => a.key - b.key);

  return (
    <div className="cb-hero__art" aria-hidden="true">
      <div className="cb-hero__cam">
        <svg className="cb-svg hc" viewBox={VB.s} data-draw="self" focusable="false">
          <defs>
            <radialGradient id="hc-fade" cx="50%" cy="55%" r="50%"><stop offset="0.4" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
            <mask id="hc-mask" maskUnits="userSpaceOnUse" x={VB.x} y={VB.y} width={VB.w} height={VB.h}><rect x={VB.x} y={VB.y} width={VB.w} height={VB.h} fill="url(#hc-fade)" /></mask>
          </defs>
          <path className="cb-dots d-floor" d={dots(GROUND.x0, GROUND.y0, GROUND.x1, GROUND.y1, 20)} mask="url(#hc-mask)" />
          {items.map((it) => it.node)}
          <g className="hc-arcs d-o">{ARCS.map((a, i) => <path key={i} d={a.d} />)}</g>
          <g className="hc-sigs d-o">
            {ARCS.map((a, i) => { const p = a.ps[Math.round(a.ps.length * (0.3 + ((i * 0.37) % 0.4)))]; return <circle key={i} r="3.8" cx="0" cy="0" transform={`translate(${f(p[0])} ${f(p[1])})`} />; })}
          </g>
        </svg>
      </div>
    </div>
  );
}
