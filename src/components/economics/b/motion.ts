// Economics B's motion (markup: EconomicsB.tsx). The ruled grid's draw-in, crosshairs and [data-rv] rises are the shared kit's
// (v3/proof-deeper/motion.ts); the small drawings build as they arrive and figures count once (kit.ts). New here:
//   · headings ([data-rise] and the h1) rise word by word: SplitText, no masks, each word from { yPercent: 40, autoAlpha: 0 } (README, "Building a page");
//   · the hero: the words rise, the flywheel builds (the disc, the stations, then the track and the labels); then it runs: coins round the track, a
//     coin into the vault, the press, people on their feet, value along the spokes; and it leans to the pointer;
//   · the loop (desktop): the flywheel sticks while the steps pass; the reading line drives its stage (stations drop in one by one, the track draws leg
//     by leg, the lit station follows the step read; the closing line closes the loop and sets the coins running), and fills the dotted axis;
//   · the engines and the token: each builds on arrival, then signals run their routes, pipes and lines while they are on screen; pointing at a job
//     lights its piece of the drawing (also with reduced motion).
// Every loop runs only while its section is near the screen. Reduced motion: every drawing at its finished frame; the loop's drawing is the whole
// flywheel, its lit station following the step read.
import { SplitText } from "gsap/SplitText";
import type { Mount, MotionCtx } from "@/lib/motion/scroll";
import { mount as gridMount } from "../../v3/proof-deeper/motion";
import { buildTimeline, mountCount, mountDraw, whileNear, along, tr, f, clamp01 } from "./kit";
import { collect, paintClock, paintStage, geo } from "./Flywheel";
import { ROUTES, PIPES, loopCoin } from "./Engines";
import { LINES } from "./Roles";

const $$ = <T extends Element>(el: ParentNode, s: string) => [...el.querySelectorAll<T>(s)];
const env = (u: number) => Math.min(1, u * 8, (1 - u) * 8);
const RISE = { yPercent: 40, autoAlpha: 0 };

/* ==================================================================== headings: word by word */
function mountHeadings(root: HTMLElement, { gsap, ScrollTrigger, reduced }: MotionCtx) {
  if (reduced) return;
  gsap.registerPlugin(SplitText);
  const splits = $$<HTMLElement>(root, "[data-rise]").map((h) => {
    const s = SplitText.create(h, { type: "words", wordsClass: "eb-w" });
    gsap.set(s.words, RISE);
    ScrollTrigger.create({ trigger: h, start: "top 86%", once: true, onEnter: () => gsap.to(s.words, { yPercent: 0, autoAlpha: 1, duration: 1.1, ease: "power4.out", stagger: 0.05 }) });
    return s;
  });
  return () => splits.forEach((s) => s.revert());
}

/* ==================================================================== the hero */
function mountHero(root: HTMLElement, { gsap, reduced }: MotionCtx) {
  const hero = root.querySelector<HTMLElement>(".eb-hero"), svg = hero?.querySelector<SVGSVGElement>("svg.fw--hero"), cam = hero?.querySelector<HTMLElement>(".eb-hero__cam");
  const h1 = hero?.querySelector<HTMLElement>(".eb-h1");
  if (!hero || !svg || !cam || !h1) return;
  if (reduced) { hero.classList.add("is-ready"); return () => hero.classList.remove("is-ready"); }
  gsap.registerPlugin(SplitText);
  const split = SplitText.create(h1, { type: "words", wordsClass: "eb-w" });
  const after = $$<HTMLElement>(hero, "[data-hero-up]");
  const build = buildTimeline(gsap, svg);
  gsap.set(split.words, RISE);   // unmasked: the words rise a little and fade in, so no letter (nor the italic accent) is ever clipped
  gsap.set(after, { autoAlpha: 0, y: 18 });
  hero.classList.add("is-ready");
  const tl = gsap.timeline({ delay: 0.1 });
  tl.to(split.words, { yPercent: 0, autoAlpha: 1, duration: 1.1, ease: "power4.out", stagger: 0.05 }, 0)
    .to(after, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.1 }, 0.45)
    .call(() => { build.play(); }, [], 0.15);

  const el = collect(svg);
  let mx = 0, my = 0, cx = 0, cy = 0;
  const onMove = (e: PointerEvent) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; };
  addEventListener("pointermove", onMove, { passive: true });
  const off = whileNear(gsap, hero, (t) => {
    cx += (mx - cx) * 0.05; cy += (my - cy) * 0.05;
    cam.style.transform = `translate3d(${f(cx * -16)}px, ${f(cy * -10)}px, 0) rotate(${f(cx * -0.6)}deg)`;
    paintClock(el, t);
  });
  return () => { off(); removeEventListener("pointermove", onMove); tl.kill(); split.revert(); cam.style.transform = ""; hero.classList.remove("is-ready"); };
}

