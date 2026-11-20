// History X's motion. The homepage's ruled grid does the rows' arrivals and mounts the dot icons (../../v3/proof-deeper/motion.ts: rows draw in,
// + crosshairs, [data-rv] rises, <i data-icon> drawn from dots as they come into view); on top of it:
//   - the h1 rises word by word (SplitText, no masks: the Kepler word's overhang is never clipped); the hero's [data-in] lines follow, once;
//   - the hero's drawing (HeroIso.tsx: a flight of steps from 2017 to 2026) builds once as the page opens: the dotted floor fades in, then step by step,
//     2017 first, each rises a little as its edges draw and its faces fill; the green top, the two years and the figure last. Then, only while the drawing
//     is near the screen, a quiet loop: the figure rests on the green top (the green answers with a soft ripple), fades, reappears on 2017 and climbs
//     the flight one step at a time back to the green, and so on;
//   - the off-grid blocks ([data-up]: Origin) rise and fade in as they come into view (CSS, keyed on .is-in);
//   - the milestones' rail (the homepage's rail, simpler; 860 px and up, motion on): the section pins and the years travel sideways under the scroll
//     (scrubbed, the scroll free, no snapping), one at a time at the centre: 2017 first (the side before it empty, 2018 faint after it), then each year in
//     turn slides in, its title and text brightening, with the others faint (their text kept, at low opacity), ending on 2026.
//     Below 860 px or with reduced motion there is no pin: the rail scrolls sideways by hand (CSS scroll snapping).
// Reduced motion: no data-motion (the grid's mount leaves it off), so everything is finished from the first paint (the drawing too: its markup is the
// finished frame, the figure on the green top; no CSS hides any of it, only gsap, just before its build plays).
import { SplitText } from "gsap/SplitText";
import type { MotionCtx } from "@/lib/motion/scroll";
import { mount as gridMount } from "../../v3/proof-deeper/motion";
import { YEARS, hop, pawnTr, ripple } from "./HeroIso";

type G = MotionCtx["gsap"];
const $$ = <T extends Element = SVGElement>(el: ParentNode, s: string) => [...el.querySelectorAll<T>(s)];
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (t: number) => t * t * (3 - 2 * t);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** a loop on gsap's ticker that runs only while `el` is near the screen (its clock stands still while it is away) */
function whileNear(gsap: G, el: Element, tick: (t: number) => void, margin = "10% 0px 10% 0px") {
  let on = false, time = 0;
  const io = new IntersectionObserver(([e]) => { on = e.isIntersecting; }, { rootMargin: margin });
  io.observe(el);
  const fn = (_t: number, dt: number) => { if (!on) return; time += Math.min(dt, 64) / 1000; tick(time); };
  gsap.ticker.add(fn);
  return () => { io.disconnect(); gsap.ticker.remove(fn); };
}

/* the figure's loop, in seconds: it rests on the green top (the ripple plays as the rest begins), fades out, comes back on 2017, then climbs: each hop
   to the next step, then a short stay on it */
const REST = 2.8, RIP = 1.6, OUT = 0.5, IN = 0.5, HOP = 0.6, STAY = 0.5;
const CLIMB = (YEARS.length - 1) * (HOP + STAY), CYCLE = REST + OUT + IN + CLIMB;

/** the hero's drawing: built once as the page opens, then the figure's climb while it is near the screen. Reduced motion: never called (the markup is
 *  the finished frame) */
