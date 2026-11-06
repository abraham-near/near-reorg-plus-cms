"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, type HTMLAttributes, type ReactNode } from "react";
import s from "../../orbit.module.css";
import { REDUCED, useSlide } from "../slide";
import { circlePath, HEAD, SQUARE, STAR, type Attrs } from "./geo";
import type { Tokens, View } from "./gl";
import {
  assetsHorizon, assetsPose, assetsVectors, dataPose, dataVectors, INTEL_GAP, INTEL_HORIZON, INTEL_RAY_FROM, intelligencePose,
  intelligenceVectors, LABEL_DATA, type AssetsPose, type DataPose, type IntelPose, type Spring,
} from "./scenes";
import m from "./o3.module.css";

// Option 3, real-time 3D (D72): three.js renders the glass and metal live (one shared WebGL renderer, loaded only on
// the client when a drawing is on the rail or in a demo), and Orbit's vector layer is projected from the same scene
// every frame, so the lines sit exactly on the objects. The rest state (reduced motion, phones, no JS, no WebGL) is a
// still rendered from this scene at t = 0 with its vectors drawn from the same pose on the server.
export const name = "Real-time 3D";
export const note =
  "Rendered live in the browser with three.js: real frosted glass (transmission with roughness) that genuinely blurs the green ball behind it, polished metal in a neutral studio light. The disc turns flat to camera as it reaches the centre and the green balls loop on their own time; Orbit’s lines are projected from the 3D scene every frame.";

const W = 420, H = 315;
const SRC = "/images/home/own/motion/o3";

// Lines, markers and tags, keyed so each frame can rewrite them in place (no React render per frame). Their numbers are
// computed on the server and again in the browser, where the last decimal can differ, so hydration doesn't check them.
export type K = (k: string, cls: string) => { "data-k": string; className: string; suppressHydrationWarning: true; [attr: string]: string | boolean };

export function Stage<P>({ which, rest, under, over, labels, pose, vectors, load, still, props }: {
  which: "data" | "assets" | "intelligence" | "identity" | "layer";
  rest: Record<string, Attrs>;
  under: (k: K) => ReactNode;
  over: (k: K) => ReactNode;
  labels: ReactNode;
  pose: (slide: number, t: number) => P;
  vectors: (p: P) => Record<string, Attrs>;
  load: () => Promise<(t: Tokens) => View<P>>;
  still: string;
  props: HTMLAttributes<HTMLDivElement>;
}) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const gate = useRef<HTMLDivElement>(null); // set only when this drawing moves (on the rail or in a demo)
  const live = useRef<{ view: View<P>; ctx: CanvasRenderingContext2D; els: Map<string, Element>; w: number; h: number; t0: number } | null>(null);
  const k: K = (key, cls) => ({ "data-k": key, className: cls, suppressHydrationWarning: true, ...rest[key] });

  useEffect(() => {
    const el = root.current, cv = canvas.current;
    if (!el || !cv || matchMedia(REDUCED).matches || !el.closest("[data-own-stage], [data-slide-frame]")) return;
    gate.current = el;
    let gone = false, view: View<P> | null = null;
    const ctx = cv.getContext("2d");
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(el.clientWidth * dpr), h = Math.round(el.clientHeight * dpr);
      if (w && h && (cv.width !== w || cv.height !== h)) { cv.width = w; cv.height = h; }
      if (live.current) { live.current.w = w; live.current.h = h; }
    };
    const ro = new ResizeObserver(size);
    ro.observe(el);
    load().then((make) => {
      if (gone || !ctx) return;
      const css = getComputedStyle(el);
      const tok = (n: string) => css.getPropertyValue(`--color-${n}`).trim();
      const tokens = { green: tok("green"), surface: tok("surface"), surface2: tok("surface-2"), onDark: tok("on-dark"), ink: tok("ink"), muted: tok("muted") };
      try { view = make(tokens); } catch { return; } // no WebGL: the still stays
      const els = new Map<string, Element>();
      el.querySelectorAll("[data-k]").forEach((n) => els.set(n.getAttribute("data-k")!, n));
      live.current = { view, ctx, els, w: cv.width, h: cv.height, t0: -1 };
    }).catch(() => {});
    return () => { gone = true; ro.disconnect(); view?.dispose(); live.current = null; el.removeAttribute("data-live"); };
  }, [load]);

  const frame = useCallback((slide: number, t: number) => {
    const L = live.current;
    if (!L || !L.w || !L.h) return;
    // the loops start from the rest pose on the first live frame, so the still hands over without a jump
    if (L.t0 < 0) L.t0 = t;
    const p = pose(slide, t - L.t0);
    const v = vectors(p);
    for (const key in v) {
      const n = L.els.get(key);
      if (n) for (const a in v[key]) n.setAttribute(a, v[key][a]);
    }
    L.view.update(p);
    L.view.draw(L.ctx, L.w, L.h);
    if (!root.current?.hasAttribute("data-live")) root.current?.setAttribute("data-live", "");
  }, [pose, vectors]);
  useSlide(gate, frame);

  return (
    <div {...props} ref={root} className={`${s.art} ${m.root} ${props.className ?? ""}`} data-art={which} aria-hidden="true">
      <div className={s.layer}>
        <svg className={`${s.svg} ${s.lines}`} viewBox={`0 0 ${W} ${H}`}>{under(k)}</svg>
        <Image className={`${s.img} ${m.still}`} src={`${SRC}/${still}.webp`} alt="" fill unoptimized />
        <canvas ref={canvas} className={m.canvas} />
        <svg className={`${s.svg} ${s.lines}`} viewBox={`0 0 ${W} ${H}`}>{over(k)}</svg>
      </div>
      <div className={s.layer}>
        <svg className={s.svg} viewBox={`0 0 ${W} ${H}`}>{labels}</svg>
      </div>
    </div>
  );
}

