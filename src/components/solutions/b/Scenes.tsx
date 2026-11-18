// Solutions B, the five solutions' drawings (one per block of "What the world is building on NEAR"), each on its own dotted floor:
//   payments: two chain blocks and NEAR between them; a coin leaves one, crosses NEAR and lands on the other as a different currency (a green note);
//   agentic finance: four agents round a settlement plate, trading along arcs, and settling into the plate;
//   cross-chain DeFi: five chains (columns of blocks) and four solvers before them; a swap arcs from the first chain to the last, the solvers bid on
//     it and one fills it (the winner turns green, a different one each time);
//   treasury: a vault between two stacks; coins move through it, one by one, until the stacks have traded places, then back;
//   confidential AI: the enclave (a glass box, a padlock on its face, the model inside on its green chip), the host locked out (its probe stops at the
//     glass) and an agent talking to the model.
// Each builds once as it arrives (kit.ts mountDraw), then lives while it is on screen: `LIVE[k](svg)` gives the tick (motion.ts). The markup is the
// finished, still frame (first paint, reduced motion). Decorative: the text beside each carries the meaning.
import type { ReactNode } from "react";
import { P, f, tr, arc, at, along, coin, dots, vbox, cornersOf, onTop, onLeft, onRight, line, clamp01, type B6, type V } from "./kit";
import { Slab, Coin, Stack, Token, Agent, Vault, Glass, Padlock, lamp } from "./parts";

type Tick = (t: number) => void;
const $$ = <T extends Element>(el: ParentNode, s: string) => [...el.querySelectorAll<T>(s)];
/** a fade at both ends of a run along a path */
export const env = (u: number, k = 8) => clamp01(Math.min(u * k, (1 - u) * k));
const cut = (B: B6) => cornersOf(B);

