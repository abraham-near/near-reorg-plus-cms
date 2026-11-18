// Analytics D, the hero drawing: the numbers as columns on a plinth. Sixteen columns climb the plinth, one per week of the revenue share (REVENUE.spark,
// sample figures), the latest in green; a green trend line rides their tops; behind them a row of drawn-only columns (the period before, a little lower);
// signals run the plinth's seams. motion.ts builds it (the plinth draws, the columns rise one by one, the line draws over them) and keeps it alive (the
// columns breathe, the signals run, it leans to the pointer). Decorative: the headline carries the meaning.
import { REVENUE } from "../content";
import { P, f, pts, line, box, faces, wire, vbox, corners, dots, type Box, type V } from "./kit";
import { Slab } from "./parts";

const N = REVENUE.spark.length, W = 20, STEP = 25, GX = -46;   // a column's footprint, the step between weeks, the ghost row's x
const H = (v: number) => (v - 28) * 6.4;
export const COLS = REVENUE.spark.map((v, k) => ({ y0: -k * STEP - W, h: H(v), k }));
const GHOST = REVENUE.spark.map((v, k) => ({ y0: -k * STEP - W, h: H(v - 5 - (k % 3) * 1.5), k }));
export const colBox = (k: number, t = 1): Box => box(0, COLS[k].y0, W, W, 0, Math.max(0.01, COLS[k].h * t));
export const colFaces = (k: number, t = 1) => faces(colBox(k, t));
/** the trend line through the columns' tops, at their current heights */
export const topAt = (k: number, t = 1): V => P(W / 2, COLS[k].y0 + W / 2, COLS[k].h * t);
export const trend = (ts: number[]) => line(...COLS.map((_, k) => topAt(k, ts[k])));

const Y0 = -N * STEP - 14, Y1 = 16;
const TOP: [number, number, number, number, number, number] = [-60, Y0, 102, Y1 - Y0, -16, 16];
const BASE: [number, number, number, number, number, number] = [-80, Y0 - 20, 142, Y1 - Y0 + 40, -36, 20];
export const LANES: [V, V][] = [[P(-13, Y1, 0), P(-13, Y0, 0)], [P(31, Y1, 0), P(31, Y0, 0)]];
const GROUND = { x0: -150, x1: 130, y0: Y0 - 70, y1: 110, z: -36 };

const all: V[] = [...corners(box(...BASE)), ...COLS.map((_, k) => topAt(k)), P(GROUND.x1, GROUND.y1, GROUND.z), P(GROUND.x0, GROUND.y1, GROUND.z), P(GROUND.x1, GROUND.y0, GROUND.z)];
export const VB = vbox(all, 10);

export function HeroPlinth() {
  const last = N - 1, endTop = topAt(last);
  return (
    <div className="ad-hero__art" aria-hidden="true">
      <div className="ad-hero__cam">
        <svg className="ad-svg hx" viewBox={VB.s} data-draw="self" focusable="false">
          <defs>
            <radialGradient id="hx-fade" cx="50%" cy="60%" r="52%"><stop offset="0.35" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
            <mask id="hx-mask" maskUnits="userSpaceOnUse" x={VB.x} y={VB.y} width={VB.w} height={VB.h}><rect x={VB.x} y={VB.y} width={VB.w} height={VB.h} fill="url(#hx-fade)" /></mask>
          </defs>
          <path className="ad-dots d-floor" d={dots(GROUND.x0, GROUND.y0, GROUND.x1, GROUND.y1, 20, GROUND.z)} mask="url(#hx-mask)" />
          <Slab b={BASE} cls="hx-base" />
          <Slab b={TOP} />
          {/* the week ticks on the plinth's front face, one per column */}
          <path className="hx-ticks d-o" d={COLS.map((c) => { const a = P(TOP[0] + TOP[2], c.y0 + W / 2, -3), b = P(TOP[0] + TOP[2], c.y0 + W / 2, -9); return `M${f(a[0])},${f(a[1])}L${f(b[0])},${f(b[1])}`; }).join("")} />
          <g className="hx-lanes d-o">{LANES.map(([a, b], i) => <path key={i} d={line(a, b)} />)}</g>
          <g className="hx-sig d-o">{LANES.map(([a], i) => <polygon key={i} points={pts(P(-4, -4), P(4, -4), P(4, 4), P(-4, 4))} transform={`translate(${f(a[0])} ${f(a[1])})`} />)}</g>
          <g className="hx-ghost d-o">{GHOST.map((g, k) => <path key={k} d={wire(box(GX, g.y0, W, W, 0, g.h))} />).reverse()}</g>
          <g className="hx-cols">
            {COLS.map((_, k) => {
              const fc = colFaces(k);
              return (
                <g key={k} className={`hx-col${k === last ? " is-now" : ""}`} data-k={k}>
                  <polygon className="hx-col__l" points={fc.left} /><polygon className="hx-col__r" points={fc.right} /><polygon className="hx-col__t" points={fc.top} />
                </g>
              );
            }).reverse()}
          </g>
          <path className="hx-trend d-o" d={trend(COLS.map(() => 1))} pathLength={1} />
          <g className="hx-dots d-o">{COLS.map((_, k) => { const p = topAt(k); return <circle key={k} cx={f(p[0])} cy={f(p[1])} r={k === last ? 5 : 2.6} />; })}</g>
          <circle className="hx-ring d-o" cx={f(endTop[0])} cy={f(endTop[1])} r="5" />
        </svg>
      </div>
    </div>
  );
}
