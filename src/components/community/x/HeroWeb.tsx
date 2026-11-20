// [[TBD: graphic by Ali]] Community X's hero drawing, a placeholder in the site's isometric hand (Community B's kit: ../b/kit.ts, ../b/parts.tsx).
// "The open web": crews on their own tiles, spread over a dotted floor at different heights, joined to each other by threads through the air.
// The middle crew holds the one green figure. Decorative (aria-hidden): the headline carries the meaning.
// Motion (./motion.ts, hero()): it builds in as the page opens (the floor, the tiles back to front, the threads, the people), then, while on screen,
// small signals run out along the threads from the middle crew and a ring breathes off the green figure. Reduced motion: the finished frame, no signals.
import { P, f, box, corners, vbox, arc, dots, PAWN, type V } from "../b/kit";
import { Slab, Pawn } from "../b/parts";

type W3 = [number, number, number];
const T = 40;   // a tile's footprint
/** the crews: tile centre, tile height and how many people stand on it (back to front) */
const CREWS: { c: [number, number]; h: number; n: number; g?: boolean }[] = [
  { c: [-40, -118], h: 34, n: 1 },
  { c: [62, -86], h: 18, n: 2 },
  { c: [-112, -20], h: 22, n: 2 },
  { c: [0, 0], h: 30, n: 3, g: true },
  { c: [104, 22], h: 12, n: 2 },
  { c: [-74, 88], h: 14, n: 1 },
  { c: [44, 112], h: 24, n: 2 },
];
/** the threads, crew to crew (indices into CREWS): every crew to the middle, and a few between neighbours */
const LINKS: [number, number, number][] = [[3, 0, 34], [3, 1, 30], [3, 2, 30], [3, 4, 30], [3, 5, 30], [3, 6, 34], [0, 1, 22], [2, 5, 26], [4, 6, 22], [0, 2, 26]];

const tile = (i: number): [number, number, number, number, number, number] => { const { c, h } = CREWS[i]; return [c[0] - T / 2, c[1] - T / 2, T, T, 0, h]; };
const topOf = (i: number): W3 => { const { c, h } = CREWS[i]; return [c[0], c[1], h]; };
/** the people on a tile's top, centred, back to front */
function people(i: number): W3[] {
  const { c, h, n } = CREWS[i];
  const at: [number, number][] = n === 1 ? [[0, 0]] : n === 2 ? [[-9, 7], [9, -7]] : [[-11, -4], [10, -10], [2, 11]];
  return at.map(([dx, dy]) => [c[0] + dx, c[1] + dy, h] as W3).sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
}

// the frame hugs the crews (and the people's heads); the dotted floor runs past it and fades out under the mask
const FLOOR = { a: -150, b: 150, step: 20 };
const ALL: V[] = [...CREWS.flatMap((_, i) => corners(box(...tile(i)))), ...CREWS.map((_, i): V => { const t = P(...topOf(i)); return [t[0], t[1] - 44]; })];
const VB = vbox(ALL, 14);
/** the green figure's head, on screen: the ring breathes off it */
const HUB = people(3), RING: V = (() => { const g = HUB[HUB.length - 1], at = P(...g); return [at[0], at[1] + PAWN.hy]; })();
const order = CREWS.map((_, i) => i).sort((a, b) => CREWS[a].c[0] + CREWS[a].c[1] - (CREWS[b].c[0] + CREWS[b].c[1]));

export function HeroWeb() {
  return (
    <svg className="cmx-web" viewBox={VB.s} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="cmx-web-fade" cx="50%" cy="50%" r="50%"><stop offset="0.35" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <mask id="cmx-web-m"><rect x={f(VB.x)} y={f(VB.y)} width={f(VB.w)} height={f(VB.h)} fill="url(#cmx-web-fade)" /></mask>
      </defs>
      <path className="cmx-web__floor" d={dots(FLOOR.a, FLOOR.a, FLOOR.b, FLOOR.b, FLOOR.step)} mask="url(#cmx-web-m)" />
      {order.map((i) => <Slab key={i} b={tile(i)} cls="cmx-web__t" />)}
      <g className="cmx-web__links">
        {LINKS.map(([a, b, h], k) => {
          const A = topOf(a), B = topOf(b), lift = 14;
          return <path key={k} className={a === 3 ? "is-hub" : ""} d={arc([A[0], A[1], A[2] + lift], [B[0], B[1], B[2] + lift], h).d} />;
        })}
      </g>
      {/* the signals that run out along the middle crew's threads (motion.ts places them; hidden until it does) */}
      <g className="cmx-web__sig">{LINKS.filter(([a]) => a === 3).map((_, k) => <circle key={k} r="2.6" cx="0" cy="0" opacity="0" />)}</g>
      {order.flatMap((i) => people(i).map((p, k) => <Pawn key={`${i}-${k}`} cls="cmx-web__p" at={P(...p)} g={!!CREWS[i].g && k === people(i).length - 1} />))}
      <circle className="cmx-web__ring" cx={f(RING[0])} cy={f(RING[1])} r={f(PAWN.hr)} opacity="0" />
    </svg>
  );
}
