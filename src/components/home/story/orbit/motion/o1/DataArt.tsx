"use client";

import Image from "next/image";
import { useId, useRef, type CSSProperties, type HTMLAttributes } from "react";
import s from "../../orbit.module.css";
import st from "./o1.module.css";
import { camera, f, onDisc, onRing, seg, useLive, type Pt, type V3 } from "./proj";

// Data, live glass (D72). A frosted glass disc (a flat-to-camera still with its chrome micro-bevel) turns in CSS 3D as
// the station slides: about 62° as it arrives, exactly flat for a stretch either side of the centre. Copies of the rim
// stepped back in depth show the edge's thickness while it is turned. The green ball swings left to right and back
// along the orbit's far half on its own clock, behind the glass.
//
// The frost: the turned disc's outline is projected each frame (an ellipse with level axes), and
//   - a real backdrop blur fills it, frosting the page behind the drawing (the ridges);
//   - inside it a blurred copy of the ball stands in for the ball, which is masked out there, and the lines behind are
//     clipped away. A backdrop filter has nothing to blur under a translucent parent (Chrome), and the rail fades each
//     station in, so what passes behind from inside the drawing is frosted explicitly, the same at any opacity.
// The vectors are projected through the same camera as the CSS (proj.ts), so the graduated arc on the glass, the
// markers on the orbits and the ball's reading stay on the objects, and several of them move slowly on their own.

const SRC = "/images/home/own/motion/o1";
const C: Pt = [210, 150]; // the disc's centre and the camera's pivot
const cam = camera(C, 1400); // the same eye as the glass layers' perspective(1400px)
const R = 94; // the disc's radius
const DISC_BOX = (2 * R * 320) / 316; // the still's square (its disc has radius 316 of 320)
const YAW = 62; // the turn at the slide's ends, degrees
const DEPTH = 14, STEP = 0.4; // the rim copies behind the face: how many, and how far apart (px): an edge 5.6 deep
// the orbit: a circle of radius 172 tilted back 74° (it reads as an ellipse 172 × 47)
const ORB = { r: 172, tilt: 74.3 };
const orb = (t: number, k = 1): V3 => onRing(ORB.r * k, ORB.tilt, t);
// the ball: one green sphere, 36 across at the disc's depth, swinging along the far half (t 180 → 360 → 180)
const BALL = 36, BALL_BOX = (BALL * 160) / 156;
const SWING = 9; // seconds for left → right → left
const RAMP = 0.22; // the share of each pass spent easing out of and into a turn
const VM = 1 / (1 - RAMP);
// where along a pass (0 at the left end, 1 at the right) the ball is, s of the way through the pass's time
function along(u: number): number {
  if (u > 1 - RAMP) return 1 - along(1 - u);
  if (u < RAMP) return VM * (u / 2 - (RAMP / (2 * Math.PI)) * Math.sin((Math.PI * u) / RAMP));
  return VM * (RAMP / 2 + u - RAMP);
}
// at rest the ball sits half behind the disc's right edge (its centre on the edge), on a rightward pass
const T_REST = 360 - (Math.acos(R / ORB.r) * 180) / Math.PI;
const T0 = ((T_REST - 180) / 180 / VM + RAMP / 2) * (SWING / 2);
function ballAt(time: number): number {
  const u = (((time + T0) % SWING) + SWING) % SWING / (SWING / 2);
  return u <= 1 ? 180 + 180 * along(u) : 360 - 180 * along(u - 1);
}
// The turn for a slide: 62° × E(|slide| / 0.45), with E smootherstep (zero speed at both ends), so the disc settles
// into flat as the rail stops and leaves flat gently as it goes; it faces the screen's centre as it comes and goes
// (entering and leaving turn opposite ways)
const smoother = (u: number) => { const x = Math.min(1, Math.max(0, u)); return x * x * x * (x * (6 * x - 15) + 10); };
const yawFor = (slide: number) => YAW * Math.sign(slide) * smoother(Math.abs(slide) / 0.45);
// The rail's scrub moves in steps (wheel ticks), so the turn chases that target with a critically damped spring (no
// overshoot; it starts from rest and settles in), and every layer and vector uses the chased angle. Settling toward
// flat it is slower (a lag of about 0.3 s), so the disc eases to a stop as the rail stops; turning away from flat it is
// quicker, so the turn is seen before the rail's fade-out takes the drawing. Near zero it snaps to exactly flat. After
// a long gap (the drawing was off screen) it jumps to the target.
const SETTLE = 6.5, LEAVE = 20;
function chase(st: { y: number; v: number; t: number }, target: number, time: number) {
  const dt = time - st.t;
  st.t = time;
  if (!(dt > 0) || dt > 0.25) { st.y = target; st.v = 0; return st.y; }
  const w = Math.abs(target) > Math.abs(st.y) ? LEAVE : SETTLE;
  const d = st.y - target, e = Math.exp(-w * dt), k = (st.v + w * d) * dt;
  st.v = (st.v - w * k) * e;
  st.y = target + (d + k) * e;
  if (Math.abs(target) < 0.1 && Math.abs(st.y) < 0.1 && Math.abs(st.v) < 0.5) { st.y = 0; st.v = 0; }
  return st.y;
}

