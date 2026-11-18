// Research B's motion (markup: ResearchB.tsx). The ruled grid's draw-in, crosshairs and [data-rv] rises are the shared kit's (v3/proof-deeper/motion.ts);
// every drawing builds once as it arrives (kit.ts mountDraw). New here:
//   · headings ([data-rise] and the h1) rise word by word: SplitText, no masks, each word from { yPercent: 40, autoAlpha: 0 } (README, "Building a page");
//   · the hero: the words rise, the stack builds (the documents drop in one on another, the labels rule off, the loose sheet lifts last); then the
//     sheet floats over its shadow and the drawing leans to the pointer;
//   · Proof-of-Response's cover: a signal runs the ping out, then one runs the response back, and the check answers each round trip.
// Every loop runs only while its drawing is near the screen. Reduced motion: every drawing at its finished frame, nothing moves.
import { SplitText } from "gsap/SplitText";
import type { Mount, MotionCtx } from "@/lib/motion/scroll";
import { mount as gridMount } from "../../v3/proof-deeper/motion";
import { buildTimeline, mountDraw, whileNear, along, tr, f, clamp01 } from "./kit";
import { PING, RESP } from "./Covers";

const $$ = <T extends Element>(el: ParentNode, s: string) => [...el.querySelectorAll<T>(s)];
const RISE = { yPercent: 40, autoAlpha: 0 };

/* ==================================================================== headings: word by word */
function mountHeadings(root: HTMLElement, { gsap, ScrollTrigger, reduced }: MotionCtx) {
  if (reduced) return;
  gsap.registerPlugin(SplitText);
  const splits = $$<HTMLElement>(root, "[data-rise]").map((h) => {
    const s = SplitText.create(h, { type: "words", wordsClass: "rb-w" });
    gsap.set(s.words, RISE);
    ScrollTrigger.create({ trigger: h, start: "top 88%", once: true, onEnter: () => gsap.to(s.words, { yPercent: 0, autoAlpha: 1, duration: 1.1, ease: "power4.out", stagger: 0.05 }) });
    return s;
  });
  return () => splits.forEach((s) => s.revert());
}

/* ==================================================================== the hero */
function mountHero(root: HTMLElement, { gsap, reduced }: MotionCtx) {
  const hero = root.querySelector<HTMLElement>(".rb-hero"), svg = hero?.querySelector<SVGSVGElement>("svg.rb-stack"), cam = hero?.querySelector<HTMLElement>(".rb-hero__cam");
  const h1 = hero?.querySelector<HTMLElement>(".rb-h1"), sheet = svg?.querySelector<SVGGElement>(".rb-sheet"), shadow = svg?.querySelector<SVGElement>(".rb-shadow");
  if (!hero || !svg || !cam || !h1) return;
  if (reduced) { hero.classList.add("is-ready"); return () => hero.classList.remove("is-ready"); }
  gsap.registerPlugin(SplitText);
  const split = SplitText.create(h1, { type: "words", wordsClass: "rb-w" });
  const after = $$<HTMLElement>(hero, "[data-hero-up]");
  const build = buildTimeline(gsap, svg);
  gsap.set(split.words, RISE);   // unmasked: the words rise a little and fade in, so no letter (nor the italic accent) is ever clipped
  gsap.set(after, { autoAlpha: 0, y: 18 });
  hero.classList.add("is-ready");
  let built = false;
  const tl = gsap.timeline({ delay: 0.1 });
  tl.to(split.words, { yPercent: 0, autoAlpha: 1, duration: 1.1, ease: "power4.out", stagger: 0.05 }, 0)
    .to(after, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.1 }, 0.45)
    .call(() => { build.play().then(() => { built = true; }); }, [], 0.15);

  let mx = 0, my = 0, cx = 0, cy = 0, lift = 0;
  const onMove = (e: PointerEvent) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; };
  addEventListener("pointermove", onMove, { passive: true });
  const off = whileNear(gsap, hero, (t) => {
    cx += (mx - cx) * 0.05; cy += (my - cy) * 0.05;
    cam.style.transform = `translate3d(${f(cx * -14)}px, ${f(cy * -9)}px, 0)`;
    if (!built || !sheet) return;
    // the sheet eases into its float once the build is done, then drifts up and down over its shadow
    lift = Math.min(1, lift + 0.01);
    const y = Math.sin(t * 1.1) * 4 * lift - 2 * lift;
    sheet.setAttribute("transform", `translate(0 ${f(y)})`);
    if (shadow) shadow.style.opacity = f(1 - 0.25 * (Math.sin(t * 1.1) * 0.5 + 0.5) * lift);
  });
  return () => { off(); removeEventListener("pointermove", onMove); tl.kill(); split.revert(); cam.style.transform = ""; sheet?.removeAttribute("transform"); hero.classList.remove("is-ready"); };
}

/* ==================================================================== Proof-of-Response: the ping and its response */
function mountPing(root: HTMLElement, { gsap, reduced }: MotionCtx) {
  if (reduced) return;
  const offs = $$<SVGSVGElement>(root, "svg.rb-cv--por").map((svg) => {
    const [ping, resp] = $$<SVGCircleElement>(svg, ".rb-sigs circle"), chk = svg.querySelector<SVGGElement>(".rb-check circle");
    if (!ping || !resp) return () => {};
    return whileNear(gsap, svg, (t) => {
      // one round trip every 3.2 s: out (0–0.42), a beat at the far node, back (0.5–0.86), the check answers (0.86–1)
      const u = (t / 3.2) % 1, a = clamp01(u / 0.42), b = clamp01((u - 0.5) / 0.36);
      ping.setAttribute("transform", tr(along(PING.ps, a)));
      ping.style.opacity = f(u < 0.42 ? Math.min(1, a * 8, (1 - a) * 8 + 0.2) : 0);
      resp.setAttribute("transform", tr(along(RESP.ps, b)));
      resp.style.opacity = f(u >= 0.5 && u < 0.86 ? Math.min(1, b * 8, (1 - b) * 8 + 0.2) : 0);
      if (chk) chk.style.transform = `scale(${f(1 + 0.18 * Math.max(0, Math.sin(clamp01((u - 0.86) / 0.14) * Math.PI)))})`;
    }, "0px");
  });
  return () => offs.forEach((o) => o());
}

/** every section's motion, under one gsap context (useScrollMotion) */
export const mountAll: Mount = (root, ctx) => {
  const offs = [gridMount(root, ctx), mountHeadings(root, ctx), mountDraw(root, ctx), mountHero(root, ctx), mountPing(root, ctx)];
  return () => offs.forEach((o) => { if (typeof o === "function") o(); });
};
