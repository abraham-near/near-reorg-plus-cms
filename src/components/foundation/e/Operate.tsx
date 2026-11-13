// Foundation E, section 6: how the Foundation operates. One isometric scene in B's hand (../b/iso.ts: white tops, light grey sides, ink hairlines, one
// green) that morphs through the three activities as they scroll past (operate-motion.ts):
//   01 allocate: the treasury in the middle sends green coins out along dotted cartesian traces to the eight projects around it, which stack them up;
//   02 support functions: four shared functions nobody owns yet (communication, coordination, governance, education) arrive between the projects, each
//      propped on a scaffold and braced from the treasury, which keeps funding them;
//   03 decentralize: the functions leave their scaffolds and land on the projects; the treasury shrinks back; the projects close their own ring and value
//      runs peer to peer around it.
// The geometry is one function of a stage s (−1 empty, 0, 1, 2 = the three states) and a clock t, so the markup (any fixed stage) and the motion (every
// frame) draw the same thing. The steps sit beside it on a dotted axis whose dots join into a line as the reader passes them.
import { useId, type ReactNode } from "react";
import { ACTS, idx } from "../b/FoundationB";
import "./operate.css";
import { P, f, line, box, coin, floorDots, onTop, smooth, ease3, INK, TOP, SIDE_L, SIDE_R, GREEN, C, type V } from "../b/iso";

/* ───────────────────────── the world (units; one unit = U screen units) ───────────────────────── */
const U = 26, NN = 14;
const X = (x: number, y: number, z = 0): V => { const p = P(x, y, z); return [p[0] * U, p[1] * U]; };
const pt = (v: V) => `${f(v[0])},${f(v[1])}`;
const tr = (v: V) => `translate(${f(v[0])} ${f(v[1])})`;
type W = [number, number];

// the ecosystem: eight projects on a ring around the treasury; the four on the axes take the functions over in the end
const NODES = [
  { c: [7, 1], h: 1.3, n: 3 }, { c: [11.2, 2.8], h: 0.9, n: 2 }, { c: [13, 7], h: 1.15, n: 3 }, { c: [11.2, 11.2], h: 1.5, n: 2 },
  { c: [7, 13], h: 1.0, n: 2 }, { c: [2.8, 11.2], h: 1.25, n: 3 }, { c: [1, 7], h: 1.4, n: 2 }, { c: [2.8, 2.8], h: 0.8, n: 3 },
] as const;
const NH = 0.6, CR = 0.32, CH = 0.15;
// the treasury: a plinth and a body with four coin stacks on top
const TB = [5.5, 5.5, 0, 3, 3, 0.45] as const, TT = [5.9, 5.9, 0.45, 2.2, 2.2, 0.8] as const, TZ = 1.25;
const TCOINS = [{ x: 6.5, y: 6.5, n: 5 }, { x: 7.5, y: 6.5, n: 3 }, { x: 6.5, y: 7.5, n: 2 }, { x: 7.5, y: 7.5, n: 4 }];
// the traces the money runs: cartesian, out of the plinth's sides to each project (rotationally the same, so none cross)
const TRACES: W[][] = [
  [[7, 5.5], [7, 1.6]], [[8.5, 6.2], [11.2, 6.2], [11.2, 3.4]], [[8.5, 7], [12.4, 7]], [[7.8, 8.5], [7.8, 11.2], [10.6, 11.2]],
  [[7, 8.5], [7, 12.4]], [[5.5, 7.8], [2.8, 7.8], [2.8, 10.6]], [[5.5, 7], [1.6, 7]], [[6.2, 5.5], [6.2, 2.8], [3.4, 2.8]],
];
// the ring the projects close between themselves (state 3), routed the same cartesian way
const RING: W[][] = [
  [[7.6, 1], [11.2, 1], [11.2, 2.2]], [[11.8, 2.8], [13, 2.8], [13, 6.4]], [[13, 7.6], [13, 11.2], [11.8, 11.2]], [[11.2, 11.8], [11.2, 13], [7.6, 13]],
  [[6.4, 13], [2.8, 13], [2.8, 11.8]], [[2.2, 11.2], [1, 11.2], [1, 7.6]], [[1, 6.4], [1, 2.8], [2.2, 2.8]], [[2.8, 2.2], [2.8, 1], [6.4, 1]],
];
// the functions without a steward: where they hover (state 2), the project that takes each over (state 3), where its brace leaves the treasury, and
// whether its label hangs above the drawing (the two at the back) or below it (the two in front), on a plumb line from the module
const MODS = [
  { label: "Communication", at: [7, 3.5] as W, node: 0, from: [7, 5.9] as W, up: true },
  { label: "Coordination", at: [10.9, 7] as W, node: 2, from: [8.1, 7] as W, up: false },
  { label: "Governance", at: [7, 10.9] as W, node: 4, from: [7, 8.1] as W, up: false },
  { label: "Education", at: [3.5, 7] as W, node: 6, from: [5.9, 7] as W, up: true },
];
const MS = 1.1, MH = 0.62, HZ = 2.0;
const CHIP_Y = { up: -22, down: 392 };   // the two rows the labels hang in
const VB = { x: -300, y: -46, w: 600, h: 460 }, VB_PHONE = { x: -245, y: -46, w: 490, h: 460 };   // the frame (tighter on phones, where the floor's fade goes)

