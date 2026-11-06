"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, type HTMLAttributes, type RefObject } from "react";
import { arc, pt, seg, ticks, type Ell, type Pt } from "../../geom";
import { REDUCED, useSlide } from "../slide";
import { matte, type Matte } from "./matte";
import { BALLS, DISC } from "./track";
import s from "./film.module.css";

// Option 2, "Rendered film" (D72). The glass and chrome are Seedance 2.5 films rendered on pure white
// (assets/generated/2026-11-05_rail-motion/o2/), their white taken out on the GPU (matte.ts), and the vectors are
// tracked from the same footage with OpenCV (track.ts), so the lines sit on the objects frame for frame.
// - Data: the frosted disc's turn from about 68° to flat is a short film, scrubbed by the slide (all-intra, so every
//   frame seeks cleanly). The one green ball is a still sprite looping left and right behind it; where the tracked disc
//   stands, the sharp ball is masked away and a heavily blurred copy under a milky wash shows instead.
// - Assets: one revolution of the two equal balls round the ring, retimed to a constant speed and seamless, playing
//   on a loop while the station is on screen.
// The rest state (phones and tablets, reduced motion, no JS, before the film loads) is each film's rest frame as a
// still, with the vectors drawn for it; the films are only fetched where the drawing moves.

export const name = "Rendered film";
export const note =
  "The disc's turn and the balls' orbit are Higgsfield Seedance films rendered on white, with the white taken out so they sit over the page, and every line is tracked from the footage with OpenCV. The slide scrubs the disc from angled to flat while the green ball loops behind it, blurred where the tracked glass covers it; the assets loop plays continuously while the station is on screen.";

const W = 420;
const FPS = 24;
const SRC = "/images/home/own/motion/o2";
const cq = (n: number) => `${((n * 100) / W).toFixed(3)}cqw`;
const r2 = (n: number) => Math.round(n * 100) / 100;

// Animate only on the rail or in a demo frame (the static reading is the same component in a list), and never under
// reduced motion. Runs before useSlide's effect (declared first), so useSlide sees the ref only when the drawing moves.
function useHost(rootRef: RefObject<HTMLDivElement | null>, slideRef: RefObject<HTMLDivElement | null>, videoRef: RefObject<HTMLVideoElement | null>, src: string) {
  useEffect(() => {
    const el = rootRef.current, v = videoRef.current;
    if (!el || !v || matchMedia(REDUCED).matches || !el.closest("[data-own-stage],[data-slide-frame]")) return;
    slideRef.current = el;
    v.setAttribute("src", src);
    v.load();
  }, [rootRef, slideRef, videoRef, src]);
}

// The film's canvas, made once the video can be drawn; disposed on unmount
function useMatte(canvasRef: RefObject<HTMLCanvasElement | null>, videoRef: RefObject<HTMLVideoElement | null>) {
  const m = useRef<Matte | null | undefined>(undefined);
  useEffect(() => () => { m.current?.dispose(); m.current = undefined; }, []);
  return useCallback(() => {
    if (m.current === undefined && canvasRef.current && videoRef.current) m.current = matte(canvasRef.current, videoRef.current);
    return m.current ? m.current.draw() : false;
  }, [canvasRef, videoRef]);
}

// Tiny atlas markers (Orbit's)
const Point = ({ p, r = 1.5, cls = s.inkFill }: { p: Pt; r?: number; cls?: string }) => <circle className={cls} cx={p[0]} cy={p[1]} r={r} />;
const Ring = ({ p, r = 2.2 }: { p: Pt; r?: number }) => <circle className={s.marker} cx={p[0]} cy={p[1]} r={r} />;
const Star = ({ p }: { p: Pt }) => <path className={s.hair} d={`M${p[0] - 3} ${p[1]}h6M${p[0]} ${p[1] - 3}v6`} />;
const Square = ({ p }: { p: Pt }) => <rect className={s.marker} x={p[0] - 1.6} y={p[1] - 1.6} width="3.2" height="3.2" />;

