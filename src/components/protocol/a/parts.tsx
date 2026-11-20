// Protocol A's drawing parts, in the site's iso hand: a box (three faces, ink hairlines), a glass box (faces at a breath, its back edges dotted),
// a pawn (an agent or an auditor: a base, a body, a head), a floor coin (a chain's plinth) and a label (a dot, a leader, mono text).
import { P, box, coin, f, faces, wireAll, type B6, type V } from "./kit";

/** a box: its three faces. cls: pa-g (green), pa-dk (dark), pa-c (a chunk) … */
export function Blk({ b, cls = "" }: { b: B6; cls?: string }) {
  const fc = faces(box(...b));
  return (
    <g className={`pa-b ${cls}`}>
      <polygon className="pa-l" points={fc.left} />
      <polygon className="pa-r" points={fc.right} />
      <polygon className="pa-t" points={fc.top} />
    </g>
  );
}
/** a glass box: its faces at a breath, every edge drawn (the back ones dotted) */
export function Glass({ b, cls = "" }: { b: B6; cls?: string }) {
  const bx = box(...b), fc = faces(bx);
  return (
    <g className={`pa-gl ${cls}`}>
      <path className="pa-gl__h" d={wireAll(bx).slice(wireAll(bx).indexOf("M", 1))} />
      <polygon className="pa-gl__l" points={fc.left} />
      <polygon className="pa-gl__r" points={fc.right} />
      <polygon className="pa-gl__t" points={fc.top} />
    </g>
  );
}
/** a pawn standing on (x, y, z): a base, a body, a head; `ant`: an antenna with a green tip (an agent) */
export function Pawn({ x, y, z = 0, ant = false, cls = "" }: { x: number; y: number; z?: number; ant?: boolean; cls?: string }) {
  const base = coin(x, y, z, 7, 4), body = coin(x, y, z + 4, 4, 13);
  const [hx, hy] = P(x, y, z + 21);
  return (
    <g className={`pa-pw ${cls}`}>
      <path className="pa-pw__s" d={base.side} />
      <ellipse className="pa-pw__t" cx={f(base.cx)} cy={f(base.cy)} rx={f(base.rx)} ry={f(base.ry)} />
      <path className="pa-pw__s" d={body.side} />
      <circle className="pa-pw__h" cx={f(hx)} cy={f(hy)} r="5.2" />
      {ant && <><path className="pa-pw__a" d={`M${f(hx)},${f(hy - 5)}V${f(hy - 13)}`} /><circle className="pa-pw__dot" cx={f(hx)} cy={f(hy - 14.5)} r="2.2" /></>}
    </g>
  );
}
/** a plinth: a short cylinder on the floor */
export function Plinth({ x, y, r = 16, h = 8, cls = "" }: { x: number; y: number; r?: number; h?: number; cls?: string }) {
  const c = coin(x, y, 0, r, h);
  return (
    <g className={`pa-pl ${cls}`}>
      <path className="pa-pl__s" d={c.side} />
      <ellipse className="pa-pl__t" cx={f(c.cx)} cy={f(c.cy)} rx={f(c.rx)} ry={f(c.ry)} />
    </g>
  );
}
/** a label: a dot on the anchor, a leader out to the text (mono, fs in the drawing's units: each drawing sets it so the text reads at about 11 px),
 *  set at d from the anchor */
export function Lab({ a, d, t, k, fs = 10.5, cls = "" }: { a: V; d: V; t: string; k?: string; fs?: number; cls?: string }) {
  const tx = a[0] + d[0], ty = a[1] + d[1], left = d[0] < 0;
  return (
    <g className={`pa-lab ${cls}`} data-k={k} aria-hidden="true">
      <circle className="pa-lab__dot" cx={f(a[0])} cy={f(a[1])} r="2.2" />
      <path className="pa-lab__ln" d={`M${f(a[0])},${f(a[1])}L${f(tx)},${f(ty)}h${left ? -4 : 4}`} />
      <text x={f(tx + (left ? -fs * 0.75 : fs * 0.75))} y={f(ty + fs * 0.34)} textAnchor={left ? "end" : "start"} style={{ fontSize: fs }}>{t}</text>
    </g>
  );
}

/** a key over an account (screen units, centred on c): the old one (an elliptic-curve key: a plain bow) or the quantum-safe one (q: its bow green,
 *  a lattice in it). The inner group (.pa-key__in) is what turns */
export function Key({ c, q = false, cls = "" }: { c: V; q?: boolean; cls?: string }) {
  return (
    <g className={`pa-key ${q ? "pa-key--q" : "pa-key--o"} ${cls}`} transform={`translate(${f(c[0])} ${f(c[1])})`}>
      <g className="pa-key__in">
        <circle className="pa-key__bow" cx="-14" cy="0" r="11" />
        {q
          ? <g className="pa-key__lat">{[-1, 0, 1].flatMap((a) => [-1, 0, 1].map((b) => <circle key={`${a}${b}`} cx={f(-14 + a * 4.2)} cy={f(b * 4.2)} r="1" />))}</g>
          : <circle className="pa-key__hole" cx="-14" cy="0" r="3.6" />}
        <path className="pa-key__sh" d={q ? "M-3,0H26M17,0v6.5M22,0v6.5M26,0v4" : "M-3,0H26M18,0v6M23,0v4.5"} />
      </g>
    </g>
  );
}

/** where a label's text ends (for a drawing's viewBox): mono, about 0.62 em a character */
export const labEnd = (a: V, d: V, t: string, fs = 10.5): V => [a[0] + d[0] + (d[0] < 0 ? -1 : 1) * (t.length * fs * 0.62 + fs), a[1] + d[1] - fs];
