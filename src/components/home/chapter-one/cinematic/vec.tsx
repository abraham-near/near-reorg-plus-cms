import type { CSSProperties } from "react";
import { type Ell, type Pt, arc, poly, r2, seg, ticks } from "./geom";

// The drawing kit for the cinematic hero's vector layers, in the stations' vocabulary (D54-D82): hairline orbits and
// arcs, radial micro ticks, small rings, crosses and squares, ticked traces on the land, and plexus links that are
// strongest at their dots (D59) with traces strongest at their ticks (D60). Hairlines keep their width at any crop
// (non-scaling strokes); everything else is in the photo's pixels. Token colours only.
export type Tone = "ink" | "deep" | "green" | "white";
const COL: Record<Tone, string> = {
  ink: "var(--color-ink)",
  deep: "var(--color-green-text)",
  green: "var(--color-green)",
  white: "var(--color-white)",
};
const mix = (t: Tone, a: number) => (a >= 1 ? COL[t] : `color-mix(in srgb, ${COL[t]} ${Math.round(a * 100)}%, transparent)`);
const line = (t: Tone, a: number, w: number, dash?: string): CSSProperties => ({
  fill: "none", stroke: mix(t, a), strokeWidth: w, strokeDasharray: dash, strokeLinecap: "round", strokeLinejoin: "round",
});
const NS = { vectorEffect: "non-scaling-stroke" } as const;

type Stroke = { tone?: Tone; a?: number; w?: number; dash?: string };

export const Path = ({ d, tone = "ink", a = 0.6, w = 0.75, dash }: Stroke & { d: string }) => <path d={d} style={line(tone, a, w, dash)} {...NS} />;

export const Arc = ({ e, t0, t1, s = 1, ...k }: Stroke & { e: Ell; t0: number; t1: number; s?: number }) => <Path d={arc(e, t0, t1, s)} {...k} />;

export const Ticks = ({ e, t0, t1, step, len, major = 0, majorLen, s = 1, ...k }: Stroke & { e: Ell; t0: number; t1: number; step: number; len: number; major?: number; majorLen?: number; s?: number }) => (
  <Path d={ticks(e, t0, t1, step, len, major, majorLen ?? len, s)} {...k} />
);

// Markers (sizes in photo pixels)
export const Ring = ({ p, r = 9, tone = "ink", a = 0.75, w = 0.75 }: { p: Pt; r?: number; tone?: Tone; a?: number; w?: number }) => (
  <circle cx={p[0]} cy={p[1]} r={r} style={line(tone, a, w)} {...NS} />
);
export const Dot = ({ p, r = 4, tone = "ink", a = 0.85 }: { p: Pt; r?: number; tone?: Tone; a?: number }) => (
  <circle cx={p[0]} cy={p[1]} r={r} style={{ fill: mix(tone, a) }} />
);
export const Cross = ({ p, s = 12, tone = "ink", a = 0.7 }: { p: Pt; s?: number; tone?: Tone; a?: number }) => (
  <Path d={`M${p[0] - s} ${p[1]}h${2 * s}M${p[0]} ${p[1] - s}v${2 * s}`} tone={tone} a={a} />
);
export const Square = ({ p, s = 7, tone = "ink", a = 0.7 }: { p: Pt; s?: number; tone?: Tone; a?: number }) => (
  <rect x={p[0] - s} y={p[1] - s} width={2 * s} height={2 * s} style={line(tone, a, 0.75)} {...NS} />
);

// A gradient stroke from a to b: full at the ends, `mid` in the middle (the D59 curve, sampled)
function Grad({ id, a, b, tone, op, mid }: { id: string; a: Pt; b: Pt; tone: Tone; op: number; mid: number }) {
  const at = (t: number) => r2((mid + (1 - mid) * Math.pow(Math.abs(2 * t - 1), 1.2)) * op * 100) / 100;
  return (
    <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}>
      {[0, 0.2, 0.35, 0.5, 0.65, 0.8, 1].map((t) => <stop key={t} offset={t} style={{ stopColor: COL[tone], stopOpacity: at(t) }} />)}
    </linearGradient>
  );
}

// Plexus: dots joined by gradient links (D59)
export function Plexus({ id, pts, links, tone = "ink", a = 0.7, dot = 3.2, w = 0.75 }: { id: string; pts: readonly Pt[]; links: readonly (readonly [number, number])[]; tone?: Tone; a?: number; dot?: number; w?: number }) {
  return (
    <g>
      {links.map(([i, j]) => {
        const gid = `${id}-${i}-${j}`;
        return (
          <g key={gid}>
            <Grad id={gid} a={pts[i]} b={pts[j]} tone={tone} op={a} mid={0.15} />
            <path d={seg(pts[i], pts[j])} style={{ fill: "none", stroke: `url(#${gid})`, strokeWidth: w }} {...NS} />
          </g>
        );
      })}
      {pts.map((p, i) => <Dot key={i} p={p} r={dot} tone={tone} a={Math.min(1, a + 0.15)} />)}
    </g>
  );
}