// ── Data ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
// The ball's orbit about the disc: it only ever travels the far half (behind the glass), out past both edges and back
const ORB: Ell = { cx: 209.8, cy: 149, rx: 166, ry: 40, rot: -4 };
const LAST = DISC.length - 1;
const BALL = 23; // the ball's radius at its nearest
const PERIOD = 9; // seconds, left → right → left
const REST_T = 236; // the rest: half behind the disc's left edge
const U0 = (REST_T - 180) / 180;
const PHASE = Math.acos(1 - 2 * U0);
const TAG: Pt = [352, 216];

// The ball at time t: its orbit angle, its centre and its scale (a touch smaller at the far point)
function ballAt(t: number) {
  const u = 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / PERIOD + PHASE);
  const th = 180 + 180 * u;
  const [x, y] = pt(ORB, th);
  return { x, y, k: 1 - 0.12 * -Math.sin((th * Math.PI) / 180) };
}
const discAt = (i: number): Ell => ({ cx: DISC[i][0], cy: DISC[i][1], rx: DISC[i][2], ry: DISC[i][3] });
// The disc's graduated rim (a short scale hugging its left edge) and the tag's anchor on its rim, tracked per frame
const rimArc = (e: Ell) => arc(e, 146, 214, 1.06);
const rimTicks = (e: Ell) => ticks(e, 146, 214, 4, 1.06, 1.09, 4, 1.13);
const anchor = (e: Ell) => pt(e, 32, 1.02);

// The frame for a slide: about 68° from ±0.82 out, flat for a stretch either side of the centre, eased between
function frameFor(slide: number) {
  const u = Math.min(1, Math.max(0, (Math.abs(slide) - 0.12) / 0.7));
  const want = 68 * u * u * (3 - 2 * u);
  let i = LAST;
  while (i > 0 && DISC[i - 1][4] <= want + 0.6) i--;
  return i;
}

function ballStyle(b: { x: number; y: number; k: number }) {
  return `translate(${cq(b.x - BALL * b.k)}, ${cq(b.y - BALL * b.k)}) scale(${r2(b.k)})`;
}
const maskFor = (e: Ell) => `radial-gradient(ellipse ${cq(e.rx - 1)} ${cq(e.ry - 1)} at ${cq(e.cx)} ${cq(e.cy)}, transparent 99.4%, var(--color-ink) 100%)`;
const clipFor = (e: Ell) => `ellipse(${cq(e.rx - 1)} ${cq(e.ry - 1)} at ${cq(e.cx)} ${cq(e.cy)})`;

