// Analytics C's core stats, one drawing each, in the hero's hand: fees as coins piling up, the Intents TVL as a sealed glass vault filling, the all-time
// volume as columns rising, the shards as one plate splitting into nine, the price as a line drawn on a standing board. The markup is each drawing's
// finished frame (reduced motion, phones before they build); every moving part carries its build window (kit.ts `bld`): motion.ts scrubs the scene's
// progress 0 → 1 and the engine places each part. All decorative: the figure and its label beside each drawing say what it shows.
import type { ReactNode } from "react";
import { Bx, Chip, Cn, DashDraw, Dots, S, f, poly, vbox, GREEN, INK, type B6, type V } from "./kit";
import { onLeft, C as IC, S as IS } from "../../foundation/b/iso";

/** a matrix that lays flat text on a top face, readable from the front: baseline along −y (screen right-up), letters' tops toward −x */
const flat = (o: V) => `matrix(${f(IC)},${f(-IS)},${f(IC)},${f(IS)},${f(o[0])},${f(o[1])})`;

const ASPECT = 1.22;
const Svg = ({ vb, k, children }: { vb: string; k: string; children: ReactNode }) => (
  <svg className={`anc-sc anc-sc--${k}`} viewBox={vb} aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet">{children}</svg>
);

/* ───────────── 01 · Total fees: coins pile up on a plinth, fed by three flows ───────────── */
export function SceneFees() {
  const u = 30, R = 0.95, H = 0.27, Z = 0.5;
  const stacks = [{ x: 2.3, y: 2.3, n: 5 }, { x: 5.7, y: 2.2, n: 8 }, { x: 2.2, y: 5.7, n: 4 }, { x: 5.8, y: 5.8, n: 11 }];
  const order = stacks.map((s, i) => ({ ...s, i })).sort((a, b) => a.x + a.y - (b.x + b.y));
  const coins: { s: number; k: number }[] = [];
  for (let k = 0; k < 11; k++) stacks.forEach((s, i) => { if (k < s.n) coins.push({ s: i, k }); });
  const at = (s: number, k: number) => { const j = coins.findIndex((c) => c.s === s && c.k === k); const a = 0.1 + (0.7 * j) / coins.length; return { a, b: a + 0.09, m: "drop" as const, d: 70 }; };
  const tall = stacks[3], tt = S(tall.x, tall.y, Z + tall.n * H, u);
  const flows = [[-2.6, 1.2, 3.6], [-2.6, 4.2, 4.4], [-2.4, 7.2, 3.2]].map(([x, y, z], i) => {
    const t = stacks[[1, 3, 2][i]], a = S(x, y, z, u), b = S(t.x, t.y, Z + t.n * H + 1.1, u);
    return `M${f(a[0])},${f(a[1])}C${f(a[0] + 60)},${f(a[1] - 40)} ${f(b[0] - 40)},${f(b[1] - 70)} ${f(b[0])},${f(b[1])}`;
  });
  const vb = vbox([[-3, -1, 0], [10, 10, 0], [-3, 9, 0], [9.5, -1, 0], [0, 0, 5.5], [10, 0, 4]], u, 18, ASPECT);
  return (
    <Svg vb={vb} k="fees">
      <Dots x0={-3} y0={-2} x1={10} y1={10} u={u} o={0.32} />
      <Bx b={[0, 0, 0, 8, 8, Z]} u={u} />
      {flows.map((d, i) => <DashDraw key={i} d={d} h={{ a: 0.02 + i * 0.05, b: 0.3 + i * 0.05, m: "draw" }} />)}
      {order.map((s) => (
        <g key={s.i}>
          {Array.from({ length: s.n }, (_, k) => <Cn key={k} x={s.x} y={s.y} z={Z + k * H} r={R} h={H} u={u} face={s.i === 3 && k === s.n - 1 ? GREEN : undefined} bh={at(s.i, k)} />)}
        </g>
      ))}
      <Chip at={[tt[0] + 70, tt[1] - 58]} label="Fees" h={{ a: 0.8, b: 0.92, m: "pop" }} />
    </Svg>
  );
}