/* ==================================================================== the loop: the flywheel built by the reading line */
const lin = (a: number, b: number, x: number) => (x <= a ? 0 : x >= b ? 1 : (x - a) / (b - a));
const NOW = 0.55;   // the reading line, a share of the screen (economics-b.css: --eb-now)
function mountLoop(root: HTMLElement, { gsap, ScrollTrigger, reduced }: MotionCtx) {
  const sec = root.querySelector<HTMLElement>(".eb-lp"), list = sec?.querySelector<HTMLElement>(".eb-lp__list"), main = sec?.querySelector<SVGSVGElement>("svg.fw--main");
  if (!sec || !list || !main) return;
  const steps = $$<HTMLElement>(sec, ".eb-lp__step"), nums = $$<HTMLElement>(sec, ".eb-lp__num");
  const fill = sec.querySelector<HTMLElement>(".eb-lp__fill"), count = sec.querySelector<HTMLElement>(".eb-lp__ci"), el = collect(main);
  sec.classList.add("is-story");
  let top = 0, H = 1, ticks: number[] = [], vh = innerHeight, desk = true;
  const measure = () => {
    vh = innerHeight; desk = main.getClientRects().length > 0;
    top = list.getBoundingClientRect().top + scrollY; H = list.offsetHeight;
    ticks = nums.map((n) => { const r = n.getBoundingClientRect(); return r.top + r.height / 2 + scrollY - top; });
  };
  const lineY = () => scrollY + vh * NOW - top;
  // −1 (empty) … 3 (the fourth step read) … 4 (the closing line read: the loop closed)
  const stageAt = (y: number) => -1 + lin(ticks[0] - vh * 0.85, ticks[0] - vh * 0.1, y) + ticks.slice(1).reduce((a, tk) => a + lin(tk - vh * 0.42, tk - vh * 0.04, y), 0);
  let on = -2;
  const ui = (y: number) => {
    if (fill) fill.style.height = `${Math.max(0, Math.min(H, y)).toFixed(1)}px`;
    nums.forEach((n, i) => n.classList.toggle("is-hit", y >= ticks[i]));
    let i = 0; for (let k = 1; k < ticks.length; k++) if (y >= ticks[k] - vh * 0.22) i = k;
    if (i === on) return false;
    on = i;
    steps.forEach((s, k) => s.classList.toggle("is-on", k === i));
    count?.style.setProperty("--ci", String(i));
    return true;
  };
  measure();
  if (reduced) {
    // the whole flywheel, its lit station following the step read
    const lit = () => { el.st.forEach((n) => n.classList.toggle("is-on", Number(n.dataset.k) === on)); el.labs.forEach((n) => n.classList.toggle("is-on", Number(n.dataset.k) === on)); el.token?.classList.toggle("is-on", on >= 4); };
    ScrollTrigger.create({ trigger: sec, start: "top bottom", end: "bottom top", onRefresh: () => { measure(); on = -2; if (ui(lineY())) lit(); }, onUpdate: () => { if (ui(lineY())) lit(); } });
    ui(lineY()); lit();
    return () => sec.classList.remove("is-story");
  }
  ScrollTrigger.create({ trigger: sec, start: "top bottom", end: "bottom top", onRefresh: measure });
  let s = stageAt(lineY());
  ui(lineY()); paintStage(el, s);
  const off = whileNear(gsap, sec, (t, dt) => {
    const y = lineY();
    ui(y);
    if (!desk) return;
    s += (stageAt(y) - s) * (1 - Math.pow(0.88, dt / 16.7));
    const g = paintStage(el, s);
    paintClock(el, t, g.spokes);
  }, "0px");
  return () => { off(); sec.classList.remove("is-story"); if (fill) fill.style.height = ""; };
}

