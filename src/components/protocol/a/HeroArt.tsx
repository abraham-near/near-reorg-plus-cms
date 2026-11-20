// Protocol A's hero drawing: the protocol as one long plate in the site's iso hand (white tops, grey sides, ink hairlines, one green). On it, four
// shards as stacks of chunks, the block chain along its front edge, an account at its far end with its key. The page tells "Built for AI scale" with it
// (motion.ts, the hero's stage): a shard fills to its state threshold and splits in two (dynamic resharding), the private shard rises at the near end
// (confidential execution, its one row disclosed in green), and the account's key turns to a quantum-safe one (ML-DSA).
// The markup is the FINISHED frame (data-state="final": the split done, the private shard up, the new key): what reduced motion shows. Motion sets
// data-state="live" and the starting states, builds the plate on load and plays the three steps (scrubbed by the pinned stage on desktop).
import { P, at, box, dots, f, faces, onRight, pts, vbox, type B6, type V } from "./kit";
import { Blk, Key } from "./parts";

/* ── the geometry (world units) ── */
const PIT = 17, CH = 13;                // a chunk's pitch and height
const SY = 34, SD = 50, SW = 44;        // the shards' row (y) and footprint
const SX = [16, 80, 144, 208];          // the four shards' x
const COUNT = [3, 4, 5, 3];             // their chunks at the start (the third grows to 7, then splits)
const PX = 272;                         // the private shard's x
const PH = 4 * PIT - 4;                 // its height
const PLATE: B6 = [-76, 0, 400, 124, -18, 18];
const ACCT: B6 = at(-40, 70, 34, 34, 0, 16);
const THR = 7 * PIT - 4;                // the state threshold (the top of 7 chunks)
const chunk = (x: number, y: number, d: number, k: number): B6 => [x, y, SW, d, k * PIT, CH];
/** the two halves after the split: A moves back (y −14), B forward (y +14); where each starts, on screen, from its final place */
const SPLIT_OFF = { a: [-(14 * 0.866), 7] as V, b: [14 * 0.866, -7] as V };
const HALF_D = 23;
const HALF_A_Y = 20, HALF_B_Y = 75;     // final y (from 34 and 61: each moves 14)

/** the key's centre (screen), above the account */
const ACCT_TOP = P(-40, 70, 16);
export const KEY: V = [ACCT_TOP[0], ACCT_TOP[1] - 64];
/** a drop's fall (screen units): a transaction falls this far into its shard */
export const DROP = 120;
const tops = [0, 1, 3].map((i) => ({ i, z: COUNT[i] * PIT - 4, cx: SX[i] + SW / 2, cy: SY + SD / 2 }));

/* labels: an anchor on the drawing, the text beside it (mono, at about 11 px as drawn) */
const LAB_FS = 7.4;
const LABS: { k: string; a: V; d: V; t: string; start?: boolean }[] = [
  { k: "thr", a: P(SX[2] + SW, SY, THR), d: [18, -10], t: "state threshold", start: true },
  { k: "split", a: P(SX[2] + SW / 2, HALF_A_Y + HALF_D / 2, 4 * PIT - 4), d: [44, -74], t: "shard splits in two" },
  { k: "priv", a: P(PX + SW / 2, SY + SD / 2, PH), d: [26, -52], t: "private shard" },
  { k: "key", a: [KEY[0] + 26, KEY[1] - 4], d: [16, -26], t: "quantum-safe key · ML-DSA" },
];

/* the chain along the plate's front edge */
const CHAIN: B6[] = Array.from({ length: 20 }, (_, i) => [-64 + i * 19, 104, 12, 12, 0, 7]);

const ALL: V[] = [
  ...[PLATE].flatMap((b) => { const x = box(...b); return [P(x.x0, x.y0, x.z1), P(x.x1, x.y0, x.z0), P(x.x1, x.y1, x.z0), P(x.x0, x.y1, x.z0), P(x.x0, x.y0, x.z0)]; }),
  P(SX[2], SY, THR + 10), [KEY[0] - 36, KEY[1] - 30],
  ...LABS.map((l) => [l.a[0] + l.d[0] + l.t.length * LAB_FS * 0.62 + LAB_FS, l.a[1] + l.d[1] - LAB_FS] as V),
];
const VB = vbox(ALL, 14);

const Stack = ({ x, y, d, n, from = 0, cls = "" }: { x: number; y: number; d: number; n: number; from?: number; cls?: string }) => (
  <>{Array.from({ length: n - from }, (_, j) => <Blk key={j} b={chunk(x, y, d, from + j)} cls={`pa-c ${cls}`} />)}</>
);