export function DataArt({ className = "", style, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const root = useRef<HTMLDivElement>(null), slideRef = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const sharp = useRef<HTMLDivElement>(null), soft = useRef<HTMLDivElement>(null), sharpMask = useRef<HTMLDivElement>(null), frost = useRef<HTMLDivElement>(null);
  const rimA = useRef<SVGPathElement>(null), rimT = useRef<SVGPathElement>(null), lead = useRef<SVGPathElement>(null), dot = useRef<SVGCircleElement>(null);
  const shown = useRef(LAST), asked = useRef(-1);
  const draw = useMatte(canvas, video);
  useHost(root, slideRef, video, `${SRC}/data-turn.mp4`);

  // The disc's frame is on screen: lay the mask, the frost and the rim's vectors on its tracked outline
  const place = useCallback((i: number) => {
    const e = discAt(i);
    if (sharpMask.current) { sharpMask.current.style.maskImage = maskFor(e); }
    if (frost.current) frost.current.style.clipPath = clipFor(e);
    rimA.current?.setAttribute("d", rimArc(e));
    rimT.current?.setAttribute("d", rimTicks(e));
    const a = anchor(e);
    lead.current?.setAttribute("d", seg(a, TAG));
    dot.current?.setAttribute("cx", String(a[0]));
    dot.current?.setAttribute("cy", String(a[1]));
  }, []);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const onSeeked = () => {
      if (asked.current < 0 || !draw()) return;
      shown.current = asked.current;
      place(shown.current);
      root.current?.setAttribute("data-live", "");
    };
    v.addEventListener("seeked", onSeeked);
    return () => v.removeEventListener("seeked", onSeeked);
  }, [draw, place]);

  const onFrame = useCallback((slide: number, t: number) => {
    const b = ballStyle(ballAt(t));
    if (sharp.current) sharp.current.style.transform = b;
    if (soft.current) soft.current.style.transform = b;
    const v = video.current;
    if (!v || v.readyState < 1 || v.seeking) return;
    const i = frameFor(slide);
    if (i === asked.current) return;
    asked.current = i;
    v.currentTime = (i + 0.5) / FPS;
  }, []);
  useSlide(slideRef, onFrame);

  const e0 = discAt(LAST), b0 = ballStyle(ballAt(0)), a0 = anchor(e0);
  return (
    <div {...rest} ref={root} className={`${s.art} ${className}`} style={style} data-art="data" aria-hidden="true">
      <div className={s.layer}>
        {/* far side: the ball's orbit behind the glass and its ticks */}
        <svg className={`${s.svg} ${s.lines}`} viewBox="0 0 420 315">
          <path className={s.orbit} d={arc(ORB, 180, 360)} />
          <path className={s.faint} d={arc(ORB, 180, 360, 0.74)} />
          <path className={s.fine} d={ticks(ORB, 196, 262, 3, 1, 1.035, 5, 1.07)} />
          <path className={s.dots} d={seg([262, 148], [392, 146])} />
          <Star p={pt(ORB, 232)} />
          {/* the horizon, with its scale up to the disc (behind the ball, which crosses it) */}
          <path className={s.hair} d={seg([36, 149], [116, 149])} />
          <path className={s.fine} d={Array.from({ length: 13 }, (_, i) => `M${36 + i * 6} 149v${i % 5 === 0 ? -5 : -2.2}`).join("")} />
          <Point p={[36, 149]} />
        </svg>
        {/* the green ball, sharp where nothing covers it */}
        <div ref={sharpMask} className={s.fill} style={{ maskImage: maskFor(e0) }}>
          <div ref={sharp} className={s.ball} style={{ transform: b0, transformOrigin: "0 0" }}>
            <Image src={`${SRC}/data-ball.webp`} alt="" width={192} height={192} unoptimized />
          </div>
        </div>
        {/* behind the glass: the same ball, diffused, under a milky wash */}
        <div ref={frost} className={s.fill} style={{ clipPath: clipFor(e0) }}>
          <div ref={soft} className={`${s.ball} ${s.soft}`} style={{ transform: b0, transformOrigin: "0 0" }}>
            <Image src={`${SRC}/data-ball.webp`} alt="" width={192} height={192} unoptimized />
          </div>
          <div className={s.frost} />
        </div>
        {/* the disc: the rest frame as a still, the film's frames over it */}
        <Image className={s.poster} src={`${SRC}/data-rest.webp`} alt="" fill unoptimized />
        <canvas ref={canvas} className={s.canvas} />
        <video ref={video} className={s.source} muted playsInline preload="auto" crossOrigin="anonymous" />
        {/* near side: the orbit in front of the glass, its scale, the markers; the rim tracked to the disc */}
        <svg className={`${s.svg} ${s.lines}`} viewBox="0 0 420 315">
          <path className={s.orbit} d={arc(ORB, 0, 180)} />
          <path className={s.faint} d={arc(ORB, 0, 180, 0.74)} />
          <path className={s.fine} d={ticks(ORB, 100, 176, 2, 1, 1.035, 5, 1.07)} />
          <Point p={pt(ORB, 150)} r={1.8} />
          <Ring p={pt(ORB, 30)} />
          <Square p={pt(ORB, 120, 0.74)} />
          <path ref={rimA} className={s.faint} d={rimArc(e0)} />
          <path ref={rimT} className={s.fine} d={rimTicks(e0)} />
          <path ref={lead} className={s.fine} d={seg(a0, TAG)} />
          <circle ref={dot} className={s.inkFill} cx={a0[0]} cy={a0[1]} r={1.6} />
        </svg>
        <svg className={s.svg} viewBox="0 0 420 315">
          <text className={s.label} x={386} y={230} textAnchor="end">Private</text>
        </svg>
      </div>
    </div>
  );
}

