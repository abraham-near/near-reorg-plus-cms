"use client";

import Image from "next/image";
import { useId, useRef, type HTMLAttributes } from "react";
import s from "../../orbit.module.css";
import st from "./o1.module.css";
import { camera, f, onRing, seg, useLive, type Pt, type V3 } from "./proj";

// Assets, live glass (D72). The frosted ring (a still) lies at its angle; two balls of the same size, one chrome and
// one green, ride a circle just outside it, half a turn apart, on their own clock (a seamless loop), nudged along by
// the slide as the station comes and goes. Each ball is scaled by its depth and sorted against the ring: on the far
// side the ring's band passes in front of it, on the near side it passes in front of the ring. The path, the dial
// around it, each ball's reading on the dial and the green swap arc between the two readings (it turns with them) are
// projected every frame through the same camera (proj.ts), and the lines in front are cut where a ball passes over them.

const SRC = "/images/home/own/motion/o1";
// The ring still (882 × 387): its outer edge is an ellipse about (441, 193.5), 420 × 172.5 across its half-axes.
// Shown at a third of that, so the outer edge is 140 × 57.5 about RC.
const RC: Pt = [210, 166];
const IMG = { w: 882 / 3, h: 387 / 3, cx: 441 / 3, cy: 193.54 / 3 };
const RING_R = 140, RING_HH = 172.54 / 3;
// The camera that draws that ellipse: the plane's tilt and the pivot's height, solved from the outer edge's height and
// centre (a perspective circle's centre sits a little below its pivot). The eye is far off (5000, against the data
// disc's 1400): the nearest ball is only about 6% larger on screen than the farthest, so the two equal balls read as
// the same size, as Lawrence asked, with just enough depth to place them.
const P = 5000;
const { tilt: TILT, o: O } = (() => {
  let e = Math.acos(RING_HH / RING_R);
  for (let i = 0; i < 8; i++) {
    const z = RING_R * Math.sin(e);
    e = Math.acos(RING_HH / (RING_R * ((P * P) / (P * P - z * z))));
  }
  const z = RING_R * Math.sin(e), y = RING_R * Math.cos(e);
  const drop = (y * P * z) / (P * P - z * z);
  return { tilt: (e * 180) / Math.PI, o: [RC[0], RC[1] - drop] as Pt };
})();
const cam = camera(O, P);

// The balls' path: a circle 166 across its radius in the ring's plane, so a ball (42 across at the pivot's depth)
// clears the ring's ends at the sides, where it changes from behind the ring to in front of it
const PATH = 166, BALL = 42, BALL_BOX = (BALL * 160) / 156;
const DIAL = 1.2; // the dial around the path, as a scale of it
const on = (t: number, k = 1): V3 => onRing(PATH * k, TILT, t);
const pt = (t: number, k = 1): Pt => cam.pt(on(t, k));

const LAP = 16; // seconds a turn
const REST_T = 158; // the chrome ball at rest: near the left end, a little toward us; the green one opposite
const NUDGE = 28; // degrees the slide adds (so the balls are already turning a little more as the station slides in)
const angleAt = (slide: number, time: number) => REST_T + (360 * time) / LAP + NUDGE * slide;

function ballPose(t: number) {
  const [x, y, k] = cam.proj(on(t));
  const near = Math.sin((t * Math.PI) / 180) > 0;
  const [dx, dy] = pt(t, DIAL);
  return {
    transform: `translate(${f(x - BALL_BOX / 2)}px, ${f(y - BALL_BOX / 2)}px) scale(${f(k)})`,
    near, x: f(x), y: f(y), r: f((BALL / 2) * k), dial: [dx, dy] as Pt,
  };
}
const REST = [ballPose(REST_T), ballPose(REST_T + 180)];
// the lines in front, everywhere but a hair around each ball (an even-odd clip: the stage with two round holes)
const cut = (ps: { x: number; y: number; r: number }[]) =>
  "M-20 -20H440V335H-20Z" + ps.map(({ x, y, r }) => { const q = f(r + 1.5); return `M${f(x - q)} ${y}a${q} ${q} 0 1 0 ${f(2 * q)} 0a${q} ${q} 0 1 0 ${f(-2 * q)} 0Z`; }).join("");

const APEX = pt(270, DIAL);

