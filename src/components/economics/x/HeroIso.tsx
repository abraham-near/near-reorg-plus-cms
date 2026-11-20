// [[TBD: graphic by Ali]] placeholder: Economics X's hero drawing, in the site's isometric hand (./iso.tsx); a designer redraws it.
// NEAR's economy on a plinth: the blocks round the edge are the things people use (apps, swaps, agents), tallest at the back; a dotted lane runs from each
// to the middle, where the network's own stack of tokens stands (the one green). Fees, small white coins, run the lanes into the stack. motion.ts builds it
// once as the page opens (the floor, the edges draw, the faces fill, the stack rises coin by coin, the lanes last) and, while it is on screen, sends the fees
// down the lanes. Reduced motion: the finished frame, each fee half way down its lane. Decorative: the headline carries the meaning.
import { P, f, box, corners, vbox, dots, tr, Slab, Coin, type B6, type V } from "./iso";

const BASE: B6 = [-112, -112, 224, 224, -34, 14];
const TOP: B6 = [-96, -96, 192, 192, -20, 20];
const PAD: B6 = [-28, -28, 56, 56, 0, 4];
const GROUND = { a: -128, b: 128, z: -34 };
const S = 26;   // a block's footprint
/** the blocks round the plinth: their centre and height (back to front) */
const BLOCKS: { c: [number, number]; h: number }[] = [
  { c: [-64, -64], h: 96 },
  { c: [0, -76], h: 64 },
  { c: [-76, 0], h: 52 },
  { c: [64, -64], h: 40 },
  { c: [-64, 64], h: 30 },
  { c: [76, 0], h: 24 },
  { c: [0, 76], h: 16 },
];
const depth = (c: [number, number]) => c[0] + c[1];
const blockBox = (c: [number, number], h: number): B6 => [c[0] - S / 2, c[1] - S / 2, S, S, 0, h];

/** the stack: COINS coins of radius R, H tall, on the pad */
const COINS = 8, R = 20, H = 5;

type V3 = [number, number, number];
/** each lane, block to stack, as two world points on the plinth's top */
export const LANES: [V3, V3][] = BLOCKS.map(({ c }) => {
  const n = Math.hypot(c[0], c[1]), k0 = (n - 26) / n, k1 = 30 / n;
  return [[c[0] * k0, c[1] * k0, 0], [c[0] * k1, c[1] * k1, 0]];
});
/** a fee's place on lane i at u (0 at the block, 1 at the stack), on screen */
export const feeAt = (i: number, u: number): V => {
  const [a, b] = LANES[i];
  return P(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, 0);
};

const all: V[] = [...corners(box(...BASE)), ...BLOCKS.map(({ c, h }) => P(c[0] - S / 2, c[1] - S / 2, h)),
  P(GROUND.a, GROUND.b, GROUND.z), P(GROUND.b, GROUND.a, GROUND.z), P(GROUND.b, GROUND.b, GROUND.z), P(0, 0, 4 + COINS * H + 8)];
const VB = vbox(all, 8);

function Block({ i }: { i: number }) {
  const { c, h } = BLOCKS[i];
  return <Slab b={blockBox(c, h)} cls="ex-hx-blk" />;
}
function Fee({ i }: { i: number }) {
  return <g className="ex-hx-fee" data-fee={i} transform={tr(feeAt(i, 0.5))}><Coin x={0} y={0} z={0} r={6} h={2} /></g>;
}

export function HeroIso() {
  const ids = BLOCKS.map((_, i) => i);
  const back = ids.filter((i) => depth(BLOCKS[i].c) <= 0), front = ids.filter((i) => depth(BLOCKS[i].c) > 0);
  return (
    <div className="ex-hx-art" aria-hidden="true">
      <svg className="ex-svg ex-hx" viewBox={VB.s} focusable="false">
        <defs>
          <radialGradient id="ex-hx-fade" cx="50%" cy="58%" r="50%"><stop offset="0.3" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
          <mask id="ex-hx-mask" maskUnits="userSpaceOnUse" x={VB.x} y={VB.y} width={VB.w} height={VB.h}><rect x={VB.x} y={VB.y} width={VB.w} height={VB.h} fill="url(#ex-hx-fade)" /></mask>
        </defs>
        <path className="ex-dots d-floor" d={dots(GROUND.a, GROUND.a, GROUND.b, GROUND.b, 16, GROUND.z)} mask="url(#ex-hx-mask)" />
        <Slab b={BASE} cls="ex-sl--base" />
        <Slab b={TOP} />
        <g className="ex-hx-lanes d-o">{LANES.map(([a, b], i) => { const p = P(...a), q = P(...b); return <path key={i} d={`M${f(p[0])},${f(p[1])}L${f(q[0])},${f(q[1])}`} />; })}</g>
        {back.map((i) => <Block key={i} i={i} />)}
        <g className="d-o">{back.map((i) => <Fee key={i} i={i} />)}</g>
        <Slab b={PAD} />
        <g className="ex-hx-stack">
          {Array.from({ length: COINS }, (_, k) => <Coin key={k} x={0} y={0} z={4 + k * H} r={R} h={H} cls="ex-cn--g" />)}
        </g>
        <g className="d-o">{front.map((i) => <Fee key={i} i={i} />)}</g>
        {front.map((i) => <Block key={i} i={i} />)}
      </svg>
    </div>
  );
}