/* ───────────── 02 · Intents confidential TVL: a sealed glass vault, filling ───────────── */
export function SceneVault() {
  const u = 31, x0 = 1, y0 = 1, x1 = 7, y1 = 7, Z = 0.4, H = 4.8;
  const p = (x: number, y: number, z: number) => S(x, y, z, u);
  const sg = (a: V, b: V) => `M${f(a[0])},${f(a[1])}L${f(b[0])},${f(b[1])}`;
  const back = [sg(p(x0, y0, Z), p(x0, y0, Z + H)), sg(p(x0, y0, Z), p(x1, y0, Z)), sg(p(x0, y0, Z), p(x0, y1, Z))];
  const front = [
    poly([p(x0, y0, Z + H), p(x1, y0, Z + H), p(x1, y1, Z + H), p(x0, y1, Z + H)]) + "Z",
    sg(p(x1, y0, Z + H), p(x1, y0, Z)), sg(p(x1, y1, Z + H), p(x1, y1, Z)), sg(p(x0, y1, Z + H), p(x0, y1, Z)),
    sg(p(x1, y0, Z), p(x1, y1, Z)), sg(p(x0, y1, Z), p(x1, y1, Z)),
  ];
  const pts = (ps: V[]) => ps.map((v) => v.map(f).join(",")).join(" ");
  const faceL = pts([p(x0, y1, Z + H), p(x1, y1, Z + H), p(x1, y1, Z), p(x0, y1, Z)]), faceR = pts([p(x1, y0, Z + H), p(x1, y1, Z + H), p(x1, y1, Z), p(x1, y0, Z)]);
  const faceT = pts([p(x0, y0, Z + H), p(x1, y0, Z + H), p(x1, y1, Z + H), p(x0, y1, Z + H)]);
  const N = 6, LH = 0.6;
  const seal = p(4, y1, Z + H * 0.56);
  const vb = vbox([[-1, -1, 0], [9, 9, 0], [-1, 9, 0], [9, -1, 0], [x0, y0, Z + H + 1.4]], u, 18, ASPECT);
  return (
    <Svg vb={vb} k="vault">
      <Dots x0={-1} y0={-1} x1={9} y1={9} u={u} step={0.8} o={0.32} />
      <Bx b={[0.4, 0.4, 0, 7.2, 7.2, Z]} u={u} />
      <g fill="none" stroke={INK} strokeOpacity={0.4} strokeDasharray="2 3">{back.map((d, i) => <path key={i} d={d} />)}</g>
      {Array.from({ length: N }, (_, k) => {
        const a = 0.08 + k * 0.11;
        return <Bx key={k} b={[x0 + 0.3, y0 + 0.3, Z + k * LH, 5.4, 5.4, LH - 0.06] as B6} u={u} top={k === N - 1 ? GREEN : undefined} h={{ a, b: a + 0.13, m: "drop", d: 60 }} />;
      })}
      <g className="anc-sc-glass">
        <polygon points={faceR} fill="#FFFFFF" fillOpacity={0.18} />
        <polygon points={faceL} fill="#FFFFFF" fillOpacity={0.3} />
        <polygon points={faceT} fill="#FFFFFF" fillOpacity={0.32} />
        <g stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" opacity={0.95}>
          <path d={sg(p(x0 + 0.7, y1, Z + H - 0.5), p(x0 + 2.0, y1, Z + H - 2.2))} />
          <path d={sg(p(x0 + 1.25, y1, Z + H - 0.45), p(x0 + 1.7, y1, Z + H - 1.05))} />
        </g>
      </g>
      <g fill="none" stroke={INK} strokeLinejoin="round">{front.map((d, i) => <path key={i} d={d} />)}</g>
      <g className="anc-sc-seal" data-a="0.78" data-b="0.92" data-m="pop">
        <g transform={onLeft(seal)}>
          <circle r={u * 0.78} fill={GREEN} stroke={INK} />
          <circle r={u * 0.48} fill="none" stroke={INK} />
          <circle cy={-u * 0.1} r={u * 0.13} fill={INK} />
          <path d={`M0,${f(-u * 0.05)}L${f(-u * 0.09)},${f(u * 0.24)}L${f(u * 0.09)},${f(u * 0.24)}Z`} fill={INK} />
        </g>
      </g>
      <Chip at={(() => { const t = p(x1, y0, Z + H); return [t[0] + 18, t[1] - 18] as V; })()} label="Confidential" h={{ a: 0.84, b: 0.96, m: "pop" }} />
    </Svg>
  );
}

