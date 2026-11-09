"use client";
import { createContext, useContext, useEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export type MotionCtx = { gsap: typeof gsap; ScrollTrigger: typeof ScrollTrigger; reduced: boolean };
/** what a section's motion returns: its own clean-up (listeners, observers); its ScrollTriggers and tweens are reverted by the gsap context */
export type Mount = (root: HTMLElement, ctx: MotionCtx) => void | (() => void);

/** prefers-reduced-motion, or v1's ?rm=1 (html[data-rm], set by its head script) */
export const prefersReduced = () =>
  typeof window !== "undefined" && (window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.hasAttribute("data-rm"));

/**
 * An optional gate: a page whose own boot builds pins above the shared sections (v1: the world, the rail, the Stack) provides a promise, and the sections
 * mount their motion only once it resolves. No provider (v2, any other page): they mount at once.
 */
const MotionGateCtx = createContext<(() => Promise<void>) | null>(null);
export const MotionGate = MotionGateCtx.Provider;

/**
 * Runs a section's scroll motion once its markup is in the DOM. Everything it creates through gsap / ScrollTrigger inside `mount` is scoped to a gsap context and
 * reverted on unmount (React's dev double-mount included); `mount` returns its own clean-up for anything else. With reduced motion `mount` still runs with
 * ctx.reduced = true (interactions only: no scroll build-in), so every section has ONE static state that is the finished layout.
 * A late ScrollTrigger.refresh follows every mount (the pins above — the hero and the rail — move every start / end below them).
 */
export function useScrollMotion(ref: RefObject<HTMLElement | null>, mount: Mount) {
  const gate = useContext(MotionGateCtx);
  useEffect(() => {
    const root = ref.current; if (!root) return;
    let dead = false, cleanup: void | (() => void), gctx: gsap.Context | null = null;
    const run = () => { gctx = gsap.context(() => { cleanup = mount(root, { gsap, ScrollTrigger, reduced: prefersReduced() }); }, root); };
    if (gate) gate().then(() => { if (dead) return; run(); requestAnimationFrame(() => ScrollTrigger.refresh()); });
    else { run(); scheduleRefresh(); }
    return () => { dead = true; if (typeof cleanup === "function") cleanup(); gctx?.revert(); };
    // mount is a module-level function and the gate is fixed per page: the effect runs once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

let refreshT = 0;
function scheduleRefresh() {
  window.clearTimeout(refreshT);
  refreshT = window.setTimeout(() => { requestAnimationFrame(() => ScrollTrigger.refresh()); }, 120);
}

/** a CSS custom property writer that skips unchanged values (3 decimals) */
export function setter() {
  const memo = new WeakMap<Element, Record<string, string>>();
  return (el: HTMLElement, name: string, v: number | string) => {
    const m = memo.get(el) || {}; const s = typeof v === "number" ? v.toFixed(3) : String(v);
    if (m[name] !== s) { m[name] = s; memo.set(el, m); el.style.setProperty(name, s); }
  };
}

/** one scrubbed trigger: fn(progress) on every update and refresh (a trigger whose start is clamped to the top of the page reads as done) */
export function scrub(trigger: Element, start: string, end: string, fn: (p: number) => void, refresh?: () => void) {
  const pr = (s: ScrollTrigger) => (s.start <= 0 ? 1 : s.progress);
  const st = ScrollTrigger.create({ trigger, start, end, onUpdate: (s) => fn(pr(s)), onRefresh: (s) => { if (refresh) refresh(); fn(pr(s)); } });
  fn(pr(st)); return st;
}
