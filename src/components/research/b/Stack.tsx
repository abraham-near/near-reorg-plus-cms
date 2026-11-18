// Research B, the hero's drawing: the four papers as a stack of bound documents on a dotted floor, the first (the White Paper) on top, each with an
// index tab out of its right side and its number and short name ruled off to the right; the top one's cover carries the mark, a heading and its text,
// and one loose sheet has lifted off it (the page being read), its shadow on the cover below. It builds as the page opens (motion.ts, data-draw="self"),
// then the sheet floats. Decorative: the heading and the cards carry the meaning.
import { PAPERS } from "../content";
import { P, f, dots, line, onTop, pts, vbox, cornersOf, type B6, type V } from "./kit";
import { Slab, Text } from "./parts";

const W = 96, D = 132, H = 7, STEP = 10;
/** each document's nudge off the stack's line, bottom to top: a stack set down by hand */
const NUDGE: [number, number][] = [[0, 0], [2, -5], [-2, 4], [1, -2]];
const n = PAPERS.length;
/** stack position s (0: the floor) holds paper n - 1 - s: the first paper on top */
const docs = NUDGE.slice(0, n).map(([dx, dy], s): { b: B6; i: number } => ({ b: [dx, dy, W, D, s * STEP, H], i: n - 1 - s }));
const tabY = (i: number) => 14 + i * 28;
const tab = (s: number): B6 => { const [x, y, w, , z] = docs[s].b; return [x + w - 3, y + tabY(docs[s].i), 13, 20, z + 2.5, 2]; };
const TIP = (s: number): V => { const t = tab(s); return P(t[0] + t[2], t[1] + t[3] / 2, t[4] + t[5]); };
const COL = 132;   // the labels' column (screen x)
const TOP = n * STEP - (STEP - H);   // the top cover's height
const SHEET: B6 = [14, -9, 82, 114, TOP + 32, 1];
const top = docs[n - 1].b;

export const STACK_PS: V[] = [
  ...docs.flatMap((d) => cornersOf(d.b)), ...docs.map((_, s) => TIP(s)), ...cornersOf(SHEET),
  [COL + 172, TIP(n - 1)[1] - 10], [COL + 172, TIP(0)[1] + 10], P(-12, D + 12), P(W + 12, -12),
];

export function PaperStack({ cls = "" }: { cls?: string }) {
  const vb = vbox(STACK_PS, 10);
  const [sx, sy, sw, sd, sz] = SHEET;
  return (
    <svg className={`rb-svg rb-stack ${cls}`} viewBox={vb.s} data-draw="self" aria-hidden="true" focusable="false">
      <path className="rb-dots d-floor" d={dots(-12, -12, W + 12, D + 12, 12)} />
      {docs.map((d, s) => (
        <g key={s} className="d-p">
          <Slab b={d.b} />
          <Slab b={tab(s)} tone={d.i === 0 ? "g" : "w"} />
        </g>
      ))}
      {/* the top cover: the mark, a heading and the text */}
      <g className="d-o">
        <rect className="rb-mark" width="10" height="10" transform={`${onTop(top[0] + 8, top[1] + 9, TOP)}`} />
        <Text x={top[0] + 9} y={top[1] + 32} z={TOP} w={76} rows={15} gap={6} head={2} />
      </g>
      {/* each paper's number and short name, ruled off its tab */}
      <g className="rb-labs d-o">
        {docs.map((d, s) => {
          const [x, y] = TIP(s), p = PAPERS[d.i];
          return (
            <g key={s} className={`rb-lab${d.i === 0 ? " is-on" : ""}`}>
              <path d={line([x + 4, y], [COL, y])} />
              <circle cx={f(COL + 4)} cy={f(y)} r="3" />
              <text x={f(COL + 14)} y={f(y + 4)}>{p.n} {p.short}</text>
            </g>
          );
        })}
      </g>
      {/* the loose sheet, lifted off the cover: its shadow stays on the cover, the sheet floats (motion.ts) */}
      <polygon className="rb-shadow d-o" points={pts(P(sx, Math.max(sy + 6, top[1]), TOP), P(sx + sw, Math.max(sy + 6, top[1]), TOP), P(sx + sw, Math.min(sy + sd + 6, top[1] + D), TOP), P(sx, Math.min(sy + sd + 6, top[1] + D), TOP))} />
      <g className="rb-sheet d-p">
        <Slab b={SHEET} />
        <Text x={sx + 9} y={sy + 12} z={sz + 1} w={62} rows={16} gap={6} head={1} />
      </g>
    </svg>
  );
}