/** a drawing's svg: its dotted floor faded at the edges (a mask the size of its viewBox), then its pieces */
function Scene({ k, ps, floor, m = 14, children, cls = "" }: { k: string; ps: V[]; floor: [number, number, number, number]; m?: number; children: ReactNode; cls?: string }) {
  const vb = vbox(ps, m), id = `sb-fade-${k}`;
  return (
    <svg className={`sb-svg sb-scene sb-scene--${k} ${cls}`} viewBox={vb.s} data-draw="" data-scene={k} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${id}-g`} cx="50%" cy="55%" r="58%"><stop offset="0.45" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <mask id={id} maskUnits="userSpaceOnUse" x={vb.x} y={vb.y} width={vb.w} height={vb.h}><rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill={`url(#${id}-g)`} /></mask>
      </defs>
      <path className="sb-dots d-floor" d={dots(...floor, 20)} mask={`url(#${id})`} />
      {children}
    </svg>
  );
}
const Sig = ({ p, r = 3.4, cls = "" }: { p: V; r?: number; cls?: string }) => <circle className={cls} r={r} transform={tr(p)} />;

/* ───────────────────────── 01 · payments ───────────────────────── */
const PA = { A: [-86, 86] as [number, number], B: [86, -86] as [number, number], H: 34 };
const PA_A = at(PA.A[0], PA.A[1], 48, 48, 0, PA.H), PA_B = at(PA.B[0], PA.B[1], 48, 48, 0, PA.H), PA_HUB = at(0, 0, 40, 40, 0, 10);
const PA_ARCS = [arc([PA.A[0], PA.A[1], PA.H + 12], [0, 0, 18], 44, 26), arc([0, 0, 18], [PA.B[0], PA.B[1], PA.H + 10], 44, 26)];
const NOTE: B6 = [-8, -8, 16, 16, 0, 4];
function Payments() {
  return (
    <Scene k="payments" ps={[...cut(PA_A), ...cut(PA_B), ...cut(PA_HUB), ...PA_ARCS.flatMap((a) => a.ps)]} floor={[-150, -150, 150, 150]}>
      <g className="d-p"><Slab b={PA_A} /><Stack x={PA.A[0]} y={PA.A[1]} z={PA.H} n={3} r={10} h={4} /></g>
      <g className="d-p"><Slab b={PA_HUB} /><Token x={0} y={0} z={10} r={13} h={6} /></g>
      <g className="d-p">
        <Slab b={PA_B} />
        <Slab b={at(PA.B[0], PA.B[1], 20, 20, PA.H, 4)} tone="g" />
        <Slab b={at(PA.B[0] + 1, PA.B[1] - 1, 20, 20, PA.H + 5, 4)} tone="g" />
      </g>
      <g className="sb-route d-o">{PA_ARCS.map((a, i) => <path key={i} d={a.d} />)}</g>
      <g className="d-o">
        <g className="pa-coin" transform={tr(along(PA_ARCS[0].ps, 0.55))}><Coin r={8} h={4} /></g>
        <g className="pa-note" transform={tr(along(PA_ARCS[1].ps, 0.5))} style={{ opacity: 0 }}><Slab b={NOTE} tone="g" /></g>
      </g>
    </Scene>
  );
}
function livePayments(svg: SVGSVGElement): Tick {
  const c = svg.querySelector<SVGGElement>(".pa-coin")!, n = svg.querySelector<SVGGElement>(".pa-note")!;
  return (t) => {
    // 0–0.44: the coin to NEAR; 0.44–0.56: it turns; 0.56–1: the note to the other chain
    const u = (t / 3.4) % 1;
    const a = clamp01(u / 0.44), b = clamp01((u - 0.56) / 0.44);
    c.setAttribute("transform", tr(along(PA_ARCS[0].ps, a)));
    n.setAttribute("transform", tr(along(PA_ARCS[1].ps, b)));
    c.style.opacity = f(u < 0.5 ? Math.min(1, a * 8) : 0);
    n.style.opacity = f(u < 0.5 ? 0 : env(b < 0.001 ? 0.5 : b, 10));
  };
}

/* ───────────────────────── 02 · agentic finance ───────────────────────── */
const AG: [number, number][] = [[-56, -56], [56, -56], [56, 56], [-56, 56]];   // back, right, front, left
const AG_S = 16, AG_ANT = 12;
const AG_ARCS = AG.map((p, i) => { const q = AG[(i + 1) % 4]; return arc(lamp(p[0], p[1], AG_S, AG_ANT), lamp(q[0], q[1], AG_S, AG_ANT), 26, 22); });
const AG_SETTLE = AG.map(([x, y]) => [P(x * 0.8, y * 0.8, 0), P(x * 0.3, y * 0.3, 8)] as [V, V]);
const AG_PLATE = at(0, 0, 60, 60, 0, 8);
function Agentic() {
  const order = [0, 1, 3, 2];   // back to front
  return (
    <Scene k="agentic" ps={[...cut(AG_PLATE), ...AG_ARCS.flatMap((a) => a.ps), ...AG.map(([x, y]) => P(x, y, 0))]} floor={[-130, -130, 130, 130]}>
      <g className="sb-route sb-route--floor d-o">{AG_SETTLE.map(([a, b], i) => <path key={i} d={line(a, b)} />)}</g>
      {order.slice(0, 1).map((i) => <g key={i} className="d-p"><Agent x={AG[i][0]} y={AG[i][1]} s={AG_S} ant={AG_ANT} /></g>)}
      <g className="d-p">
        <Slab b={AG_PLATE} />
        <Slab b={at(0, 0, 28, 28, 8, 5)} tone="g" />
        <Stack x={0} y={0} z={13} n={2} r={7} h={3} />
      </g>
      {order.slice(1).map((i) => <g key={i} className="d-p"><Agent x={AG[i][0]} y={AG[i][1]} s={AG_S} ant={AG_ANT} /></g>)}
      <g className="sb-route d-o">{AG_ARCS.map((a, i) => <path key={i} d={a.d} />)}</g>
      <g className="sb-sigs ag-x d-o">{AG_ARCS.map((a, i) => <Sig key={i} p={along(a.ps, 0.3 + i * 0.15)} />)}</g>
      <g className="sb-sigs ag-s d-o">{AG_SETTLE.map(([a, b], i) => <Sig key={i} r={2.8} p={along([a, b], 0.5)} />)}</g>
    </Scene>
  );
}
function liveAgentic(svg: SVGSVGElement): Tick {
  const xs = $$<SVGCircleElement>(svg, ".ag-x circle"), ss = $$<SVGCircleElement>(svg, ".ag-s circle");
  return (t) => {
    xs.forEach((c, i) => {
      // each pair trades both ways: out along the arc, back the other way, on its own beat
      const w = (t * 0.3 + i * 0.27) % 1, u = w < 0.5 ? w * 2 : 2 - w * 2;
      c.setAttribute("transform", tr(along(AG_ARCS[i].ps, u)));
      c.style.opacity = f(clamp01(Math.min(u, 1 - u) * 9 + 0.1));
    });
    ss.forEach((c, i) => {
      const u = (t * 0.42 + i * 0.25 + 0.1) % 1;
      c.setAttribute("transform", tr(along(AG_SETTLE[i], u)));
      c.style.opacity = f(env(u, 6));
    });
  };
}

/* ───────────────────────── 03 · cross-chain DeFi ───────────────────────── */
const DF_N = [3, 2, 4, 3, 4], DF_D = [-104, -52, 0, 52, 104], DF_BACK = -26, DF_S = 24, DF_BH = 12, DF_GAP = 2.5;
const dfTop = (i: number) => DF_N[i] * (DF_BH + DF_GAP) - DF_GAP;
const DF_COLS = DF_D.map((d) => [d + DF_BACK, -d + DF_BACK] as [number, number]);
const DF_SWAP = arc([DF_COLS[0][0], DF_COLS[0][1], dfTop(0) + 2], [DF_COLS[4][0], DF_COLS[4][1], dfTop(4) + 2], 74, 40);
// the solvers stand before the gaps between the chains; each bid rises straight up through its gap to the swap's arc
const DF_SOLV = [-78, -26, 26, 78].map((d) => [d + 34, -d + 34] as [number, number]);
const overX = (x: number) => DF_SWAP.ps.reduce((a, p) => (Math.abs(p[0] - x) < Math.abs(a[0] - x) ? p : a));
const DF_BIDS = DF_SOLV.map(([x, y]) => { const b = P(x, y, 22); return [b, overX(b[0])] as [V, V]; });
function DeFi() {
  const cols = DF_COLS.map(([x, y], i) => (
    <g key={i} className="d-p">
      {Array.from({ length: DF_N[i] }, (_, k) => <Slab key={k} b={at(x, y, DF_S, DF_S, k * (DF_BH + DF_GAP), DF_BH)} tone={k === DF_N[i] - 1 && (i === 0 || i === 4) ? "lit" : "w"} />)}
    </g>
  ));
  return (
    <Scene k="defi" ps={[...DF_COLS.flatMap(([x, y], i) => cut(at(x, y, DF_S, DF_S, 0, dfTop(i)))), ...DF_SWAP.ps, ...DF_SOLV.map(([x, y]) => P(x, y, 0))]} floor={[-160, -160, 160, 160]}>
      {cols}
      <path className="sb-route sb-route--swap d-o" d={DF_SWAP.d} />
      <g className="df-bids d-o">{DF_BIDS.map(([a, b], i) => <path key={i} className={`df-bid${i === 1 ? " is-on" : ""}`} d={line(a, b)} />)}</g>
      {DF_SOLV.map(([x, y], i) => {
        const c = coin(x, y, 0, 9, 14), top = P(x, y, 22);
        return (
          <g key={i} className="d-p df-solver">
            <Coin x={x} y={y} r={9} h={14} />
            <path className="ag__ant" d={`M${f(c.cx)},${f(c.cy)}V${f(top[1])}`} />
            <circle className={`df-lamp${i === 1 ? " is-on" : ""}`} cx={f(top[0])} cy={f(top[1])} r="2.8" />
          </g>
        );
      })}
      <g className="d-o"><g className="df-coin" transform={tr(along(DF_SWAP.ps, 0.62))}><Coin r={8} h={4} g /></g></g>
    </Scene>
  );
}
function liveDeFi(svg: SVGSVGElement): Tick {
  const coinG = svg.querySelector<SVGGElement>(".df-coin")!, face = coinG.querySelector(".cn")!, bids = $$<SVGPathElement>(svg, ".df-bid"), lamps = $$<SVGCircleElement>(svg, ".df-lamp");
  const T = 3.8;
  return (t) => {
    // the bids rise (0–0.3), one solver wins and fills the swap, which runs to the last chain (0.3–0.95)
    const k = Math.floor(t / T), u = (t % T) / T, win = (k + 1) % DF_SOLV.length, run = clamp01((u - 0.28) / 0.66);
    bids.forEach((b, i) => { b.classList.toggle("is-on", u > 0.18 && i === win); b.style.opacity = f(u < 0.3 ? clamp01(u * 6) : i === win ? 1 : 0.25); });
    lamps.forEach((l, i) => l.classList.toggle("is-on", u > 0.18 && i === win));
    coinG.setAttribute("transform", tr(along(DF_SWAP.ps, run)));
    coinG.style.opacity = f(u < 0.28 ? 0 : env(run, 10));
    face.classList.toggle("cn--g", run > 0.5);
  };
}

/* ───────────────────────── 04 · treasury ───────────────────────── */
const TR = { L: [-84, 84] as [number, number], R: [84, -84] as [number, number], n: 7, total: 9, r: 11, h: 5, z: 8 };
const TR_VAULT = at(0, 0, 54, 54, 0, 48);
const TR_TOP = TR.z + TR.n * TR.h;
const TR_IN = arc([TR.L[0], TR.L[1], TR_TOP], [0, 0, 48], 40, 24), TR_OUT = arc([0, 0, 48], [TR.R[0], TR.R[1], TR_TOP], 40, 24);
function Treasury() {
  const pile = (p: [number, number], k: string, shown: number) => (
    <g className={`d-p tr-pile tr-pile--${k}`}>
      <Slab b={at(p[0], p[1], 40, 40, 0, TR.z)} />
      {Array.from({ length: TR.n }, (_, i) => <g key={i} className="tr-c" style={i < shown ? undefined : { visibility: "hidden" }}><Coin x={p[0]} y={p[1]} z={TR.z + i * TR.h} r={TR.r} h={TR.h} /></g>)}
    </g>
  );
  return (
    <Scene k="treasury" ps={[...cut(at(TR.L[0], TR.L[1], 40, 40, 0, TR_TOP)), ...cut(at(TR.R[0], TR.R[1], 40, 40, 0, TR_TOP)), ...cut(TR_VAULT), ...TR_IN.ps, ...TR_OUT.ps]} floor={[-150, -150, 150, 150]}>
      {pile(TR.L, "l", 6)}
      <g className="d-p">
        <Vault b={TR_VAULT} />
        <path className="sb-slot" d="M0,0h22" transform={onTop(-11, 0, 48)} />
      </g>
      {pile(TR.R, "r", 2)}
      <g className="sb-route d-o"><path d={TR_IN.d} /><path d={TR_OUT.d} /></g>
      <g className="d-o"><g className="tr-coin" transform={tr(along(TR_IN.ps, 0.5))}><Coin r={TR.r} h={TR.h} g /></g></g>
    </Scene>
  );
}
function liveTreasury(svg: SVGSVGElement): Tick {
  const L = $$<SVGGElement>(svg, ".tr-pile--l .tr-c"), R = $$<SVGGElement>(svg, ".tr-pile--r .tr-c"), c = svg.querySelector<SVGGElement>(".tr-coin")!;
  const T = 1.9, show = (els: SVGGElement[], n: number) => els.forEach((e, i) => { e.style.visibility = i < n ? "" : "hidden"; });
  return (t) => {
    // eight moves a cycle: four from left to right, then four back; each move goes into the vault and out the other side
    const k = Math.floor(t / T), u = (t % T) / T, cyc = k % 8, right = cyc < 4, m = right ? cyc : 8 - cyc;
    const lb = 7 - m, rb = TR.total - lb;
    show(L, right ? lb - 1 : lb); show(R, right ? rb : rb - 1);
    const w = clamp01((u - 0.08) / 0.84), leg = right ? w : 1 - w;
    c.setAttribute("transform", tr(leg < 0.5 ? along(TR_IN.ps, leg * 2) : along(TR_OUT.ps, leg * 2 - 1)));
    c.style.opacity = f(clamp01(Math.min(w * 10, (1 - w) * 10, Math.abs(leg - 0.5) * 14)));
  };
}

/* ───────────────────────── 05 · confidential AI ───────────────────────── */
const AI_PLATE = at(0, 0, 100, 100, 0, 8), AI_GLASS = at(0, 0, 68, 68, 8, 60), AI_HOST = at(132, -6, 30, 34, 0, 54);
const AI_AGENT: [number, number] = [-10, 124];
const AI_TALK = arc(lamp(AI_AGENT[0], AI_AGENT[1], 16, 12), [0, 34, 34], 30, 24);
const AI_PROBE: [V, V] = [P(116, -6, 34), P(38, -6, 34)];
const AI_WALL = line(P(37, -16, 26), P(37, 4, 42));
function ConfidentialAI() {
  const [gx, gy, gw, gd, gz, gh] = AI_GLASS;
  return (
    <Scene k="ai" ps={[...cut(AI_PLATE), ...cut(AI_GLASS), ...cut(AI_HOST), ...AI_TALK.ps, P(AI_AGENT[0], AI_AGENT[1], 0)]} floor={[-140, -140, 170, 170]}>
      <g className="d-p">
        <Slab b={AI_PLATE} />
        <Glass.Back b={AI_GLASS} />
        <Slab b={at(0, 0, 30, 30, 8, 8)} tone="g" />
        {[0, 1, 2].map((k) => <Slab key={k} b={at(0, 0, 22, 22, 18 + k * 8, 4)} tone={k === 2 ? "lit" : "w"} />)}
        <Glass.Front b={AI_GLASS} />
        <Padlock m={onRight(gx + gw, gy + gd, gz + gh)} a={gd / 2} b={gh * 0.4} s={1.25} />
      </g>
      <g className="d-p">
        <Slab b={AI_HOST} />
        <g className="sb-rack" transform={onLeft(AI_HOST[0], AI_HOST[1] + AI_HOST[3], AI_HOST[4] + AI_HOST[5])}>
          {[0, 1, 2, 3].map((k) => <path key={k} d={`M5,${9 + k * 11}h16`} />)}
        </g>
      </g>
      <g className="d-p"><Agent x={AI_AGENT[0]} y={AI_AGENT[1]} s={16} ant={12} /></g>
      <g className="d-o">
        <path className="sb-route" d={AI_TALK.d} />
        <path className="ai-probe" d={line(...AI_PROBE)} />
        <path className="ai-wall" d={AI_WALL} />
      </g>
      <g className="sb-sigs ai-sigs d-o">{[0, 1].map((i) => <Sig key={i} p={along(AI_TALK.ps, 0.35 + i * 0.3)} />)}</g>
      <g className="d-o"><Sig cls="ai-poke" r={3} p={along(AI_PROBE, 0.4)} /></g>
    </Scene>
  );
}
function liveAI(svg: SVGSVGElement): Tick {
  const sigs = $$<SVGCircleElement>(svg, ".ai-sigs circle"), poke = svg.querySelector<SVGCircleElement>(".ai-poke")!, wall = svg.querySelector<SVGPathElement>(".ai-wall")!;
  return (t) => {
    sigs.forEach((c, i) => {
      // the agent and the model: one signal in, one back
      const u0 = (t * 0.36 + i * 0.5) % 1, u = i ? 1 - u0 : u0;
      c.setAttribute("transform", tr(along(AI_TALK.ps, u)));
      c.style.opacity = f(env(u0, 7));
    });
    // the host's probe runs to the glass and stops there: the wall flashes, the probe fades
    const w = (t * 0.42) % 1, run = clamp01(w / 0.6), hit = clamp01((w - 0.6) / 0.4);
    poke.setAttribute("transform", tr(along(AI_PROBE, run)));
    poke.style.opacity = f(w < 0.6 ? clamp01(run * 6) : 1 - hit);
    wall.style.opacity = f(w < 0.6 ? 0.35 : 0.35 + 0.65 * (1 - hit));
  };
}

/** the drawings by solution key (content.ts SOLUTIONS.items[].k) */
export const SCENES: Record<string, () => ReactNode> = { payments: Payments, agentic: Agentic, defi: DeFi, treasury: Treasury, ai: ConfidentialAI };
export const LIVE: Record<string, (svg: SVGSVGElement) => Tick> = { payments: livePayments, agentic: liveAgentic, defi: liveDeFi, treasury: liveTreasury, ai: liveAI };
