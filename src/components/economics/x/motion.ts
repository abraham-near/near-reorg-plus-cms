// Economics X's motion (markup: EconomicsX.tsx). The homepage's ruled grid does the arrivals (../../v3/proof-deeper/motion.ts: the rows draw in, the + crosshairs
// land where the lines meet, [data-rv] rises, the dot icons draw from dots as they come in); on top of it:
//   - the h1 rises word by word on load, each h2 ([data-split]) as it comes in (SplitText, no masks: the Kepler word's overhang is never clipped);
//     the hero's [data-in] lines follow the h1;
//   - the hero's plinth (HeroIso.tsx) builds once as the page opens (the floor, the plinth, the blocks rising onto it, the green stack coin by coin, the lanes
//     last; whole pieces, nothing half drawn); then, only while it is near the screen, fees run the lanes into the stack;
//   - the loop (LoopIso.tsx): one station on show at a time (data-step on the row: its station green, its name at full ink, the side out of it solid, the
//     step itself at full ink beside it). Wide screens: the step crossing 60 % of the view is the one on show, and a dot runs the side out of it with the
//     step's scroll. Phones (the drawing sits above the steps): the stations take turns slowly, only while the drawing is near the screen.
// Reduced motion: no split, no build, no fees, no dot, no cycle; on wide screens the station on show still follows the scroll, without transitions.
import { SplitText } from "gsap/SplitText";
import type { MotionCtx } from "@/lib/motion/scroll";
import { mount as gridMount } from "../../v3/proof-deeper/motion";
import { feeAt } from "./HeroIso";
import { along } from "./LoopIso";
import { f, tr } from "./iso";

type G = MotionCtx["gsap"];
const $$ = <T extends Element = SVGElement>(el: ParentNode, s: string) => [...el.querySelectorAll<T>(s)];
const frac = (v: number) => v - Math.floor(v);
const env = (u: number) => Math.min(1, u * 6, (1 - u) * 6);
const ease = (t: number) => t * t * (3 - 2 * t);

/** a loop on gsap's ticker that runs only while `el` is near the screen */
function whileNear(gsap: G, el: Element, tick: (t: number) => void, margin = "10% 0px 10% 0px") {
  let on = false, time = 0;
  const io = new IntersectionObserver(([e]) => { on = e.isIntersecting; }, { rootMargin: margin });
  io.observe(el);
  const fn = (_t: number, dt: number) => { if (!on) return; time += Math.min(dt, 64) / 1000; tick(time); };
  gsap.ticker.add(fn);
  return () => { io.disconnect(); gsap.ticker.remove(fn); };
}

/* ==================================================================== the hero's plinth */
function mountHero(root: HTMLElement, { gsap, reduced }: MotionCtx) {
  const art = root.querySelector<HTMLElement>(".ex-hx-art"), svg = art?.querySelector<SVGSVGElement>("svg");
  if (!art || !svg) return;
  if (reduced) { art.classList.add("is-ready"); return () => art.classList.remove("is-ready"); }
  // built from nothing on a firm base, whole pieces only (no half-drawn edges: a dash draw breaks under the 1 px non-scaling strokes): the floor, then the
  // plinth's two slabs and the pad, then the blocks rising onto it, then the stack coin by coin, the lanes and fees last
  const floor = $$(svg, ".d-floor"), accents = $$(svg, ".d-o"), coins = $$(svg, ".ex-hx-stack .ex-cn");
  const slabs = $$(svg, ".ex-sl"), base = slabs.filter((g) => !g.classList.contains("ex-hx-blk")), blocks = slabs.filter((g) => g.classList.contains("ex-hx-blk"));
  const fees = $$<SVGGElement>(svg, "[data-fee]");
  gsap.set(floor, { opacity: 0 });
  gsap.set(base, { opacity: 0, y: 10 });
  gsap.set(blocks, { opacity: 0, y: 22 });
  gsap.set(coins, { opacity: 0, y: -14 });
  gsap.set(accents, { opacity: 0 });
  fees.forEach((g) => { g.style.opacity = "0"; });
  art.classList.add("is-ready");
  const tl = gsap.timeline({ delay: 0.35 });
  tl.to(floor, { opacity: 1, duration: 0.8, ease: "power2.out" }, 0)
    .to(base, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.12 }, 0.15)
    .to(blocks, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.08 }, 0.6)
    .to(coins, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.06 }, 1.15)
    .to(accents, { opacity: 1, duration: 0.6, ease: "power2.out" }, 1.75);
  let t0 = -1;
  const off = whileNear(gsap, art, (t) => {
    if (tl.isActive()) return;
    if (t0 < 0) t0 = t;
    const s = t - t0;
    fees.forEach((g, i) => {
      const u = frac(s * 0.16 + (i * 0.618) % 1);   // each lane its own phase: never two fees in step
      const p = feeAt(+(g.dataset.fee ?? i), u);
      g.setAttribute("transform", tr(p)); g.style.opacity = f(env(u));
    });
  });
  return () => { off(); tl.kill(); art.classList.remove("is-ready"); fees.forEach((g) => { g.style.opacity = ""; }); };
}