/** a point a fraction u along a floor polyline */
function along(ps: W[], u: number): W {
  const L = ps.slice(1).map((p, i) => Math.hypot(p[0] - ps[i][0], p[1] - ps[i][1])), tot = L.reduce((a, b) => a + b, 0);
  let d = u * tot;
  for (let i = 0; i < L.length; i++) {
    if (d <= L[i] || i === L.length - 1) { const k = L[i] ? Math.min(1, d / L[i]) : 0; return [ps[i][0] + (ps[i + 1][0] - ps[i][0]) * k, ps[i][1] + (ps[i + 1][1] - ps[i][1]) * k]; }
    d -= L[i];
  }
  return ps[ps.length - 1];
}
const floorPath = (ps: W[]) => line(ps.map(([x, y]) => P(x, y)), U);
const frac = (v: number) => v - Math.floor(v);
const env = (u: number) => Math.min(1, u * 7, (1 - u) * 7);
/** a scaffold under a module: four legs from the floor to z, a frame at the top and a ring halfway up */
function scaffold([cx, cy]: W, z: number) {
  if (z < 0.02) return "M0,0";
  const a = 0.5, x0 = cx - a, x1 = cx + a, y0 = cy - a, y1 = cy + a;
  const seg = (p: V, q: V) => line([p, q], U);
  return [
    seg(P(x0, y0), P(x0, y0, z)), seg(P(x1, y0), P(x1, y0, z)), seg(P(x1, y1), P(x1, y1, z)), seg(P(x0, y1), P(x0, y1, z)),
    line([P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z)], U, true),
    line([P(x0, y0, z / 2), P(x1, y0, z / 2), P(x1, y1, z / 2), P(x0, y1, z / 2)], U, true),
  ].join("");
}

