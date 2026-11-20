// [[TBD: graphic by Ali]] placeholder: Economics X's loop, in the site's isometric hand (./iso.tsx); a designer redraws it. It replaces A's quadrant + ring.
// The four steps as four stations on one slab, a corner each, joined by a dotted path that runs round them clockwise (usage → revenue → supply → strength →
// usage), a chevron on each side for the direction:
//   usage, a cluster of small blocks (the things people use); revenue, a stack of coins; supply, plates that narrow as they rise (the supply tightening);
//   strength, a pillar on its footing.
// The step on show (data-step on the row, motion.ts: the scroll on wide screens, a slow cycle on phones) turns its station green, its name to full ink and the
// path out of it solid; a dot runs that side towards the next station. The names are set as HTML over the drawing; the drawing and its names are decorative,
// the steps beside it (an ordered list) carry the meaning.
import type { ReactNode } from "react";
import { LOOP } from "../content";
import { P, f, box, corners, vbox, line, Slab, Coin, type B6, type V } from "./iso";

const K = 58;          // a station's centre, on each diagonal of the slab
const PAD = 24;        // half a station's pad
const TOP: B6 = [-100, -100, 200, 200, -16, 16];
const BASE: B6 = [-114, -114, 228, 228, -28, 12];
type XY = [number, number];
/** the stations in the steps' order: back (top of the drawing), right, front, left */
const AT: XY[] = [[-K, -K], [K, -K], [K, K], [-K, K]];
/** each station's highest point on screen, world x / y / z (its name sits just over it): the back block's far corner, the top coin's far edge,
 *  the top plate's far corner, the pillar's far corner */
const HEAD: [number, number, number][] = [[-K - 19, -K - 19, 39], [K - 11.3, -K - 11.3, 33], [K - 6.5, K - 6.5, 27], [-K - 11, K - 11, 51]];
/** where a station's name sits: over its centre, 14 units above its highest point */
const NAME = AT.map(([x, y], i): V => [P(x, y)[0], P(...HEAD[i])[1] - 14]);
/** the direction of the side out of station i (unit, in world x / y) */
const DIR: XY[] = [[1, 0], [0, 1], [-1, 0], [0, -1]];

/** the open part of side i (pad edge to pad edge), at u from 0 to 1, on screen */
export function along(i: number, u: number): V {
  const a = AT[i], d = DIR[i], s = 2 * K - 2 * (PAD + 2);
  const x = a[0] + d[0] * (PAD + 2 + s * u), y = a[1] + d[1] * (PAD + 2 + s * u);
  return P(x, y, 0);
}

const all: V[] = [...corners(box(...BASE)), ...NAME.map(([x, y]): V => [x, y - 18])];
const VB = vbox(all, 6);
const pct = (p: V) => ({ left: `${(((p[0] - VB.x) / VB.w) * 100).toFixed(2)}%`, top: `${(((p[1] - VB.y) / VB.h) * 100).toFixed(2)}%` });

/** the path's side i, dotted, with its chevron half way */
function Side({ i }: { i: number }) {
  const a = AT[i], b = AT[(i + 1) % 4], d = DIR[i], n: XY = [-d[1], d[0]];
  const m: XY = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const tip = P(m[0] + d[0] * 4, m[1] + d[1] * 4), w1 = P(m[0] - d[0] * 3 + n[0] * 6, m[1] - d[1] * 3 + n[1] * 6), w2 = P(m[0] - d[0] * 3 - n[0] * 6, m[1] - d[1] * 3 - n[1] * 6);
  return (
    <g className="ex-lp-side" data-seg={i + 1}>
      <path className="ex-lp-side__p" d={line(P(...a), P(...b))} />
      <path className="ex-lp-side__h" d={line(w1, tip, w2)} />
    </g>
  );
}

function Station({ i }: { i: number }) {
  const [x, y] = AT[i];
  let body: ReactNode;
  if (i === 0) {
    // usage: four small blocks, back to front
    const hs = [36, 24, 28, 14], o: XY[] = [[-19, -19], [2, -19], [-19, 2], [2, 2]];
    body = o.map(([dx, dy], k) => <Slab key={k} b={[x + dx, y + dy, 17, 17, 3, hs[k]]} />);
  } else if (i === 1) {
    // revenue: a stack of coins
    body = Array.from({ length: 6 }, (_, k) => <Coin key={k} x={x} y={y} z={3 + k * 5} r={16} h={5} />);
  } else if (i === 2) {
    // supply: plates that narrow as they rise
    body = [40, 31, 22, 13].map((s, k) => <Slab key={k} b={[x - s / 2, y - s / 2, s, s, 3 + k * 6, 6]} />);
  } else {
    // strength: a pillar on its footing
    body = <><Slab b={[x - 19, y - 19, 38, 38, 3, 8]} /><Slab b={[x - 11, y - 11, 22, 22, 11, 40]} /></>;
  }
  return (
    <g className="ex-lp-st" data-st={i + 1}>
      <Slab b={[x - PAD, y - PAD, PAD * 2, PAD * 2, 0, 3]} cls="ex-lp-pad" />
      <g className="ex-lp-obj">{body}</g>
    </g>
  );
}

export function LoopIso() {
  return (
    <div className="ex-lp" aria-hidden="true"><div className="ex-lp__fig">
      <svg className="ex-svg ex-lp__svg" viewBox={VB.s} focusable="false">
        <Slab b={BASE} cls="ex-sl--base" />
        <Slab b={TOP} />
        {[0, 1, 2, 3].map((i) => <Side key={i} i={i} />)}
        {/* back to front: usage, then revenue and strength (side by side), then supply */}
        {[0, 1, 3, 2].map((i) => <Station key={i} i={i} />)}
        <circle className="ex-lp-dot" data-dot="" cx={f(along(0, 0)[0])} cy={f(along(0, 0)[1])} r="4" />
      </svg>
      {LOOP.steps.map((s, i) => (
        <span key={s.n} className="ex-lp__lb" data-lb={i + 1} style={pct(NAME[i])}>{s.short}</span>
      ))}
    </div></div>
  );
}
