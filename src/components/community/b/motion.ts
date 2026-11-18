// Community B's motion (markup: CommunityB.tsx). The ruled grid's draw-in, crosshairs and [data-rv] rises are the shared kit's
// (v3/proof-deeper/motion.ts); the small drawings build as they arrive (kit.ts mountDraw); figures count once. New here:
//   · the hero: the words rise, the map of crews builds (ground, slabs, people, then the arcs); then it lives: signals run the arcs, the arcs flow,
//     people shift on their feet, and the drawing leans to the pointer;
//   · events: the stage builds, the rows fill one by one, then the two lamps sweep the stage while it is on screen;
//   · the Legion: the people step up onto the plinth and fall into ranks as the band scrolls in (scrubbed, eased);
//   · ways (desktop): the drawing sticks while the four ways pass; the reading line drives the plot's stage, and fills the dotted axis.
// Every loop runs only while its section is near the screen. Reduced motion: every drawing at its finished frame; the ways' drawing shows the way read.
import type { Mount, MotionCtx } from "@/lib/motion/scroll";
import { mount as gridMount } from "../../v3/proof-deeper/motion";
import { buildTimeline, mountCount, mountDraw, mountRise, whileNear, along, tr, f, clamp01 } from "./kit";
import { ARCS, PEOPLE } from "./HeroCrews";
import { cone } from "./EventStage";
import { MEN, placeAt } from "./LegionFormation";
import { collect, geo, paint } from "./WaysScene";

const $$ = <T extends Element>(el: ParentNode, s: string) => [...el.querySelectorAll<T>(s)];
const env = (u: number) => Math.min(1, u * 8, (1 - u) * 8);

/* ==================================================================== the hero */
function mountHero(root: HTMLElement, { gsap, reduced }: MotionCtx) {
  const hero = root.querySelector<HTMLElement>(".cb-hero"), svg = hero?.querySelector<SVGSVGElement>("svg.hc"), cam = hero?.querySelector<HTMLElement>(".cb-hero__cam");
  if (!hero || !svg || !cam) return;
  if (reduced) { hero.classList.add("is-ready"); return () => hero.classList.remove("is-ready"); }
  const words = $$<HTMLElement>(hero, ".cb-w"), after = $$<HTMLElement>(hero, "[data-hero-up]");
  const build = buildTimeline(gsap, svg);
  gsap.set(words, { yPercent: 40, autoAlpha: 0 });   // unmasked: the words rise a little and fade in, so no letter is ever clipped
  gsap.set(after, { autoAlpha: 0, y: 18 });
  hero.classList.add("is-ready");
  const tl = gsap.timeline({ delay: 0.1 });
  tl.to(words, { yPercent: 0, autoAlpha: 1, duration: 1.1, ease: "power4.out", stagger: 0.05 }, 0)
    .to(after, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.1 }, 0.45)
    .call(() => { build.play(); }, [], 0.15);

  const pws = $$<SVGGElement>(svg, ".hc-pw").map((w) => ({ el: w.querySelector<SVGGElement>(".pw")!, i: Number(w.dataset.i), last: 0 }));
  const sigs = $$<SVGCircleElement>(svg, ".hc-sigs circle"), arcs = svg.querySelector<SVGGElement>(".hc-arcs");
  let mx = 0, my = 0, cx = 0, cy = 0;
  const onMove = (e: PointerEvent) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; };
  addEventListener("pointermove", onMove, { passive: true });
  const off = whileNear(gsap, hero, (t) => {
    cx += (mx - cx) * 0.05; cy += (my - cy) * 0.05;
    cam.style.transform = `translate3d(${f(cx * -16)}px, ${f(cy * -10)}px, 0) rotate(${f(cx * -0.7)}deg)`;
    if (arcs) arcs.style.strokeDashoffset = f(-t * 9);
    for (let i = 0; i < sigs.length; i++) {
      const u = (t * (0.11 + (i % 4) * 0.018) + i * 0.29) % 1, p = along(ARCS[i].ps, u);
      sigs[i].setAttribute("transform", tr(p));
      sigs[i].style.opacity = f(env(u));
    }
    // people shift on their feet: now and then a small lift, each on its own beat
    for (const p of pws) {
      const k = Math.sin(t * 1.25 + p.i * 2.17), dy = -Math.pow(Math.max(0, k), 10) * 3.2;
      if (Math.abs(dy - p.last) < 0.05) continue;
      p.last = dy;
      const a = PEOPLE[p.i].at;
      p.el.setAttribute("transform", tr([a[0], a[1] + dy]));
    }
  });
  return () => { off(); removeEventListener("pointermove", onMove); tl.kill(); cam.style.transform = ""; hero.classList.remove("is-ready"); };
}