/* the small flywheels of the phones' steps: once built, they run */
function mountSmallWheels(root: HTMLElement, { gsap, reduced }: MotionCtx) {
  if (reduced) return;
  const offs = $$<SVGSVGElement>(root, ".eb-lp__mfig svg.fw").map((svg) => {
    const el = collect(svg), s = Number(svg.dataset.stage), sp = geo(s).spokes;
    return whileNear(gsap, svg, (t) => { if (svg.getClientRects().length) paintClock(el, t, sp); }, "0px");
  });
  return () => offs.forEach((o) => o());
}

/* ==================================================================== the engines */
function mountEngines(root: HTMLElement, { gsap, ScrollTrigger, reduced }: MotionCtx) {
  const svg = root.querySelector<SVGSVGElement>("svg.en");
  if (!svg || reduced) return;
  const build = buildTimeline(gsap, svg);
  ScrollTrigger.create({ trigger: svg, start: "top 80%", once: true, onEnter: () => build.play() });
  const sigs = $$<SVGCircleElement>(svg, ".en-sigs circle"), lcoins = $$<SVGGElement>(svg, ".en-lcoin");
  const paths = [...ROUTES, ...PIPES, ...PIPES], nR = ROUTES.length;
  return whileNear(gsap, svg, (t) => {
    for (let i = 0; i < sigs.length; i++) {
      // routes: out from the hub; pipes: into the loop, two signals each, half a turn apart
      const speed = i < nR ? 0.22 + (i % 3) * 0.04 : 0.3, u = (t * speed + (i < nR ? i * 0.31 : (i - nR) * 0.5)) % 1;
      sigs[i].setAttribute("transform", tr(along(paths[i].ps, u)));
      sigs[i].style.opacity = f(env(u));
    }
    lcoins.forEach((c, i) => c.setAttribute("transform", tr(loopCoin(i, t))));
  });
}

/* ==================================================================== the token and its three jobs */
function mountRoles(root: HTMLElement, { gsap, ScrollTrigger, reduced }: MotionCtx) {
  const sec = root.querySelector<HTMLElement>(".eb-ct"), fig = sec?.querySelector<HTMLElement>(".eb-ct__fig"), svg = fig?.querySelector<SVGSVGElement>("svg.rl");
  if (!sec || !fig || !svg) return;
  // pointing at (or focusing) a job lights its piece and its line
  const ac = new AbortController(), o = { signal: ac.signal };
  $$<HTMLElement>(sec, ".eb-job").forEach((j) => {
    const on = () => fig.setAttribute("data-hl", j.dataset.job!), offHl = () => fig.removeAttribute("data-hl");
    j.addEventListener("pointerenter", on, o); j.addEventListener("pointerleave", offHl, o);
    j.addEventListener("focus", on, o); j.addEventListener("blur", offHl, o);
  });
  if (reduced) return () => ac.abort();
  const build = buildTimeline(gsap, svg);
  ScrollTrigger.create({ trigger: svg, start: "top 80%", once: true, onEnter: () => build.play() });
  const sigs = $$<SVGCircleElement>(svg, ".rl-sigs circle");
  const off = whileNear(gsap, svg, (t) => {
    sigs.forEach((c, i) => {
      // out to the job and back to the token, each on its own beat
      const w = (t * 0.32 + i * 0.33) % 1, u = w < 0.5 ? w * 2 : 2 - w * 2, [a, b] = LINES[i];
      c.setAttribute("transform", tr([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]));
      c.style.opacity = f(clamp01(Math.min(u, 1 - u) * 7 + 0.15));
    });
  });
  return () => { off(); ac.abort(); };
}

/** every section's motion, under one gsap context (useScrollMotion) */
export const mountAll: Mount = (root, ctx) => {
  const offs = [gridMount(root, ctx), mountHeadings(root, ctx), mountDraw(root, ctx), mountCount(root, ctx), mountHero(root, ctx), mountLoop(root, ctx),
    mountSmallWheels(root, ctx), mountEngines(root, ctx), mountRoles(root, ctx)];
  return () => offs.forEach((o) => { if (typeof o === "function") o(); });
};
