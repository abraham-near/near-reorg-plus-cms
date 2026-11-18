// Economics B, "Real products. Real revenue.": the two engines feeding the loop, on one dotted ground. On the left NEAR Intents: a hub with its green
// router, its routes arcing out to blocks of every height (the chains it settles across); on the right NEAR AI: a rack with its lamps and three agents
// tethered to it, each with its antenna. From each engine a pipe arcs through the air into the loop (a small turntable with the token at its centre);
// green signals run the routes and the pipes (motion.ts). Decorative: the two cells under it carry the meaning.
import { SOURCES } from "../content";
import { P, f, tr, arc, at, coin, dots, vbox, cornersOf, onLeft, type B6, type V } from "./kit";
import { Slab, Coin, Token } from "./parts";

const IN: [number, number] = [-190, 110], AI: [number, number] = [110, -190], LP: [number, number] = [96, 96];
// the chains round the hub: offset from the hub, side, height
const CHAINS: [number, number, number, number][] = [[-84, -14, 20, 30], [-50, -74, 18, 18], [14, -100, 22, 42], [-96, 52, 16, 22], [-20, 96, 20, 34], [-120, -60, 14, 14], [58, -60, 14, 24]];
const AGENTS: [number, number][] = [[64, 14], [22, -66], [78, -54]];
const HUB = { w: 64, h: 12 }, ROUTER = { w: 26, h: 18 };
const RACK: B6 = at(AI[0], AI[1], 30, 26, 10, 64);

export const ROUTES = CHAINS.map(([dx, dy, , h]) => arc([IN[0], IN[1], HUB.h + ROUTER.h], [IN[0] + dx, IN[1] + dy, h], 26 + Math.hypot(dx, dy) * 0.25, 18));
export const PIPES = [
  arc([IN[0], IN[1], HUB.h + ROUTER.h + 4], [LP[0], LP[1], 20], 84, 28),
  arc([AI[0], AI[1], 10 + 64], [LP[0], LP[1], 20], 46, 28),
];
const TETHERS = AGENTS.map(([dx, dy]) => [P(AI[0] + dx, AI[1] + dy, 0), P(AI[0], AI[1], 10)] as [V, V]);

const LR = 72, LT = 46;   // the loop: its disc, its track
const DISC = coin(LP[0], LP[1], -10, LR, 10);
const all: V[] = [...ROUTES.flatMap((r) => r.ps), ...PIPES.flatMap((p) => p.ps), ...CHAINS.flatMap(([dx, dy, s, h]) => cornersOf(at(IN[0] + dx, IN[1] + dy, s, s, 0, h))),
  ...cornersOf(RACK), ...AGENTS.map(([dx, dy]) => P(AI[0] + dx, AI[1] + dy, 30)), [DISC.cx - DISC.rx, DISC.cy + DISC.ry + 10], [DISC.cx + DISC.rx, DISC.cy], P(IN[0] - 40, IN[1] + 40), P(AI[0] + 110, AI[1] + 10)];
// the names on the drawing (the products' own names, from content.ts)
const LABELS = [{ t: SOURCES.items[0].name, p: P(IN[0] + 40, IN[1] + 62, 0) }, { t: SOURCES.items[1].name, p: P(AI[0] + 46, AI[1] + 66, 0) }];
export const VB = vbox([...all, ...LABELS.map((l) => [l.p[0] + 110, l.p[1]] as V)], 12);

