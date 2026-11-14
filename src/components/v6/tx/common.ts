"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Shared plumbing for home-v6's hero-to-intro transition studies (D109). Each study is a client component placed in the hero's sticky stage
// (.hero__bg); it gets the hero, the stage and the intro statement below, and runs only on desktop with motion, where the picture sticks and
// the film is scrubbed (the same query as HeroVideo). Elsewhere the hero is plain v6: a still with its foot fade (v6.css).
export const MOTION = "(min-width: 1280px) and (prefers-reduced-motion: no-preference)";
export const SCRUB = 0.6;   /* as v2's chapter one: the scroll is smoothed a little, so a fast flick still glides */

export type TxCtx = { hero: HTMLElement; stage: HTMLElement; statement: HTMLElement | null; W: () => number; H: () => number };

/** A value 0 to 1 scrubbed by the hero's scroll between two ScrollTrigger positions (e.g. "top -110%" to "top -170%"), smoothed by SCRUB. */
export function track(hero: HTMLElement, start: string, end: string, onUpdate: (p: number) => void, trigger: Element = hero) {
  const o = { p: 0 };
  const tw = gsap.to(o, { p: 1, ease: "none", onUpdate: () => onUpdate(o.p), scrollTrigger: { trigger, start, end, scrub: SCRUB, invalidateOnRefresh: true } });
  onUpdate(0);
  return () => { tw.scrollTrigger?.kill(); tw.kill(); };
}

/** Runs `setup` on desktop with motion, undone when the query stops matching or the component unmounts. Returns the anchor's ref. */
export function useHeroTx(setup: (c: TxCtx) => (() => void) | void) {
  const anchor = useRef<HTMLSpanElement>(null);
  useGSAP(() => {
    const hero = anchor.current?.closest<HTMLElement>(".hero--v6");
    const stage = hero?.querySelector<HTMLElement>(".hero__bg");
    if (!hero || !stage) return;
    const statement = hero.parentElement?.querySelector<HTMLElement>(".statement") ?? null;
    const mm = gsap.matchMedia();
    mm.add(MOTION, () => setup({ hero, stage, statement, W: () => stage.clientWidth, H: () => stage.clientHeight }));
    return () => mm.revert();
  }, { scope: anchor });
  return anchor;
}

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** The part of p between a and b, as 0 to 1 */
export const span = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const ease = { io: gsap.parseEase("power2.inOut"), out: gsap.parseEase("power3.out"), in: gsap.parseEase("power2.in"), io1: gsap.parseEase("power1.inOut") };

/** A node in the stage's overlay layer (above the picture and its vector layer, below the hero copy) */
export function overlay(stage: HTMLElement, cls: string) {
  const el = document.createElement("div");
  el.className = `tx-overlay ${cls}`;
  el.setAttribute("aria-hidden", "true");
  stage.appendChild(el);
  return el;
}

// ---- for the canvas studies (F, G): the grid's geometry and marks, the film on screen, a redraw loop

/** The page's margin (v3/proof-deeper: --margin: clamp(20px, 5.56vw, 96px)) */
export const pageMargin = (w: number) => Math.min(96, Math.max(20, w * 0.0556));

/** The tokens the canvases paint with (read once from the stage) */
export function inks(stage: HTMLElement) {
  const css = getComputedStyle(stage);
  const v = (n: string, f: string) => css.getPropertyValue(n).trim() || f;
  return { ink: v("--color-ink", "#262626"), paper: v("--paper", "#f4f4f4"), green: v("--color-green", "#00dc8d"), onDark: v("--color-on-dark", "#f5f4f1") };
}

