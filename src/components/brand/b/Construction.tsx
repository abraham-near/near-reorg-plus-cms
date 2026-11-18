// Brand B, the hero's drawing: the NEAR mark as a construction. The real mark (public/brand/icon.svg) stands on its tile, on a plinth, on a dotted floor;
// the construction is drawn on the plane of the tile's face (onLeft), so it shears with it: a fine grid under the mark, the keylines through its edges
// and centre (they run on past the tile), the mark's box, the clear-space box (dashed, green) closing in round it, the circles of its rounded
// terminals and the diagonal, then the dimensions (x) and the labels, set flat on screen.
// The tile, the plinth and the floor build once on arrival (kit.ts buildTimeline); every construction piece carries its stretch of the scroll
// (data-s="from to") and how it arrives (data-m: draw, fade or close), painted by motion.ts. The markup is the finished drawing (reduced motion).
import { P, f, line, cornersOf, dots, onLeft, vbox, type B6, type V } from "./kit";
import { Slab } from "./parts";

/* the tile: x 0…240, y −4…24, z 12…252; its face (y = 24) is the drawing's plane, a 240-unit square, a right and b down from its top-left corner */
const S = 240, FY = 24, FZ = 252, TILE: B6 = [0, -4, S, 28, 12, S], PLINTH: B6 = [-50, -50, 340, 120, 0, 12];
const IMG = { o: 20, s: 200 };                               // icon.svg's 639 square, set 200 wide inside the face
const k = IMG.s / 639, M0 = IMG.o + 144 * k, M1 = IMG.o + 495 * k, R = 37.39 * k, MID = S / 2;   // the mark's box (144…495) and its corner radius
const Q = (a: number, b: number): V => P(a, FY, FZ - b);   // a point on the face, on screen

type Piece = { d: string; s: [number, number] };
const KEY_V = [MID, M0, M1].map((a, i): Piece => ({ d: `M${f(a)},-64V250`, s: [0.06 + i * 0.07, 0.3 + i * 0.07] }));
const KEY_H = [MID, M0, M1].map((b, i): Piece => ({ d: `M-70,${f(b)}H310`, s: [0.1 + i * 0.07, 0.34 + i * 0.07] }));
const GRID = (() => { let d = ""; for (let i = 1; i < 16; i++) { const v = f((i * S) / 16); d += `M${v},0V${S}M0,${v}H${S}`; } return d; })();
const CIRC: [number, number][] = [[M0 + R, M0 + R], [M1 - R, M0 + R], [M0 + R, M1 - R], [M1 - R, M1 - R]];
const DIAG = (() => { const e = 46 / Math.SQRT2, a = M0 + R, b = M1 - R; return `M${f(a - e)},${f(a - e)}L${f(b + e)},${f(b + e)}`; })();
/* the dimensions: a line with a tick at each end, just outside the face */
const dim = (a0: number, a1: number, b: number, vert = false) => {
  const t = 5, L = (x0: number, y0: number, x1: number, y1: number) => (vert ? `M${f(y0)},${f(x0)}L${f(y1)},${f(x1)}` : `M${f(x0)},${f(y0)}L${f(x1)},${f(y1)}`);
  return L(a0, b, a1, b) + L(a0, b - t, a0, b + t) + L(a1, b - t, a1, b + t);
};
const DIMS: Piece[] = [
  { d: dim(IMG.o, M0, -16), s: [0.7, 0.8] },
  { d: dim(M1, IMG.o + IMG.s, -16), s: [0.74, 0.84] },
  { d: dim(IMG.o, M0, -16, true), s: [0.76, 0.86] },
  { d: dim(M0, M1, S + 16), s: [0.78, 0.88] },
];
/* labels, flat on screen: where on the face, the nudge, the text */
type Lab = { at: V; dx: number; dy: number; t: string; end?: boolean; g?: boolean };
const LABS: Lab[] = [
  { at: Q((IMG.o + M0) / 2, -16), dx: 0, dy: -12, t: "x", g: true },
  { at: Q((M1 + IMG.o + IMG.s) / 2, -16), dx: 0, dy: -12, t: "x", g: true },
  { at: Q(-16, (IMG.o + M0) / 2), dx: -14, dy: 3.5, t: "x", g: true },
  { at: Q((M0 + M1) / 2, S + 16), dx: -4, dy: 22, t: "mark", end: true },
  { at: Q(310, M0), dx: 8, dy: 4, t: "keyline" },
  { at: Q(310, MID), dx: 8, dy: 4, t: "centre" },
  { at: Q(-70, M1), dx: -8, dy: 4, t: "clear space", end: true },
];

