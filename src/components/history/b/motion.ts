// History B's motion (markup: HistoryB.tsx). The ruled grid's draw-in, crosshairs and [data-rv] rises are the shared kit's
// (v3/proof-deeper/motion.ts); the small drawings build as they arrive (Community B's kit.ts mountDraw). New here:
//   · the hero: the headline's words rise (SplitText, no masks), the road builds (ground, stones, things, hops, years); then it lives: a green signal
//     hops the road from 2017 to now and rests there a moment, and the drawing leans to the pointer;
//   · the section headings rise word by word as they arrive (SplitText, no masks);
//   · the timeline: a green line runs down the grid's left rule with the reading line, and each year it reaches is marked;
//   · today: the four layers settle down onto one another as the section scrolls in (scrubbed), their labels with them.
// Every loop runs only while its section is near the screen. Reduced motion: every drawing at its finished frame, the timeline's line drawn to the end.
import { SplitText } from "gsap/SplitText";
import { scrub, type Mount, type MotionCtx } from "@/lib/motion/scroll";
import { mount as gridMount } from "../../v3/proof-deeper/motion";
import { buildTimeline, mountDraw, whileNear, along, tr, f, clamp01, seg, easeOut } from "../../community/b/kit";
import { ROAD } from "./HeroRoad";

const $$ = <T extends Element>(el: ParentNode, s: string) => [...el.querySelectorAll<T>(s)];

/* ==================================================================== the hero */
function mountHero(root: HTMLElement, { gsap, reduced }: MotionCtx) {
  const hero = root.querySelector<HTMLElement>(".hb-hero"), svg = hero?.querySelector<SVGSVGElement>("svg.hb-road");
  const cam = hero?.querySelector<HTMLElement>(".hb-hero__cam"), h1 = hero?.querySelector<HTMLElement>(".hb-h1");
  if (!hero || !svg || !cam || !h1) return;
  if (reduced) { hero.classList.add("is-ready"); return () => hero.classList.remove("is-ready"); }
  gsap.registerPlugin(SplitText);
  const split = SplitText.create(h1, { type: "words", wordsClass: "hb-w" });
  const after = $$<HTMLElement>(hero, "[data-hero-up]"), build = buildTimeline(gsap, svg);
  gsap.set(split.words, { yPercent: 40, autoAlpha: 0 });   // unmasked: each word rises a little and fades in, so no letter is ever clipped
  gsap.set(after, { autoAlpha: 0, y: 18 });
  hero.classList.add("is-ready");
  const tl = gsap.timeline({ delay: 0.1 });
  tl.to(split.words, { yPercent: 0, autoAlpha: 1, duration: 1.1, ease: "power4.out", stagger: 0.045 }, 0)
    .to(after, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.1 }, 0.5)
    .call(() => { build.play(); }, [], 0.35);

  // the signal: 2017 → now in ~11 s, a rest on now, then again (it fades out at the end and in at the start)
  const sig = svg.querySelector<SVGCircleElement>(".hb-road__sig");
  const RUN = 11, REST = 2.4;
  let mx = 0, my = 0, cx = 0, cy = 0;
  const onMove = (e: PointerEvent) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; };
  addEventListener("pointermove", onMove, { passive: true });
  const off = whileNear(gsap, hero, (t) => {
    cx += (mx - cx) * 0.05; cy += (my - cy) * 0.05;
    cam.style.transform = `translate3d(${f(cx * -14)}px, ${f(cy * -8)}px, 0)`;
    if (!sig) return;
    const k = (t + 1.5) % (RUN + REST), u = Math.min(1, k / RUN);
    sig.setAttribute("transform", tr(along(ROAD, u)));
    sig.style.opacity = f(Math.min(1, k * 3, (RUN + REST - k) * 2));
  });
  return () => { off(); removeEventListener("pointermove", onMove); tl.kill(); split.revert(); cam.style.transform = ""; hero.classList.remove("is-ready"); };
}

