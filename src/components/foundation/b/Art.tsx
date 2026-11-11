// Foundation B's smaller drawings, in the hero's hand (iso.ts): the three pillars (a sealed Stiftung, a growing stack, a dispersed lattice), the glass
// Stiftung (transparency), the Council's diagram (on the dark) and the operations scene (three states). The markup is each drawing's finished frame (the
// reduced-motion state); motion.ts brings them in. All decorative: the text beside each says what it shows.
import type { ReactNode } from "react";
import { box, boxOutline, coin, floorDots, line, onLeft, P, f, INK, TOP, SIDE_L, SIDE_R, GREEN, C, type V } from "./iso";

type Tone = { ink: string; top: string; r: string; l: string; dots: string };
const LIGHT: Tone = { ink: INK, top: TOP, r: SIDE_R, l: SIDE_L, dots: INK };
const DARK: Tone = { ink: "rgb(245 244 241 / 0.86)", top: "#3a3a38", r: "#1d1d1d", l: "#2c2c2b", dots: "#f5f4f1" };

/** the view box around a floor of n units with things up to h units high */
const frame = (n: number, h: number, u: number, pad = 16, extraTop = 0, extraRight = 0): string => {
  const x = -n * C * u - pad, y = -h * u - pad - extraTop;
  return `${f(x)} ${f(y)} ${f(2 * n * C * u + 2 * pad + extraRight)} ${f((n + h) * u + 2 * pad + extraTop)}`;
};

function Box({ b, u, tone = LIGHT, top, className, data }: { b: [number, number, number, number, number, number]; u: number; tone?: Tone; top?: string; className?: string; data?: Record<string, string> }) {
  const q = box(...b, u);
  return (
    <g className={className} {...data}>
      <polygon points={q.r} fill={tone.r} stroke={tone.ink} />
      <polygon points={q.l} fill={tone.l} stroke={tone.ink} />
      <polygon points={q.t} fill={top || tone.top} stroke={tone.ink} />
    </g>
  );
}
function Floor({ n, u, tone = LIGHT, o = 0.5, step = 1 }: { n: number; u: number; tone?: Tone; o?: number; step?: number }) {
  return (
    <g className="fb-a-floor">
      <path d={floorDots(0, 0, n, n, u, step)} stroke={tone.dots} strokeOpacity={o} strokeLinecap="round" className="fb-a-dots" />
    </g>
  );
}
function Coin({ x, y, z, r, h, u, face = TOP, tone = LIGHT, className }: { x: number; y: number; z: number; r: number; h: number; u: number; face?: string; tone?: Tone; className?: string }) {
  const c = coin(x, y, z, r, h, u);
  return (
    <g className={className}>
      <path d={c.side} fill={tone.r} stroke={tone.ink} strokeLinejoin="round" />
      <ellipse cx={f(c.cx)} cy={f(c.cy)} rx={f(c.rx)} ry={f(c.ry)} fill={face} stroke={tone.ink} />
      <ellipse cx={f(c.cx)} cy={f(c.cy)} rx={f(c.rx * 0.6)} ry={f(c.ry * 0.6)} fill="none" stroke={tone.ink} />
    </g>
  );
}
/** a chip: black (paper on the dark), a green dot, mono caps; (x, y) is its left middle */
function Chip({ at, label, dark, className = "" }: { at: V; label: string; dark?: boolean; className?: string }) {
  const w = 30 + label.length * 7.3, h = 22, [x, y] = at;
  return (
    <g className={`fb-schip ${className}`} data-cx={f(x + w / 2)} data-cy={f(y)}>
      <g className="fb-schip__in">
        <rect x={f(x)} y={f(y - h / 2)} width={f(w)} height={h} fill={dark ? "#F5F4F1" : INK} />
        <circle className="fb-schip__dot" cx={f(x + 12)} cy={f(y)} r={4} fill={GREEN} />
        <text x={f(x + 23)} y={f(y + 4)} className="fb-schip__t" fill={dark ? INK : "#F5F4F1"}>{label.toUpperCase()}</text>
      </g>
    </g>
  );
}
const Svg = ({ vb, className, children }: { vb: string; className: string; children: ReactNode }) => (
  <svg className={`fb-art ${className}`} viewBox={vb} aria-hidden="true" focusable="false">{children}</svg>
);
const S = (v: V, u: number): V => [v[0] * u, v[1] * u];

