"use client";

import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";
import { useSlide } from "../slide";

// Option 1, "Live glass" (D72): one camera per drawing for the stills, the CSS 3D and the vectors. Every drawing is laid
// out on a 420 × 315 stage (scaled to its slot by --fit), and every point, whether it is a vector, a sprite's place or
// the disc's CSS turn, goes through the same central projection: the eye sits P in front of the drawing's pivot `o`,
// so a point (x, y, z) about the pivot (z toward the viewer) lands at o + (x, y) · P / (P − z). CSS's own
// `perspective(P)` about the same pivot does exactly this, so the disc's turned layers and the vectors drawn on them
// stay together.
export type V3 = readonly [number, number, number];
export type Pt = readonly [number, number];
export const f = (n: number) => Math.round(n * 100) / 100;
const rad = (d: number) => (d * Math.PI) / 180;

// A camera: the eye P in front of the pivot o. `proj` gives a point's place on the stage and its scale (for a sprite's
// size); `curve` and `ticks` draw projected paths; `heading` is the direction of travel on screen at t along a curve.
export type Cam = ReturnType<typeof camera>;
export function camera(o: Pt, P = 1400) {
  const proj = (p: V3): [number, number, number] => { const k = P / (P - p[2]); return [o[0] + p[0] * k, o[1] + p[1] * k, k]; };
  const pt = (p: V3): Pt => { const [x, y] = proj(p); return [f(x), f(y)]; };
  // `at(t)` gives the 3D point, sampled every `step` degrees from t0 to t1
  const curve = (at: (t: number) => V3, t0: number, t1: number, step = 2.5) => {
    const n = Math.max(1, Math.ceil(Math.abs(t1 - t0) / step));
    let d = "";
    for (let i = 0; i <= n; i++) { const [x, y] = pt(at(t0 + ((t1 - t0) * i) / n)); d += `${i ? "L" : "M"}${x} ${y}`; }
    return d;
  };
  // radial ticks every `step` degrees from t0 to t1, from scale s1 to s2 (every `major`th to s3)
  const ticks = (at: (t: number, s: number) => V3, t0: number, t1: number, step: number, s1: number, s2: number, major = 0, s3 = s2) => {
    let d = "";
    for (let t = t0, i = 0; t <= t1 + 1e-6; t += step, i++) d += seg(pt(at(t, s1)), pt(at(t, major && i % major === 0 ? s3 : s2)));
    return d;
  };
  const heading = (at: (t: number) => V3, t: number) => {
    const [ax, ay] = proj(at(t - 0.5)), [bx, by] = proj(at(t + 0.5));
    return f((Math.atan2(by - ay, bx - ax) * 180) / Math.PI);
  };
  return { o, P, proj, pt, curve, ticks, heading };
}

// A circle of radius r in a plane tilted back by `tilt` degrees from flat-to-camera about the horizontal axis (90 =
// lying flat), at angle t: t runs clockwise on screen, 90 the near point, 270 the far one (as Orbit's geom.ts)
export function onRing(r: number, tilt: number, t: number): V3 {
  const a = rad(t), e = rad(tilt);
  return [r * Math.cos(a), r * Math.sin(a) * Math.cos(e), r * Math.sin(a) * Math.sin(e)];
}

// A point (u, v) on a disc standing flat to camera, turned by `yaw` degrees about its vertical axis (CSS rotateY)
export function onDisc(u: number, v: number, yaw: number): V3 {
  const a = rad(yaw);
  return [u * Math.cos(a), v, -u * Math.sin(a)];
}

export const seg = (a: Pt, b: Pt) => `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`;

export const smooth = (u: number) => { const x = Math.min(1, Math.max(0, u)); return x * x * (3 - 2 * x); };

// The live drawing: useSlide only where the drawing is on a moving stage (the rail's stage or a demo frame). The
// static reading (phones, tablets, the screen-reader copy) keeps the server-rendered rest state, as do reduced motion
// and no JS. `onFrame` is read through a ref, so the subscription is made once.
export function useLive(root: RefObject<HTMLElement | null>, onFrame: (slide: number, t: number) => void) {
  const live = useRef<HTMLElement | null>(null);
  const cb = useRef(onFrame);
  useLayoutEffect(() => {
    cb.current = onFrame;
    const el = root.current;
    live.current = el?.closest("[data-s='stage'], [data-slide-frame]") ? el : null;
  });
  const frame = useCallback((s: number, t: number) => cb.current(s, t), []);
  useSlide(live, frame);
}
