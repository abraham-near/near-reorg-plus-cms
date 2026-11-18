// Brand B's motion (markup: BrandB.tsx). The ruled grid's draw-in, crosshairs and [data-rv] rises are the shared kit's (v3/proof-deeper/motion.ts); the
// small drawings build as they arrive (kit.ts mountDraw). New here:
//   · headings ([data-rise] and the h1) rise word by word: SplitText, no masks, each word from { yPercent: 40, autoAlpha: 0 } (README, "Building a page");
//   · the hero: the words rise and the tile builds (floor, plinth, tile, the mark), and the first of the construction comes in (the grid, a keyline).
//     Then the scroll builds the rest (Construction.tsx: each piece's data-s is its stretch of the progress): desktop, the stage sticks for one more
//     screen while it builds; phones, it builds as the drawing crosses the screen. The progress is eased on gsap's ticker, only while the hero is near;
//   · type: the guides (cap height, x-height, baseline) are measured on the real letters once the fonts are in, and again on resize. That runs with
//     reduced motion too: it is layout, not motion.
// Reduced motion: the hero's drawing is the finished construction (the markup); nothing sticks, nothing builds.
import { SplitText } from "gsap/SplitText";
import type { Mount, MotionCtx } from "@/lib/motion/scroll";
import { mount as gridMount } from "../../v3/proof-deeper/motion";
import { buildTimeline, mountDraw, seg, ease3, f } from "./kit";

const $$ = <T extends Element>(el: ParentNode, s: string) => [...el.querySelectorAll<T>(s)];
const RISE = { yPercent: 40, autoAlpha: 0 };

/* ==================================================================== headings: word by word */
function mountHeadings(root: HTMLElement, { gsap, ScrollTrigger, reduced }: MotionCtx) {
  if (reduced) return;
  gsap.registerPlugin(SplitText);
  const splits = $$<HTMLElement>(root, "[data-rise]").map((h) => {
    const s = SplitText.create(h, { type: "words", wordsClass: "bb-w" });
    gsap.set(s.words, RISE);
    ScrollTrigger.create({ trigger: h, start: "top 86%", once: true, onEnter: () => gsap.to(s.words, { yPercent: 0, autoAlpha: 1, duration: 1.1, ease: "power4.out", stagger: 0.05 }) });
    return s;
  });
  return () => splits.forEach((s) => s.revert());
}