// The swap: a green arc along the dial from the chrome ball's reading to the green ball's (half a turn ahead, where the
// chrome ball is going), turning with them, with a head at the green end. Drawn in short pieces, each at its own
// strength (strongest at the two ends, faint across the middle), each piece in front of or behind the ring by its depth
const SWAP_N = 30, SWAP_FROM = 5, SWAP_TO = 174;
const SWAP_OP = Array.from({ length: SWAP_N }, (_, k) => f(0.1 + 0.9 * Math.abs((2 * (k + 0.5)) / SWAP_N - 1) ** 1.6));
function swapPose(t: number) {
  const pieces = Array.from({ length: SWAP_N }, (_, k) => {
    const a = t + SWAP_FROM + ((SWAP_TO - SWAP_FROM) * k) / SWAP_N, b = t + SWAP_FROM + ((SWAP_TO - SWAP_FROM) * (k + 1)) / SWAP_N;
    return { d: cam.curve((u) => on(u, DIAL), a, b, 2), near: Math.sin((((a + b) / 2) * Math.PI) / 180) > 0 };
  });
  const end = t + SWAP_TO + 3;
  const tip = pt(end, DIAL);
  return { pieces, head: `translate(${tip[0]} ${tip[1]}) rotate(${cam.heading((u) => on(u, DIAL), end)})` };
}
const SWAP_REST = swapPose(REST_T);
// the ecliptic: a horizon through the ring's centre with a fine scale (every 6, longer every 30)
const ECLIPTIC = (() => {
  let d = seg([8, RC[1]], [412, RC[1]]);
  for (let x = 8, i = 0; x <= 412; x += 6, i++) d += `M${x} ${RC[1]}v${i % 5 === 0 ? -4.5 : -2}`;
  return d;
})();