const Y_HOR = C[1]; // the horizon through the disc's centre

// The vectors' own slow motions, all on the same clock as the ball, all seamless loops, each computed through the
// projection every frame (so they stay on the disc and the orbit at any turn). Nothing travels along a line:
// - the graduated arc on the glass sweeps round the rim, once every ARC_LAP seconds;
const ARC_LAP = 40, ARC_FROM = 192, ARC_SPAN = 60;
// - three markers ride the orbit ellipses at their own speeds and ways (degrees a second), passing behind the glass
//   on the far side and in front of it on the near side;
const MARKS = [
  { kind: "ring", k: 1, t0: 30, rate: 360 / 64 },
  { kind: "square", k: 0.72, t0: 120, rate: -360 / 48 },
  { kind: "point", k: 1, t0: 150, rate: 360 / 90 },
] as const;
// - the pivot's dashed axis draws out from the disc and back in (its dashes fixed at the disc's end, so they never
//   travel), with a pause at full length;
const AXIS_LOOP = 7, AXIS_LEN = 17;
function axisAt(time: number) {
  const u = ((time % AXIS_LOOP) + AXIS_LOOP) % AXIS_LOOP; // 0-3.5 s full, 3.5-5 s in, 5-5.6 s gone, 5.6-7.1 s out
  const ease = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, x)));
  if (u < 3.5) return 1;
  if (u < 5) return 1 - ease((u - 3.5) / 1.5);
  if (u < 5.5) return 0;
  return ease((u - 5.5) / 1.5);
}
// - the horizon's scale breathes: each tick only lengthens and shortens in place, in a slow wave
const TICKS = 11, TICK_LOOP = 8;
const tickScale = (time: number) =>
  Array.from({ length: TICKS }, (_, i) => {
    const h = (i % 5 === 0 ? 5 : 2.2) * (0.78 + 0.3 * Math.sin(2 * Math.PI * (time / TICK_LOOP - i / TICKS)));
    return `M${22 + i * 6} ${Y_HOR}v${f(-h)}`;
  }).join("");