/* ───────────── 03 · Intents all-time volume: columns rising, the newest the tallest ───────────── */
export function SceneVolume() {
  const u = 29, Z = 0.4, CW = 1.25, CH = 0.6, hs = [1, 2, 3, 5, 8];
  const cols = hs.map((n, i) => ({ x: 0.7 + i * 1.75, y: 3.4, n }));
  const total = hs.reduce((s, n) => s + n, 0);
  let j = 0;
  const tops = cols.map((c) => S(c.x + CW / 2, c.y + CW / 2, Z + c.n * CH, u));
  const last = tops[tops.length - 1];
  const vb = vbox([[-1, -1, 0], [10.5, 9, 0], [-1, 8, 0], [10.5, 0, 0], [9.5, 3.4, Z + 8 * CH + 1.6]], u, 18, ASPECT);
  return (
    <Svg vb={vb} k="volume">
      <Dots x0={-1} y0={-1} x1={10} y1={9} u={u} o={0.32} />
      <Bx b={[0, 2.6, 0, 9.6, 2.8, Z]} u={u} />
      {cols.map((c, ci) => (
        <g key={ci}>
          {Array.from({ length: c.n }, (_, k) => {
            const a = 0.06 + (0.7 * j++) / total;
            return <Bx key={k} b={[c.x, c.y, Z + k * CH, CW, CW, CH - 0.04]} u={u} top={ci === cols.length - 1 && k === c.n - 1 ? GREEN : undefined} h={{ a, b: a + 0.08, m: "drop", d: 50 }} />;
          })}
        </g>
      ))}
      <DashDraw d={poly(tops.map((t) => [t[0], t[1] - 14] as V))} dash="3 3" o={1} h={{ a: 0.74, b: 0.9, m: "draw" }} />
      <Chip at={[last[0] + 24, last[1] - 34]} label="All-time" h={{ a: 0.84, b: 0.96, m: "pop" }} />
    </Svg>
  );
}

/* ───────────── 04 · Shards online: one plate splits into nine ───────────── */
export function SceneShards() {
  const u = 27, Z = 0.45, PH = 0.32, PS = 2.8, G = 0.6;
  const plates = Array.from({ length: 9 }, (_, k) => ({ k, c: k % 3, r: Math.floor(k / 3) })).sort((a, b) => a.c + a.r - (b.c + b.r) || a.c - b.c);
  const vb = vbox([[-1, -1, 0], [12, 12, 0], [-1, 12, 0], [12, -1, 0], [0, 0, 2.4]], u, 18, ASPECT);
  const tip = S(10.8, 0.6, Z + PH, u);
  return (
    <Svg vb={vb} k="shards">
      <Dots x0={-1} y0={-1} x1={12} y1={12} u={u} o={0.32} />
      <Bx b={[0, 0, 0, 10.8, 10.8, Z]} u={u} />
      <g data-a="0.5" data-b="0.78" data-m="out"><Bx b={[0.6, 0.6, Z, 9.6, 9.6, PH]} u={u} /></g>
      {plates.map((p, i) => {
        const x = G + p.c * (PS + G), y = G + p.r * (PS + G), a = 0.16 + i * 0.075;
        return (
          <g key={p.k} data-a={a.toFixed(3)} data-b={(a + 0.11).toFixed(3)} data-m="pop">
            <Bx b={[x, y, Z, PS, PS, PH]} u={u} top={i === plates.length - 1 ? GREEN : undefined} />
            <text className="anc-sc-n" transform={flat(S(x, y + PS, Z + PH, u))} x={10} y={18}>{String(p.k).padStart(2, "0")}</text>
          </g>
        );
      })}
      <Chip at={[tip[0] + 14, tip[1] - 24]} label="Shards" h={{ a: 0.86, b: 0.97, m: "pop" }} />
    </Svg>
  );
}

/* ───────────── 05 · NEAR price: a line drawn on a standing board ───────────── */
export const PRICE_LINE = Array.from({ length: 30 }, (_, i) => 2.64 + i * 0.0068 + Math.sin(i * 0.7) * 0.05 + Math.sin(i * 1.9 + 1) * 0.025);   // SAMPLE shape
export function ScenePrice() {
  const u = 29, Z = 0.4, BX = 0.6, BY = 2.6, BW = 9.2, BD = 0.36, BH = 5.4;
  const W = BW * u, Hh = BH * u, m = 0.55 * u;
  const lo = Math.min(...PRICE_LINE), hi = Math.max(...PRICE_LINE);
  const pts: V[] = PRICE_LINE.map((v, i) => [m + (i / (PRICE_LINE.length - 1)) * (W - 2 * m), Hh - m - ((v - lo) / (hi - lo)) * (Hh - 2.6 * m)]);
  const end = pts[pts.length - 1];
  const o = S(BX, BY + BD, Z + BH, u);
  const vb = vbox([[-1, 0, 0], [11, 6, 0], [-1, 6, 0], [11, 0, 0], [BX, BY, Z + BH + 0.6], [BX + BW, BY, Z + BH + 0.6]], u, 18, ASPECT);
  const tp = S(BX + BW, BY + BD, Z + BH, u);
  return (
    <Svg vb={vb} k="price">
      <Dots x0={-1} y0={0} x1={11} y1={7} u={u} o={0.32} />
      <Bx b={[0, 1.6, 0, 10.4, 3.2, Z]} u={u} />
      <Bx b={[BX, BY, Z, BW, BD, BH]} u={u} />
      <g transform={onLeft(o)}>
        <g stroke={INK} strokeOpacity={0.22} strokeDasharray="2 4">
          {[1, 2, 3, 4].map((k) => <path key={k} d={`M${f(m)},${f((Hh / 5) * k)}H${f(W - m)}`} />)}
        </g>
        <path d={poly(pts) + `L${f(end[0])},${f(Hh - m)}L${f(pts[0][0])},${f(Hh - m)}Z`} fill={GREEN} fillOpacity={0.14} stroke="none" data-a="0.55" data-b="0.8" data-m="fade" />
        <path d={poly(pts)} fill="none" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" pathLength={1} data-a="0.1" data-b="0.75" data-m="draw" />
        <g data-a="0.72" data-b="0.84" data-m="pop"><circle cx={f(end[0])} cy={f(end[1])} r={6} fill={GREEN} stroke={INK} /></g>
        <text className="anc-sc-axis" x={f(m)} y={f(m * 0.8)}>30D</text>
      </g>
      <Chip at={[tp[0] + 4, tp[1] - 22]} label="NEAR / USD" h={{ a: 0.82, b: 0.95, m: "pop" }} />
    </Svg>
  );
}