export function HeroArt() {
  const [kx, ky] = KEY;
  return (
    <svg className="pa-iso" data-state="final" viewBox={VB.s} role="img" aria-label="NEAR Protocol drawn as a plate of shards: one shard splits in two, a private shard rises, and an account's key turns quantum-safe.">
      <path className="pa-floor" d={dots(-140, -60, 400, 190, 20, -18)} />
      <g className="pa-plate"><Blk b={PLATE} cls="pa-plate__b" /></g>

      {/* the account (far end) and its key, tethered */}
      <g className="pa-acct">
        <Blk b={ACCT} cls="pa-c pa-bd" />
        <path className="pa-teth" d={`M${f(kx)},${f(ky + 12)}L${f(ACCT_TOP[0])},${f(ACCT_TOP[1])}`} />
        <circle className="pa-halo" cx={f(kx)} cy={f(ky)} r="24" />
        <Key c={KEY} cls="pa-start" />
        <Key c={KEY} q />
      </g>

      {/* shards 1 and 2, each with its drop (a transaction falling in) */}
      {[0, 1].map((i) => (
        <g key={i}>
          <g className="pa-sh" data-i={i}><Stack x={SX[i]} y={SY} d={SD} n={COUNT[i]} cls="pa-bd" /></g>
          <g className="pa-drop" data-i={i}><Blk b={at(tops[i].cx, tops[i].cy, 9, 9, tops[i].z + 1, 9)} cls="pa-g" /></g>
        </g>
      ))}

      {/* shard 3: whole (it grows to the threshold), then its two halves */}
      <g className="pa-whole pa-start">
        <Stack x={SX[2]} y={SY} d={SD} n={4} cls="pa-bd" />
        <g className="pa-lift"><Stack x={SX[2]} y={SY} d={SD} n={5} from={4} cls="pa-bd" /><g className="pa-xtra"><Stack x={SX[2]} y={SY} d={SD} n={7} from={5} /></g></g>
      </g>
      <g className="pa-thr pa-start">
        <polygon points={faces(box(SX[2], SY, SW, SD, THR, 0)).top} />
        {([[SX[2], SY], [SX[2] + SW, SY], [SX[2] + SW, SY + SD], [SX[2], SY + SD]] as V[]).map(([x, y], i) => (
          <path key={i} d={`M${pts(P(x, y, 5 * PIT - 4))}L${pts(P(x, y, THR))}`} />
        ))}
      </g>
      <g className="pa-half pa-half--a"><Stack x={SX[2]} y={HALF_A_Y} d={HALF_D} n={4} /></g>
      <g className="pa-half pa-half--b"><Stack x={SX[2]} y={HALF_B_Y} d={HALF_D} n={4} /></g>

      <g className="pa-sh" data-i={3}><Stack x={SX[3]} y={SY} d={SD} n={COUNT[3]} cls="pa-bd" /></g>
      <g className="pa-drop" data-i={3}><Blk b={at(tops[2].cx, tops[2].cy, 9, 9, tops[2].z + 1, 9)} cls="pa-g" /></g>

      {/* the private shard: dark, its rows hidden; one disclosed (green) */}
      <g className="pa-priv">
        <Blk b={[PX, SY, SW, SD, 0, PH]} cls="pa-dk" />
        <g transform={onRight(PX + SW, SY + SD, PH)}>
          {[10, 24, 38].map((y) => <rect key={y} className="pa-priv__bar" x="8" y={y} width="34" height="7" />)}
          <rect className="pa-priv__win" x="8" y="24" width="34" height="7" />
        </g>
      </g>

      {/* the chain: blocks along the front edge (each lights as it is produced) */}
      <g className="pa-chain">{CHAIN.map((b, i) => <Blk key={i} b={b} cls="pa-blk pa-bd" />)}</g>

      {/* the labels */}
      <g className="pa-labs" aria-hidden="true">
        {LABS.map((l) => {
          const [ax, ay] = l.a, tx = ax + l.d[0], ty = ay + l.d[1];
          return (
            <g key={l.k} className={`pa-lab${l.start ? " pa-start" : ""}`} data-k={l.k}>
              <circle className="pa-lab__dot" cx={f(ax)} cy={f(ay)} r="2.2" />
              <path className="pa-lab__ln" d={`M${f(ax)},${f(ay)}L${f(tx)},${f(ty)}H${f(tx + 4)}`} />
              <text x={f(tx + 6)} y={f(ty + 2.6)} style={{ fontSize: LAB_FS }}>{l.t}</text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

/** for motion.ts: the drops' fall and the halves' offsets */
export const HERO_GEO = { DROP, SPLIT_OFF };