// Everything that moves, for a turn (yaw), a ball angle (t) and the clock (for the vectors' own motions)
function pose(yaw: number, t: number, time: number) {
  const b = orb(t);
  const [bx, by, bk] = cam.proj(b);
  const a = (yaw * Math.PI) / 180;
  const behind = b[0] * Math.sin(a) + b[2] * Math.cos(a) < 0; // the ball's side of the turned disc's plane
  const disc = (t: number, k = 1): V3 => onDisc(R * k * Math.cos((t * Math.PI) / 180), R * k * Math.sin((t * Math.PI) / 180), yaw);
  const left = cam.proj(onDisc(-R, 0, yaw));
  // the hole the ball cuts in the lines in front: none while it is behind the glass (the frost hides it)
  const hidden = behind && Math.abs(bx - C[0]) < Math.abs(left[0] - C[0]);
  const q = hidden ? 0 : f((BALL / 2) * bk + 1.5);
  // the frost's outline: a disc turned about its vertical axis, seen from an eye level with its centre, projects to an
  // ellipse with level axes (its centre a little toward the nearer edge), so a rounded box fits it exactly: its width
  // from the rim's projected left and right points, its height from the rim's highest projected point
  const rr = (R - 0.75) / R;
  const xl = cam.proj(disc(180, rr))[0], xr = cam.proj(disc(0, rr))[0];
  let hh = 0;
  for (let i = 0; i <= 90; i++) hh = Math.max(hh, C[1] - cam.proj(disc(180 + i * 2, rr))[1]);
  const ea = (xr - xl) / 2, ecx = xl + ea, ex = ecx - ea, ey = C[1] - hh;
  const oval = `M${f(ex)} ${C[1]}a${f(ea)} ${f(hh)} 0 1 0 ${f(2 * ea)} 0a${f(ea)} ${f(hh)} 0 1 0 ${f(-2 * ea)} 0Z`;
  // the ball, sharp, is shown only outside that outline while it is behind the glass (a mask in its own unscaled box);
  // inside it a blurred copy stands for it, clipped to the outline (the frost's own blur reaches only the page behind
  // the drawing: Chrome gives a backdrop filter nothing to blur under a translucent parent, as the rail's fade-in is)
  const lx = BALL_BOX / 2 + (ecx - bx) / bk, ly = BALL_BOX / 2 + (C[1] - by) / bk;
  return {
    ball: `translate(${f(bx - BALL_BOX / 2)}px, ${f(by - BALL_BOX / 2)}px) scale(${f(bk)})`,
    ballMask: behind ? `radial-gradient(${f(ea / bk)}px ${f(hh / bk)}px at ${f(lx)}px ${f(ly)}px, transparent 99%, var(--color-ink) 100%)` : "none",
    frosted: `translate(${f(bx - BALL_BOX / 2 - ex)}px, ${f(by - BALL_BOX / 2 - ey)}px) scale(${f(bk)})`,
    behind,
    // the lines behind the glass, everywhere but inside its outline
    hole: `M-20 -20H440V335H-20Z${oval}`,
    glass: (z: number) => `perspective(${cam.P}px) rotateY(${f(yaw)}deg) translateZ(${z}px)`,
    frost: { left: `${f(xl)}px`, top: `${f(C[1] - hh)}px`, width: `${f(xr - xl)}px`, height: `${f(2 * hh)}px` },
    // the graduated arc on the glass and its scale, sweeping round the rim
    ...(() => {
      const a0 = ARC_FROM + (360 * time) / ARC_LAP;
      return { arc: cam.curve((u) => disc(u, 1.1), a0, a0 + ARC_SPAN), scale: cam.ticks((u, k) => disc(u, k), a0, a0 + ARC_SPAN, 4, 1.1, 1.13, 5, 1.165) };
    })(),
    // the markers on the orbits: each one's place, and whether it is on the near (front) side
    marks: MARKS.map((m) => { const u = m.t0 + m.rate * time; const [x, y] = cam.pt(orb(u, m.k)); return { x, y, near: Math.sin((u * Math.PI) / 180) > 0 }; }),
    // the pivot's axis, drawn out from the disc by g (0 to 1)
    axis: (() => {
      const g = axisAt(time), l = AXIS_LEN * g;
      return { g: f(g), d: g > 0.01 ? seg([C[0], C[1] - R - 5], [C[0], C[1] - R - 5 - l]) + seg([C[0], C[1] + R + 5], [C[0], C[1] + R + 5 + l]) : "", top: f(C[1] - R - 5 - l), bottom: f(C[1] + R + 5 + l) };
    })(),
    ticks: tickScale(time),
    // the horizon up to the glass's left edge
    horizon: seg([22, Y_HOR], [left[0] - 1.5, Y_HOR]),
    // the ball's reading on the horizon: a drop to it, and a point where it lands
    drop: seg([bx, by], [bx, Y_HOR - 1.5]),
    foot: [f(bx), Y_HOR] as Pt,
    dropGrad: { y1: f(by), y2: Y_HOR },
    // the lines in front, everywhere but a hair around the ball (an even-odd clip: the stage with a round hole)
    cut: `M-20 -20H440V335H-20ZM${f(bx - q)} ${f(by)}a${q} ${q} 0 1 0 ${f(2 * q)} 0a${q} ${q} 0 1 0 ${f(-2 * q)} 0Z`,
  };
}
const REST = pose(0, T_REST, 0);

// The turned layers of the glass, back to front: the rim's copies stepped back in depth (the edge's thickness), then
// (after the frost, which is not turned but clipped to the turned outline) the veil, the frosted face and the rim. All
// turn together about the disc's centre.
const GLASS: { cls: "edge" | "veil" | "face" | "rim"; z: number; size: number; src?: string }[] = [
  ...Array.from({ length: DEPTH }, (_, i) => ({ cls: "edge" as const, z: f(-(DEPTH - i) * STEP), size: DISC_BOX, src: "data-disc-rim" })),
  { cls: "veil", z: 0, size: 2 * (R - 1) },
  { cls: "face", z: 0, size: DISC_BOX, src: "data-disc-face" },
  { cls: "rim", z: 0, size: DISC_BOX, src: "data-disc-rim" },
];

// A marker drawn about (0, 0), placed by transform: a hollow ring, a tiny square or a filled point
const Mark = ({ kind }: { kind: (typeof MARKS)[number]["kind"] }) =>
  kind === "ring" ? <circle className={s.marker} r="2.2" /> : kind === "square" ? <rect className={s.marker} x="-1.6" y="-1.6" width="3.2" height="3.2" /> : <circle className={s.inkFill} r="1.7" />;