/* ───────────────────────── the scene as a function of the stage and the clock ───────────────────────── */
export type Geo = ReturnType<typeof geo>;
export function geo(s: number, t: number) {
  const a1 = smooth(-1, -0.15, s), a3 = smooth(1.1, 1.9, s);   // the allocation builds in; the ecosystem takes over
  const k = 1 - 0.42 * smooth(1.25, 1.9, s);                    // the treasury shrinks back
  const flow = a1 * (1 - a3);                                   // how much money runs out along the traces
  const c0 = X(7, 7), ctop = X(7, 7, TZ + 5 * CH);
  // a still frame (t = 0: the markup, reduced motion) parks every moving coin mid-way and opens no rings
  const still = t === 0, at = (u: number, i: number) => (still ? 0.3 + frac(i * 0.37) * 0.4 : u);
  const mods = MODS.map((m, j) => {
    const nd = NODES[m.node], into = smooth(0.1 + j * 0.12, 0.6 + j * 0.12, s), out = smooth(1.1 + j * 0.12, 1.6 + j * 0.12, s);
    const ei = ease3(into), eo = ease3(out), bob = 0.07 * Math.sin(t * 1.4 + j * 1.7) * into * (1 - out);
    const zb = HZ + bob + (1 - ei) * 1.3;
    const x = m.at[0] + (nd.c[0] - m.at[0]) * eo, y = m.at[1] + (nd.c[1] - m.at[1]) * eo, z = zb + (nd.h - zb) * eo + Math.sin(Math.PI * eo) * 0.9;
    const o0 = X(...m.at, HZ), p = X(x, y, z), tp = X(x, y, z + MH), held = (HZ + bob) * ei * (1 - eo);
    const bo = smooth(0.5, 1, into) * (1 - smooth(0, 0.35, out)), bu = at(frac(t * 0.42 + j * 0.27), j);
    const bA = X(...m.from, TZ), bB = X(...m.at, HZ + bob);
    return {
      d: [p[0] - o0[0], p[1] - o0[1]] as V, o: Math.min(1, into * 2.2), chip: smooth(0.45, 1, into),
      lead: `M${pt(tp)}V${f(m.up ? CHIP_Y.up + 11 : CHIP_Y.down - 11)}`,
      scaf: scaffold(m.at, held), so: Math.min(1, into * 3) * (1 - out),
      brace: `M${pt(bA)}L${pt(bB)}`, bo, bc: [bA[0] + (bB[0] - bA[0]) * bu, bA[1] + (bB[1] - bA[1]) * bu] as V, bco: bo * into * (1 - out) * env(bu),
    };
  });
  return {
    k, c0,
    tchip: [(ctop[0] - c0[0]) * (k - 1), (ctop[1] - c0[1]) * (k - 1)] as V,
    trace: 0.1 + 0.9 * a1 * (1 - 0.82 * a3),
    flows: TRACES.map((tp, i) => { const u = at(frac(t * 0.26 + i * 0.37), i); return { p: X(...along(tp, u)), o: flow * env(u) }; }),
    // a project that has just received its coin: a green ring opens on its top
    pulses: NODES.map((_, i) => { const a = frac(t * 0.26 + i * 0.37 - 0.93) / 0.25; return a > 1 || still ? { k: 1, o: 0 } : { k: 0.45 + 0.85 * a, o: flow * (1 - a) }; }),
    coins: NODES.map((nd, i) => {
      const host = MODS.findIndex((m) => m.node === i), gone = host < 0 ? 0 : smooth(1.32 + host * 0.12, 1.5 + host * 0.12, s);
      return Array.from({ length: nd.n }, (_, c) => smooth(-0.9 + i * 0.04 + c * 0.2, -0.78 + i * 0.04 + c * 0.2, s) * (1 - gone));
    }),
    mods,
    ring: RING.map((_, l) => 1 - smooth(1.3 + l * 0.05, 1.72 + l * 0.05, s)),
    peers: RING.map((rp, l) => { let u = at(frac(t * 0.24 + l * 0.31), l); if (l % 2) u = 1 - u; return { p: X(...along(rp, u)), o: smooth(1.7, 2, s) * env(u) }; }),
  };
}