/* ==================================================================== the hero: the construction, built by the scroll */
const BASE = 0.36;   // how far the construction gets on its own, before any scroll
type Piece = { el: SVGElement; a: number; b: number; m: string };
function paint(ps: Piece[], p: number) {
  for (const q of ps) {
    const t = ease3(seg(p, q.a, q.b));
    if (q.m === "draw") q.el.style.strokeDashoffset = f(1 - t);
    else if (q.m === "fade") q.el.style.opacity = f(t);
    else { q.el.style.opacity = f(t); q.el.style.transform = `scale(${f(1.18 - 0.18 * t)})`; }   // close: the clear-space box settles round the mark
  }
}
function mountHero(root: HTMLElement, { gsap, ScrollTrigger, reduced }: MotionCtx) {
  const hero = root.querySelector<HTMLElement>(".bb-hero"), svg = hero?.querySelector<SVGSVGElement>("svg.bb-con"), h1 = hero?.querySelector<HTMLElement>(".bb-h1");
  if (!hero || !svg || !h1) return;
  if (reduced) { hero.classList.add("is-ready"); return () => hero.classList.remove("is-ready"); }
  gsap.registerPlugin(SplitText);
  const split = SplitText.create(h1, { type: "words", wordsClass: "bb-w" });
  const after = $$<HTMLElement>(hero, "[data-hero-up]");
  const build = buildTimeline(gsap, svg);
  const ps: Piece[] = $$<SVGElement>(svg, "[data-s]").map((el) => {
    const [a, b] = (el.dataset.s ?? "0 1").split(" ").map(Number);
    if (el.dataset.m === "draw") el.style.strokeDasharray = "1 1";
    return { el, a, b, m: el.dataset.m ?? "fade" };
  });
  paint(ps, 0);
  gsap.set(split.words, RISE);
  gsap.set(after, { autoAlpha: 0, y: 18 });
  hero.classList.add("is-ready");

  // the progress: what the hero does on its own (st.base, 0 → BASE) and the scroll's (st.sp, 0 → 1), eased on the ticker
  const st = { base: 0, sp: 0 };
  const target = () => Math.min(st.base / BASE, 1) * (BASE + (1 - BASE) * st.sp);
  const tl = gsap.timeline({ delay: 0.1 });
  tl.to(split.words, { yPercent: 0, autoAlpha: 1, duration: 1.1, ease: "power4.out", stagger: 0.05 }, 0)
    .to(after, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.1 }, 0.45)
    .call(() => { build.play(); }, [], 0.15)
    .to(st, { base: BASE, duration: 1.6, ease: "power2.inOut" }, 1.3);

  let near = true, cur = 0;
  const io = new IntersectionObserver(([e]) => { near = e.isIntersecting; }, { rootMargin: "10% 0px 10% 0px" });
  io.observe(hero);
  const tick = (_t: number, dt: number) => {
    if (!near) return;
    const to = target(), d = to - cur;
    if (Math.abs(d) < 0.0004) { if (cur !== to) { cur = to; paint(ps, cur); } return; }
    cur += d * (1 - Math.pow(0.86, Math.min(dt, 64) / 16.7));
    paint(ps, cur);
  };
  gsap.ticker.add(tick);

  // desktop: the stage sticks for one more screen while the scroll builds it; phones: it builds as the drawing crosses the screen
  const mm = gsap.matchMedia();
  mm.add("(min-width: 860px)", () => {
    hero.classList.add("is-scrub");
    ScrollTrigger.create({ trigger: hero, start: "top top", end: "bottom bottom", onUpdate: (s) => { st.sp = s.progress; }, onRefresh: (s) => { st.sp = s.progress; } });
    return () => hero.classList.remove("is-scrub");
  });
  mm.add("(max-width: 859px)", () => {
    ScrollTrigger.create({ trigger: svg, start: "top 80%", end: "bottom 35%", onUpdate: (s) => { st.sp = s.progress; }, onRefresh: (s) => { st.sp = s.progress; } });
  });

  return () => {
    gsap.ticker.remove(tick); io.disconnect(); mm.revert(); tl.kill(); split.revert();
    ps.forEach((q) => { q.el.style.strokeDasharray = ""; q.el.style.strokeDashoffset = ""; q.el.style.opacity = ""; q.el.style.transform = ""; });
    hero.classList.remove("is-ready", "is-scrub");
  };
}

/* ==================================================================== type: the guides, measured on the letters */
function mountType(root: HTMLElement) {
  const boxes = $$<HTMLElement>(root, "[data-guides]");
  if (!boxes.length) return;
  const ctx = document.createElement("canvas").getContext("2d");
  let dead = false;
  const measure = () => {
    if (dead || !ctx) return;
    boxes.forEach((bx) => {
      const g = bx.querySelector<HTMLElement>(".bb-spec__glyph"), base = bx.querySelector<HTMLElement>(".bb-spec__base");
      if (!g || !base) return;
      const cs = getComputedStyle(g);
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const cap = ctx.measureText("H").actualBoundingBoxAscent, xh = ctx.measureText("x").actualBoundingBoxAscent;
      const by = base.getBoundingClientRect().top - bx.getBoundingClientRect().top;
      bx.style.setProperty("--base", `${by.toFixed(1)}px`);
      bx.style.setProperty("--xh", `${(by - xh).toFixed(1)}px`);
      bx.style.setProperty("--cap", `${(by - cap).toFixed(1)}px`);
      bx.classList.add("is-measured");
    });
  };
  measure();
  document.fonts?.ready.then(measure);
  let rz = 0;
  const onRz = () => { clearTimeout(rz); rz = window.setTimeout(measure, 120); };
  addEventListener("resize", onRz);
  return () => { dead = true; clearTimeout(rz); removeEventListener("resize", onRz); boxes.forEach((bx) => bx.classList.remove("is-measured")); };
}

/** every section's motion, under one gsap context (useScrollMotion) */
export const mountAll: Mount = (root, ctx) => {
  const offs = [gridMount(root, ctx), mountHeadings(root, ctx), mountDraw(root, ctx), mountHero(root, ctx), mountType(root)];
  return () => offs.forEach((o) => { if (typeof o === "function") o(); });
};
