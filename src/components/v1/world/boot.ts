// The world's boot (r13/lib/page.js + r17 v1's intro, in r17's order): mountIntro -> the globe (the intro attaches as soon as it exists) -> the statement's words ->
// GSAP + ScrollTrigger + Lenis (only when the pin runs) on ONE ticker -> the transition's pinned, scrubbed master timeline -> intro.start(ctx).
// Reduced motion (?rm=1): no pin, a still globe (rendered once), the statement follows the hero. ?gl=0 or no WebGL: the SVG poster, no pin, the statement fades in on view.
//
// ctx (WorldCtx = V1Ctx + what the world's own modules use):
//   globe (null on the poster), pin, stage, canvas, box (.globe), hero { el, h1, lines (.ln), sub, subLines (.bl), cta (.hero__cta), copy }, statement (split.ts), W, H,
//   tl (the transition's timeline), master (the scrubbed timeline: tl + the held rest),
//   progress(cb) -> off      cb(p), p = 0..1 over the transition (smoothed by the scrub), once per change; also called at once with the current p
//   onLayout(cb) -> off      cb(ctx) once after the fonts + the layout are settled, then after every resize / dot-count change
//   dispose()                tears the world down (WebGL, Lenis, the ticker, the ScrollTriggers, the listeners, the statement's split); idempotent; also runs when `signal` aborts
import { gsap } from "gsap";
import { setSmooth } from "@/lib/motion/smooth";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import type { V1Ctx, Dispose } from "../ctx";
import { createGlobe, type Globe } from "./globe";
import { splitStatement, type Statement } from "./split";
import { mountIntro } from "./intro";
import setupTransition, { config as transitionConfig } from "./transition";

gsap.registerPlugin(ScrollTrigger);

export type WorldCtx = V1Ctx & {
  dispose: Dispose;
  globe: Globe | null;
  pin: HTMLElement; stage: HTMLElement; canvas: HTMLCanvasElement; box: HTMLElement;
  hero: { el: HTMLElement | null; h1: HTMLElement | null; lines: HTMLElement[]; sub: HTMLElement | null; subLines: HTMLElement[]; cta: HTMLElement | null; copy: HTMLElement | null };
  statement: Statement | null;
  W: number; H: number;
  tl: gsap.core.Timeline | null; master: gsap.core.Timeline | null;
  onLayout: (cb: (ctx: WorldCtx) => void) => Dispose;
  /** the world's own modules push their offs here (run by dispose) */
  offs: Dispose[];
};

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

