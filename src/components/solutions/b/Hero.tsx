// Solutions B, the hero's drawing: NEAR at the centre (the token on its plinth), the five solutions round it as small stations on one dotted floor, each
// carrying its piece (payments: a stack of coins and a green note; agentic finance: two agents; cross-chain DeFi: three chains; treasury: a vault;
// confidential AI: the enclave, its chip inside), each named on the floor and joined to the centre by a route; green signals run the routes (motion.ts).
// Decorative: the headline and the sections below carry the meaning.
import { SOLUTIONS } from "../content";
import { P, tr, arc, at, along, dots, vbox, cornersOf, type V } from "./kit";
import { Slab, Stack, Token, Agent, Vault, Glass } from "./parts";

const R = 164, PLAT = 64, PZ = 10;
export const STATIONS = SOLUTIONS.items.map((s, k) => {
  const a = ((-135 + k * 72) * Math.PI) / 180;
  return { k: s.k, n: s.n, title: s.title, x: R * Math.cos(a), y: R * Math.sin(a) };
});
export const ROUTES = STATIONS.map((s) => arc([0, 0, 30], [s.x, s.y, PZ + 4], 52 + (s.y < 0 && s.x < 0 ? 24 : 0), 26));
const label = (s: (typeof STATIONS)[number]): V => {
  // the three back stations: their names above them; the two in front: below
  if (s.x + s.y < 0) return [P(s.x, s.y)[0], P(s.x - PLAT / 2, s.y - PLAT / 2)[1] - 62];
  return [P(s.x, s.y)[0], P(s.x + PLAT / 2, s.y + PLAT / 2)[1] + 24];
};
const BASE = at(0, 0, 96, 96, 0, 10);
const all: V[] = [...cornersOf(BASE), ...STATIONS.flatMap((s) => cornersOf(at(s.x, s.y, PLAT, PLAT, 0, 50))), ...ROUTES.flatMap((r) => r.ps),
  ...STATIONS.flatMap((s) => { const l = label(s); return [[l[0] - 100, l[1]], [l[0] + 100, l[1] - 12]] as V[]; })];
export const VB = vbox(all, 10);

function Piece({ k, x, y }: { k: string; x: number; y: number }) {
  switch (k) {
    case "payments":
      return <><Stack x={x - 12} y={y + 12} z={PZ} n={4} r={9} h={4} /><Slab b={at(x + 13, y - 13, 18, 18, PZ, 4)} tone="g" /><Slab b={at(x + 14, y - 14, 18, 18, PZ + 5, 4)} tone="g" /></>;
    case "agentic":
      return <><Agent x={x - 14} y={y - 14} s={14} ant={11} /><Agent x={x + 14} y={y + 14} s={14} ant={11} /></>;
    case "defi":
      return <>{[[-16, 22], [0, 34], [16, 16]].map(([d, h], j) => <Slab key={j} b={at(x + d - 6, y - d - 6, 13, 13, PZ, h)} tone={j === 1 ? "g" : "w"} />)}</>;
    case "treasury":
      return <Vault b={at(x, y, 36, 36, PZ, 32)} />;
    default: {
      const g = at(x, y, 38, 38, PZ, 38);
      return <><Glass.Back b={g} /><Slab b={at(x, y, 16, 16, PZ, 6)} tone="g" /><Slab b={at(x, y, 12, 12, PZ + 10, 4)} /><Glass.Front b={g} /></>;
    }
  }
}

export function HeroHub() {
  const order = STATIONS.map((s, i) => ({ s, i })).sort((a, b) => a.s.x + a.s.y - (b.s.x + b.s.y));
  const back = order.filter(({ s }) => s.x + s.y < 0), front = order.filter(({ s }) => s.x + s.y >= 0);
  const station = ({ s, i }: (typeof order)[number]) => (
    <g key={s.k} className="d-p hb-st" data-k={i}>
      <Slab b={at(s.x, s.y, PLAT, PLAT, 0, PZ)} />
      <Piece k={s.k} x={s.x} y={s.y} />
    </g>
  );
  return (
    <svg className="sb-svg hb" viewBox={VB.s} data-draw="self" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="hb-fade-g" cx="50%" cy="52%" r="56%"><stop offset="0.5" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <mask id="hb-fade" maskUnits="userSpaceOnUse" x={VB.x} y={VB.y} width={VB.w} height={VB.h}><rect x={VB.x} y={VB.y} width={VB.w} height={VB.h} fill="url(#hb-fade-g)" /></mask>
      </defs>
      <path className="sb-dots d-floor" d={dots(-260, -260, 260, 260, 20)} mask="url(#hb-fade)" />
      {back.map(station)}
      <g className="d-p">
        <Slab b={BASE} />
        <Slab b={at(0, 0, 46, 46, 10, 10)} />
        <Token x={0} y={0} z={20} r={18} h={8} />
      </g>
      {front.map(station)}
      <g className="sb-route d-o">{ROUTES.map((r, i) => <path key={i} d={r.d} />)}</g>
      <g className="sb-sigs hb-sigs d-o">{ROUTES.map((r, i) => <circle key={i} r="3.6" transform={tr(along(r.ps, 0.3 + i * 0.12))} />)}</g>
      <g className="hb-labs d-o">
        {STATIONS.map((s) => { const l = label(s); return <g key={s.k} className="hb-lab" transform={tr(l)}><text x="0" y="0" textAnchor="middle">{`${s.n} ${s.title}`}</text></g>; })}
      </g>
    </svg>
  );
}
