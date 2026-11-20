// [[TBD: graphic by Ali]] placeholder: History X's hero drawing, in the site's isometric hand (Community B's kit: ../../community/b/kit.ts, the slab from
// ../../community/b/parts.tsx; Foundation C's geometry underneath: 2:1 iso, x right-down, y left-down, z up); a designer redraws it.
// "From 2017 to now": a flight of slabs on a dotted floor, one per milestone year (../content.ts MILESTONES, each year once), climbing away to the upper
// right: 2017 the lowest, at the front, 2026 the tallest, at the back, its top the one green ("now"). A small white figure stands on the green top; the two
// ends are named on the floor beside them (2017, 2026). motion.ts builds it once as the page opens (the floor fades in, then step by step, 2017 first, each
// rises a little as its edges draw and its faces fill; the green, the names and the figure last) and, while it is on screen, the figure climbs the flight
// from 2017 to the green top, one step at a time, and the green answers with a soft ripple when it arrives. Reduced motion: the finished frame (the figure on
// the green top, still). Decorative (aria-hidden): the headline carries the meaning.
import { P, f, box, corners, vbox, dots, tr, PAWN, type V } from "../../community/b/kit";
import { Slab } from "../../community/b/parts";
import { MILESTONES } from "../content";

/** the years on the flight: each milestone year once, in order (2018 has two milestones, one step) */
export const YEARS = [...new Set(MILESTONES.map((m) => m.year))];
const N = YEARS.length;

/* one step: W wide (along x), D deep (along y), G apart; the first H0 tall, each next one DH taller. The flight climbs along −y (up and to the right
   on screen), centred on the origin */
const W = 96, D = 40, G = 8, H0 = 18, DH = 19;
const Y0 = (N * D + (N - 1) * G) / 2 - D;
type B6 = [number, number, number, number, number, number];
export const stepBox = (i: number): B6 => [-W / 2, Y0 - i * (D + G), W, D, 0, H0 + i * DH];
/** the middle of step i's top, in world units: where the figure stands */
export const topAt = (i: number): [number, number, number] => { const b = stepBox(i); return [0, b[1] + D / 2, b[5]]; };

/** the figure: Community B's person, a size up to suit the steps; LIFT is how high a hop arcs over the step it lands on */
export const PAWN_K = 1.35, LIFT = 22;
/** where the figure stands, on screen, part way (u, 0 to 1) through the hop from step i to step i + 1 */
export function hop(i: number, u: number): V {
  const a = topAt(i), b = topAt(Math.min(N - 1, i + 1)), k = (s: number, t: number) => s + (t - s) * u;
  return P(k(a[0], b[0]), k(a[1], b[1]), k(a[2], b[2]) + LIFT * 4 * u * (1 - u));
}
export const pawnTr = (v: V) => `${tr(v)} scale(${PAWN_K})`;

/** the green top's outline grown by d world units all round (the ripple when the figure arrives) */
export function ripple(d: number) {
  const [x, y, w, dd, , h] = stepBox(N - 1);
  return [P(x - d, y - d, h), P(x + w + d, y - d, h), P(x + w + d, y + dd + d, h), P(x - d, y + dd + d, h)].map((p) => `${f(p[0])},${f(p[1])}`).join(" ");
}

// the frame hugs the flight (and the figure's head on the top step); the dotted floor runs past it and fades out under the mask
const FLOOR = { x: 128, y: 208, step: 20 };
const ALL: V[] = [...YEARS.flatMap((_, i) => corners(box(...stepBox(i)))), ((): V => { const t = P(...topAt(N - 1)); return [t[0], t[1] - 34 * PAWN_K]; })(),
  P(W / 2 + 40, Y0 + D, 0), P(-W / 2, Y0 + D + 24, 0)];
const VB = vbox(ALL, 10);

/** a year's name, laid flat on the floor beside its step's right face (reading along the flight) */
function Label({ i }: { i: number }) {
  const [x, y, , dd] = stepBox(i), o = P(x + W + 14, y + dd, 0), C = Math.cos(Math.PI / 6);
  return <text className="hx-iso__yr" transform={`matrix(${f(C)},-0.5,${f(C)},0.5,${f(o[0])},${f(o[1])})`} y="12">{YEARS[i]}</text>;
}

export function HeroIso() {
  const back = YEARS.map((_, i) => N - 1 - i);   // back to front: 2026 first
  const top = stepBox(N - 1), tb = box(...top);
  const g = [P(tb.x0, tb.y0, tb.z1), P(tb.x1, tb.y0, tb.z1), P(tb.x1, tb.y1, tb.z1), P(tb.x0, tb.y1, tb.z1)].map((p) => `${f(p[0])},${f(p[1])}`).join(" ");
  return (
    <svg className="hx-iso" viewBox={VB.s} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="hx-iso-fade" cx="50%" cy="62%" r="52%"><stop offset="0.35" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <mask id="hx-iso-m" maskUnits="userSpaceOnUse" x={f(VB.x - 24)} y={f(VB.y)} width={f(VB.w + 48)} height={f(VB.h + 40)}>
          <rect x={f(VB.x - 24)} y={f(VB.y)} width={f(VB.w + 48)} height={f(VB.h + 40)} fill="url(#hx-iso-fade)" />
        </mask>
      </defs>
      <path className="hx-iso__floor d-floor" d={dots(-FLOOR.x, -FLOOR.y, FLOOR.x, FLOOR.y, FLOOR.step)} mask="url(#hx-iso-m)" />
      {back.map((i) => (
        <g key={YEARS[i]} className="hx-iso__step" data-step={i}>
          <Slab b={stepBox(i)} />
          {i === N - 1 && <>
            <polygon className="hx-iso__now d-o" points={g} />
            <polygon className="hx-iso__ripple" data-ripple="" points={ripple(0)} />
          </>}
        </g>
      ))}
      <g className="d-o"><Label i={0} /><Label i={N - 1} /></g>
      <g className="d-o">
        <g className="pw hx-iso__pawn" data-pawn="" transform={pawnTr(P(...topAt(N - 1)))}>
          <path className="pw__b" d={PAWN.side} />
          <ellipse className="pw__t" cx={f(PAWN.cx)} cy={f(PAWN.cy)} rx={f(PAWN.rx)} ry={f(PAWN.ry)} />
          <circle className="pw__h" cx="0" cy={f(PAWN.hy)} r={f(PAWN.hr)} />
        </g>
      </g>
    </svg>
  );
}
