// The final Protocol page's motion: version B's (../b/motion.ts: the ruled grid's arrivals, the headings' word rise, the hero's [data-in] lines, the
// pinned chapter, Speed's metronome) and, for the parts that come from the Vercel page, its drawings (./art.ts: the isometric plates build as they
// arrive, the hero index lights its part, the quantum ring turns). Reduced motion: every drawing finished, no loop.
import type { MotionCtx } from "@/lib/motion/scroll";
import { mount as mountB } from "../b/motion";
import { mountArt } from "./art";

export function mount(root: HTMLElement, ctx: MotionCtx) {
  const b = mountB(root, ctx);
  const art = mountArt(root, ctx);
  return () => { art(); if (typeof b === "function") b(); };
}
