"use client";

import { useEffect, useRef } from "react";
import styles from "./GateLayer.module.css";
import { draw, type Track } from "./draw";

// The gate (D90): the static concept's layer (cinematic/layers/Gate.tsx) tracked to the camera move. track.json holds,
// for every frame of the footage, the chrome ring's front edge as an ellipse (fitted to its silhouette, robust to the
// reflections sliding over it), the green sphere's centre and size, and the grass edge either side of the ring (points
// that ride the land: their x follows the grass by optical flow, their y sits on the edge found in that frame); scripts
// in assets/generated/2026-11-05_hero-gate. Nothing plays on its own: the frame is the video's frame on screen, so the
// layer's marks ride the footage only as the reader scrolls, and over the still (phones, reduced motion, before the
// video is ready) they sit at frame 0. Idle life (draw.ts) runs on its own clock at every size, slowly, unless the reader
// prefers reduced motion; it pauses with the tab and while the hero is off screen, and redraws at 30 fps at rest.
const FPS = 24; // unless track.json gives the clip's own rate (round 4: 30)

// `track` (optional): another picture's track in the same format, drawn instead of the gate's own (the ring options,
// heroes/ring-options, pass a single-frame track fitted to their still)
export function GateLayer({ track }: { track?: Track } = {}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    const media = host?.closest<HTMLElement>("[data-ch='media']");
    if (!host || !media) return;
    const video = media.querySelector<HTMLVideoElement>("[data-ch='video']");
    const img = media.querySelector<HTMLImageElement>("img");
    const canvas = document.createElement("canvas");
    canvas.className = styles.canvas;
    host.appendChild(canvas);
    const g = canvas.getContext("2d")!;
    const playing = () => !!video?.hasAttribute("data-ready");

    let data: Track | null = track ?? null, dead = false;
    if (!track) import("./track.json").then((m) => { if (!dead) { data = m.default as Track; key = ""; update(); } });

    // The frame on screen: during a seek currentTime is already the target while the old frame still shows, so take
    // the presented frame's own time where the browser reports it, and otherwise hold the last time while seeking
    let shownT = 0, vfc = 0;
    const hasVFC = !!video && "requestVideoFrameCallback" in video;
    if (video && hasVFC) {
      const onFrame = (_: number, m: VideoFrameCallbackMetadata) => { shownT = m.mediaTime; vfc = video.requestVideoFrameCallback(onFrame); };
      vfc = video.requestVideoFrameCallback(onFrame);
    }
    const frameNow = () => {
      if (!playing()) return 0;
      if (!hasVFC && !video!.seeking) shownT = video!.currentTime;
      return shownT * (data?.fps ?? FPS);
    };

    let W = 0, H = 0, dpr = 1, key = "", raf = 0, inView = true, crop = "", pos = [0.5, 0.5];
    let lastStill = "", lastMove = 0, lastDraw = 0;
    // The idle clock: advances only while the layer is drawn (paused off screen and with the tab), from just above 0
    // (0 means "no idle motion" to draw.ts)
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    let clock = 1e-4, lastNow = performance.now();
    const ambientT = () => {
      if (still.matches) return 0;
      const now = performance.now();
      clock += Math.min(now - lastNow, 100) / 1000; lastNow = now;
      return clock;
    };
    const update = () => {
      const w = host.clientWidth, h = host.clientHeight;
      if (w !== W || h !== H) {
        W = w; H = h; dpr = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
        key = "";
      }
      if (!data || !W || !H) return;
      // The same crop as the picture under it: object-fit cover at its object-position (read once per size and source)
      const el = (playing() ? video : img) as HTMLElement | null, id = `${W}|${H}|${playing()}`;
      if (id !== crop && el) { crop = id; pos = getComputedStyle(el).objectPosition.split(" ").map((v) => parseFloat(v) / 100); }
      const f = Math.min(frameNow(), data.frames - 1), t = ambientT(), now = performance.now();
      const rest = `${f.toFixed(2)}|${W}|${H}|${id}`;
      if (rest !== lastStill) { lastStill = rest; lastMove = now; }
      // at rest, the idle motion alone redraws at 30 fps; while the reader scrolls every frame draws
      if (t && now - lastMove > 250 && now - lastDraw < 33) return;
      const k = `${rest}|${t.toFixed(3)}`;
      if (k === key) return;
      key = k; lastDraw = now;
      const s = Math.max(W / data.w, H / data.h), ox = (W - data.w * s) * pos[0], oy = (H - data.h * s) * (pos[1] ?? 0.5);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      g.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);
      draw(g, data, f, 1 / s, t);
    };

    // The loop runs with the desktop camera move or the idle motion; with reduced motion (and no camera move) the layer
    // redraws only on resize and once the still has loaded
    const motion = window.matchMedia("(min-width: 1280px) and (prefers-reduced-motion: no-preference)");
    const tick = () => { raf = requestAnimationFrame(tick); if (inView) update(); else lastNow = performance.now(); };
    const start = () => { cancelAnimationFrame(raf); raf = 0; if (motion.matches || !still.matches) raf = requestAnimationFrame(tick); else { key = ""; update(); } };
    const ro = new ResizeObserver(() => update());
    ro.observe(host);
    img?.addEventListener("load", update);
    motion.addEventListener("change", start);
    still.addEventListener("change", start);
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { rootMargin: "100px" });
    io.observe(media);
    start();
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      if (video && hasVFC && vfc) video.cancelVideoFrameCallback(vfc);
      io.disconnect(); ro.disconnect();
      img?.removeEventListener("load", update);
      motion.removeEventListener("change", start);
      still.removeEventListener("change", start);
      canvas.remove();
    };
  }, [track]);

  return <div ref={ref} className={styles.layer} aria-hidden="true" />;
}