// ── Assets ───────────────────────────────────────────────────────────────────────────────────────────────────────────
// The ring as tracked from the clean plate, and the wide orbit about it that carries the balls' markers
const RING: Ell = { cx: 209.9, cy: 161.3, rx: 163, ry: 61.2 };
const OUT: Ell = { ...RING, rx: RING.rx * 1.12, ry: RING.ry * 1.12 };
// A ball's angle round the ring, from where it rests on the band (its tracked centre, one radius down)
const footAngle = (x: number, y: number, r: number) => ((Math.atan2((y + r * 0.92 - RING.cy) / RING.ry, (x - RING.cx) / RING.rx) * 180) / Math.PI + 360) % 360;
const far = (t: number) => t > 180;
// The swap: the orbit from the chrome ball's marker forward to the green one's, split where it passes behind the ring
function swap(tc: number, tg: number) {
  const end = tg > tc ? tg : tg + 360;
  const parts: { d: string; far: boolean }[] = [];
  const cuts = [tc, ...[180, 360, 540].filter((c) => c > tc && c < end), end];
  for (let i = 0; i < cuts.length - 1; i++) {
    const a = cuts[i], b = cuts[i + 1];
    if (b - a < 0.5) continue;
    parts.push({ d: arc(OUT, a, b), far: far(((a + b) / 2) % 360) });
  }
  return parts;
}
const APEX = pt(OUT, 90);
// Per frame: each ball's angle, its marker on the wide orbit and the plumb from the ring's edge out to it
function balls(f: number) {
  const [gx, gy, gr, cx, cy, cr] = BALLS[f];
  const tg = footAngle(gx, gy, gr), tc = footAngle(cx, cy, cr);
  return { tg, tc, g: pt(OUT, tg), c: pt(OUT, tc), gp: seg(pt(RING, tg, 1.02), pt(OUT, tg)), cp: seg(pt(RING, tc, 1.02), pt(OUT, tc)), gb: [gx, gy, gr], cb: [cx, cy, cr] };
}

// The far lines' mask: the whole drawing, with a hole where each ball stands
const hole = ([x, y, r]: readonly number[]) => { const R = r2(r + 1); return `M${r2(x - R)} ${y}a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0`; };
const holes = (a: readonly number[], b: readonly number[]) => `M0 0H420V315H0Z${hole(a)}${hole(b)}`;