/* ───────────────────────── the drawing ───────────────────────── */
function Box({ b, top }: { b: readonly number[]; top?: string }) {
  const q = box(b[0], b[1], b[2], b[3], b[4], b[5], U);
  return (
    <>
      <polygon points={q.r} fill={SIDE_R} stroke={INK} />
      <polygon points={q.l} fill={SIDE_L} stroke={INK} />
      <polygon points={q.t} fill={top || TOP} stroke={INK} />
    </>
  );
}
function Coin({ x, y, z, r, h, face = TOP }: { x: number; y: number; z: number; r: number; h: number; face?: string }) {
  const c = coin(x, y, z, r, h, U);
  return (
    <>
      <path d={c.side} fill={SIDE_R} stroke={INK} strokeLinejoin="round" />
      <ellipse cx={f(c.cx)} cy={f(c.cy)} rx={f(c.rx)} ry={f(c.ry)} fill={face} stroke={INK} />
      <ellipse cx={f(c.cx)} cy={f(c.cy)} rx={f(c.rx * 0.58)} ry={f(c.ry * 0.58)} fill="none" stroke={INK} strokeOpacity={0.7} />
    </>
  );
}
/** a dark chip, centred on (x, y) */
function Chip({ x, y, label, className, style }: { x: number; y: number; label: string; className: string; style?: Record<string, number | string> }) {
  const w = 30 + label.length * 7.3, h = 22;
  return (
    <g className={`fe-op-chip ${className}`} style={style}>
      <g className="fe-op-chip__in" style={{ transformOrigin: `${f(x)}px ${f(y)}px` }}>
        <rect x={f(x - w / 2)} y={f(y - h / 2)} width={f(w)} height={h} fill={INK} />
        <circle cx={f(x - w / 2 + 12)} cy={f(y)} r={4} fill={GREEN} />
        <text x={f(x - w / 2 + 23)} y={f(y + 4)} fill="#F5F4F1">{label.toUpperCase()}</text>
      </g>
    </g>
  );
}
// the functions' marks, flat on their tops (a along x, b along y, MS·U square)
const GLYPHS = [
  "M7,8h15v10h-8l-4,4v-4h-3z M10,12h9 M10,15h6",                                                  // communication: a speech bubble
  "M8,9m-2.4,0a2.4,2.4 0 1,0 4.8,0a2.4,2.4 0 1,0 -4.8,0 M21,9m-2.4,0a2.4,2.4 0 1,0 4.8,0a2.4,2.4 0 1,0 -4.8,0 M14.5,21m-2.4,0a2.4,2.4 0 1,0 4.8,0a2.4,2.4 0 1,0 -4.8,0 M10.4,9h8.2 M9.2,11.1l4.1,7.8 M19.8,11.1l-4.1,7.8", // coordination: three linked nodes
  "M6,11l8.3,-5l8.3,5z M8.5,12.5v7.5 M14.3,12.5v7.5 M20.1,12.5v7.5 M6,21.5h16.6",                  // governance: a portico
  "M14.3,9.5c-2.6,-1.8 -5.4,-2 -8,-1v12c2.6,-1 5.4,-0.8 8,1c2.6,-1.8 5.4,-2 8,-1v-12c-2.6,-1 -5.4,-0.8 -8,1z M14.3,9.5v12", // education: an open book
];