export function Engines() {
  const chains = CHAINS.map(([dx, dy, s, h], i) => ({ key: IN[0] + dx + IN[1] + dy, node: <Slab key={`c${i}`} b={at(IN[0] + dx, IN[1] + dy, s, s, 0, h)} /> }));
  const agents = AGENTS.map(([dx, dy], i) => {
    const x = AI[0] + dx, y = AI[1] + dy, top = P(x, y, 12), tip = P(x, y, 24);
    return {
      key: x + y, node: (
        <g key={`a${i}`} className="d-p">
          <Slab b={at(x, y, 12, 12, 0, 12)} />
          <path className="en-ant" d={`M${f(top[0])},${f(top[1])}V${f(tip[1])}`} />
          <circle className="en-ant__dot" cx={f(tip[0])} cy={f(tip[1])} r="2.6" />
        </g>
      ),
    };
  });
  const back = [...chains, ...agents].sort((a, b) => a.key - b.key);
  return (
    <svg className="eb-svg en" viewBox={VB.s} data-draw="self" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="en-fade" cx="50%" cy="50%" r="55%"><stop offset="0.5" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <mask id="en-mask" maskUnits="userSpaceOnUse" x={VB.x} y={VB.y} width={VB.w} height={VB.h}><rect x={VB.x} y={VB.y} width={VB.w} height={VB.h} fill="url(#en-fade)" /></mask>
      </defs>
      <path className="eb-dots d-floor" d={dots(-340, -340, 260, 260, 20)} mask="url(#en-mask)" />
      <g className="en-tethers d-o">{TETHERS.map(([a, b], i) => <path key={i} d={`M${f(a[0])},${f(a[1])}L${f(b[0])},${f(b[1])}`} />)}</g>

      {/* NEAR Intents: the hub and its router; NEAR AI: the rack */}
      <g className="d-p">
        <Slab b={at(IN[0], IN[1], HUB.w, HUB.w, 0, HUB.h)} />
        <Slab b={at(IN[0], IN[1], ROUTER.w, ROUTER.w, HUB.h, ROUTER.h)} tone="g" />
      </g>
      <g className="d-p">
        <Slab b={at(AI[0], AI[1], 50, 50, 0, 10)} />
        <Slab b={RACK} />
        <g className="en-slots" transform={onLeft(RACK[0], RACK[1] + RACK[3], RACK[4] + RACK[5])}>
          {[0, 1, 2, 3, 4].map((k) => <g key={k}><path d={`M5,${8 + k * 11}h15`} /><circle cx="25" cy={8 + k * 11} r="1.8" className={k === 1 ? "is-g" : ""} /></g>)}
        </g>
      </g>
      {back.map((b) => b.node)}

      <g className="en-routes d-o">{ROUTES.map((r, i) => <path key={i} d={r.d} />)}</g>

      {/* the loop the engines feed: a small turntable, its track, the token */}
      <g className="d-f en-disc"><path className="fw-disc__s" d={DISC.side} /><ellipse className="fw-disc__t" cx={f(DISC.cx)} cy={f(DISC.cy)} rx={f(DISC.rx)} ry={f(DISC.ry)} /></g>
      <ellipse className="en-track d-o" cx={f(P(LP[0], LP[1])[0])} cy={f(P(LP[0], LP[1])[1])} rx={f(LT * Math.SQRT2 * 0.866)} ry={f(LT * Math.SQRT2 * 0.5)} />
      <g className="en-lcoins d-o">{[0, 1, 2].map((i) => <g key={i} className="en-lcoin" transform={tr(loopCoin(i, 0))}><Coin r={6} h={3} g /></g>)}</g>
      <g className="d-p"><Token x={LP[0]} y={LP[1]} r={25} h={13} /></g>
      <g className="en-pipes d-o">{PIPES.map((p, i) => <path key={i} d={p.d} />)}</g>
      <g className="en-labs d-o">
        {LABELS.map((l) => <g key={l.t} className="en-lab" transform={tr(l.p)}><circle cx="0" cy="-4" r="3" /><text x="10" y="0">{l.t}</text></g>)}
      </g>
      <g className="en-sigs d-o">
        {[...ROUTES, ...PIPES, ...PIPES].map((r, i) => { const p = r.ps[Math.round((r.ps.length - 1) * ((0.2 + i * 0.37) % 1))]; return <circle key={i} r={i >= ROUTES.length ? 4 : 3} transform={tr(p)} />; })}
      </g>
    </svg>
  );
}
/** the little coins on the loop's track: their places at clock t */
export const loopCoin = (i: number, t: number): V => { const a = t * 0.9 + (i / 3) * Math.PI * 2; return P(LP[0] + LT * Math.cos(a), LP[1] + LT * Math.sin(a)); };
