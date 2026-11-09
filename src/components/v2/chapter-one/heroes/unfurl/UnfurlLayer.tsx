"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { r2 } from "../../cinematic/geom";
import { FPS, FRAMES, scene, type Part, type Tone } from "./scene";
import styles from "./UnfurlLayer.module.css";

// The Unfurl hero's vector layer (D90), tracked to its camera move. Server-rendered at the first frame (so phones,
// reduced motion and no JS show the concept over the still); on desktop with motion it redraws at the video frame on
// screen, which only the reader's scroll moves (HeroVideo scrubs it). Unless the reader prefers reduced motion, a quiet
// idle life runs on its own clock at every size while it is on screen (scene.ts: a marker, a circle drawing off and on,
// breathing ticks, a dew link). The SVG shares the picture's crop: a box with the
// video's aspect ratio covering the stage from the same object-position (CSS), so no measuring is needed.
const COL: Record<Tone, string> = { ink: "var(--color-ink)", deep: "var(--color-green-text)", green: "var(--color-green)" };
const mix = (t: Tone, a: number) => (a >= 1 ? COL[t] : `color-mix(in srgb, ${COL[t]} ${Math.round(a * 100)}%, transparent)`);
const NS = { vectorEffect: "non-scaling-stroke" } as const;
const strokeOf = (p: { tone: Tone; a: number; w?: number; dash?: string }): CSSProperties => ({
  fill: "none", stroke: mix(p.tone, p.a), strokeWidth: p.w ?? 0.75, strokeDasharray: p.dash, strokeLinecap: "round", strokeLinejoin: "round",
});
// The D59 curve: a link full at its ends and `mid` in the middle
const STOPS = [0, 0.2, 0.35, 0.5, 0.65, 0.8, 1];
const stopOp = (mid: number, op: number, t: number) => r2((mid + (1 - mid) * Math.pow(Math.abs(2 * t - 1), 1.2)) * op * 100) / 100;

function Shape({ p }: { p: Part }) {
  const o = p.o ?? 1;
  if (p.t === "circle") {
    const st: CSSProperties = p.fill ? { fill: mix(p.tone, p.a) } : strokeOf(p);
    return <circle data-k={p.k} cx={r2(p.c[0])} cy={r2(p.c[1])} r={r2(p.r)} style={st} opacity={o} {...(p.fill ? {} : NS)} />;
  }
  if (p.t === "grad") {
    const id = `uf-${p.k}`;
    return (
      <g>
        <linearGradient id={id} data-g={p.k} gradientUnits="userSpaceOnUse" x1={r2(p.g[0][0])} y1={r2(p.g[0][1])} x2={r2(p.g[1][0])} y2={r2(p.g[1][1])}>
          {STOPS.map((t) => <stop key={t} offset={t} style={{ stopColor: COL[p.tone], stopOpacity: stopOp(p.mid, p.a, t) }} />)}
        </linearGradient>
        <path data-k={p.k} d={p.d} opacity={o} style={{ fill: "none", stroke: `url(#${id})`, strokeWidth: p.w ?? 0.75, strokeLinecap: "round" }} {...NS} />
      </g>
    );
  }
  return <path data-k={p.k} d={p.d} opacity={o} style={strokeOf(p)} {...NS} />;
}

export function UnfurlLayer() {
  const ref = useRef<HTMLDivElement>(null);
  const first = scene(0);

  useEffect(() => {
    const host = ref.current;
    const media = host?.closest<HTMLElement>("[data-ch='media']");
    const svg = host?.querySelector("svg");
    if (!host || !media || !svg) return;
    const video = media.querySelector<HTMLVideoElement>("[data-ch='video']");
    const els = new Map<string, SVGElement>();
    svg.querySelectorAll<SVGElement>("[data-k]").forEach((n) => els.set(n.dataset.k!, n));
    const grads = new Map<string, SVGElement>();
    svg.querySelectorAll<SVGElement>("[data-g]").forEach((n) => grads.set(n.dataset.g!, n));

    // The frame on screen: the presented frame's own time where the browser reports it (during a seek currentTime is
    // already the target while the old frame still shows), as HeroLayer does
    const playing = () => !!video?.hasAttribute("data-ready");
    let shownT = 0, vfc = 0;
    const hasVFC = !!video && "requestVideoFrameCallback" in video;
    if (video && hasVFC) {
      const onFrame = (_: number, m: VideoFrameCallbackMetadata) => { shownT = m.mediaTime; vfc = video.requestVideoFrameCallback(onFrame); };
      vfc = video.requestVideoFrameCallback(onFrame);
    }
    const frameNow = () => {
      if (!playing()) return 0;
      if (!hasVFC && !video!.seeking) shownT = video!.currentTime;
      return Math.min(FRAMES - 1, Math.max(0, shownT * FPS));
    };

    const set = (n: Element, k: string, v: number | string) => { const s = String(v); if (n.getAttribute(k) !== s) n.setAttribute(k, s); };
    let lastF = -1, lastT = -1, lastDraw = 0, raf = 0, inView = true;
    const draw = (f: number, time: number) => {
      for (const p of scene(f, time)) {
        const n = els.get(p.k);
        if (!n) continue;
        set(n, "opacity", r2(p.o ?? 1));
        if (p.t === "circle") { set(n, "cx", r2(p.c[0])); set(n, "cy", r2(p.c[1])); set(n, "r", r2(p.r)); }
        else set(n, "d", p.d);
        if (p.t === "grad") {
          const g = grads.get(p.k);
          if (g) { set(g, "x1", r2(p.g[0][0])); set(g, "y1", r2(p.g[0][1])); set(g, "x2", r2(p.g[1][0])); set(g, "y2", r2(p.g[1][1])); }
        }
      }
    };
    // The idle clock (D44): runs while the layer is on screen and motion is allowed, holds otherwise (so it resumes
    // where it stopped); 0 with reduced motion, where the layer is the still's
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    let clock = 0, prevNow = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(now - prevNow, 100) / 1000; prevNow = now;
      if (!inView) return;
      clock += dt;
      const f = Math.round(frameNow() * 4) / 4;
      // the scroll draws every frame; idle-only changes redraw at about 30 fps
      if (f !== lastF || (clock - lastT > 0.033 && now - lastDraw > 30)) { lastF = f; lastT = clock; lastDraw = now; draw(f, clock); }
    };
    const start = () => {
      cancelAnimationFrame(raf); raf = 0;
      if (!still.matches) { prevNow = performance.now(); raf = requestAnimationFrame(tick); }
      else { clock = 0; lastF = 0; lastT = 0; draw(0, 0); }
    };
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { rootMargin: "100px" });
    io.observe(media);
    still.addEventListener("change", start);
    start();
    return () => {
      cancelAnimationFrame(raf);
      if (video && hasVFC && vfc) video.cancelVideoFrameCallback(vfc);
      io.disconnect();
      still.removeEventListener("change", start);
    };
  }, []);

  return (
    <div ref={ref} className={styles.layer} aria-hidden="true">
      <div className={styles.box}>
        <svg className={styles.svg} viewBox="0 0 1920 1080" preserveAspectRatio="none">
          {first.map((p) => <Shape key={p.k} p={p} />)}
        </svg>
      </div>
    </div>
  );
}