/* ==================================================================== events: the stage */
function mountStage(root: HTMLElement, { gsap, ScrollTrigger, reduced }: MotionCtx) {
  const svg = root.querySelector<SVGSVGElement>("svg.es");
  if (!svg || reduced) return;
  const build = buildTimeline(gsap, svg);
  ScrollTrigger.create({ trigger: svg, start: "top 80%", once: true, onEnter: () => build.play() });
  const beams = $$<SVGPathElement>(svg, ".es-cone"), spots = $$<SVGEllipseElement>(svg, ".es-spot");
  return whileNear(gsap, svg, (t) => {
    for (let i = 0; i < 2; i++) {
      const c = cone(i, Math.sin(t * 0.42 + i * 2.4) * 0.85);
      beams[i]?.setAttribute("d", c.beam);
      spots[i]?.setAttribute("cx", f(c.spot.cx)); spots[i]?.setAttribute("cy", f(c.spot.cy));
    }
  });
}

/* ==================================================================== the Legion: the formation */
function mountLegion(root: HTMLElement, { gsap, ScrollTrigger, reduced }: MotionCtx) {
  const sec = root.querySelector<HTMLElement>(".cb-lg"), svg = sec?.querySelector<SVGSVGElement>("svg.lg");
  if (!sec || !svg || reduced) return;
  const men = $$<SVGGElement>(svg, ".lg-man").map((w) => ({ el: w.querySelector<SVGGElement>(".pw")!, m: MEN[Number(w.dataset.i)] }));
  const build = buildTimeline(gsap, svg);
  let target = 0, p = -1;
  const draw = (v: number) => men.forEach((x) => x.el.setAttribute("transform", tr(placeAt(x.m, v))));
  draw(0);
  ScrollTrigger.create({ trigger: svg, start: "top 82%", once: true, onEnter: () => build.play() });
  ScrollTrigger.create({ trigger: svg, start: "top 78%", end: "center 52%", onUpdate: (s) => { target = s.progress; }, onRefresh: (s) => { target = s.progress; } });
  return whileNear(gsap, sec, (_t, dt) => {
    const k = 1 - Math.pow(0.9, dt / 16.7), next = p < 0 ? target : p + (target - p) * k;
    if (Math.abs(next - p) < 0.0004) return;
    p = next; draw(clamp01(p));
  });
}

/* ==================================================================== ways: the plot that becomes each way */
const lin = (a: number, b: number, x: number) => (x <= a ? 0 : x >= b ? 1 : (x - a) / (b - a));
const NOW = 0.55;   // the reading line, a share of the screen (community-b.css: --cb-now)
function mountWays(root: HTMLElement, { gsap, ScrollTrigger, reduced }: MotionCtx) {
  const sec = root.querySelector<HTMLElement>(".cb-wy"), list = sec?.querySelector<HTMLElement>(".cb-wy__list"), main = sec?.querySelector<SVGSVGElement>("svg.wy--main");
  if (!sec || !list || !main) return;
  const steps = $$<HTMLElement>(sec, ".cb-wy__step"), nums = $$<HTMLElement>(sec, ".cb-wy__num");
  const fill = sec.querySelector<HTMLElement>(".cb-wy__fill"), count = sec.querySelector<HTMLElement>(".cb-wy__ci"), el = collect(main);
  sec.classList.add("is-story");
  let top = 0, H = 1, ticks: number[] = [], vh = innerHeight, desk = true;
  const measure = () => {
    vh = innerHeight; desk = main.getClientRects().length > 0;
    top = list.getBoundingClientRect().top + scrollY; H = list.offsetHeight;
    ticks = nums.map((n) => { const r = n.getBoundingClientRect(); return r.top + r.height / 2 + scrollY - top; });
  };
  const lineY = () => scrollY + vh * NOW - top;
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
    ScrollTrigger.create({ trigger: sec, start: "top bottom", end: "bottom top", onRefresh: measure, onUpdate: () => { if (ui(lineY())) paint(el, geo(on, 0)); } });
    ui(lineY()); paint(el, geo(on, 0));
    return () => sec.classList.remove("is-story");
  }
  ScrollTrigger.create({ trigger: sec, start: "top bottom", end: "bottom top", onRefresh: measure });
  let s = stageAt(lineY());
  ui(lineY()); paint(el, geo(s, 0));
  const off = whileNear(gsap, sec, (t, dt) => {
    const y = lineY();
    ui(y);
    if (!desk) return;
    s += (stageAt(y) - s) * (1 - Math.pow(0.88, dt / 16.7));
    paint(el, geo(s, t));
  }, "0px");
  return () => { off(); sec.classList.remove("is-story"); if (fill) fill.style.height = ""; };
}

/** every section's motion, under one gsap context (useScrollMotion) */
export const mountAll: Mount = (root, ctx) => {
  const offs = [gridMount(root, ctx), mountRise(root, ctx), mountDraw(root, ctx), mountCount(root, ctx), mountHero(root, ctx), mountStage(root, ctx), mountLegion(root, ctx), mountWays(root, ctx)];
  return () => offs.forEach((o) => { if (typeof o === "function") o(); });
};
