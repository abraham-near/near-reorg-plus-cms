// Economics B, "One asset, holding it all together": the NEAR token at the centre on its plinth, its three jobs drawn round it and tied to it by lines
// on the floor that signals run both ways (motion.ts):
//   1 settlement (back): a ledger slab with coins settled on it in stacks;
//   2 unit of account (left): a service, a box with its meter on the face and a coin on top (priced and paid in NEAR);
//   3 coordination (right): a green plinth with people standing round it (what secures the network and what governance runs on).
// Pointing at a job in the list beside it lights its piece and its line (data-hl on the figure). Decorative: the list carries the meaning.
import type { ReactNode } from "react";
import { P, f, tr, line, at, dots, vbox, cornersOf, onLeft, type V } from "./kit";
import { Slab, Coin, Stack, Token, Pawn } from "./parts";

// the jobs' places (world): back, left, right on screen
export const SPOTS: [number, number][] = [[-122, -122], [-100, 160], [160, -100]];
const T = { r: 44, h: 22, base: 14 };
export const LINES = SPOTS.map(([x, y]) => { const k = Math.hypot(x, y), a = (T.r + 22) / k, b = (k - 40) / k; return [P(x * a, y * a), P(x * b, y * b)] as [V, V]; });

function Job({ k }: { k: number }): ReactNode {
  const [cx, cy] = SPOTS[k];
  if (k === 0) return <>
    <Slab b={at(cx, cy, 64, 48, 0, 9)} />
    <Stack x={cx - 16} y={cy - 8} z={9} n={2} r={8} h={4} />
    <Stack x={cx + 4} y={cy - 12} z={9} n={4} r={8} h={4} g={3} />
    <Stack x={cx - 4} y={cy + 12} z={9} n={3} r={8} h={4} />
  </>;
  if (k === 1) return <>
    <Slab b={at(cx, cy, 44, 38, 0, 36)} />
    <g className="rl-meter" transform={onLeft(cx - 22, cy + 19, 36)}>
      <rect x="8" y="8" width="28" height="12" />
      <path d="M12,14h12" className="is-g" />
      <path d="M8,26h28M8,30h20" />
    </g>
    <Coin x={cx} y={cy} z={36} r={10} h={4} g />
  </>;
  const ring = Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * Math.PI * 2 + 0.4; return [cx + 34 * Math.cos(a), cy + 34 * Math.sin(a)] as [number, number]; }).sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  const back = ring.filter(([x, y]) => x + y < cx + cy), front = ring.filter(([x, y]) => x + y >= cx + cy);
  return <>
    {back.map(([x, y], i) => <Pawn key={`b${i}`} at={P(x, y)} />)}
    <Slab b={at(cx, cy, 30, 30, 0, 16)} tone="g" />
    {front.map(([x, y], i) => <Pawn key={`f${i}`} at={P(x, y)} g={i === 1} />)}
  </>;
}

const all: V[] = [...cornersOf(at(0, 0, 112, 112, 0, T.base)), P(0, 0, T.base + T.h + 34), ...SPOTS.flatMap(([x, y]) => [...cornersOf(at(x, y, 76, 76, 0, 40))])];
export const VB = vbox(all, 14);

export function Roles() {
  return (
    <svg className="eb-svg rl" viewBox={VB.s} data-draw="self" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="rl-fade" cx="50%" cy="52%" r="52%"><stop offset="0.45" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <mask id="rl-mask" maskUnits="userSpaceOnUse" x={VB.x} y={VB.y} width={VB.w} height={VB.h}><rect x={VB.x} y={VB.y} width={VB.w} height={VB.h} fill="url(#rl-fade)" /></mask>
      </defs>
      <path className="eb-dots d-floor" d={dots(-240, -240, 240, 240, 20)} mask="url(#rl-mask)" />
      <g className="rl-lines d-o">{LINES.map(([a, b], i) => <path key={i} className="rl-line" data-k={i} d={line(a, b)} />)}</g>
      <g className="rl-sigs d-o">{LINES.map(([a], i) => <circle key={i} r="3.4" transform={tr(a)} />)}</g>
      <g className="d-p rl-role" data-k="0"><Job k={0} /></g>
      <g className="d-p">
        <Slab b={at(0, 0, 112, 112, 0, T.base)} />
        <Token z={T.base} r={T.r} h={T.h} />
      </g>
      {[1, 2].map((k) => <g key={k} className="d-p rl-role" data-k={k}><Job k={k} /></g>)}
      <g className="rl-nums d-o">
        {SPOTS.map(([x, y], k) => { const p = P(x, y, k === 0 ? 46 : k === 1 ? 64 : 50); return <text key={k} className="rl-num" data-k={k} x={f(p[0])} y={f(p[1])} textAnchor="middle">{`0${k + 1}`}</text>; })}
      </g>
    </svg>
  );
}