export const VIEW = (() => {
  const ps: V[] = [...cornersOf(PLINTH), ...cornersOf(TILE), P(-110, -110), P(350, -110), P(-110, 130), P(350, 130), Q(MID, -64), Q(-70, MID), Q(310, MID), Q(MID, 250)];
  return vbox(ps, 40);
})();

export function Construction({ cls = "" }: { cls?: string }) {
  const img = onLeft(0, FY, FZ);
  return (
    <svg className={`bb-svg bb-con ${cls}`} viewBox={VIEW.s} data-draw="self" aria-hidden="true" focusable="false">
      <path className="bb-dots d-floor" d={dots(-110, -110, 350, 130, 20)} />
      <Slab b={PLINTH} />
      <Slab b={TILE} cls="bb-con__tile" />
      <g transform={img}>
        <path className="bb-con__grid" d={GRID} data-s="0 0.2" data-m="fade" />
        <image className="d-o" href="/brand/icon.svg" x={IMG.o} y={IMG.o} width={IMG.s} height={IMG.s} preserveAspectRatio="xMidYMid meet" />
        <g className="bb-con__keys">
          {KEY_V.concat(KEY_H).map((p, i) => <path key={i} className={i % 3 === 0 ? "is-mid" : ""} d={p.d} pathLength={1} data-s={p.s.join(" ")} data-m="draw" />)}
        </g>
        <path className="bb-con__box" d={`M${f(M0)},${f(M0)}H${f(M1)}V${f(M1)}H${f(M0)}Z`} pathLength={1} data-s="0.3 0.46" data-m="draw" />
        <rect className="bb-con__clear" x={IMG.o} y={IMG.o} width={IMG.s} height={IMG.s} data-s="0.4 0.58" data-m="close" />
        <g className="bb-con__circ">
          {CIRC.map(([a, b], i) => <circle key={i} cx={f(a)} cy={f(b)} r={f(R)} pathLength={1} data-s={`${0.5 + i * 0.04} ${0.62 + i * 0.04}`} data-m="draw" />)}
          <circle className="is-big" cx={f(MID)} cy={f(MID)} r={f((M1 - M0) / 2)} pathLength={1} data-s="0.6 0.78" data-m="draw" />
          <path d={DIAG} pathLength={1} data-s="0.62 0.76" data-m="draw" />
        </g>
        <g className="bb-con__dims">{DIMS.map((p, i) => <path key={i} d={p.d} data-s={p.s.join(" ")} data-m="fade" />)}</g>
      </g>
      <g className="bb-con__labs">
        {LABS.map((l, i) => (
          <g key={i} className={l.g ? "is-g" : ""} data-s={`${0.8 + (i % 4) * 0.03} ${0.92 + (i % 4) * 0.02}`} data-m="fade">
            {l.g && <circle cx={f(l.at[0] + l.dx)} cy={f(l.at[1] + l.dy - 3.5)} r="7.5" />}
            <text x={f(l.at[0] + l.dx)} y={f(l.at[1] + l.dy)} textAnchor={l.g ? "middle" : l.end ? "end" : "start"}>{l.t}</text>
          </g>
        ))}
      </g>
      <path className="bb-con__lead" d={line(Q(-70, M1), Q(IMG.o, IMG.o + IMG.s))} data-s="0.84 0.96" data-m="fade" />
    </svg>
  );
}
