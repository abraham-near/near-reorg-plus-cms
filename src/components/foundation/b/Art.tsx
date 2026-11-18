// Foundation B's glass Stiftung (the Foundation page's transparency drawing), in the iso hand (iso.ts). The markup is the finished frame (the
// reduced-motion state); motion.ts brings it in. Decorative: the text beside it says what it shows.
import type { ReactNode } from "react";
import { coin, floorDots, line, P, f, INK, TOP, SIDE_L, SIDE_R, GREEN, C, type V } from "./iso";

type Tone = { ink: string; top: string; r: string; l: string; dots: string };
const LIGHT: Tone = { ink: INK, top: TOP, r: SIDE_R, l: SIDE_L, dots: INK };

/** the view box around a floor of n units with things up to h units high */
const frame = (n: number, h: number, u: number, pad = 16, extraTop = 0, extraRight = 0): string => {
  const x = -n * C * u - pad, y = -h * u - pad - extraTop;
  return `${f(x)} ${f(y)} ${f(2 * n * C * u + 2 * pad + extraRight)} ${f((n + h) * u + 2 * pad + extraTop)}`;
};

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