export function OperateArt({ stage, className = "", vb = VB }: { stage: number; className?: string; vb?: typeof VB }) {
  const g = geo(stage, 0), uid = useId().replace(/[^\w]/g, "");
  const tchip = X(7, 7, TZ + 5 * CH);
  type Item = { key: number; node: ReactNode };
  const items: Item[] = [
    ...NODES.map((nd, i) => ({ key: nd.c[0] + nd.c[1], node: (
      <g key={`n${i}`} className="fe-op-node">
        <Box b={[nd.c[0] - NH, nd.c[1] - NH, 0, 2 * NH, 2 * NH, nd.h]} />
        <g transform={`translate(${pt(X(nd.c[0], nd.c[1], nd.h))})`}>
          <ellipse className="fe-op-pulse" data-i={i} rx={f(0.52 * Math.SQRT2 * C * U)} ry={f(0.52 * Math.SQRT2 * 0.5 * U)} transform={`scale(${f(g.pulses[i].k)})`} opacity={f(g.pulses[i].o)} />
        </g>
        {g.coins[i].map((o, c) => <g key={c} className="fe-op-ncoin" data-i={i} data-c={c} opacity={f(o)}><Coin x={nd.c[0]} y={nd.c[1]} z={nd.h + c * CH} r={CR} h={CH} /></g>)}
      </g>) })),
    { key: 14, node: (
      <g key="t" className="fe-op-treasury" transform={`translate(${pt(g.c0)}) scale(${f(g.k)}) translate(${f(-g.c0[0])} ${f(-g.c0[1])})`}>
        <Box b={TB} /><Box b={TT} />
        {TCOINS.slice().sort((a, b) => a.x + a.y - (b.x + b.y)).map((s, i) => (
          <g key={i}>{Array.from({ length: s.n }, (_, c) => <Coin key={c} x={s.x} y={s.y} z={TZ + c * CH} r={0.38} h={CH} face={s.n === 5 && c === 4 ? GREEN : TOP} />)}</g>
        ))}
      </g>) },
    ...MODS.map((m, j) => {
      const q = g.mods[j], tc = X(m.at[0] - MS / 2, m.at[1] - MS / 2, HZ + MH);
      return { key: m.at[0] + m.at[1] < 14 ? 10.6 : 20.05, node: (   // after the project it lands on, before or after the treasury
        <g key={`m${j}`} className="fe-op-unit" data-i={j}>
          <path className="fe-op-brace" d={q.brace} opacity={f(q.bo)} />
          <path className="fe-op-scaf" d={q.scaf} opacity={f(q.so)} />
          <g className="fe-op-bcoin" transform={tr(q.bc)} opacity={f(q.bco)}><Coin x={0} y={0} z={0} r={0.22} h={0.08} face={GREEN} /></g>
          <g className="fe-op-mod" transform={tr(q.d)} opacity={f(q.o)}>
            <Box b={[m.at[0] - MS / 2, m.at[1] - MS / 2, HZ, MS, MS, MH]} />
            <path className="fe-op-glyph" d={GLYPHS[j]} transform={onTop(tc)} />
          </g>
        </g>) };
    }),
  ].sort((a, b) => a.key - b.key);
  const fl = coin(0, 0, 0, 0.26, 0.1, U), dot = [P(-0.2, -0.2), P(0.2, -0.2), P(0.2, 0.2), P(-0.2, 0.2)].map(([a, b]) => `${f(a * U)},${f(b * U)}`).join(" ");
  return (
    <svg className={`fe-op-art ${className}`} viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} data-stage={stage} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${uid}g`} cx="50%" cy="50%" r="52%"><stop offset="0.5" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x={vb.x} y={vb.y} width={vb.w} height={vb.h}><rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill={`url(#${uid}g)`} /></mask>
      </defs>
      <path className="fe-op-floor" d={floorDots(0, 0, NN, NN, U, 1)} mask={`url(#${uid}m)`} />
      <g className="fe-op-ring">{RING.map((rp, l) => <path key={l} d={floorPath(rp)} pathLength={1} strokeDasharray="1 1" strokeDashoffset={f(g.ring[l])} />)}</g>
      <g className="fe-op-traces" opacity={f(g.trace)}>{TRACES.map((tp, i) => <path key={i} d={floorPath(tp)} />)}</g>
      <g className="fe-op-leads">{g.mods.map((q, j) => <path key={j} d={q.lead} opacity={f(q.o * q.chip)} />)}</g>
      <g className="fe-op-flows">
        {g.flows.map((fw, i) => (
          <g key={i} className="fe-op-flow" transform={tr(fw.p)} opacity={f(fw.o)}>
            <path d={fl.side} fill={SIDE_R} stroke={INK} /><ellipse cx={f(fl.cx)} cy={f(fl.cy)} rx={f(fl.rx)} ry={f(fl.ry)} fill={GREEN} stroke={INK} />
          </g>
        ))}
        {g.peers.map((pp, l) => <polygon key={l} className="fe-op-peer" points={dot} transform={tr(pp.p)} opacity={f(pp.o)} />)}
      </g>
      {items.map((it) => it.node)}
      <g className="fe-op-chips">
        <Chip x={0} y={tchip[1] - 34} label="Foundation" className="fe-op-tchip" style={{ transform: `translate(${f(g.tchip[0])}px, ${f(g.tchip[1])}px)` }} />
        {MODS.map((m, j) => <Chip key={j} x={X(...m.at)[0]} y={m.up ? CHIP_Y.up : CHIP_Y.down} label={m.label} className="fe-op-mchip" style={{ transform: `translateX(${f(g.mods[j].d[0])}px)`, opacity: f(g.mods[j].o * g.mods[j].chip) }} />)}
      </g>
    </svg>
  );
}