export async function startWorld(signal: AbortSignal): Promise<WorldCtx> {
  const html = document.documentElement;
  const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
  const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
  const RM = html.hasAttribute("data-rm");
  const pinEl = $(".pin")!, stage = $(".stage")!, canvas = $<HTMLCanvasElement>(".stage canvas")!, boxEl = $(".globe")!;
  const mobileMQ = matchMedia("(max-width: 760px)");
  const ac = new AbortController(), on = { signal: ac.signal };
  const timers: number[] = [];
  const later = (f: () => void, ms: number) => { timers.push(window.setTimeout(f, ms)); };

  /* the orbital-dawn intro: before the globe (its hard timeout starts now) */
  const intro = mountIntro();

  /* ───── the statement: words in masks ───── */
  const statementEl = $(".statement");
  const statement = statementEl ? splitStatement(statementEl) : null;

  /* ───── the intro (the copy waits for the globe to draw itself) ───── */
  let introDone = false, g: Globe | null = null;
  const introOver = () => {
    if (html.getAttribute("data-intro") === "wait") html.setAttribute("data-intro", "done");
    if (!introDone) { introDone = true; later(() => { if (html.getAttribute("data-intro") === "done") html.setAttribute("data-intro", "over"); if (g) g.resize(); }, 1500); }   /* resize: the boxes are measured at rest */
  };
  const unpin = () => { html.removeAttribute("data-pin"); };
  let io: IntersectionObserver | null = null;
  function fallbackFade() {
    if (!statementEl || RM || io || html.hasAttribute("data-pin")) return;
    statementEl.classList.add("is-pre");
    io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { statementEl.classList.remove("is-pre"); io?.disconnect(); } }, { threshold: 0.18 });
    io.observe(statementEl);
  }
  const poster = () => { html.setAttribute("data-gl", "off"); unpin(); introOver(); fallbackFade(); };

  const layoutCbs: ((c: WorldCtx) => void)[] = [], progCbs: ((p: number) => void)[] = [];
  let pNow = 0, laidOut = false, dead = false;
  let lenis: Lenis | null = null, tickFn: ((t: number) => void) | null = null, loopRaf = 0, gctx: gsap.Context | null = null;

  const ctx: WorldCtx = {
    gsap, ScrollTrigger, lenis: null, reduced: RM, mobile: mobileMQ.matches, pinned: false, signal,
    globe: null, pin: pinEl, stage, canvas, box: boxEl,
    hero: { el: $(".hero"), h1: $(".h1"), lines: $$(".hero .ln"), sub: $(".hero__sub"), subLines: $$(".hero__sub .bl"), cta: $(".hero__cta"), copy: $(".hero__main") },
    statement, W: innerWidth, H: innerHeight, tl: null, master: null, offs: [],
    progress: (cb) => { progCbs.push(cb); cb(pNow); return () => { const i = progCbs.indexOf(cb); if (i >= 0) progCbs.splice(i, 1); }; },
    onLayout: (cb) => { layoutCbs.push(cb); if (laidOut) cb(ctx); return () => { const i = layoutCbs.indexOf(cb); if (i >= 0) layoutCbs.splice(i, 1); }; },
    dispose,
  };
  const runLayout = () => {
    if (dead) return;
    ctx.mobile = mobileMQ.matches; ctx.W = innerWidth; ctx.H = innerHeight;
    if (statement) statement.regroup();
    laidOut = true;
    layoutCbs.slice().forEach((f) => f(ctx));
  };
  signal.addEventListener("abort", dispose, { once: true });

  /* ───── the world ───── */
  const fallbackNeeded = html.getAttribute("data-gl") === "off";
  if (!fallbackNeeded) {
    try {
      g = await createGlobe(canvas, { box: boxEl, mode: "A", host: pinEl, stage, frozen: false, still: RM, raf: false, intro: true });
      if (dead) { g.destroy(); return ctx; }
      html.setAttribute("data-gl", "on");
      g.onFrame((dt, now, S) => { if (S.k > 0.8) introOver(); if (S.draw >= 1 && !html.hasAttribute("data-drawn")) html.setAttribute("data-drawn", ""); });
      ctx.globe = g;
      if (RM) introOver();
      else later(introOver, 6500);                       // never leave the copy hidden
    } catch (e) {
      console.warn("[globe] falling back to the poster", e);
      g = null;
      if (dead) return ctx;
      poster();
    }
  } else { unpin(); introOver(); fallbackFade(); }
  intro.attach(ctx);                                     // the intro takes the globe at once (it drives the frames until the ticker below does)
  if (RM && html.hasAttribute("data-pin")) unpin();      // reduced motion: no pin, no morph; the statement follows the hero
  const pinned = html.hasAttribute("data-pin") && !!g && !!statement;
  if (!pinned) { unpin(); if (!RM && !fallbackNeeded) fallbackFade(); }

  await (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve());
  if (dead) return ctx;
  if (g) g.resize();

  if (!pinned) {
    // no pin (reduced motion, poster): the globe (if any, and not still) runs on its own loop
    if (g && !RM) { const gg = g; const loop = (t: number) => { loopRaf = requestAnimationFrame(loop); gg.frame(t); }; loopRaf = requestAnimationFrame(loop); }
    runLayout();
    intro.start(ctx);
    return ctx;
  }

  /* ───── Lenis (smooth scroll) + ONE ticker: Lenis, then the globe's frame (after the scrub tweens of this tick have written their uniforms) ───── */
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  ctx.lenis = lenis;
  setSmooth(lenis);   // the shared header scrolls (logo, Get started) and locks (phone map) through it
  lenis.on("scroll", ScrollTrigger.update);
  ScrollTrigger.config({ ignoreMobileResize: true });
  gsap.ticker.lagSmoothing(0);
  const gg = g!;
  tickFn = (t: number) => { if (lenis) lenis.raf(t * 1000); gg.frame(t * 1000); };
  gsap.ticker.add(tickFn);

  runLayout();
  await new Promise((r) => requestAnimationFrame(r));   // one frame so the layout callbacks have seen the settled page
  if (dead) return ctx;

  /* ───── the transition ───── */
  const cfg = { scrub: 0.8, ...transitionConfig };          /* lengths in screen heights: the pinned stretch, of which the last `rest` holds still */
  gctx = gsap.context(() => {
    let tl: gsap.core.Timeline | null = null;
    try { tl = setupTransition(ctx); } catch (e) { console.error("[transition] setup failed", e); unpin(); }
    if (!tl) return;
    ctx.tl = tl; tl.paused(false);
    const D = Math.max(0.0001, tl.duration());
    const total = () => (mobileMQ.matches ? cfg.pinMobile : cfg.pin), rest = Math.min(cfg.rest, total() - 0.5);
    const pad = (D * rest) / (total() - rest);
    const master = gsap.timeline({ paused: true });
    master.add(tl, 0);
    master.to({}, { duration: pad }, D);
    ctx.master = master;
    ctx.pinned = true;
    let lastInter = true;
    const emit = () => {
      const p = clamp(master.time() / D, 0, 1);
      if (p === pNow) return;
      pNow = p;
      if (p > 0 && !introDone) introOver();
      if (p > 0.0005) html.setAttribute("data-intro", "over");
      const inter = p < 0.004;
      if (inter !== lastInter) { lastInter = inter; if (g) g.setInteractive(inter); }
      for (let i = 0; i < progCbs.length; i++) progCbs[i](p);
    };
    master.eventCallback("onUpdate", emit);
    ScrollTrigger.create({
      trigger: pinEl, start: "top top", end: () => "+=" + Math.round(total() * innerHeight), pin: true, pinSpacing: true, anticipatePin: 1,
      scrub: cfg.scrub, animation: master, invalidateOnRefresh: true,
    });
  });
  requestAnimationFrame(() => { if (!dead) ScrollTrigger.refresh(); });

  let rq = 0;
  const onRes = () => { clearTimeout(rq); rq = window.setTimeout(() => { if (dead) return; if (g) g.resize(); runLayout(); if (ctx.pinned) ScrollTrigger.refresh(); }, 160); };
  window.addEventListener("resize", onRes, on);
  ctx.offs.push(() => clearTimeout(rq));
  ctx.offs.push(gg.onRebuild(() => runLayout()));

  intro.start(ctx);
  return ctx;

  function dispose() {
    if (dead) return;
    dead = true;
    signal.removeEventListener("abort", dispose);
    ac.abort();
    timers.forEach((t) => clearTimeout(t));
    intro.dispose();
    for (const f of ctx.offs.splice(0).reverse()) { try { f(); } catch (e) { console.warn("[world] dispose", e); } }
    if (tickFn) { gsap.ticker.remove(tickFn); tickFn = null; gsap.ticker.lagSmoothing(500, 33); }
    cancelAnimationFrame(loopRaf);
    if (gctx) { gctx.revert(); gctx = null; }
    if (lenis) { setSmooth(null); lenis.destroy(); lenis = null; ctx.lenis = null; }
    if (g) { g.destroy(); g = null; ctx.globe = null; }
    io?.disconnect(); io = null;
    statementEl?.classList.remove("is-pre");
    statement?.undo();
    layoutCbs.length = progCbs.length = 0;
    ctx.pinned = false;
  }
}