export function AssetsArt({ className = "", ...rest }: HTMLAttributes<HTMLDivElement>) {
  const id = useId().replace(/[^\w-]/g, "");
  const root = useRef<HTMLDivElement>(null);
  const balls = useRef<(HTMLDivElement | null)[]>([]);
  const holes = useRef<SVGPathElement>(null);
  const idx = useRef<(SVGPathElement | null)[]>([]);
  const marks = useRef<(SVGCircleElement | null)[]>([]);
  const grads = useRef<(SVGLinearGradientElement | null)[]>([]);
  const swapFar = useRef<(SVGPathElement | null)[]>([]), swapNear = useRef<(SVGPathElement | null)[]>([]);
  const head = useRef<SVGPathElement>(null);

  useLive(root, (slide, time) => {
    const t = angleAt(slide, time);
    const ps = [ballPose(t), ballPose(t + 180)];
    holes.current!.setAttribute("d", cut(ps));
    const sw = swapPose(t);
    sw.pieces.forEach((q, k) => {
      swapFar.current[k]!.setAttribute("d", q.near ? "" : q.d);
      swapNear.current[k]!.setAttribute("d", q.near ? q.d : "");
    });
    head.current!.setAttribute("transform", sw.head);
    ps.forEach((p, i) => {
      const b = balls.current[i]!;
      b.style.transform = p.transform;
      b.style.zIndex = p.near ? "3" : "1";
      idx.current[i]!.setAttribute("d", seg([p.x, p.y], p.dial));
      const m = marks.current[i]!;
      m.setAttribute("cx", String(p.dial[0])); m.setAttribute("cy", String(p.dial[1]));
      const g = grads.current[i]!;
      g.setAttribute("x1", String(p.x)); g.setAttribute("y1", String(p.y)); g.setAttribute("x2", String(p.dial[0])); g.setAttribute("y2", String(p.dial[1]));
    });
  });

  const names = ["chrome", "green"] as const;
  return (
    <div {...rest} ref={root} className={`${st.art} ${className}`} data-art="assets" aria-hidden="true">
      <div className={st.stage}>
        {/* behind everything: the ecliptic, the far half of the path and the dial, the swap, each ball's reading */}
        <svg className={`${st.svg} ${st.under} ${st.lines}`} viewBox="0 0 420 315">
          <defs>
            {REST.map((p, i) => (
              <linearGradient key={i} id={`${id}g${i}`} ref={(el) => { grads.current[i] = el; }} gradientUnits="userSpaceOnUse" x1={p.x} y1={p.y} x2={p.dial[0]} y2={p.dial[1]}>
                <stop offset="0.25" style={{ stopColor: "var(--color-ink)" }} stopOpacity="0.85" />
                <stop offset="0.62" style={{ stopColor: "var(--color-ink)" }} stopOpacity="0.2" />
                <stop offset="1" style={{ stopColor: "var(--color-ink)" }} stopOpacity="0.85" />
              </linearGradient>
            ))}
          </defs>
          <path className={s.faint} d={ECLIPTIC} />
          <path className={s.orbit} d={cam.curve(on, 180, 360)} />
          <path className={s.faint} d={cam.curve((t) => on(t, DIAL), 180, 360)} />
          <path className={s.fine} d={cam.ticks(on, 204, 336, 3, DIAL, DIAL + 0.03, 5, DIAL + 0.06)} />
          {SWAP_REST.pieces.map((q, k) => <path key={k} ref={(el) => { swapFar.current[k] = el; }} className={st.swap} strokeOpacity={SWAP_OP[k]} d={q.near ? "" : q.d} />)}
          <circle className={s.marker} cx={pt(206, DIAL)[0]} cy={pt(206, DIAL)[1]} r="2.2" />
          {REST.map((p, i) => (
            <g key={i}>
              <path ref={(el) => { idx.current[i] = el; }} d={seg([p.x, p.y], p.dial)} fill="none" stroke={`url(#${id}g${i})`} strokeWidth="0.6" />
              <circle ref={(el) => { marks.current[i] = el; }} className={s.marker} cx={p.dial[0]} cy={p.dial[1]} r="1.9" />
            </g>
          ))}
        </svg>

        {names.map((n, i) => (
          <div key={n} ref={(el) => { balls.current[i] = el; }} className={`${st.sprite} ${REST[i].near ? st.front : st.back}`} style={{ width: BALL_BOX, height: BALL_BOX, transform: REST[i].transform }}>
            <Image src={`${SRC}/ball-${n}.webp`} alt="" fill unoptimized />
          </div>
        ))}

        <div className={`${st.sprite} ${st.glass}`} style={{ left: RC[0] - IMG.cx, top: RC[1] - IMG.cy, width: IMG.w, height: IMG.h }}>
          <Image src={`${SRC}/assets-ring.webp`} alt="" fill unoptimized />
        </div>

        {/* in front: the near half of the path and the dial, the tag's leader; cut where a ball passes over them */}
        <svg className={`${st.svg} ${st.over} ${st.lines}`} viewBox="0 0 420 315">
          <defs>
            <clipPath id={`${id}m`} clipPathUnits="userSpaceOnUse">
              <path ref={holes} d={cut(REST)} clipRule="evenodd" />
            </clipPath>
          </defs>
          <g clipPath={`url(#${id}m)`}>
            <path className={s.dash} d={cam.curve(on, 0, 180)} />
            {SWAP_REST.pieces.map((q, k) => <path key={k} ref={(el) => { swapNear.current[k] = el; }} className={st.swap} strokeOpacity={SWAP_OP[k]} d={q.near ? q.d : ""} />)}
            <path ref={head} className={s.gFill} d="M0 0l-6-2.3v4.6z" transform={SWAP_REST.head} />
            <path className={s.faint} d={cam.curve((t) => on(t, DIAL), 0, 180)} />
            <rect className={s.marker} x={pt(140, DIAL)[0] - 1.6} y={pt(140, DIAL)[1] - 1.6} width="3.2" height="3.2" />
            <path className={s.hair} d={`M${pt(36, DIAL)[0] - 3} ${pt(36, DIAL)[1]}h6M${pt(36, DIAL)[0]} ${pt(36, DIAL)[1] - 3}v6`} />
            <circle className={s.inkFill} cx={APEX[0]} cy={APEX[1]} r="1.6" />
            <path className={s.fine} d={seg(APEX, [APEX[0], APEX[1] - 9])} />
          </g>
        </svg>
        <svg className={`${st.svg} ${st.free}`} viewBox="0 0 420 315">
          <text className={st.label} x={APEX[0]} y={f(APEX[1] - 14)} textAnchor="middle">Swap</text>
        </svg>
      </div>
    </div>
  );
}