// A trace along the land: the run between ticks dips to `dip` in the middle (D60); ticks every `every` points, `tick`
// px long, square to the line (up = towards the sky)
export function Trace({ id, pts, every = 4, tick = 10, tone = "ink", a = 0.6, dip = 0.3, w = 0.75, ticksAt = 1 }: { id: string; pts: readonly Pt[]; every?: number; tick?: number; tone?: Tone; a?: number; dip?: number; w?: number; ticksAt?: number }) {
  const idx: number[] = [];
  for (let i = 0; i < pts.length; i += every) idx.push(i);
  if (idx[idx.length - 1] !== pts.length - 1) idx.push(pts.length - 1);
  let td = "";
  idx.forEach((i) => {
    const p = pts[i], q = pts[Math.min(pts.length - 1, i + 1)], o = pts[Math.max(0, i - 1)];
    const dx = q[0] - o[0], dy = q[1] - o[1], l = Math.hypot(dx, dy) || 1;
    let nx = dy / l, ny = -dx / l;
    if (ny > 0) { nx = -nx; ny = -ny; }
    td += `M${p[0]} ${p[1]}L${r2(p[0] + nx * tick)} ${r2(p[1] + ny * tick)}`;
  });
  return (
    <g>
      {idx.slice(1).map((j, k) => {
        const i = idx[k], gid = `${id}-${i}`;
        return (
          <g key={gid}>
            <Grad id={gid} a={pts[i]} b={pts[j]} tone={tone} op={a} mid={dip} />
            <path d={poly(pts.slice(i, j + 1))} style={{ fill: "none", stroke: `url(#${gid})`, strokeWidth: w, strokeLinejoin: "round" }} {...NS} />
          </g>
        );
      })}
      {tick > 0 && <path d={td} style={line(tone, a * ticksAt, w)} {...NS} />}
    </g>
  );
}

// A level ruler (the rail's ticked horizon): ticks hang below the line (or above, `up`); it fades in from x0 over `fade`
// px and out towards x1 over `fadeEnd` px, so it mixes into the picture at its ends
export function Ruler({ id, x0, x1, y, step = 14, major = 5, len = 6, majorLen = 14, tone = "ink", a = 0.55, fade = 0, fadeEnd = 0, up = false }: { id: string; x0: number; x1: number; y: number; step?: number; major?: number; len?: number; majorLen?: number; tone?: Tone; a?: number; fade?: number; fadeEnd?: number; up?: boolean }) {
  let d = `M${x0} ${y}H${x1}`;
  const sgn = up ? -1 : 1, span = x1 - x0;
  for (let x = x0, i = 0; x <= x1 + 1e-6; x += step, i++) d += `M${r2(x)} ${y}v${sgn * (major && i % major === 0 ? majorLen : len)}`;
  const stops: [number, number][] = [[0, fade ? 0 : a], [fade / span, a], [1 - fadeEnd / span, a], [1, fadeEnd ? 0 : a]];
  return (
    <g>
      <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={x0} y1={y} x2={x1} y2={y}>
        {stops.map(([o, op], i) => <stop key={i} offset={r2(o * 1000) / 1000} style={{ stopColor: COL[tone], stopOpacity: op }} />)}
      </linearGradient>
      <path d={d} style={{ fill: "none", stroke: `url(#${id})`, strokeWidth: 0.75 }} {...NS} />
    </g>
  );
}

// A dash-dot construction axis with a dot at each end
export const Axis = ({ a, b, tone = "ink", op = 0.5, ends = true }: { a: Pt; b: Pt; tone?: Tone; op?: number; ends?: boolean }) => (
  <g>
    <Path d={seg(a, b)} tone={tone} a={op} dash="14 6 2 6" />
    {ends && <><Dot p={a} r={3} tone={tone} a={op + 0.2} /><Dot p={b} r={3} tone={tone} a={op + 0.2} /></>}
  </g>
);

// Four corner brackets framing a point (a sight), `w` × `h` half-sizes, arms `l` long
export const Brackets = ({ p, w, h, l = 10, tone = "ink", a = 0.6 }: { p: Pt; w: number; h: number; l?: number; tone?: Tone; a?: number }) => {
  const [x, y] = p;
  const d = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => `M${x + sx * w} ${y + sy * (h - l)}V${y + sy * h}H${x + sx * (w - l)}`).join("");
  return <Path d={d} tone={tone} a={a} />;
};

// A dial: a full circle of radial micro ticks (watchmaker), every `step` degrees, majors every `major`
export const Dial = ({ p, r, step = 6, len = -5, major = 5, majorLen = -10, tone = "ink", a = 0.4 }: { p: Pt; r: number; step?: number; len?: number; major?: number; majorLen?: number; tone?: Tone; a?: number }) => (
  <Ticks e={{ cx: p[0], cy: p[1], rx: r, ry: r }} t0={0} t1={360 - step} step={step} len={len} major={major} majorLen={majorLen} tone={tone} a={a} />
);