/* ───────────────────────── pillar 1 · Nonprofit: a sealed Stiftung ───────────────────────── */
export function ArtVault() {
  const u = 24, n = 7;
  const strapL = [[3.2, 3.8]].flatMap(([a, b]) => [
    line([P(a, 1.4, 2.62), P(a, 5.6, 2.62), P(a, 5.6, 0)], u), line([P(b, 1.4, 2.62), P(b, 5.6, 2.62), P(b, 5.6, 0)], u),
  ]);
  return (
    <Svg vb={frame(n, 3.4, u, 16, 10, 24)} className="fb-art--vault">
      <Floor n={n} u={u} />
      <path className="fb-a-shadow" d={line([P(1.2, 1.2), P(6, 1.2), P(6, 6), P(1.2, 6)], u, true)} fill="none" stroke={INK} strokeOpacity={0.35} strokeDasharray="2 3" />
      <Box b={[1.5, 1.5, 0, 4, 4, 2.2]} u={u} className="fb-a-body" />
      <g className="fb-a-lid"><Box b={[1.4, 1.4, 2.2, 4.2, 4.2, 0.42]} u={u} /></g>
      <g className="fb-a-strap" fill="none" stroke={INK}>
        {strapL.map((d, i) => <path key={i} d={d} pathLength={1} />)}
        <polygon points={[P(3.2, 5.6, 2.62), P(3.8, 5.6, 2.62), P(3.8, 5.6, 0), P(3.2, 5.6, 0)].map((v) => S(v, u).map(f).join(",")).join(" ")} fill={SIDE_L} stroke="none" className="fb-a-strapfill" />
      </g>
      <g className="fb-a-seal" transform={onLeft(S(P(3.5, 5.6, 1.25), u))}>
        <circle r={u * 0.62} fill={GREEN} stroke={INK} />
        <circle r={u * 0.36} fill="none" stroke={INK} />
        <path d={`M${f(-u * 0.12)},${f(-u * 0.04)}h${f(u * 0.24)}`} stroke={INK} />
      </g>
      <Chip at={S(P(6.4, 1.8, 3.3), u)} label="Stiftung" className="fb-a-chip" />
    </Svg>
  );
}

/* ───────────────────────── pillar 2 · Ecosystem growth: a growing stack ───────────────────────── */
export function ArtGrowth() {
  const u = 25, n = 7, x = 2.6, ch = 0.82, cols = [{ y: 5.0, h: 1 }, { y: 3.6, h: 2 }, { y: 2.2, h: 3 }, { y: 0.8, h: 4 }];
  const tops = cols.map((c) => S(P(x + 0.55, c.y + 0.55, c.h * ch + 0.55), u));
  const [ax, ay] = tops[3], [bx, by] = tops[2], len = Math.hypot(ax - bx, ay - by), ux = (ax - bx) / len, uy = (ay - by) / len;
  const back = cols.slice().reverse();   // the far (tall) column first
  return (
    <Svg vb={frame(n, 3.4, u, 16, 0)} className="fb-art--growth">
      <Floor n={n} u={u} />
      {back.map((c) => (
        <g key={c.y} className="fb-a-col">
          {Array.from({ length: c.h }, (_, k) => (
            <Box key={k} b={[x, c.y, k * ch, 1.1, 1.1, ch]} u={u} top={c.h === 4 && k === 3 ? GREEN : undefined} className="fb-a-cube" />
          ))}
        </g>
      ))}
      <path className="fb-a-trend" d={"M" + tops.map((t) => `${f(t[0])},${f(t[1])}`).join("L")} fill="none" stroke={INK} strokeDasharray="3 3" />
      <path className="fb-a-tick" d={`M${f(ax - ux * 8 - uy * 5)},${f(ay - uy * 8 + ux * 5)}L${f(ax)},${f(ay)}L${f(ax - ux * 8 + uy * 5)},${f(ay - uy * 8 - ux * 5)}`} fill="none" stroke={INK} />
      <Chip at={[ax + 18, ay - 4]} label="Growth" className="fb-a-chip" />
    </Svg>
  );
}