/* ───────────────────────── the section ───────────────────────── */
export function OperateSection() {
  return (
    <section className="fe-op" id="fb-operates" aria-labelledby="fb-op-t">
      <div className="fe-op__head">
        <h2 id="fb-op-t" className="fb-h2" data-fb-rv="">How the Foundation <span className="accent">operates</span></h2>
        <p className="l-lede" data-fb-rv="">As one of the larger nodes supporting a decentralized ecosystem, the Foundation limits itself to indirect support. Its primary lever is the financial resources in its treasury, and its operations are deliberately lightweight, directed at three activities.</p>
      </div>
      <div className="fe-op__story">
        <div className="fe-op__fig">
          <div className="fe-op__sticky">
            <OperateArt stage={2} className="fe-op-art--main" />
            <p className="fe-op__count" aria-hidden="true"><span className="fe-op__ci"><span>01</span><span>02</span><span>03</span></span><span>/ 03</span></p>
          </div>
        </div>
        <div className="fe-op__list">
          <span className="fe-op__axis" aria-hidden="true"><span className="fe-op__fill" /></span>
          <span className="fe-op__now" aria-hidden="true"><span className="fe-op__cursor" /></span>
          <ol className="fe-op__steps">
            {ACTS.map((a, i) => (
              <li key={a.t} className="fe-op__step" data-step={i}>
                <div className="fe-op__mfig"><OperateArt stage={i} vb={VB_PHONE} /></div>
                <div className="fe-op__num"><span className="fe-op__tick" aria-hidden="true"><i /></span><span className="fb-n">{idx(i)}</span></div>
                <h3 className="fb-h3">{a.t}</h3>
                <p className="fb-body">{a.b}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/** the elements the motion repaints, per drawing */
export function collect(svg: SVGSVGElement) {
  const q = <T extends Element>(s: string) => Array.from(svg.querySelectorAll<T>(s));
  return {
    treasury: svg.querySelector<SVGGElement>(".fe-op-treasury")!, tchip: svg.querySelector<SVGGElement>(".fe-op-tchip")!,
    ring: q<SVGPathElement>(".fe-op-ring path"), traces: svg.querySelector<SVGGElement>(".fe-op-traces")!,
    flows: q<SVGGElement>(".fe-op-flow"), pulses: q<SVGEllipseElement>(".fe-op-pulse"), peers: q<SVGPolygonElement>(".fe-op-peer"), ncoins: q<SVGGElement>(".fe-op-ncoin"),
    units: q<SVGGElement>(".fe-op-unit").sort((a, b) => +a.dataset.i! - +b.dataset.i!).map((u) => ({
      brace: u.querySelector<SVGPathElement>(".fe-op-brace")!, scaf: u.querySelector<SVGPathElement>(".fe-op-scaf")!,
      bcoin: u.querySelector<SVGGElement>(".fe-op-bcoin")!, mod: u.querySelector<SVGGElement>(".fe-op-mod")!,
    })),
    mchips: q<SVGGElement>(".fe-op-mchip"), leads: q<SVGPathElement>(".fe-op-leads path"),
  };
}
/** paint a frame of geo() onto a drawing's elements */
export function paint(el: ReturnType<typeof collect>, g: Geo) {
  el.treasury.setAttribute("transform", `translate(${pt(g.c0)}) scale(${f(g.k)}) translate(${f(-g.c0[0])} ${f(-g.c0[1])})`);
  el.tchip.style.transform = `translate(${f(g.tchip[0])}px, ${f(g.tchip[1])}px)`;
  el.traces.setAttribute("opacity", f(g.trace));
  el.ring.forEach((p, l) => p.setAttribute("stroke-dashoffset", f(g.ring[l])));
  el.flows.forEach((n, i) => { n.setAttribute("transform", tr(g.flows[i].p)); n.setAttribute("opacity", f(g.flows[i].o)); });
  el.peers.forEach((n, l) => { n.setAttribute("transform", tr(g.peers[l].p)); n.setAttribute("opacity", f(g.peers[l].o)); });
  el.pulses.forEach((n, i) => { n.setAttribute("transform", `scale(${f(g.pulses[i].k)})`); n.setAttribute("opacity", f(g.pulses[i].o)); });
  el.ncoins.forEach((n) => n.setAttribute("opacity", f(g.coins[+n.dataset.i!][+n.dataset.c!])));
  el.units.forEach((u, j) => {
    const m = g.mods[j];
    u.brace.setAttribute("d", m.brace); u.brace.setAttribute("opacity", f(m.bo));
    u.scaf.setAttribute("d", m.scaf); u.scaf.setAttribute("opacity", f(m.so));
    u.bcoin.setAttribute("transform", tr(m.bc)); u.bcoin.setAttribute("opacity", f(m.bco));
    u.mod.setAttribute("transform", tr(m.d)); u.mod.setAttribute("opacity", f(m.o));
    const c = el.mchips[j]; c.style.transform = `translateX(${f(m.d[0])}px)`; c.style.opacity = f(m.o * m.chip);
    el.leads[j].setAttribute("d", m.lead); el.leads[j].setAttribute("opacity", f(m.o * m.chip));
  });
}