function hero(root: HTMLElement, gsap: G) {
  const art = root.querySelector<HTMLElement>(".hx-hero__art"), svg = art?.querySelector<SVGSVGElement>("svg");
  if (!art || !svg) return;
  const steps = $$<SVGGElement>(svg, "[data-step]").sort((a, b) => +(a.dataset.step ?? 0) - +(b.dataset.step ?? 0));   // 2017 first
  const floor = $$(svg, ".d-floor"), accents = $$(svg, ".d-o");
  const pawn = svg.querySelector<SVGGElement>("[data-pawn]"), rip = svg.querySelector<SVGPolygonElement>("[data-ripple]");
  const pawn0 = pawn?.getAttribute("transform") ?? "";
  const last = YEARS.length - 1;

  // hidden by gsap only now, just before the build plays (without JS, or with reduced motion, the finished frame stays)
  gsap.set(floor, { opacity: 0 });
  gsap.set(accents, { opacity: 0 });
  const tl = gsap.timeline({ delay: 0.45 });
  tl.to(floor, { opacity: 1, duration: 0.9, ease: "power2.out" }, 0);
  steps.forEach((st, i) => {
    const at = 0.2 + i * 0.17, edges = $$(st, ".d-e"), fills = $$(st, ".d-f");
    gsap.set(edges, { strokeDasharray: "1 1", strokeDashoffset: 1 });
    gsap.set(fills, { opacity: 0 });
    tl.fromTo(st, { y: 18 }, { y: 0, duration: 0.9, ease: "power3.out" }, at)
      .to(edges, { strokeDashoffset: 0, duration: 0.75, ease: "power2.inOut" }, at)
      .to(fills, { opacity: 1, duration: 0.5, ease: "power2.out" }, at + 0.3);
  });
  // every starting state is set: the CSS gate (history-x.css, .hx-hero__art until .is-ready) lets the drawing show
  art.classList.add("is-ready");
  tl.to(accents, { opacity: 1, duration: 0.6, ease: "power2.out", stagger: 0.12 }, 0.2 + last * 0.17 + 0.55);

  const place = (v: [number, number], dy: number, o: number) => {
    if (!pawn) return;
    pawn.setAttribute("transform", pawnTr([v[0], v[1] + dy]));
    pawn.style.opacity = o.toFixed(3);
  };
  let t0 = -1;
  const off = whileNear(gsap, art, (t) => {
    if (tl.progress() < 1) return;
    if (t0 < 0) t0 = t;
    const c = (t - t0) % CYCLE;
    // the ripple off the green top as the figure arrives (and once as the build ends)
    if (rip) {
      const p = clamp01(c / RIP);
      rip.setAttribute("points", ripple(3 + 16 * easeOut(p)));
      rip.style.opacity = c < RIP ? (0.85 * (1 - p)).toFixed(3) : "0";
    }
    if (c < REST) return place(hop(last, 0), 0, 1);
    if (c < REST + OUT) { const p = smooth((c - REST) / OUT); return place(hop(last, 0), 6 * p, 1 - p); }
    if (c < REST + OUT + IN) { const p = smooth((c - REST - OUT) / IN); return place(hop(0, 0), -10 * (1 - p), p); }
    const u = c - REST - OUT - IN, k = Math.min(last - 1, Math.floor(u / (HOP + STAY))), w = u - k * (HOP + STAY);
    place(w < HOP ? hop(k, smooth(w / HOP)) : hop(k + 1, 0), 0, 1);
  });
  return () => {
    off(); tl.kill();
    if (pawn) { pawn.setAttribute("transform", pawn0); pawn.style.opacity = ""; }
    if (rip) { rip.setAttribute("points", ripple(0)); rip.style.opacity = ""; }
  };
}