// ── Data
const DATA_REST = dataVectors(dataPose(0, 0));
const loadData = () => import("./gl").then((g) => g.dataView);
const dataParts = {
  under: (k: K) => (
    <>
      <path {...k("innerBack", s.faint)} />
      <path {...k("orbitBack", s.orbit)} />
      <path {...k("ticksBack", s.fine)} />
      <path {...k("track", s.dots)} />
    </>
  ),
  over: (k: K) => (
    <>
      <path {...k("innerFront", s.faint)} />
      <path {...k("orbitFront", s.orbit)} />
      <path {...k("ticksFront", s.fine)} />
      <path {...k("rim", s.fine)} />
      <path {...k("rimArc", s.faint)} />
      <path {...k("trackLeft", s.hair)} />
      <path {...k("trackScale", s.fine)} />
      <g {...k("trackEnd", "")}><path className={s.inkFill} d={circlePath(1.5)} /></g>
      <g {...k("p150", "")}><path className={s.inkFill} d={circlePath(1.8)} /></g>
      <g {...k("p30", "")}><path className={s.marker} d={circlePath(2.2)} /></g>
      <g {...k("p232", "")}><path className={s.hair} d={STAR} /></g>
      <g {...k("p120", "")}><path className={s.marker} d={SQUARE} /></g>
      <path {...k("leader", s.fine)} />
      <g {...k("leadDot", "")}><path className={s.inkFill} d={circlePath(1.6)} /></g>
    </>
  ),
};
export function DataArt(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <Stage<DataPose>
      which="data" rest={DATA_REST} still="data" props={props} pose={dataPose} vectors={dataVectors} load={loadData}
      under={dataParts.under} over={dataParts.over}
      labels={<text className={s.label} x={LABEL_DATA[0]} y={LABEL_DATA[1]} textAnchor="end">Private</text>}
    />
  );
}

// ── Assets
const ASSETS_REST = assetsVectors(assetsPose(0, 0));
const loadAssets = () => import("./gl").then((g) => g.assetsView);
// the ticked horizon, left out where it passes behind a sphere (`gap`, intelligence only)
function ecliptic(y = assetsHorizon(), gap?: readonly [number, number]) {
  const yy = y.toFixed(2);
  let d = gap ? `M8 ${yy}H${gap[0].toFixed(2)}M${gap[1].toFixed(2)} ${yy}H412` : `M8 ${yy}H412`;
  for (let x = 8, i = 0; x <= 412; x += 6, i++) if (!gap || x < gap[0] || x > gap[1]) d += `M${x} ${yy}v${i % 5 === 0 ? -4.5 : -2}`;
  return d;
}
const ECLIPTIC = ecliptic();

// the three orbiting markers (ring, cross, square), each drawn in both layers and shown in the one it is in
const MARKS = [circlePath(2.2), STAR, SQUARE];
const markCls = [s.marker, s.hair, s.marker];
const marksIn = (k: K, side: "b" | "f") => MARKS.map((d, i) => (
  <g key={i}>
    <path {...k(`mt${i}${side}`, s.fine)} />
    <g {...k(`mk${i}${side}`, "")}><path className={markCls[i]} d={d} /></g>
  </g>
));

