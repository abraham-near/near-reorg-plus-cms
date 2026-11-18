// Solutions B's motion (markup: SolutionsB.tsx). The ruled grid's draw-in, crosshairs and [data-rv] rises are the shared kit's
// (v3/proof-deeper/motion.ts); the small drawings build as they arrive and the figures count once (kit.ts). New here:
//   · headings ([data-rise] and the h1) rise word by word: SplitText, no masks, each word from { yPercent: 40, autoAlpha: 0 } (README, "Building a page");
//   · the hero: the words rise, the hub builds (the stations, the centre, then the routes and the names); then signals run the routes, and the drawing
//     leans a little to the pointer;
//   · the five solutions and the spotlight: each drawing builds on arrival (kit.ts mountDraw), then lives while it is on screen (Scenes.tsx LIVE,
//     Shard.tsx liveShard): coins and notes cross, agents trade, solvers bid, the vault rebalances, the host's probe stops at the glass, bars close.
// Every loop runs only while its drawing is near the screen. Reduced motion: every drawing at its finished, still frame.
import { SplitText } from "gsap/SplitText";
import type { Mount, MotionCtx } from "@/lib/motion/scroll";
import { mount as gridMount } from "../../v3/proof-deeper/motion";
import { buildTimeline, mountCount, mountDraw, whileNear, along, tr, f } from "./kit";
import { ROUTES } from "./Hero";
import { LIVE, env } from "./Scenes";
import { liveShard } from "./Shard";

const $$ = <T extends Element>(el: ParentNode, s: string) => [...el.querySelectorAll<T>(s)];
const RISE = { yPercent: 40, autoAlpha: 0 };

/* ==================================================================== headings: word by word */
function mountHeadings(root: HTMLElement, { gsap, ScrollTrigger, reduced }: MotionCtx) {
  if (reduced) return;
  gsap.registerPlugin(SplitText);
  const splits = $$<HTMLElement>(root, "[data-rise]").map((h) => {
    const s = SplitText.create(h, { type: "words", wordsClass: "sb-w" });
    gsap.set(s.words, RISE);
    ScrollTrigger.create({ trigger: h, start: "top 86%", once: true, onEnter: () => gsap.to(s.words, { yPercent: 0, autoAlpha: 1, duration: 1.1, ease: "power4.out", stagger: 0.05 }) });
    return s;
  });
  return () => splits.forEach((s) => s.revert());
}

/* ==================================================================== the hero */
function mountHero(root: HTMLElement, { gsap, reduced }: MotionCtx) {
  const hero = root.querySelector<HTMLElement>(".sb-hero"), svg = hero?.querySelector<SVGSVGElement>("svg.hb"), cam = hero?.querySelector<HTMLElement>(".sb-hero__cam");
  const h1 = hero?.querySelector<HTMLElement>(".sb-h1");
  if (!hero || !svg || !cam || !h1) return;
  if (reduced) { hero.classList.add("is-ready"); return () => hero.classList.remove("is-ready"); }
  gsap.registerPlugin(SplitText);
  const split = SplitText.create(h1, { type: "words", wordsClass: "sb-w" });
  const after = $$<HTMLElement>(hero, "[data-hero-up]");
  const build = buildTimeline(gsap, svg);
  gsap.set(split.words, RISE);   // unmasked: the words rise a little and fade in, so no letter (nor the italic accent) is ever clipped
  gsap.set(after, { autoAlpha: 0, y: 18 });
  hero.classList.add("is-ready");
  const tl = gsap.timeline({ delay: 0.1 });
  tl.to(split.words, { yPercent: 0, autoAlpha: 1, duration: 1.1, ease: "power4.out", stagger: 0.05 }, 0)
    .to(after, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.1 }, 0.45)
    .call(() => { build.play(); }, [], 0.15);

  const sigs = $$<SVGCircleElement>(svg, ".hb-sigs circle");
  let mx = 0, my = 0, cx = 0, cy = 0;
  const onMove = (e: PointerEvent) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; };
  addEventListener("pointermove", onMove, { passive: true });
  const off = whileNear(gsap, hero, (t) => {
    cx += (mx - cx) * 0.05; cy += (my - cy) * 0.05;
    cam.style.transform = `translate3d(${f(cx * -14)}px, ${f(cy * -9)}px, 0)`;
    sigs.forEach((c, i) => {
      // out from NEAR to the station, back again, each route on its own beat
      const w = (t * 0.24 + i * 0.37) % 1, u = w < 0.5 ? w * 2 : 2 - w * 2;
      c.setAttribute("transform", tr(along(ROUTES[i].ps, u)));
      c.style.opacity = f(env(u < 0.5 ? u + 0.06 : u - 0.06, 7));
    });
  });
  return () => { off(); removeEventListener("pointermove", onMove); tl.kill(); split.revert(); cam.style.transform = ""; hero.classList.remove("is-ready"); };
}

/* ==================================================================== the drawings that live once built */
function mountScenes(root: HTMLElement, { gsap, reduced }: MotionCtx) {
  if (reduced) return;
  const offs = $$<SVGSVGElement>(root, "svg[data-scene]").map((svg) => {
    const k = svg.dataset.scene!, live = k === "shard" ? liveShard(svg) : LIVE[k]?.(svg);
    return live ? whileNear(gsap, svg, live, "10% 0px 10% 0px") : undefined;
  });
  return () => offs.forEach((o) => o?.());
}

/** every section's motion, under one gsap context (useScrollMotion) */
export const mountAll: Mount = (root, ctx) => {
  const offs = [gridMount(root, ctx), mountHeadings(root, ctx), mountDraw(root, ctx), mountCount(root, ctx), mountHero(root, ctx), mountScenes(root, ctx)];
  return () => offs.forEach((o) => { if (typeof o === "function") o(); });
};