export function AssetsArt({ className = "", style, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null), slideRef = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const lines = useRef<SVGSVGElement[]>([]);
  const last = useRef(-1);
  const draw = useMatte(canvas, video);
  useHost(root, slideRef, video, `${SRC}/assets-loop.mp4`);

  // Pause off screen (useSlide stops calling then)
  useEffect(() => {
    const el = root.current, v = video.current;
    if (!el || !v) return;
    const io = new IntersectionObserver(([e]) => { if (!e.isIntersecting) v.pause(); });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Lay the tracked vectors on the film's frame f
  const place = useCallback((f: number) => {
    const b = balls(f), parts = swap(b.tc, b.tg);
    lines.current.forEach((svg, layer) => {
      const isFar = layer === 0;
      const q = <T extends Element>(sel: string) => svg.querySelector<T>(sel);
      const mark = (k: "g" | "c", t: number, p: Pt, d: string) => {
        q<SVGGElement>(`[data-m=${k}]`)?.style.setProperty("visibility", far(t) === isFar ? "visible" : "hidden");
        q(`[data-m=${k}] circle`)?.setAttribute("cx", String(p[0]));
        q(`[data-m=${k}] circle`)?.setAttribute("cy", String(p[1]));
        q(`[data-m=${k}] path`)?.setAttribute("d", d);
      };
      mark("g", b.tg, b.g, b.gp);
      mark("c", b.tc, b.c, b.cp);
      q("[data-m=swap]")?.setAttribute("d", parts.filter((p) => p.far === isFar).map((p) => p.d).join(""));
      const grad = q("linearGradient");
      grad?.setAttribute("x1", String(b.c[0])); grad?.setAttribute("y1", String(b.c[1]));
      grad?.setAttribute("x2", String(b.g[0])); grad?.setAttribute("y2", String(b.g[1]));
      // behind the balls, the far lines stop (the chrome's white highlights would otherwise show them through)
      if (isFar) q("mask path")?.setAttribute("d", holes(b.gb, b.cb));
    });
  }, []);

  const onFrame = useCallback(() => {
    const v = video.current;
    if (!v || v.readyState < 2) return;
    if (v.paused) v.play().catch(() => {});
    if (!draw()) return;
    root.current?.setAttribute("data-live", "");
    const f = Math.floor(v.currentTime * FPS) % BALLS.length;
    if (f !== last.current) { last.current = f; place(f); }
  }, [draw, place]);
  useSlide(slideRef, onFrame);

  // The rest: the film's first frame (chrome near left, green far right)
  const b0 = balls(0), parts0 = swap(b0.tc, b0.tg);
  const layer = (isFar: boolean) => {
    const k = `${id}${isFar ? "f" : "n"}`;
    return (
      <svg ref={(n) => { if (n) lines.current[isFar ? 0 : 1] = n; }} className={`${s.svg} ${s.lines}`} viewBox="0 0 420 315">
        <defs>
          {/* the swap is strongest at its two balls */}
          <linearGradient id={`${k}g`} gradientUnits="userSpaceOnUse" x1={b0.c[0]} y1={b0.c[1]} x2={b0.g[0]} y2={b0.g[1]}>
            <stop offset="0" stopColor="var(--color-green-text)" />
            <stop offset="0.5" stopColor="var(--color-green-text)" stopOpacity="0.3" />
            <stop offset="1" stopColor="var(--color-green-text)" />
          </linearGradient>
          {isFar && (
            <mask id={`${k}m`} maskUnits="userSpaceOnUse" x="0" y="0" width="420" height="315" style={{ maskType: "alpha" }}>
              <path fillRule="evenodd" fill="var(--color-ink)" d={holes(b0.gb, b0.cb)} />
            </mask>
          )}
        </defs>
        <g mask={isFar ? `url(#${k}m)` : undefined}>
          {isFar ? (
            <>
              <path className={s.faint} d={seg([8, RING.cy], [412, RING.cy]) + Array.from({ length: 68 }, (_, i) => `M${8 + i * 6} ${RING.cy}v${i % 5 === 0 ? -4.5 : -2}`).join("")} />
              <path className={s.orbit} d={arc(OUT, 180, 360)} />
              <path className={s.fine} d={ticks(OUT, 204, 336, 3, 1, 1.04, 5, 1.08)} />
              <Square p={pt(OUT, 300, 1.08)} />
            </>
          ) : (
            <>
              <path className={s.orbit} d={arc(OUT, 0, 180)} />
              <path className={s.faint} d={arc(RING, 0, 180, 1.22)} />
              <Ring p={pt(OUT, 154, 1.09)} />
              <Star p={pt(OUT, 28, 1.09)} />
              <Point p={APEX} />
              <path className={s.fine} d={seg(APEX, [APEX[0], APEX[1] + 8])} />
            </>
          )}
          <path data-m="swap" className={s.gLine} style={{ stroke: `url(#${k}g)` }} d={parts0.filter((p) => p.far === isFar).map((p) => p.d).join("")} />
          <g data-m="c" style={{ visibility: far(b0.tc) === isFar ? "visible" : "hidden" }}>
            <path className={s.fine} d={b0.cp} />
            <circle className={s.marker} cx={b0.c[0]} cy={b0.c[1]} r={2.2} />
          </g>
          <g data-m="g" style={{ visibility: far(b0.tg) === isFar ? "visible" : "hidden" }}>
            <path className={s.fine} d={b0.gp} />
            <circle className={s.gFill} cx={b0.g[0]} cy={b0.g[1]} r={2.4} />
          </g>
        </g>
      </svg>
    );
  };
  return (
    <div {...rest} ref={root} className={`${s.art} ${className}`} style={style} data-art="assets" aria-hidden="true">
      <div className={s.layer}>
        {layer(true)}
        <Image className={s.poster} src={`${SRC}/assets-rest.webp`} alt="" fill unoptimized />
        <canvas ref={canvas} className={s.canvas} />
        <video ref={video} className={s.source} muted playsInline loop preload="auto" crossOrigin="anonymous" />
        {layer(false)}
        <svg className={s.svg} viewBox="0 0 420 315">
          <text className={s.label} x={APEX[0]} y={APEX[1] + 21} textAnchor="middle">Swap</text>
        </svg>
      </div>
    </div>
  );
}