export function AssetsArt(props: HTMLAttributes<HTMLDivElement>) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const trail = `o3trail${id}`, reading = `o3read${id}`;
  return (
    <Stage<AssetsPose>
      which="assets" rest={ASSETS_REST} still="assets" props={props} pose={assetsPose} vectors={assetsVectors} load={loadAssets}
      under={(k) => (
        <>
          <path className={s.faint} d={ECLIPTIC} />
          <path {...k("dialRingBack", s.faint)} />
          <path {...k("dialBack", s.fine)} />
          <path {...k("constructBack", s.faint)} />
          {marksIn(k, "b")}
          <path {...k("pathBack", s.orbit)} />
          <path {...k("ticks", s.fine)} />
        </>
      )}
      over={(k) => (
        <>
          <defs>
            {/* the trail: full strength where it meets the ball, gone at its tail */}
            <linearGradient id={trail} gradientUnits="userSpaceOnUse" {...k("trailGrad", "")}>
              <stop offset="0" stopColor="var(--color-green-text)" stopOpacity="0" />
              <stop offset="1" stopColor="var(--color-green-text)" />
            </linearGradient>
            {/* the reading joins two points: strongest at both */}
            <linearGradient id={reading} gradientUnits="userSpaceOnUse" {...k("readingGrad", "")}>
              <stop offset="0" stopColor="var(--color-ink)" stopOpacity="0.85" />
              <stop offset="0.5" stopColor="var(--color-ink)" stopOpacity="0.2" />
              <stop offset="1" stopColor="var(--color-ink)" stopOpacity="0.85" />
            </linearGradient>
          </defs>
          <path {...k("dialRingFront", s.faint)} />
          <path {...k("dialFront", s.fine)} />
          <path {...k("constructFront", s.faint)} />
          {marksIn(k, "f")}
          <path {...k("pathFront", s.orbit)} />
          <path {...k("arc0", s.dash)} />
          <path {...k("arc1", s.dash)} />
          <path {...k("arc2", s.dash)} />
          <path {...k("reading", s.hair)} style={{ stroke: `url(#${reading})` }} />
          <path {...k("readingTicks", s.faint)} />
          <g {...k("readingFrom", "")}><path className={s.inkFill} d={circlePath(1.4)} /></g>
          <g {...k("readingTo", "")}><path className={s.inkFill} d={circlePath(1.4)} /></g>
          <path {...k("trail", s.gLine)} style={{ stroke: `url(#${trail})`, strokeWidth: 1.2 }} />
        </>
      )}
      labels={null}
    />
  );
}

// ── Intelligence (Lawrence: "core only"): the sphere and the chrome ball stay put; the green core turns inside the
// frost and the vectors move. The sphere arrives pitched and rolled (its band an open ellipse) and eases level at the
// centre with the data disc's spring (D73), so each drawing keeps its own spring state. No tag (the "Signed proof" tag,
// its leader and its dot are gone, as "Private" and "Swap" were).
const INTEL_REST = intelligenceVectors(intelligencePose(0, 0));
const loadIntelligence = () => import("./gl").then((g) => g.intelligenceView);
const INTEL_ECLIPTIC = ecliptic(INTEL_HORIZON, INTEL_GAP);
const INTEL_MARKS = [circlePath(2.2), STAR, SQUARE];
const intelMarks = (k: K, side: "b" | "f") => INTEL_MARKS.map((d, i) => (
  <g key={i} {...k(`mk${i}${side}`, "")}><path className={markCls[i]} d={d} /></g>
));

export function IntelligenceArt(props: HTMLAttributes<HTMLDivElement>) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const trace = `o3trace${id}`;
  const spring = useRef<Spring>({ y: 0, v: 0, t: -1 });
  const pose = useCallback((slide: number, t: number) => intelligencePose(slide, t, spring.current), []);
  return (
    <Stage<IntelPose>
      which="intelligence" rest={INTEL_REST} still="intelligence" props={props} pose={pose} vectors={intelligenceVectors}
      load={loadIntelligence}
      under={(k) => (
        <>
          <path className={s.faint} d={INTEL_ECLIPTIC} />
          <path {...k("sealBack", s.orbit)} />
          <path {...k("tiltBack", s.dash)} />
          <path {...k("scale", s.fine)} />
          <path {...k("meridBack", s.faint)} />
          <path {...k("meridTicksBack", s.fine)} />
          {intelMarks(k, "b")}
        </>
      )}
      over={(k) => (
        <>
          <defs>
            {/* the signed trace, in ink now the ball is chrome (D79): full strength at the ball, gone at its tail */}
            <linearGradient id={trace} gradientUnits="userSpaceOnUse" {...k("traceGrad", "")}>
              <stop offset="0" stopColor="var(--color-ink)" stopOpacity="0" />
              <stop offset="1" stopColor="var(--color-ink)" stopOpacity="0.86" />
            </linearGradient>
          </defs>
          <path {...k("sealFront", s.orbit)} />
          <path {...k("tiltFront", s.dash)} />
          <path {...k("meridFront", s.faint)} />
          <path {...k("meridTicksFront", s.fine)} />
          {intelMarks(k, "f")}
          <path {...k("ray", s.hair)} />
          <g {...k("head", "")}><path className={s.inkFill} d={HEAD} /></g>
          <g transform={`translate(${INTEL_RAY_FROM[0]} ${INTEL_RAY_FROM[1]})`}><path className={s.inkFill} d={circlePath(1.5)} /></g>
          <path {...k("trace", s.hair)} style={{ stroke: `url(#${trace})`, strokeWidth: 1 }} />
        </>
      )}
      labels={null}
    />
  );
}
