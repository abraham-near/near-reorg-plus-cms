// Analytics D, the core stats' small drawings, one per figure (in the stats row): fees as a stack of coins, the confidential TVL as coins under glass,
// the all-time volume as a climbing stair, the shards as a field of tiles, the price as a coin on a step. Decorative: the label beside each says what it is.
import type { ReactNode } from "react";
import { P, vbox, box, corners, line, type V } from "./kit";
import { Slab, Coin, type B6 } from "./parts";

const cornersOf = (b: B6) => corners(box(...b));
function Svg({ pts, children }: { pts: V[]; children: ReactNode }) {
  const vb = vbox(pts, 5);
  return <svg className="ad-svg ad-glyph" viewBox={vb.s} data-draw="" aria-hidden="true" focusable="false">{children}</svg>;
}
function Fees() {
  const st: [number, number, number][] = [[14, 14, 3], [34, 14, 5], [24, 34, 4]];
  return (
    <Svg pts={[P(0, 0), P(48, 0), P(0, 48), P(48, 48), P(34, 14, 30)]}>
      <g className="d-p">{st.map(([x, y, n], s) => <g key={s}>{Array.from({ length: n }, (_, k) => <Coin key={k} x={x} y={y} z={k * 5} r={9} h={5} g={s === 1 && k === n - 1} />)}</g>)}</g>
    </Svg>
  );
}
function Tvl() {
  const g: B6 = [0, 0, 44, 44, 0, 34];
  const bx = box(...g);
  return (
    <Svg pts={cornersOf(g)}>
      <g className="d-p">{[[14, 14, 2], [30, 16, 3], [18, 30, 1]].map(([x, y, n], s) => <g key={s}>{Array.from({ length: n }, (_, k) => <Coin key={k} x={x} y={y} z={k * 5} r={7} h={5} g={s === 1 && k === n - 1} />)}</g>)}</g>
      <path className="ad-glass d-e" d={line(P(bx.x0, bx.y1, bx.z1), P(bx.x1, bx.y1, bx.z1), P(bx.x1, bx.y0, bx.z1), P(bx.x0, bx.y0, bx.z1), P(bx.x0, bx.y1, bx.z1), P(bx.x0, bx.y1, 0), P(bx.x1, bx.y1, 0), P(bx.x1, bx.y0, 0), P(bx.x1, bx.y0, bx.z1)) + line(P(bx.x1, bx.y1, bx.z1), P(bx.x1, bx.y1, 0))} pathLength={1} />
    </Svg>
  );
}
function Volume() {
  const s: B6[] = [[0, 30, 22, 22, 0, 12], [0, 6, 22, 22, 0, 24], [0, -18, 22, 22, 0, 38]];
  return <Svg pts={s.flatMap(cornersOf)}>{s.slice().reverse().map((b, i) => <Slab key={i} b={b} tone={i === 0 ? "g" : "w"} />)}</Svg>;
}
function Shards() {
  const t: B6[] = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) t.push([i * 17, j * 17, 13, 13, 0, i === 1 && j === 1 ? 14 : 6]);
  return <Svg pts={t.flatMap(cornersOf)}>{t.sort((a, b) => a[0] + a[1] - (b[0] + b[1])).map((b, k) => <Slab key={k} b={b} tone={b[5] > 10 ? "g" : "w"} edges={false} />)}</Svg>;
}
function Price() {
  const s: B6 = [0, 0, 40, 40, 0, 10];
  return (
    <Svg pts={[...cornersOf(s), P(20, 20, 34)]}>
      <Slab b={s} />
      <g className="d-p"><Coin x={20} y={20} z={10} r={12} h={6} g /></g>
      <path className="ad-tick d-o" d={line(P(20, 20, 22), P(20, 20, 34))} />
    </Svg>
  );
}
export const STAT_GLYPHS: Record<string, () => ReactNode> = { fees: Fees, tvl: Tvl, volume: Volume, shards: Shards, price: Price };