/* ───────────────────────── pillar 3 · Decentralization: a dispersed lattice ───────────────────────── */
const LAT = [[0.5, 0.5, 1.1], [3.5, 0.5, 0.7], [6.5, 0.5, 1.4], [0.5, 3.5, 0.8], [6.5, 3.5, 1.0], [0.5, 6.5, 1.5], [3.5, 6.5, 0.9], [6.5, 6.5, 1.2]] as const;
const LAT_LINKS: [number, number][] = [[0, 1], [1, 2], [0, 3], [2, 4], [3, 5], [4, 7], [5, 6], [6, 7], [1, 6], [3, 4]];
export function ArtLattice() {
  const u = 21, n = 8, c = (i: number) => S(P(LAT[i][0] + 0.5, LAT[i][1] + 0.5), u);
  const order = LAT.map((_, i) => i).sort((a, b) => LAT[a][0] + LAT[a][1] - (LAT[b][0] + LAT[b][1]));
  return (
    <Svg vb={frame(n, 2, u, 16, 22)} className="fb-art--lattice">
      <Floor n={n} u={u} />
      <g className="fb-a-links" fill="none" stroke={INK} strokeOpacity={0.7}>
        {LAT_LINKS.map(([a, b], i) => { const A = c(a), B = c(b); return <path key={i} d={`M${f(A[0])},${f(A[1])}L${f(B[0])},${f(B[1])}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={0} className="fb-a-link" />; })}
      </g>
      <path className="fb-a-ghost" d={boxOutline(3.5, 3.5, 0, 1, 1, 1, u)} fill="none" stroke={INK} strokeDasharray="2 3" />
      {order.map((i) => (
        <Box key={i} b={[LAT[i][0], LAT[i][1], 0, 1, 1, LAT[i][2]]} u={u} top={i === 4 ? GREEN : undefined} className="fb-a-node"
          data={{ "data-dx": f(S(P(3.5 - LAT[i][0], 3.5 - LAT[i][1]), u)[0]), "data-dy": f(S(P(3.5 - LAT[i][0], 3.5 - LAT[i][1]), u)[1]) }} />
      ))}
      <Chip at={(() => { const t = S(P(7, 4, 1.0), u); return [t[0] + 14, t[1] - 10] as V; })()} label="Network" className="fb-a-chip" />
    </Svg>
  );
}

/* ───────────────────────── transparency · the glass Stiftung, funds inside ───────────────────────── */
const STACKS = [{ x: 2.4, y: 2.6, n: 3 }, { x: 4.4, y: 2.4, n: 6 }, { x: 2.7, y: 4.6, n: 4 }, { x: 4.7, y: 4.5, n: 5 }];
export function ArtGlass() {
  const u = 44, n = 7, x0 = 1, y0 = 1, x1 = 6.4, y1 = 6.4, H = 4.4, R = 0.62, CH = 0.24;
  const p = (x: number, y: number, z: number) => S(P(x, y, z), u);
  const seg = (a: V, b: V) => `M${f(a[0])},${f(a[1])}L${f(b[0])},${f(b[1])}`;
  const back = [seg(p(x0, y0, 0), p(x0, y0, H)), seg(p(x0, y0, 0), p(x1, y0, 0)), seg(p(x0, y0, 0), p(x0, y1, 0))];
  const front = [
    line([P(x0, y0, H), P(x1, y0, H), P(x1, y1, H), P(x0, y1, H)], u, true),
    seg(p(x1, y0, H), p(x1, y0, 0)), seg(p(x1, y1, H), p(x1, y1, 0)), seg(p(x0, y1, H), p(x0, y1, 0)),
    seg(p(x1, y0, 0), p(x1, y1, 0)), seg(p(x0, y1, 0), p(x1, y1, 0)),
  ];
  const faceL = [P(x0, y1, H), P(x1, y1, H), P(x1, y1, 0), P(x0, y1, 0)], faceR = [P(x1, y0, H), P(x1, y1, H), P(x1, y1, 0), P(x1, y0, 0)];
  const faceT = [P(x0, y0, H), P(x1, y0, H), P(x1, y1, H), P(x0, y1, H)];
  const poly = (ps: V[]) => ps.map((v) => S(v, u).map(f).join(",")).join(" ");
  const plane = (z: number) => poly([P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z)]);
  const sorted = STACKS.map((s, i) => ({ ...s, i })).sort((a, b) => a.x + a.y - (b.x + b.y));
  return (
    <Svg vb={frame(n + 0.4, H + 0.6, u, 18, 12)} className="fb-art--glass">
      <Floor n={n + 0.4} u={u} step={0.7} o={0.42} />
      <polygon points={plane(0)} fill="#FFFFFF" fillOpacity={0.55} stroke="none" className="fb-a-base" />
      <g className="fb-a-back" fill="none" stroke={INK} strokeOpacity={0.4} strokeDasharray="2 3">{back.map((d, i) => <path key={i} d={d} />)}</g>
      <g className="fb-a-funds">
        {sorted.map((s) => (
          <g key={s.i} className="fb-a-stack">
            {Array.from({ length: s.n }, (_, k) => <Coin key={k} x={s.x} y={s.y} z={k * CH} r={R} h={CH} u={u} face={s.i === 1 && k === s.n - 1 ? GREEN : TOP} className="fb-a-coin" />)}
          </g>
        ))}
      </g>
      <g className="fb-a-scan">
        <polygon points={plane(H * 0.5)} fill={GREEN} fillOpacity={0.08} stroke={GREEN} strokeWidth={1.2} />
      </g>
      <g className="fb-a-glass">
        <polygon points={poly(faceR)} fill="#FFFFFF" fillOpacity={0.16} />
        <polygon points={poly(faceL)} fill="#FFFFFF" fillOpacity={0.26} />
        <polygon points={poly(faceT)} fill="#FFFFFF" fillOpacity={0.3} />
        <g className="fb-a-glare" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" opacity={0.95}>
          <path d={seg(p(x0 + 0.7, y1, H - 0.5), p(x0 + 2.0, y1, H - 2.2))} />
          <path d={seg(p(x0 + 1.25, y1, H - 0.45), p(x0 + 1.7, y1, H - 1.05))} />
        </g>
      </g>
      <g className="fb-a-edges" fill="none" stroke={INK} strokeLinejoin="round">{front.map((d, i) => <path key={i} d={d} pathLength={1} />)}</g>
      <Chip at={(() => { const t = S(P(x0, y0, H), u); return [t[0] - (30 + 14 * 7.3) / 2, t[1] - 34] as V; })()} label="Swiss Stiftung" className="fb-a-chip" />
      <Chip at={S(P(x1 + 0.4, 3.4, 1.0), u)} label="Funds" className="fb-a-chip" />
      <path className="fb-a-lead" d={seg(p(x1 + 0.4, 3.4, 1.0), p(4.4 + 0.6, 2.4, 6 * CH))} stroke={INK} strokeOpacity={0.5} strokeDasharray="2 2" fill="none" />
    </Svg>
  );
}

/* ───────────────────────── the Council (on the dark): Council → executive team, reporting back ───────────────────────── */
export function ArtCouncil() {
  const u = 40, n = 7, ZC = 6.2, T = DARK;
  const p = (x: number, y: number, z: number) => S(P(x, y, z), u);
  const down = { a: p(2.3, 5.1, ZC), b: p(2.3, 5.1, 0.95) }, up = { a: p(5.1, 2.3, 0.7), b: p(5.1, 2.3, ZC - 0.35) };
  const arrow = (tip: V, dir: 1 | -1) => `M${f(tip[0] - 5)},${f(tip[1] - 7 * dir)}L${f(tip[0])},${f(tip[1])}L${f(tip[0] + 5)},${f(tip[1] - 7 * dir)}`;
  return (
    <Svg vb={frame(n, ZC + 1.6, u, 24, 4)} className="fb-art--council">
      <Floor n={n} u={u} tone={T} o={0.22} />
      <Box b={[0.6, 0.6, 0, 5.8, 5.8, 0.7]} u={u} tone={T} className="fb-a-exec" />
      <g className="fb-a-team">
        {[[1.2, 1.2], [2.6, 1.2], [1.2, 2.6]].map(([x, y], i) => <Box key={i} b={[x, y, 0.7, 0.9, 0.9, 0.9]} u={u} tone={T} />)}
      </g>
      <g className="fb-a-lines" fill="none">
        <path className="fb-a-down" d={`M${f(down.a[0])},${f(down.a[1])}L${f(down.b[0])},${f(down.b[1])}`} stroke={GREEN} strokeWidth={1.4} strokeDasharray="4 4" />
        <path className="fb-a-downh" d={arrow(down.b, 1)} stroke={GREEN} strokeWidth={1.4} />
        <path className="fb-a-up" d={`M${f(up.a[0])},${f(up.a[1])}L${f(up.b[0])},${f(up.b[1])}`} stroke="#F5F4F1" strokeOpacity={0.8} strokeDasharray="4 4" />
        <path className="fb-a-uph" d={arrow(up.b, -1)} stroke="#F5F4F1" strokeOpacity={0.8} />
        <circle className="fb-a-pulse fb-a-pulse--d" cx={f(down.a[0])} cy={f(down.a[1])} r={3.5} fill={GREEN} data-x0={f(down.a[0])} data-y0={f(down.a[1])} data-y1={f(down.b[1])} />
        <circle className="fb-a-pulse fb-a-pulse--u" cx={f(up.a[0])} cy={f(up.a[1])} r={3.5} fill="#F5F4F1" data-x0={f(up.a[0])} data-y0={f(up.a[1])} data-y1={f(up.b[1])} />
      </g>
      <Box b={[1.7, 1.7, ZC, 3.6, 3.6, 0.55]} u={u} tone={T} className="fb-a-council" />
      <g className="fb-a-seats">
        {[[2.2, 2.2], [3.3, 2.2], [4.4, 2.2], [2.2, 3.3], [2.2, 4.4]].map(([x, y], i) => <Box key={i} b={[x, y, ZC + 0.55, 0.6, 0.6, 0.6]} u={u} tone={T} top={i === 0 ? GREEN : undefined} />)}
      </g>
      <text className="fb-a-cap" x={f(down.a[0] - 14)} y={f((down.a[1] + down.b[1]) / 2)} textAnchor="end" fill={GREEN}>EMPOWERS</text>
      <text className="fb-a-cap" x={f(up.a[0] + 14)} y={f((up.a[1] + up.b[1]) / 2)} fill="#F5F4F1" fillOpacity={0.8}>REPORTS BACK</text>
      <Chip at={S(P(5.6, 1.4, ZC + 1.1), u)} label="Council" dark className="fb-a-chip" />
      <Chip at={S(P(6.8, 4.2, 1.2), u)} label="Executive team" dark className="fb-a-chip" />
    </Svg>
  );
}

/* ───────────────────────── how the Foundation operates: one scene, three states ───────────────────────── */
export const OP_BLOCKS = [
  { b: [5.2, 0.6, 0, 1.6, 1.6, 1.8] as const, k: "n" }, { b: [10, 5.2, 0, 1.6, 1.6, 1.2] as const, k: "e" },
  { b: [5.2, 10, 0, 1.6, 1.6, 2.2] as const, k: "s" }, { b: [0.6, 5.2, 0, 1.6, 1.6, 1.5] as const, k: "w" },
];
export const OP_FUNCS = [
  { b: [9.8, 0.8, 0, 1.4, 1.4, 1.4] as const, label: "Comms" }, { b: [9.8, 9.8, 0, 1.4, 1.4, 1.0] as const, label: "Governance" },
  { b: [0.8, 9.8, 0, 1.4, 1.4, 1.7] as const, label: "Education" },
];
const OP_RING: [number, number][] = [[0, 4], [4, 1], [1, 5], [5, 2], [2, 6], [6, 3], [3, 0]]; // indices into [...blocks, ...funcs]: the ring the ecosystem closes
/** a box as a wireframe: its outline and the three edges meeting at its near top corner */
const wire = (b: readonly number[], u: number) => {
  const [x0, y0, z0, dx, dy, dz] = b, x1 = x0 + dx, y1 = y0 + dy, z1 = z0 + dz;
  return boxOutline(x0, y0, z0, dx, dy, dz, u) + line([P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], u) + line([P(x1, y1, z1), P(x1, y1, z0)], u);
};
export function ArtOperate() {
  const u = 26, n = 12, TZ = 1.1;
  const all = [...OP_BLOCKS.map((o) => o.b), ...OP_FUNCS.map((o) => o.b)];
  const mid = (b: readonly number[]) => S(P(b[0] + b[3] / 2, b[1] + b[4] / 2), u);
  const topOf = (b: readonly number[]) => S(P(b[0] + b[3] / 2, b[1] + b[4] / 2, b[5]), u);
  const src = S(P(6, 6, TZ + 0.75), u);
  const arcs = OP_BLOCKS.map((o) => { const t = topOf(o.b); return `M${f(src[0])},${f(src[1])}C${f(src[0])},${f(src[1] - 90)} ${f(t[0])},${f(t[1] - 90)} ${f(t[0])},${f(t[1])}`; });
  type Item = { key: number; node: ReactNode };
  const items: Item[] = [
    ...OP_BLOCKS.map((o, i) => ({ key: o.b[0] + o.b[1], node: (
      <g key={`b${i}`} className="fb-op-block">
        <Box b={[...o.b]} u={u} />
        <g className="fb-op-coin" data-i={i}><Coin x={o.b[0] + 0.8} y={o.b[1] + 0.8} z={o.b[5]} r={0.42} h={0.18} u={u} face={GREEN} /></g>
      </g>) })),
    ...OP_FUNCS.map((o, i) => ({ key: o.b[0] + o.b[1], node: (
      <g key={`f${i}`} className="fb-op-func" data-i={i}>
        <path className="fb-op-ghost" d={wire(o.b, u)} fill="none" stroke={INK} strokeDasharray="3 3" />
        <g className="fb-op-solid"><Box b={[...o.b]} u={u} /></g>
      </g>) })),
    { key: 12, node: (
      <g key="t" className="fb-op-treasury">
        <g className="fb-op-tscale">
          <Box b={[4.4, 4.4, 0, 3.2, 3.2, TZ]} u={u} />
          <g className="fb-op-tcoins">
            {[0, 1, 2, 3].map((k) => <Coin key={k} x={6} y={6} z={TZ + k * 0.19} r={0.62} h={0.19} u={u} face={k === 3 ? GREEN : TOP} />)}
          </g>
        </g>
      </g>) },
  ].sort((a, b) => a.key - b.key);
  const tc = S(P(6, 6, 0), u);
  return (
    <Svg vb={frame(n, 3.6, u, 20, 20)} className="fb-art--operate">
      <Floor n={n} u={u} o={0.4} />
      <g className="fb-op-ring" fill="none" stroke={INK} strokeOpacity={0.75}>
        {OP_RING.map(([a, b], i) => { const A = mid(all[a]), B = mid(all[b]); return <path key={i} d={`M${f(A[0])},${f(A[1])}L${f(B[0])},${f(B[1])}`} pathLength={1} strokeDasharray="1 1" className="fb-op-link" />; })}
      </g>
      <g className="fb-op-spokes" fill="none" stroke={INK} strokeOpacity={0.4} strokeDasharray="2 3">
        {all.map((b, i) => { const A = mid(b); return <path key={i} d={`M${f(tc[0])},${f(tc[1])}L${f(A[0])},${f(A[1])}`} />; })}
      </g>
      {items.map((it) => it.node)}
      <g className="fb-op-arcs" fill="none" stroke={INK} strokeDasharray="3 3">{arcs.map((d, i) => <path key={i} d={d} className="fb-op-arc" />)}</g>
      <g className="fb-op-fly">
        {arcs.map((d, i) => <g key={i} className="fb-op-flyc" data-d={d}><ellipse rx={u * 0.42 * Math.SQRT2 * C} ry={u * 0.42 * Math.SQRT2 * 0.5} fill={GREEN} stroke={INK} /></g>)}
      </g>
      <g className="fb-op-chips">
        {OP_FUNCS.map((o, i) => <Chip key={i} at={(() => { const t = topOf(o.b); return [t[0] - 20, t[1] - 26] as V; })()} label={o.label} className="fb-op-fchip" />)}
        <Chip at={(() => { const t = S(P(6, 6, TZ + 0.76), u); return [t[0] - (30 + 10 * 7.3) / 2, t[1] - 34] as V; })()} label="Foundation" className="fb-op-tchip" />
      </g>
    </Svg>
  );
}