/* ==================================================================== the loop */
function mountLoop(root: HTMLElement, { gsap, ScrollTrigger, reduced }: MotionCtx) {
  const loop = root.querySelector<HTMLElement>("[data-loop]");
  if (!loop) return;
  const steps = $$<HTMLElement>(loop, "[data-step-i]"), fig = loop.querySelector<HTMLElement>(".ex-lp");
  const dot = loop.querySelector<SVGCircleElement>("[data-dot]");
  let cur = -1;
  const show = (i: number, p: number) => {
    if (i !== cur) {
      cur = i; loop.dataset.step = String(i + 1);
      steps.forEach((s, j) => s.toggleAttribute("data-on", j === i));
    }
    if (dot && !reduced) { const v = along(i, Math.max(0, Math.min(1, p))); dot.setAttribute("cx", f(v[0])); dot.setAttribute("cy", f(v[1])); }
  };
  show(0, 0);
  const mm = gsap.matchMedia();
  mm.add("(min-width: 860px)", () => {
    loop.setAttribute("data-live", "");
    const last = steps.length - 1;
    steps.forEach((s, i) => ScrollTrigger.create({
      trigger: s, start: "top 60%", end: "bottom 60%",
      onUpdate: (st) => { if (st.isActive) show(i, st.progress); },
      onToggle: (st) => { if (st.isActive) show(i, st.progress); },
      onLeave: () => { if (i === last) show(i, 1); },
      onLeaveBack: () => { if (i === 0) show(0, 0); },
    }));
    return () => loop.removeAttribute("data-live");
  });
  mm.add("(max-width: 859px)", () => {
    show(0, 0);
    if (reduced || !fig) return;
    const T = 3.6;   // seconds a station stays on show; the dot runs its side in the first 1.6
    return whileNear(gsap, fig, (t) => { const k = Math.floor(t / T); show(k % 4, ease(Math.min(1, (t - k * T) / 1.6))); });
  });
  return () => { mm.revert(); loop.dataset.step = "1"; steps.forEach((s) => s.removeAttribute("data-on")); };
}

/* ==================================================================== the headings */
function mountType(root: HTMLElement, { gsap, reduced }: MotionCtx) {
  if (reduced) return;
  let dead = false;
  const splits: SplitText[] = [];
  gsap.registerPlugin(SplitText);
  const h1 = root.querySelector<HTMLElement>("[data-h1]");
  if (h1) {
    const s = SplitText.create(h1, { type: "words", wordsClass: "ex-w" }); splits.push(s);
    gsap.from(s.words, { yPercent: 40, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: 0.07, delay: 0.1 });
  }
  $$<HTMLElement>(root, "[data-split]").forEach((h) => {
    const s = SplitText.create(h, { type: "words", wordsClass: "ex-w" }); splits.push(s);
    gsap.from(s.words, { yPercent: 40, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: 0.06,
      scrollTrigger: { trigger: h, start: "top 92%", once: true } });
  });
  $$<HTMLElement>(root, "[data-in]").forEach((el, i) => {
    el.style.setProperty("--d", `${(0.35 + i * 0.1).toFixed(2)}s`);
    requestAnimationFrame(() => requestAnimationFrame(() => { if (!dead) el.classList.add("is-in"); }));
  });
  return () => { dead = true; splits.forEach((s) => s.revert()); $$(root, "[data-in]").forEach((el) => el.classList.remove("is-in")); };
}

export function mount(root: HTMLElement, ctx: MotionCtx) {
  const offs = [gridMount(root, ctx), mountHero(root, ctx), mountLoop(root, ctx), mountType(root, ctx)];
  return () => offs.forEach((o) => { if (typeof o === "function") o(); });
}
