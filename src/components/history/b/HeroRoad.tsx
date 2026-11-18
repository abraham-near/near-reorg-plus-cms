// History B, the hero drawing: the road from 2017 to 2026. Ten stones, one a year, winding left to right and climbing as they go; the years that made
// NEAR carry their thing (the paper, the shards, the bridge, one account, the chip, the wallets) and the last one, now, is green, with its flag. A green
// signal hops the road from stone to stone (motion.ts). Built once on arrival, alive while on screen, leans to the pointer. Decorative: the headline and
// the timeline below carry the meaning.
import type { ReactNode } from "react";
import { P, f, vbox, arc, dots, onTop, Slab, Pawn, Sheet, Coin, cornersOf, type B6, type V } from "./draw";

const N = 10, STEP = 50;
type Stone = { yr: number; x: number; y: number; w: number; h: number };
export const STONES: Stone[] = Array.from({ length: N }, (_, i) => {
  const wob = 34 * Math.sin(i * 0.9 + 0.4), w = i === N - 1 ? 46 : 36;
  return { yr: 2017 + i, x: STEP * i + wob, y: -STEP * i + wob, w, h: 8 + i * 7 + (i === N - 1 ? 8 : 0) };
});
const top = (s: Stone, lift = 0): [number, number, number] => [s.x + s.w / 2, s.y + s.w / 2, s.h + lift];
/** the hops between stones (the signal's path): one arc per gap, and all their points in order */
export const HOPS = STONES.slice(0, -1).map((s, i) => arc(top(s, 3), top(STONES[i + 1], 3), 22));
export const ROAD: V[] = HOPS.flatMap((h, i) => (i ? h.ps.slice(1) : h.ps));

const GROUND = { x0: -70, x1: 520, y0: -500, y1: 110 };
const labelAt = (s: Stone): V => { const p = P(s.x + s.w, s.y + s.w, 0); return [p[0], p[1] + 20]; };
export const VB = vbox([...STONES.flatMap((s) => cornersOf([s.x, s.y, s.w, s.w, 0, s.h])), ...STONES.map(labelAt), ...ROAD, P(STONES[N - 1].x, STONES[N - 1].y + 40, STONES[N - 1].h + 70)], 18);

/** what stands on each year's stone */
function Things({ s, i }: { s: Stone; i: number }) {
  const z = s.h, x = s.x, y = s.y;
  const out: ReactNode[] = [];
  if (i === 0) {   // the paper
    const sh: B6 = [x + 6, y + 5, 24, 27, z, 1.5];
    out.push(<Sheet key="s" b={sh} />, <g key="i" className="hb-ink d-o" transform={onTop(sh[0], sh[1], z + 1.5)}><path className="hb-ink__t" d="M4,5h12" /><path d="M4,10h16M4,14h13M4,18h16M4,22h9" /></g>);
  }
  if (i === 1) {   // the shards
    [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([a, b], k) => out.push(<Slab key={k} b={[x + 5 + a * 15, y + 5 + b * 15, 11, 11, z, 6 + (a + b) * 4]} />));
  }
  if (i === 4) {   // the bridge: two towers and the deck between them, a coin crossing
    out.push(<Slab key="a" b={[x + 3, y + 12, 10, 12, z, 14]} />, <Slab key="d" b={[x + 13, y + 15, 10, 6, z + 11, 3]} />, <Slab key="b" b={[x + 23, y + 12, 10, 12, z, 14]} />,
      <g key="c" className="d-p"><Coin x={x + 18} y={y + 18} z={z + 14} r={3.4} h={2} g /></g>);
  }
  if (i === 6) out.push(<Pawn key="p" at={P(x + 18, y + 18, z)} g />);   // one account
  if (i === 7) out.push(<Slab key="c" b={[x + 9, y + 9, 18, 18, z, 5]} />);   // the chip
  if (i === 8) out.push(<Pawn key="a" at={P(x + 11, y + 13, z)} />, <Pawn key="b" at={P(x + 25, y + 23, z)} />);   // wallets, people
  if (i === N - 1) {   // now: the flag
    const a = P(x + 8, y + s.w - 6, z), b = P(x + 8, y + s.w - 6, z + 64);
    const cl = [P(x + 8, y + s.w - 6, z + 64), P(x + 38, y + s.w - 6, z + 64), P(x + 32, y + s.w - 6, z + 56), P(x + 38, y + s.w - 6, z + 48), P(x + 8, y + s.w - 6, z + 48)];
    out.push(<Pawn key="p" at={P(x + 30, y + 16, z)} />, (
      <g key="f" className="hb-flag d-o">
        <path className="hb-flag__pole" d={`M${f(a[0])},${f(a[1])}V${f(b[1])}`} />
        <path className="hb-flag__cloth" d={"M" + cl.map((p) => `${f(p[0])},${f(p[1])}`).join("L") + "Z"} />
      </g>
    ));
  }
  return <>{out}</>;
}

export function HeroRoad() {
  return (
    <div className="hb-hero__art" aria-hidden="true">
      <div className="hb-hero__cam">
        <svg className="hb-svg hb-road" viewBox={VB.s} data-draw="self" focusable="false">
          <defs>
            <radialGradient id="hb-fade" cx="50%" cy="50%" r="55%"><stop offset="0.45" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
            <mask id="hb-mask" maskUnits="userSpaceOnUse" x={VB.x} y={VB.y} width={VB.w} height={VB.h}><rect x={VB.x} y={VB.y} width={VB.w} height={VB.h} fill="url(#hb-fade)" /></mask>
          </defs>
          <path className="hb-dots d-floor" d={dots(GROUND.x0, GROUND.y0, GROUND.x1, GROUND.y1, 20)} mask="url(#hb-mask)" />
          {STONES.map((s, i) => (
            <g key={s.yr} className={`hb-stone${i === N - 1 ? " hb-stone--now" : ""}`}>
              <Slab b={[s.x, s.y, s.w, s.w, 0, s.h]} tone={i === N - 1 ? "g" : "w"} />
              <Things s={s} i={i} />
            </g>
          ))}
          <g className="hb-hops d-o">{HOPS.map((h, i) => <path key={i} d={h.d} />)}</g>
          <g className="hb-years d-o">
            {STONES.map((s, i) => { const p = labelAt(s); return <text key={s.yr} className={i === N - 1 ? "is-now" : i % 3 ? "is-mid" : ""} x={f(p[0])} y={f(p[1])} textAnchor="middle">{i === N - 1 ? `${s.yr} · Now` : s.yr}</text>; })}
          </g>
          <g className="d-o"><circle className="hb-road__sig" r="4.6" cx="0" cy="0" transform={`translate(${f(ROAD[ROAD.length - 1][0])} ${f(ROAD[ROAD.length - 1][1])})`} /></g>
        </svg>
      </div>
    </div>
  );
}