/** the rail: pinned, scrubbed sideways, one year at the centre at a time (the others faint at the sides) */
function rail(root: HTMLElement, { gsap, ScrollTrigger }: MotionCtx) {
  const pin = root.querySelector<HTMLElement>(".hx-ms__pin"), cell = root.querySelector<HTMLElement>(".hx-rail"), track = root.querySelector<HTMLElement>(".hx-rail__track");
  const sts = [...root.querySelectorAll<HTMLElement>("[data-st]")];
  if (!pin || !cell || !track || sts.length < 2) return;
  const n = sts.length;
  const mm = gsap.matchMedia();
  mm.add("(min-width: 860px)", () => {
    root.setAttribute("data-pin", "");
    let on = -1;
    const set = (i: number) => {
      if (i === on) return;
      on = i;
      sts.forEach((el, k) => {
        el.classList.toggle("is-on", k === i);
        el.classList.toggle("is-near", Math.abs(k - i) === 1);
        el.setAttribute("aria-current", k === i ? "step" : "false");
      });
    };
    set(0);
    // one station's width, and the offset that puts the first station's centre on the cell's centre (read from layout, so it holds on resize)
    const step = () => sts[1].offsetLeft - sts[0].offsetLeft;
    const x0 = () => cell.clientWidth / 2 - (sts[0].offsetLeft + sts[0].offsetWidth / 2);
    // the year at the centre follows the track where it is drawn (the scrubbed tween), not the scroll ahead of it
    // (fromTo renders its first frame at once, so onUpdate can run before the tween is assigned: it reads it from `this`)
    const tw = gsap.fromTo(track, { x: () => x0() }, { x: () => x0() - step() * (n - 1), ease: "none",
      onUpdate(this: gsap.core.Tween) { set(Math.round(this.progress() * (n - 1))); } });
    // pinned while the section sits in the middle of the view; about 60% of a screen of scroll per year. No snapping: the scroll stays free, the
    // year nearest the centre is the one on show
    ScrollTrigger.create({
      trigger: pin, start: "center center", end: () => "+=" + Math.round(window.innerHeight * 0.6 * (n - 1)), pin: true, pinSpacing: true, scrub: 0.6,
      animation: tw, invalidateOnRefresh: true, anticipatePin: 1,
    });
    return () => {
      root.removeAttribute("data-pin");
      sts.forEach((el) => { el.classList.remove("is-on", "is-near"); el.removeAttribute("aria-current"); });
      gsap.set(track, { clearProps: "transform" });
    };
  });
  return () => mm.revert();
}

export function mount(root: HTMLElement, ctx: MotionCtx) {
  const { reduced, gsap } = ctx;
  const grid = gridMount(root, ctx);
  const unrail = reduced ? undefined : rail(root, ctx);
  const unhero = reduced ? undefined : hero(root, gsap);
  const undo = () => { unhero?.(); unrail?.(); if (typeof grid === "function") grid(); };
  if (reduced) return undo;
  let dead = false;

  /* the h1, word by word */
  let split: SplitText | null = null;
  const h = root.querySelector<HTMLElement>("[data-h1]");
  if (h) {
    gsap.registerPlugin(SplitText);
    split = SplitText.create(h, { type: "words", wordsClass: "hx-w" });
    gsap.from(split.words, { yPercent: 40, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: 0.06, delay: 0.1 });
  }
  root.querySelectorAll<HTMLElement>("[data-in]").forEach((el, i) => {
    el.style.setProperty("--d", `${(0.35 + i * 0.1).toFixed(2)}s`);
    requestAnimationFrame(() => requestAnimationFrame(() => { if (!dead) el.classList.add("is-in"); }));
  });

  /* the off-grid blocks: read every position first, then act (a block already above the view is finished at once) */
  const ups = [...root.querySelectorAll<HTMLElement>("[data-up]")];
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    e.target.classList.add("is-in");
  }), { rootMargin: "0px 0px -8% 0px" });
  const above = ups.map((el) => el.getBoundingClientRect().bottom < 0);
  ups.forEach((el, i) => { if (above[i]) el.classList.add("is-in", "is-now"); else io.observe(el); });
  // keyboard: a block that receives focus before it has arrived shows at once
  const onFocus = (e: FocusEvent) => { const b = (e.target as Element).closest?.("[data-up]"); if (b) b.classList.add("is-in", "is-now"); };
  root.addEventListener("focusin", onFocus);

  return () => {
    dead = true; split?.revert(); io.disconnect(); root.removeEventListener("focusin", onFocus);
    root.querySelectorAll("[data-in], [data-up]").forEach((el) => el.classList.remove("is-in", "is-now"));
    undo();
  };
}