/** The film as it sits on screen (object-fit: cover at its object-position): a screen point (x, y) is the source point (ox + x / s, oy + y / s) */
export function film(stage: HTMLElement) {
  const media = stage.querySelector<HTMLElement>(".hero6__media");
  const video = media?.querySelector<HTMLVideoElement>("video") ?? null;
  const img = media?.querySelector<HTMLImageElement>("img") ?? null;
  let px = 0.3, py = 0.5;
  const read = () => {
    const el = video ?? img;
    if (!el) return;
    const [a, b] = getComputedStyle(el).objectPosition.split(" ").map((v) => parseFloat(v) / 100);
    px = Number.isFinite(a) ? a : 0.3; py = Number.isFinite(b) ? b : 0.5;
  };
  read();
  return {
    read,
    time: () => video?.currentTime ?? 0,
    frame(w: number, h: number) {
      const src: HTMLVideoElement | HTMLImageElement | null = video && video.hasAttribute("data-ready") && video.readyState >= 2 ? video : img;
      if (!src) return null;
      const sw = src instanceof HTMLVideoElement ? src.videoWidth : src.naturalWidth, sh = src instanceof HTMLVideoElement ? src.videoHeight : src.naturalHeight;
      if (!sw || !sh) return null;
      const s = Math.max(w / sw, h / sh);
      return { src, s, ox: (sw - w / s) * px, oy: (sh - h / s) * py };
    },
  };
}

/** A canvas over the stage, redrawn on each animation frame whose `key` has changed. Returns the cleanup. */
export function canvasLoop(stage: HTMLElement, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, key: () => string, onLayout?: () => void, cls = "") {
  const canvas = document.createElement("canvas");
  canvas.className = `tx-overlay txd${cls ? " " + cls : ""}`;
  canvas.setAttribute("aria-hidden", "true");
  stage.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;
  let w = 0, h = 0, dpr = 1, last = "", raf = 0;
  const layout = () => {
    w = stage.clientWidth; h = stage.clientHeight; dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); last = "";
    onLayout?.();
  };
  layout();
  const ro = new ResizeObserver(layout);
  ro.observe(stage);
  /* the loop runs only while the stage is within half a screen (D134: it ran every frame of the whole page, the hero long gone) */
  let near = true;
  const tick = () => {
    raf = near ? requestAnimationFrame(tick) : 0;
    const k = `${key()}|${w}|${h}`;
    if (k === last) return;
    last = k;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    draw(ctx, w, h);
  };
  const io = new IntersectionObserver(([en]) => { near = en.isIntersecting; if (near && !raf) raf = requestAnimationFrame(tick); }, { rootMargin: "50% 0px" });
  io.observe(stage);
  raf = requestAnimationFrame(tick);
  return () => { cancelAnimationFrame(raf); raf = 0; io.disconnect(); ro.disconnect(); canvas.remove(); };
}

/** The grid's 1 px rule from (x1, y1) toward (x2, y2), drawn to fraction k: ink at the grid's strength (24 %) with a pale edge beside it, so it
 *  reads on mist and on forest alike (as B) */
export function rule(ctx: CanvasRenderingContext2D, c: ReturnType<typeof inks>, x1: number, y1: number, x2: number, y2: number, k: number, alpha = 0.24) {
  if (k <= 0) return;
  const x = x1 + (x2 - x1) * k, y = y1 + (y2 - y1) * k, v = x1 === x2;
  const at = (n: number) => Math.round(n) + 0.5;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.45; ctx.strokeStyle = c.onDark; ctx.beginPath();
  if (v) { ctx.moveTo(at(x1) + 1, y1); ctx.lineTo(at(x1) + 1, y); } else { ctx.moveTo(x1, at(y1) + 1); ctx.lineTo(x, at(y1) + 1); }
  ctx.stroke();
  ctx.globalAlpha = alpha; ctx.strokeStyle = c.ink; ctx.beginPath();
  if (v) { ctx.moveTo(at(x1), y1); ctx.lineTo(at(x1), y); } else { ctx.moveTo(x1, at(y1)); ctx.lineTo(x, at(y1)); }
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/** The grid's + (9 px, 1 px arms) at (x, y), turned in to fraction k: from a fifth of its size and a quarter turn, as the rows draw lower down */
export function cross(ctx: CanvasRenderingContext2D, c: ReturnType<typeof inks>, x: number, y: number, k: number) {
  if (k <= 0.02) return;
  ctx.save();
  ctx.translate(Math.round(x) + 0.5, Math.round(y) + 0.5);
  ctx.rotate(((1 - k) * -90 * Math.PI) / 180);
  ctx.scale(0.2 + 0.8 * k, 0.2 + 0.8 * k);
  ctx.fillStyle = c.ink;
  ctx.fillRect(-4.5, -0.5, 9, 1); ctx.fillRect(-0.5, -4.5, 1, 9);
  ctx.restore();
}