/* ==================================================================== the section headings: word by word */
function mountHeads(root: HTMLElement, { gsap, reduced }: MotionCtx) {
  const hs = $$<HTMLElement>(root, ".hb-h2");
  if (reduced || !hs.length) return;
  gsap.registerPlugin(SplitText);
  const splits = hs.map((h) => {
    const s = SplitText.create(h, { type: "words", wordsClass: "hb-w" });
    if (h.getBoundingClientRect().bottom > 0) gsap.set(s.words, { yPercent: 40, autoAlpha: 0 });   // one already above the screen stays put
    return { h, s };
  });
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return; io.unobserve(e.target);
    const x = splits.find((q) => q.h === e.target);
    if (x) gsap.to(x.s.words, { yPercent: 0, autoAlpha: 1, duration: 1.05, ease: "power4.out", stagger: 0.05, delay: 0.1 });
  }), { rootMargin: "0px 0px -12% 0px" });
  splits.forEach((x) => io.observe(x.h));
  return () => { io.disconnect(); splits.forEach((x) => x.s.revert()); };
}

/* ==================================================================== the timeline: the road down the left rule */
const READ = 0.62;   // the reading line, a share of the screen
function mountRoad(root: HTMLElement, { reduced }: MotionCtx) {
  const list = root.querySelector<HTMLElement>(".hb-tl__list"), fill = list?.querySelector<HTMLElement>(".hb-tl__fill");
  if (!list || !fill) return;
  const rows = $$<HTMLElement>(list, ".hb-ms"), yrs = rows.map((r) => r.querySelector<HTMLElement>(".hb-ms__yr"));
  if (reduced) { rows.forEach((r) => r.classList.add("is-hit")); return; }
  list.classList.add("is-road");
  let top = 0, H = 1, at: number[] = [];
  const measure = () => {
    top = list.getBoundingClientRect().top + scrollY; H = list.offsetHeight || 1;
    at = yrs.map((y) => (y ? y.getBoundingClientRect().top + y.offsetHeight / 2 + scrollY - top : 0));
  };
  const paint = () => {
    const y = scrollY + innerHeight * READ - top;
    fill.style.transform = `scaleY(${clamp01(y / H).toFixed(4)})`;
    rows.forEach((r, i) => r.classList.toggle("is-hit", y >= at[i]));
  };
  measure(); paint();
  scrub(list, "top bottom", "bottom top", paint, measure);
  return () => { list.classList.remove("is-road"); fill.style.transform = ""; rows.forEach((r) => r.classList.remove("is-hit")); };
}

/* ==================================================================== today: the layers settle */
function mountStack(root: HTMLElement, { reduced }: MotionCtx) {
  const box = root.querySelector<HTMLElement>(".hb-stack");
  if (!box || reduced) return;
  const lys = $$<SVGGElement>(box, ".hb-ly"), ls = $$<HTMLElement>(box, ".hb-stack__l");
  const paint = (p: number) => {
    lys.forEach((g, i) => {
      const e = easeOut(seg(p, i * 0.17, i * 0.17 + 0.42));
      g.setAttribute("transform", `translate(0 ${f(-(1 - e) * 90)})`);
      g.style.opacity = f(seg(e, 0, 0.5));
      if (ls[i]) { ls[i].style.opacity = f(seg(e, 0.55, 1)); ls[i].style.translate = `${f((1 - e) * 16)}px 0`; }
    });
  };
  scrub(box, "top 88%", "center 50%", paint);
  return () => { lys.forEach((g) => { g.removeAttribute("transform"); g.style.opacity = ""; }); ls.forEach((l) => { l.style.opacity = ""; l.style.translate = ""; }); };
}

/** every section's motion, under one gsap context (useScrollMotion) */
export const mountAll: Mount = (root, ctx) => {
  const offs = [gridMount(root, ctx), mountDraw(root, ctx), mountHero(root, ctx), mountHeads(root, ctx), mountRoad(root, ctx), mountStack(root, ctx)];
  return () => offs.forEach((o) => { if (typeof o === "function") o(); });
};
