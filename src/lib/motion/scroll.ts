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

/**
 * Where a reload (or the browser's back / forward) left the page, kept across the boot (D134). The browser restores the scroll as the page loads, before
 * the pins above (the hero, the rail, the Stack) add their space, so it lands short (about 1,450 px on /home-v5 and /home-v6, partway down) and nothing
 * scrubbed catches up until the next scroll. This keeps the page's scroll in sessionStorage as it is left, and, on a reload or back / forward of this same
 * document, puts it back after each ScrollTrigger refresh for a few seconds, until the reader scrolls themselves. Returns its clean-up.
 */
export function keepScroll(): () => void {
  if (typeof window === "undefined") return () => {};
  const key = "scroll:" + location.pathname + location.search;
  const save = () => { try { sessionStorage.setItem(key, String(Math.round(scrollY))); } catch {} };
  const onHide = () => { if (document.visibilityState === "hidden") save(); };
  addEventListener("pagehide", save); document.addEventListener("visibilitychange", onHide);
  const offSave = () => { removeEventListener("pagehide", save); document.removeEventListener("visibilitychange", onHide); };
  /* only for the load of this very page by reload or back / forward (not a page reached later by a client-side link) */
  const nav = performance.getEntriesByType?.("navigation")[0] as PerformanceNavigationTiming | undefined;
  let same = false;
  try { same = !!nav && (nav.type === "reload" || nav.type === "back_forward") && new URL(nav.name).pathname === location.pathname; } catch {}
  let want = NaN;
  if (same) { try { want = parseFloat(sessionStorage.getItem(key) ?? ""); } catch {} }
  if (!(want > 0)) return offSave;
  let done = false, t = 0;
  const put = () => { if (done) return; if (Math.abs(scrollY - want) > 1) { scrollTo(0, want); ScrollTrigger.update(); } };
  const stop = () => {
    if (done) return; done = true; clearTimeout(t);
    ScrollTrigger.removeEventListener("refresh", put);
    for (const e of ["wheel", "touchstart", "keydown", "pointerdown"]) removeEventListener(e, stop, true);
  };
  ScrollTrigger.addEventListener("refresh", put);
  for (const e of ["wheel", "touchstart", "keydown", "pointerdown"]) addEventListener(e, stop, { capture: true, passive: true });
  t = window.setTimeout(stop, 4000);
  return () => { stop(); offSave(); };
}