export const SCENES = { fees: SceneFees, tvl: SceneVault, volume: SceneVolume, shards: SceneShards, price: ScenePrice } as const;

/* ───────────── SVRN (featured card): a sealed block held over its plinth, four pillars standing round it ───────────── */
export function SvrnArt() {
  const u = 22, Z = 0.4;
  const pillars: B6[] = [[0.9, 0.9, Z, 1, 1, 2.2], [7.1, 0.9, Z, 1, 1, 1.6], [0.9, 7.1, Z, 1, 1, 1.8], [7.1, 7.1, Z, 1, 1, 2.6]];
  const o = S(2.9, 6.1, 5.4, u);
  const vb = vbox([[-1, -1, 0], [10, 10, 0], [-1, 10, 0], [10, -1, 0], [2.9, 2.9, 6.6]], u, 14, 1.35);
  const order = pillars.slice().sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  return (
    <svg className="anc-sv" viewBox={vb} aria-hidden="true" focusable="false">
      <Dots x0={-1} y0={-1} x1={10} y1={10} u={u} o={0.32} />
      <Bx b={[0, 0, 0, 9, 9, Z]} u={u} />
      <path d={poly([S(2.6, 2.6, Z, u), S(6.4, 2.6, Z, u), S(6.4, 6.4, Z, u), S(2.6, 6.4, Z, u)]) + "Z"} fill="none" stroke={INK} strokeOpacity={0.4} strokeDasharray="2 3" />
      {order.slice(0, 1).map((b, i) => <Bx key={i} b={b} u={u} />)}
      <g className="anc-sv-core">
        <Bx b={[2.9, 2.9, 2.2, 3.2, 3.2, 3.2]} u={u}>
          <g transform={onLeft(o)}>
            <circle cx={f(1.6 * u)} cy={f(1.6 * u)} r={u * 0.66} fill={GREEN} stroke={INK} />
            <circle cx={f(1.6 * u)} cy={f(1.6 * u)} r={u * 0.42} fill="none" stroke={INK} />
            <circle cx={f(1.6 * u)} cy={f(1.48 * u)} r={u * 0.12} fill={INK} />
            <path d={`M${f(1.6 * u)},${f(1.52 * u)}l${f(-0.08 * u)},${f(0.26 * u)}h${f(0.16 * u)}Z`} fill={INK} />
          </g>
        </Bx>
      </g>
      {order.slice(1).map((b, i) => <Bx key={i} b={b} u={u} top={i === 2 ? GREEN : undefined} />)}
    </svg>
  );
}

/** a tool's monogram, set on the top of a small iso tile (our own type: no third-party logo artwork) */
export function Tile({ mono }: { mono: string }) {
  const u = 16, b: B6 = [0, 0, 0, 2.6, 1.6, 1.5];
  const vb = vbox([[0, 0, 0], [2.6, 1.6, 0], [0, 1.6, 0], [2.6, 0, 0], [0, 0, 2.6]], u, 3);
  const o = S(0, 1.6, 1.5, u);
  return (
    <svg className="anc-tile" viewBox={vb} aria-hidden="true" focusable="false">
      <ellipse className="anc-tile__sh" cx={f(S(1.3, 0.8, 0, u)[0])} cy={f(S(1.3, 0.8, 0, u)[1] + 4)} rx={f(2.2 * u)} ry={f(0.7 * u)} />
      <g className="anc-tile__b">
        <Bx b={b} u={u}>
          <text className="anc-tile__t" transform={onLeft(o)} x={f(1.3 * u)} y={f(0.75 * u + 5)} textAnchor="middle">{mono}</text>
        </Bx>
      </g>
    </svg>
  );
}