const marksIn = (front: boolean, ref: (i: number) => (el: SVGGElement | null) => void) =>
  REST.marks.map((m, i) => (
    <g key={i} ref={ref(i)} transform={`translate(${m.x} ${m.y})`} style={{ visibility: m.near === front ? "visible" : "hidden" }}>
      <Mark kind={MARKS[i].kind} />
    </g>
  ));

const Point = ({ p, r = 1.5, cls = s.inkFill }: { p: Pt; r?: number; cls?: string }) => <circle className={cls} cx={p[0]} cy={p[1]} r={r} />;

export function DataArt({ className = "", style, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const root = useRef<HTMLDivElement>(null);
  const ball = useRef<HTMLDivElement>(null);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const arc = useRef<SVGPathElement>(null), scale = useRef<SVGPathElement>(null), horizon = useRef<SVGPathElement>(null);
  const marks = useRef<(SVGGElement | null)[]>([]); // each marker twice: behind the glass [i], in front [i + 3]
  const axis = useRef<SVGPathElement>(null), axisTop = useRef<SVGCircleElement>(null), axisBottom = useRef<SVGCircleElement>(null);
  const tickPath = useRef<SVGPathElement>(null);
  const drop = useRef<SVGPathElement>(null), foot = useRef<SVGCircleElement>(null), grad = useRef<SVGLinearGradientElement>(null);
  const cut = useRef<SVGPathElement>(null);
  const frost = useRef<HTMLDivElement>(null), inside = useRef<HTMLDivElement>(null), frosted = useRef<HTMLDivElement>(null);
  const hole = useRef<SVGPathElement>(null);
  const id = useId().replace(/[^\w-]/g, "");

  const turn = useRef({ y: 0, v: 0, t: -1 });
  useLive(root, (slide, time) => {
    const p = pose(chase(turn.current, yawFor(slide), time), ballAt(time), time);
    const b = ball.current!;
    b.style.transform = p.ball;
    b.style.zIndex = p.behind ? "1" : "3";
    GLASS.forEach((g, i) => { const el = layers.current[i]; if (el) el.style.transform = p.glass(g.z); });
    Object.assign(frost.current!.style, p.frost);
    Object.assign(inside.current!.style, p.frost);
    b.style.maskImage = p.ballMask;
    b.style.setProperty("-webkit-mask-image", p.ballMask);
    frosted.current!.style.transform = p.frosted;
    frosted.current!.style.visibility = p.behind ? "visible" : "hidden";
    hole.current!.setAttribute("d", p.hole);
    arc.current!.setAttribute("d", p.arc);
    scale.current!.setAttribute("d", p.scale);
    horizon.current!.setAttribute("d", p.horizon);
    p.marks.forEach((m, i) => {
      const far = marks.current[i]!, near = marks.current[i + MARKS.length]!;
      far.setAttribute("transform", `translate(${m.x} ${m.y})`); near.setAttribute("transform", `translate(${m.x} ${m.y})`);
      far.style.visibility = m.near ? "hidden" : "visible"; near.style.visibility = m.near ? "visible" : "hidden";
    });
    axis.current!.setAttribute("d", p.axis.d);
    axisTop.current!.setAttribute("cy", String(p.axis.top)); axisBottom.current!.setAttribute("cy", String(p.axis.bottom));
    axisTop.current!.style.opacity = axisBottom.current!.style.opacity = String(p.axis.g);
    tickPath.current!.setAttribute("d", p.ticks);
    drop.current!.setAttribute("d", p.drop);
    foot.current!.setAttribute("cx", String(p.foot[0]));
    grad.current!.setAttribute("y1", String(p.dropGrad.y1));
    cut.current!.setAttribute("d", p.cut);
  });

  const box = (size: number): CSSProperties => ({ left: C[0] - size / 2, top: C[1] - size / 2, width: size, height: size });
  const glass = GLASS.map((g, i) => (
    <div key={i} ref={(el) => { layers.current[i] = el; }} className={st[g.cls]} style={{ ...box(g.size), transform: REST.glass(g.z) }}>
      {g.src && <Image src={`${SRC}/${g.src}.webp`} alt="" fill unoptimized />}
    </div>
  ));

  return (
    <div {...rest} ref={root} className={`${st.art} ${className}`} style={style} data-art="data" aria-hidden="true">
      <div className={st.stage}>
        {/* behind the glass: the far half of the orbit, the horizon past the disc, the ball's reading */}
        <svg className={`${st.svg} ${st.under} ${st.lines}`} viewBox="0 0 420 315">
          <defs>
            <linearGradient id={`${id}d`} ref={grad} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={REST.dropGrad.y1} y2={Y_HOR}>
              <stop offset="0" style={{ stopColor: "var(--color-ink)" }} stopOpacity="0.9" />
              <stop offset="0.5" style={{ stopColor: "var(--color-ink)" }} stopOpacity="0.25" />
              <stop offset="1" style={{ stopColor: "var(--color-ink)" }} stopOpacity="0.9" />
            </linearGradient>
            <clipPath id={`${id}h`} clipPathUnits="userSpaceOnUse"><path ref={hole} d={REST.hole} clipRule="evenodd" /></clipPath>
          </defs>
          <g clipPath={`url(#${id}h)`}>
          <path className={s.orbit} d={cam.curve(orb, 180, 270)} />
          <path className={s.dots} d={cam.curve(orb, 273, 360)} />
          <path className={s.faint} d={cam.curve((t) => orb(t, 0.72), 180, 360)} />
          <path className={s.fine} d={cam.ticks(orb, 196, 262, 3, 1, 1.035, 5, 1.07)} />
          <path className={s.faint} d={seg([C[0] - R, Y_HOR], [C[0] + R + 4, Y_HOR])} />
          <path className={s.dots} d={seg([C[0] + R + 8, Y_HOR], [404, Y_HOR - 0.5])} />
          <path ref={drop} d={REST.drop} fill="none" stroke={`url(#${id}d)`} strokeWidth="0.6" />
          <circle ref={foot} className={s.inkFill} cx={REST.foot[0]} cy={Y_HOR} r="1.3" />
          {marksIn(false, (i) => (el) => { marks.current[i] = el; })}
          </g>
        </svg>

        <div ref={ball} className={`${st.sprite} ${REST.behind ? st.back : st.front}`} style={{ width: BALL_BOX, height: BALL_BOX, transform: REST.ball, maskImage: REST.ballMask, WebkitMaskImage: REST.ballMask }}>
          <Image src={`${SRC}/ball-green.webp`} alt="" fill unoptimized />
        </div>

        <div className={`${st.disc} ${st.glass}`}>
          {glass.slice(0, DEPTH)}
          <div ref={frost} className={st.frost} style={REST.frost} />
          <div ref={inside} className={st.inside} style={REST.frost}>
            <div ref={frosted} className={`${st.sprite} ${st.frosted}`} style={{ width: BALL_BOX, height: BALL_BOX, transform: REST.frosted, visibility: REST.behind ? "visible" : "hidden" }}>
              <Image src={`${SRC}/ball-green.webp`} alt="" fill unoptimized />
            </div>
          </div>
          {glass.slice(DEPTH)}
        </div>

        {/* in front of the glass: the near half of the orbit with its scale, the horizon to the glass, the glass's own arc */}
        <svg className={`${st.svg} ${st.over} ${st.lines}`} viewBox="0 0 420 315">
          <defs>
            <clipPath id={`${id}c`} clipPathUnits="userSpaceOnUse"><path ref={cut} d={REST.cut} clipRule="evenodd" /></clipPath>
          </defs>
          {/* the ball's own orbit and the horizon pass through it at the ends of its swing: cut around it there */}
          <g clipPath={`url(#${id}c)`}>
            <path className={s.orbit} d={cam.curve(orb, 90, 180)} />
            <path className={s.dots} d={cam.curve(orb, 0, 87)} />
            <path className={s.faint} d={cam.curve((t) => orb(t, 0.72), 0, 180)} />
            <path className={s.fine} d={cam.ticks(orb, 100, 176, 2, 1, 1.035, 5, 1.07)} />
            <path ref={horizon} className={s.hair} d={REST.horizon} />
            <path ref={tickPath} className={s.fine} d={REST.ticks} />
            <Point p={[22, Y_HOR]} />
            {marksIn(true, (i) => (el) => { marks.current[i + MARKS.length] = el; })}
          </g>
          {/* the pivot: the disc turns about this axis */}
          <path ref={axis} className={s.dash} d={REST.axis.d} />
          <circle ref={axisTop} className={s.inkFill} cx={C[0]} cy={REST.axis.top} r="1.2" />
          <circle ref={axisBottom} className={s.inkFill} cx={C[0]} cy={REST.axis.bottom} r="1.2" />
          <path ref={arc} className={s.orbit} d={REST.arc} />
          <path ref={scale} className={s.fine} d={REST.scale} />
        </svg>
      </div>
    </div>
  );
}
