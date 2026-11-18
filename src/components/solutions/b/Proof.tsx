// Solutions B, the proof strip's small drawings, each on its plinth (one per cell of the ruled row, after Economics B's Plinths.tsx):
//   volume: three stacks of coins rising, the tallest topped green; chains: five chains of different heights, one green line along their tops (one
//   integration); assets: a tray of many small coins and notes, one green; fees: a ghost of a full coin and the sliver that is the fee, green; years:
//   five strata, one a year, the top one green. Each builds once as it arrives (kit.ts mountDraw). Decorative: the figure and label carry the meaning.
import type { ReactNode } from "react";
import { P, f, line, at, coin, vbox, cornersOf, type B6, type V } from "./kit";
import { Slab, Stack, Coin } from "./parts";

function Svg({ ps, children }: { ps: V[]; children: ReactNode }) {
  const vb = vbox(ps, 6);
  return <svg className="sb-svg sb-plinth" viewBox={vb.s} data-draw="" aria-hidden="true" focusable="false">{children}</svg>;
}

function Volume() {
  const base: B6 = [0, 0, 64, 40, 0, 8], cols: [number, number, number][] = [[14, 20, 3], [32, 20, 5], [50, 20, 8]];
  return (
    <Svg ps={[...cornersOf(base), P(50, 20, 8 + 8 * 4 + 6), P(14, 20, 30)]}>
      <Slab b={base} />
      <g className="d-p">{cols.map(([x, y, n], i) => <Stack key={i} x={x} y={y} z={8} n={n} r={7.5} h={4} g={i === 2 ? n - 1 : -1} />)}</g>
    </Svg>
  );
}

function Chains() {
  const base: B6 = [0, 0, 100, 26, 0, 8], hs = [18, 30, 14, 36, 22];
  const xs = hs.map((_, i) => 10 + i * 20);
  const tops = xs.map((x, i) => P(x, 13, 8 + hs[i] + 6));
  return (
    <Svg ps={[...cornersOf(base), ...tops.map((p) => [p[0], p[1] - 4] as V)]}>
      <Slab b={base} />
      <g className="d-p">{xs.map((x, i) => <Slab key={i} b={at(x, 13, 10, 10, 8, hs[i])} />)}</g>
      <path className="sb-link d-o" d={line(...tops)} />
      <g className="d-o">{tops.map((p, i) => <circle key={i} className={`sb-node${i === 0 ? " is-g" : ""}`} cx={f(p[0])} cy={f(p[1])} r="2.6" />)}</g>
    </Svg>
  );
}

function Assets() {
  const base: B6 = [0, 0, 64, 64, 0, 8], cells: [number, number][] = [];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) cells.push([10 + i * 14.6, 10 + j * 14.6]);
  return (
    <Svg ps={[...cornersOf(base), P(10, 10, 20)]}>
      <Slab b={base} />
      <g className="d-p">
        {cells.map(([x, y], i) => (i % 3 === 1
          ? <Slab key={i} b={at(x, y, 9, 9, 8, 3)} tone={i === 10 ? "g" : "w"} edges={false} />
          : <Coin key={i} x={x} y={y} z={8} r={5} h={2.6} g={i === 9} />))}
      </g>
    </Svg>
  );
}

function Fees() {
  const base: B6 = [0, 0, 60, 60, 0, 8], c = coin(30, 30, 8, 22, 7), sl = coin(30, 30, 8, 4.5, 2.4);
  return (
    <Svg ps={[...cornersOf(base), [c.cx - c.rx, c.cy - c.ry - 4], [c.cx + c.rx, c.cy]]}>
      <Slab b={base} />
      <g className="d-o">
        <path className="sb-ghost" d={c.side} />
        <ellipse className="sb-ghost" cx={f(c.cx)} cy={f(c.cy)} rx={f(c.rx)} ry={f(c.ry)} />
      </g>
      <g className="d-p">
        <path className="cn__s" d={sl.side} />
        <ellipse className="cn__t sb-fee" cx={f(sl.cx)} cy={f(sl.cy)} rx={f(sl.rx)} ry={f(sl.ry)} />
      </g>
    </Svg>
  );
}

function Years() {
  const n = 5, h = 6;
  const layers: B6[] = Array.from({ length: n }, (_, i) => at(30, 30, 64 - i * 9, 64 - i * 9, i * (h + 1.5), h));
  return (
    <Svg ps={layers.flatMap(cornersOf)}>
      {layers.map((b, i) => <g key={i} className={i ? "d-p" : ""}><Slab b={b} tone={i === n - 1 ? "g" : "w"} /></g>)}
    </Svg>
  );
}

/** the drawings in the order of content.ts PROOF */
export const PROOF_ART = [Volume, Chains, Assets, Fees, Years];
