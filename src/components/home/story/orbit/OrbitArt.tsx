import Image from "next/image";
import { useId, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import type { OwnKey } from "../../chapter-one/OwnArt";
import { arc, back, dir, f, pt, seg, ticks, type Ell, type Pt } from "./geom";
import s from "./orbit.module.css";

// Orbit (D54, on the rail in D56): a celestial atlas around FutureDeluxe chrome. Polished chrome and satin spheres
// with frosted glass rings and planes (rendered stills with transparent backgrounds), threaded by thin perspective
// orbits. Each orbit is split where it passes the objects: its far half is drawn under the render (frosted glass mutes
// it, a sphere hides it), its near half over it. Graduated arcs with fine ticks, tiny markers, a ticked horizon (the
// ecliptic) and small level labels on short leaders. Measured on the 420 × 315 render.
//
// Each still comes in two layers cut from one render: the scene, and its one green part on its own
// (`orbit-<station>-green.webp`, the scene filled in behind it), so the green part can move.
//
// Motion (orbit.module.css): the drawing's default is its end state (phones, reduced motion, no JS). [data-play] runs
// one orchestrated sequence of about 1.9 s and stops: orbits and arcs draw on, ticks and markers pop in on a short
// stagger, the tag rises, then the station's one story move. [data-hover] (OwnReplay, with --px / --py) moves the joined
// drawing (lines under, render, lines over) as one rigid piece and the free tag a little further, firms the lines up and
// lifts the green part; a replay on hover redraws only the lines and markers.
//
// One tag per station (D56: "Private", "Swap", "Signed proof", the engraved name), always ≥ 13 px: the root is a size
// container and the type divides by the drawing's scale (--fit) as well as the station's zoom (--k).

const W = 420, H = 315;
const SRC = "/images/home/own/orbit"; // the homepage's own assets since Orbit shipped (D71)

// Timing on the 120 ms step (--dur-1): `d` is the delay, `t` the duration, in steps
const at = (d: number, t?: number) => ({ "--d": d, ...(t ? { "--t": t } : {}) }) as CSSProperties;

// A path that draws on (solid lines only: a dashed or dotted line fades in instead, see Fade)
function Draw({ d, cls, when, rev = false }: { d: string; cls: string; when: [number, number]; rev?: boolean }) {
  return <path className={`${cls} ${rev ? s.drawRev : s.draw}`} d={d} pathLength={1} style={at(...when)} />;
}
const Fade = ({ d, cls, when }: { d: string; cls: string; when: [number, number?] }) => (
  <path className={`${cls} ${s.fade}`} d={d} style={at(when[0], when[1])} />
);
const Pop = ({ when, children }: { when: number; children: ReactNode }) => <g className={s.pop} style={at(when)}>{children}</g>;

// `zoom` [k, cx, cy]: the stills are cropped k times tighter about (cx, cy), so the drawing, measured on the uncropped
// render, is scaled with them; type and strokes divide by --k to keep their size
type Zoom = readonly [number, number, number];
function Frame({ src, under, over, labels, engraved, zoom = [1, W / 2, H / 2], move, which, className = "", rest }: {
  src: string; under: ReactNode; over: ReactNode; labels?: ReactNode; engraved?: ReactNode; zoom?: Zoom; move: string; which: OwnKey; className?: string;
  rest: HTMLAttributes<HTMLDivElement>;
}) {
  const [k, cx, cy] = zoom;
  const t = k === 1 ? undefined : `translate(${W / 2} ${H / 2}) scale(${k}) translate(${-cx} ${-cy})`;
  return (
    <div {...rest} className={`${s.art} ${className}`} data-art={which} aria-hidden="true" style={{ "--k": k } as CSSProperties}>
      {/* everything joined moves as one piece: the far lines, the render, the near lines */}
      <div className={`${s.layer} ${s.rig}`}>
        <svg className={`${s.svg} ${s.lines}`} viewBox={`0 0 ${W} ${H}`}><g transform={t}>{under}</g></svg>
        <Image className={s.img} src={`${SRC}-${src}.webp`} alt="" fill unoptimized />
        <div className={`${s.layer} ${s.lift}`}>
          <Image className={`${s.img} ${s.move} ${move}`} src={`${SRC}-${src}-green.webp`} alt="" fill unoptimized />
        </div>
        <svg className={`${s.svg} ${s.lines}`} viewBox={`0 0 ${W} ${H}`}><g transform={t}>{over}</g></svg>
        {engraved && <svg className={s.svg} viewBox={`0 0 ${W} ${H}`}><g transform={t}>{engraved}</g></svg>}
      </div>
      {/* the free tag, a step nearer */}
      {labels && (
        <div className={`${s.layer} ${s.free}`}>
          <svg className={s.svg} viewBox={`0 0 ${W} ${H}`}><g transform={t}>{labels}</g></svg>
        </div>
      )}
    </div>
  );
}

// A small arrowhead at p pointing along `deg`
const Head = ({ p, deg, cls = s.inkFill }: { p: Pt; deg: number; cls?: string }) => (
  <path className={cls} d="M0 0l-6-2.3v4.6z" transform={`translate(${p[0]} ${p[1]}) rotate(${deg})`} />
);

// Atlas markers: a hollow ring, a filled point, a little cross, a tiny square
const Ring = ({ p, r = 2.2 }: { p: Pt; r?: number }) => <circle className={s.marker} cx={p[0]} cy={p[1]} r={r} />;
const Point = ({ p, r = 1.5, cls = s.inkFill }: { p: Pt; r?: number; cls?: string }) => <circle className={cls} cx={p[0]} cy={p[1]} r={r} />;
const Star = ({ p }: { p: Pt }) => <path className={s.hair} d={`M${p[0] - 3} ${p[1]}h6M${p[0]} ${p[1] - 3}v6`} />;
const Square = ({ p }: { p: Pt }) => <rect className={s.marker} x={p[0] - 1.6} y={p[1] - 1.6} width="3.2" height="3.2" />;

// The ecliptic: a horizon line with a fine tick scale (every 6, longer every 30)
function Ecliptic({ y, x0, x1 }: { y: number; x0: number; x1: number }) {
  let d = "";
  for (let x = x0, i = 0; x <= x1; x += 6, i++) d += `M${x} ${y}v${i % 5 === 0 ? -4.5 : -2}`;
  return <Fade d={seg([x0, y], [x1, y]) + d} cls={s.faint} when={[0, 4]} />;
}

// A tag's leader: a point on the drawing and a hairline toward the label (it rises in at `when`)
function Leader({ at: p, to, green = false, when }: { at: Pt; to: Pt; green?: boolean; when: number }) {
  return (
    <g className={s.rise} style={at(when)}>
      <Point p={p} r={1.6} cls={green ? s.gFill : s.inkFill} />
      <path className={green ? s.gHair : s.fine} d={seg(p, to)} />
    </g>
  );
}
// The tag itself, level, in the free layer
const Label = ({ x, y, anchor = "start", cls = s.label, when, children }: { x: number; y: number; anchor?: "start" | "middle" | "end"; cls?: string; when: number; children: ReactNode }) => (
  <text className={`${cls} ${s.rise}`} style={at(when)} x={x} y={y} textAnchor={anchor}>{children}</text>
);

type ArtProps = { className?: string; rest: HTMLAttributes<HTMLDivElement> };

// ── Data: a frosted disc stands across an orbit. On the near side of the glass the orbit and the horizon are solid;
// past it they go on as dots, and the green sphere behind the frost is only a soft shape. Move: the green sphere drifts
// into place behind the disc as the near half of its orbit draws
const ORB_D: Ell = { cx: 210, cy: 160, rx: 168, ry: 46, rot: -5 };
function Data(p: ArtProps) {
  const y = 152;
  return (
    <Frame
      {...p}
      which="data"
      src="data"
      zoom={[1.15, 210, 157]}
      move={s.drift}
      under={
        <>
          <Draw d={arc(ORB_D, 180, 270)} cls={s.orbit} when={[0, 5]} />
          <Fade d={arc(ORB_D, 272, 360)} cls={s.dots} when={[3, 4]} />
          <Fade d={arc(ORB_D, 180, 360, 0.72)} cls={s.faint} when={[1, 4]} />
          <Pop when={3}><path className={s.fine} d={ticks(ORB_D, 196, 262, 3, 1, 1.035, 5, 1.07)} /></Pop>
          <Draw d={seg([189, y], [209, y - 0.5])} cls={s.hair} when={[4, 1]} />
          <Fade d={seg([209, y - 0.5], [262, y - 1])} cls={s.faint} when={[5, 2]} />
          <Fade d={seg([264, y - 1], [388, y - 3])} cls={s.dots} when={[6, 4]} />
        </>
      }
      over={
        <>
          <Draw d={arc(ORB_D, 90, 180)} cls={s.orbit} rev when={[4, 7]} />
          <Fade d={arc(ORB_D, 0, 88)} cls={s.dots} when={[6, 4]} />
          <Fade d={arc(ORB_D, 0, 180, 0.72)} cls={s.faint} when={[2, 4]} />
          <Pop when={6}><path className={s.fine} d={ticks(ORB_D, 100, 176, 2, 1, 1.035, 5, 1.07)} /></Pop>
          {/* the horizon through both spheres, with its scale up to the chrome one */}
          <Draw d={seg([36, y], [149, y])} cls={s.hair} when={[1, 3]} />
          <Pop when={3}><path className={s.fine} d={Array.from({ length: 19 }, (_, i) => `M${36 + i * 6} ${y}v${i % 5 === 0 ? -5 : -2.2}`).join("")} /></Pop>
          <Pop when={1}><Point p={[36, y]} /></Pop>
          <Pop when={7}><Point p={pt(ORB_D, 150)} r={1.8} /></Pop>
          <Pop when={10}><Ring p={pt(ORB_D, 30)} /></Pop>
          <Pop when={5}><Star p={pt(ORB_D, 232)} /></Pop>
          <Pop when={8}><Square p={pt(ORB_D, 120, 0.72)} /></Pop>
          <Leader at={pt(ORB_D, 40)} to={[350, 189]} when={10} />
        </>
      }
      labels={<Label x={382} y={202} anchor="end" when={10}>Private</Label>}
    />
  );
}

// ── Assets: a frosted ring (the one account) holding a chrome sphere and a green one; the swap is an orbit from one to
// the other over the far side, landing green. Move: a small ink ring travels the swap orbit from the chrome sphere to
// the green one, which then settles
const RING_A: Ell = { cx: 211, cy: 166, rx: 162, ry: 61 };
const SWAP: Ell = { cx: 215, cy: 135.5, rx: 145.3, ry: 52, rot: 3.75 };
function Assets(p: ArtProps) {
  const apex = pt(SWAP, 270), trip = arc(SWAP, 180, 326);
  return (
    <Frame
      {...p}
      which="assets"
      src="assets"
      move={s.settle}
      under={
        <>
          <Ecliptic y={166} x0={8} x1={412} />
          <Fade d={arc(RING_A, 180, 360, 1.2)} cls={s.faint} when={[0, 4]} />
          <Draw d={arc(SWAP, 180, 284)} cls={s.orbit} when={[1, 5]} />
          <Draw d={arc(SWAP, 284, 360)} cls={s.gLine} when={[9, 4]} />
          <Pop when={3}><path className={s.fine} d={ticks(SWAP, 204, 315, 3, 1, 1.04, 5, 1.08)} /></Pop>
        </>
      }
      over={
        <>
          <Fade d={arc(RING_A, 0, 180, 1.2)} cls={s.faint} when={[1, 4]} />
          <Fade d={arc(SWAP, 10, 170)} cls={s.dash} when={[4, 3]} />
          {/* the traveller: an ink ring riding the swap orbit (a single dash moved by its offset), turning green as it lands,
              gone on arrival */}
          <path className={`${s.travel} ${s.travelInk}`} d={trip} pathLength={1} style={at(5, 7)} />
          <path className={`${s.travel} ${s.travelGreen}`} d={trip} pathLength={1} style={at(5, 7)} />
          <path className={`${s.travel} ${s.travelHole}`} d={trip} pathLength={1} style={at(5, 7)} />
          <Pop when={12}><Head p={pt(SWAP, 331)} deg={dir(SWAP, 331)} cls={s.gFill} /></Pop>
          <Pop when={5}><Ring p={pt(RING_A, 206, 1.2)} /></Pop>
          <Pop when={7}><Star p={pt(RING_A, 328, 1.2)} /></Pop>
          <Pop when={6}><Square p={pt(RING_A, 140, 1.2)} /></Pop>
          <Pop when={8}><Point p={pt(SWAP, 240)} /></Pop>
          <Leader at={apex} to={[apex[0], f(apex[1] - 8)]} when={6} />
        </>
      }
      labels={<Label x={apex[0]} y={apex[1] - 13} anchor="middle" when={6}>Swap</Label>}
    />
  );
}

// ── Intelligence: a frosted sphere seals a machined chrome core (the enclave). Orbits pass behind and in front of it.
// Move: the request ray draws in, then the signed trace draws out along an orbit to the green sphere
const SEAL: Ell = { cx: 200, cy: 160, rx: 98, ry: 34, rot: 18 };
const TILT: Ell = { cx: 200, cy: 157, rx: 92, ry: 26, rot: -14 };
const MERID: Ell = { cx: 200, cy: 157, rx: 76, ry: 76 };
function Intelligence(p: ArtProps) {
  const from: Pt = [54, 105], edge: Pt = [146, 132];
  const end = pt(SEAL, -30);
  return (
    <Frame
      {...p}
      which="intelligence"
      src="intelligence"
      zoom={[1.3, 205, 160]}
      move={s.arrive}
      under={
        <>
          <Ecliptic y={160} x0={48} x1={362} />
          <Draw d={arc(SEAL, 180, 346)} cls={s.orbit} when={[0, 6]} />
          <Fade d={arc(TILT, 180, 360)} cls={s.dash} when={[1, 4]} />
          <Pop when={3}><path className={s.fine} d={ticks(SEAL, 196, 250, 3, 1, 1.05, 5, 1.1)} /></Pop>
          <Draw d={seg(edge, [176, 141])} cls={s.hair} when={[6, 2]} />
          <Draw d={arc(SEAL, -30, 23)} cls={s.gLine} rev when={[10, 3]} />
        </>
      }
      over={
        <>
          <Draw d={arc(SEAL, 80, 180)} cls={s.orbit} when={[2, 5]} />
          <Fade d={arc(TILT, 0, 180)} cls={s.dash} when={[2, 4]} />
          {/* a graduated meridian over the sealed sphere */}
          <Draw d={arc(MERID, 214, 326)} cls={s.faint} when={[1, 5]} />
          <Pop when={4}><path className={s.fine} d={ticks(MERID, 214, 326, 4, 1, 1.03, 5, 1.065)} /></Pop>
          <Draw d={arc(SEAL, 47, 78)} cls={s.gLine} rev when={[8, 2]} />
          <Draw d={arc(SEAL, -30, 0)} cls={s.gLine} rev when={[11, 2]} />
          <Pop when={13}><Point p={end} r={1.8} cls={s.gFill} /></Pop>
          {/* the request */}
          <Draw d={seg(from, [edge[0] - 5.5, edge[1] - 1.6])} cls={s.hair} when={[3, 3]} />
          <Pop when={6}><Head p={edge} deg={16.4} /></Pop>
          <Pop when={3}><Point p={from} /></Pop>
          <Pop when={5}><Ring p={pt(TILT, 200)} /></Pop>
          <Pop when={7}><Star p={pt(SEAL, 300)} /></Pop>
          <Pop when={6}><Square p={pt(MERID, 290)} /></Pop>
          <Leader at={end} to={[298, 154]} green when={12} />
        </>
      }
      labels={<Label x={358} y={147} anchor="end" cls={s.gLabel} when={12}>Signed proof</Label>}
    />
  );
}

// ── Identity: a green ring (the new keys) floats over a frosted disc engraved with the name. The old ring is a hairline
// ghost about the same centre at its previous, steeper tilt; a graduated arc measures the single rotation between them.
// The account's orbit runs wide around both. Move: the ghost fades in at its old tilt, the protractor arc sweeps, and
// the green ring settles
const KEY: Ell = { cx: 208.5, cy: 126, rx: 97.5, ry: 37 };
const C: Pt = [208.5, 134.5]; // the ring's centre, halfway through its thickness
const GHOST: Ell = { cx: C[0], cy: C[1], rx: 97.5, ry: 76, rot: -16 };
const DISC: Ell = { cx: 208, cy: 170, rx: 148, ry: 59 };
const WIDE: Ell = { cx: 208, cy: 175, rx: 200, ry: 76 };
const PROT: Ell = { cx: C[0], cy: C[1], rx: 104, ry: 104 };
function Identity(p: ArtProps) {
  const id = useId();
  const top = pt(GHOST, 270), now = pt(KEY, 270);
  const a0 = (Math.atan2(top[1] - C[1], top[0] - C[0]) * 180) / Math.PI + 360;
  const ray = (q: Pt, r: number): Pt => { const d = Math.hypot(q[0] - C[0], q[1] - C[1]); return [f(C[0] + ((q[0] - C[0]) * r) / d), f(C[1] + ((q[1] - C[1]) * r) / d)]; };
  return (
    <Frame
      {...p}
      which="identity"
      src="identity"
      move={s.settleRing}
      under={
        <>
          <Ecliptic y={170} x0={8} x1={412} />
          <Draw d={arc(WIDE, 180, 360)} cls={s.orbit} when={[0, 6]} />
          <Fade d={arc(GHOST, 180, 360) + arc(GHOST, 180, 360, 0.75)} cls={s.ghost} when={[2, 4]} />
        </>
      }
      over={
        <>
          <Draw d={arc(WIDE, 0, 180)} cls={s.orbit} rev when={[2, 6]} />
          <Pop when={5}><path className={s.fine} d={ticks(WIDE, 22, 78, 2, 1, 1.035, 5, 1.07)} /></Pop>
          {[112, 128, 168, 196, 300, 336].map((t, i) => <Pop key={t} when={5 + i}><Point p={pt(WIDE, t)} r={1.4} /></Pop>)}
          <Fade d={arc(GHOST, 0, 180) + arc(GHOST, 0, 180, 0.75)} cls={s.ghost} when={[2, 4]} />
          {/* the single rotation, measured like a protractor from the old tilt to the new */}
          <Fade d={seg(top, ray(top, 116)) + seg(now, ray(now, 116))} cls={s.dash} when={[5, 2]} />
          <Pop when={6}><path className={s.fine} d={ticks(PROT, a0, 270, 2, 1, 1.04, 4, 1.08)} /></Pop>
          <Draw d={arc(PROT, a0, 268)} cls={s.gLine} when={[6, 4]} />
          <Pop when={10}><Head p={pt(PROT, 270)} deg={dir(PROT, 270)} cls={s.gFill} /></Pop>
          <Pop when={4}><Ring p={top} r={1.8} /></Pop>
        </>
      }
      engraved={
        <>
          <defs><path id={`${id}n`} d={back(DISC, 160, 20, 0.9)} /></defs>
          <text className={`${s.name} ${s.rise}`} style={at(11)}><textPath href={`#${id}n`} startOffset="50%" textAnchor="middle">your-name<tspan className={s.near}>.near</tspan></textPath></text>
        </>
      }
    />
  );
}

// The rail's art slot (or the lab's) gives the width; the drawing fills it at 4:3
export function OrbitArt({ which, className, ...rest }: { which: OwnKey } & HTMLAttributes<HTMLDivElement>) {
  const p = { className, rest };
  if (which === "data") return <Data {...p} />;
  if (which === "assets") return <Assets {...p} />;
  if (which === "intelligence") return <Intelligence {...p} />;
  return <Identity {...p} />;
}
