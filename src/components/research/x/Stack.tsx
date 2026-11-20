// [[TBD: graphic by Ali]] Research X's one header graphic, a placeholder until the research brand exists: Research B's iso "stack of papers"
// (../b/Stack.tsx, its kit and parts trimmed and copied here so this version stands on its own). The four papers as bound documents on a dotted floor,
// the White Paper on top with its green tab, each tab ruled off to its short name (no numbers), one loose sheet lifted off the cover over its shadow.
// It builds once as the page opens and the sheet floats (motion.ts); reduced motion shows the finished frame. Decorative: the copy carries the meaning.
import { PAPERS } from "../content";

/* ───────────── the iso kit (from ../b/kit.ts): 2:1 iso, x right-down, y left-down, z up */
type V = [number, number];
type B6 = [number, number, number, number, number, number];
const C30 = Math.cos(Math.PI / 6);
const P = (x: number, y: number, z = 0): V => [(x - y) * C30, (x + y) * 0.5 - z];
export const f = (n: number) => (Math.round(n * 100) / 100).toString();
const pts = (...ps: V[]) => ps.map((p) => `${f(p[0])},${f(p[1])}`).join(" ");
const line = (...ps: V[]) => "M" + ps.map((p) => `${f(p[0])},${f(p[1])}`).join("L");
const onTop = (x: number, y: number, z: number) => { const o = P(x, y, z); return `matrix(${f(C30)},0.5,${f(-C30)},0.5,${f(o[0])},${f(o[1])})`; };

function box([x, y, w, d, z0, h]: B6) { return { x0: x, x1: x + w, y0: y, y1: y + d, z0, z1: z0 + h }; }
function corners(b: B6): V[] {
  const { x0, x1, y0, y1, z0, z1 } = box(b);
  return [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0)];
}
function dots(x0: number, y0: number, x1: number, y1: number, step: number) {
  let d = "";
  for (let x = x0; x <= x1 + 1e-6; x += step) for (let y = y0; y <= y1 + 1e-6; y += step) { const [a, b] = P(x, y); d += `M${f(a)},${f(b)}h0`; }
  return d;
}
function vbox(ps: V[], m: number) {
  let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
  for (const [x, y] of ps) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); }
  return `${f(a - m)} ${f(b - m)} ${f(c - a + 2 * m)} ${f(d - b + 2 * m)}`;
}

/** a box as its three faces (top, left, right) and its visible edges as one path that draws in */
function Slab({ b, green = false }: { b: B6; green?: boolean }) {
  const { x0, x1, y0, y1, z0, z1 } = box(b);
  const A = P(x1, y1, z0), B = P(x1, y1, z1), Cc = P(x0, y1, z1), D = P(x0, y1, z0), E = P(x1, y0, z0), F = P(x1, y0, z1), G = P(x0, y0, z1);
  return (
    <g className={`rx-sl${green ? " rx-sl--g" : ""}`}>
      <g className="d-f">
        <polygon className="rx-sl__l" points={pts(Cc, B, A, D)} />
        <polygon className="rx-sl__r" points={pts(F, B, A, E)} />
        <polygon className="rx-sl__t" points={pts(G, F, B, Cc)} />
      </g>
      <path className="rx-sl__e d-e" d={line(A, B, Cc, D, A, E, F, B, F, G, Cc)} pathLength={1} />
    </g>
  );
}
/** lines of text laid flat on a top face; the first `head` rows a heading */
function Text({ x, y, z, w, rows, gap, head }: { x: number; y: number; z: number; w: number; rows: number; gap: number; head: number }) {
  let d = "", hd = "";
  for (let i = 0; i < rows; i++) {
    const len = i < head ? w * 0.62 : (i - head) % 4 === 3 ? w * 0.58 : w;
    const s = `M0,${f(i * gap)}h${f(len)}`;
    if (i < head) hd += s; else d += s;
  }
  return (
    <g className="rx-tx" transform={onTop(x, y, z)}>
      <path className="rx-tx__h" d={hd} />
      <path className="rx-tx__l" d={d} />
    </g>
  );
}

/* ───────────── the stack (geometry as ../b/Stack.tsx) */
const W = 96, D = 132, H = 7, STEP = 10;
const NUDGE: [number, number][] = [[0, 0], [2, -5], [-2, 4], [1, -2]];
const n = PAPERS.length;
/** stack position s (0: the floor) holds paper n - 1 - s: the first paper on top */
const docs = NUDGE.slice(0, n).map(([dx, dy], s): { b: B6; i: number } => ({ b: [dx, dy, W, D, s * STEP, H], i: n - 1 - s }));
const tab = (s: number): B6 => { const [x, y, w, , z] = docs[s].b; return [x + w - 3, y + 14 + docs[s].i * 28, 13, 20, z + 2.5, 2]; };
const TIP = (s: number): V => { const t = tab(s); return P(t[0] + t[2], t[1] + t[3] / 2, t[4] + t[5]); };
const COL = 132;   // the labels' column (screen x)
const TOP = n * STEP - (STEP - H);
const SHEET: B6 = [14, -9, 82, 114, TOP + 32, 1];
const top = docs[n - 1].b;
const VB = vbox([
  ...docs.flatMap((d) => corners(d.b)), ...docs.map((_, s) => TIP(s)), ...corners(SHEET),
  [COL + 150, TIP(n - 1)[1] - 10], [COL + 150, TIP(0)[1] + 10], P(-12, D + 12), P(W + 12, -12),
], 10);

export function PaperStack() {
  const [sx, sy, sw, sd, sz] = SHEET;
  const sh = (x: number, y: number) => P(x, y, TOP);
  const y0 = Math.max(sy + 6, top[1]), y1 = Math.min(sy + sd + 6, top[1] + D);
  return (
    <svg className="rx-stack" viewBox={VB} aria-hidden="true" focusable="false">
      <path className="rx-dots d-floor" d={dots(-12, -12, W + 12, D + 12, 12)} />
      {docs.map((d, s) => (
        <g key={s} className="d-p">
          <Slab b={d.b} />
          <Slab b={tab(s)} green={d.i === 0} />
        </g>
      ))}
      <g className="d-o">
        <rect className="rx-mark" width="10" height="10" transform={onTop(top[0] + 8, top[1] + 9, TOP)} />
        <Text x={top[0] + 9} y={top[1] + 32} z={TOP} w={76} rows={15} gap={6} head={2} />
      </g>
      {/* each paper's short name, ruled off its tab (real titles, no numbers) */}
      <g className="d-o">
        {docs.map((d, s) => {
          const [x, y] = TIP(s);
          return (
            <g key={s} className={`rx-lab${d.i === 0 ? " is-on" : ""}`}>
              <path d={line([x + 4, y], [COL, y])} />
              <circle cx={f(COL + 4)} cy={f(y)} r="3" />
              <text x={f(COL + 14)} y={f(y + 4)}>{PAPERS[d.i].short}</text>
            </g>
          );
        })}
      </g>
      <polygon className="rx-shadow d-o" points={pts(sh(sx, y0), sh(sx + sw, y0), sh(sx + sw, y1), sh(sx, y1))} />
      <g className="rx-sheet d-p">
        <Slab b={SHEET} />
        <Text x={sx + 9} y={sy + 12} z={sz + 1} w={62} rows={16} gap={6} head={1} />
      </g>
    </svg>
  );
}
