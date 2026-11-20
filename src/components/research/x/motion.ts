// Research X's motion (markup: ResearchX.tsx). The catalogue's ruled rows are the homepage grid's (../../v3/proof-deeper/motion.ts: rows draw in,
// + crosshairs, [data-rv] rises, the dotted icons draw). On top of it:
//   - the hero (no grid): the h1 rises word by word (SplitText, no masks: the Kepler word is never clipped), its [data-in] lines follow, and the header
//     graphic builds once (floor, edges, faces, the documents drop in, the labels last), then the loose sheet floats over its shadow while it's near;
//   - "Keep reading"'s heading rises word by word as it comes in;
//   - the filter's rows that come back rise in again (research-x.css, .is-filtered): no script.
// Reduced motion: no split, no build, no float; everything stands finished.
import { SplitText } from "gsap/SplitText";
import type { MotionCtx } from "@/lib/motion/scroll";
import { mount as gridMount } from "../../v3/proof-deeper/motion";
import { f } from "./Stack";

const $$ = <T extends Element = SVGElement>(el: ParentNode, s: string) => [...el.querySelectorAll<T>(s)];

export function mount(root: HTMLElement, ctx: MotionCtx) {
  const { reduced, gsap } = ctx;
  const grid = gridMount(root, ctx);
  if (reduced) return () => { if (typeof grid === "function") grid(); };

  gsap.registerPlugin(SplitText);
  let dead = false;
  const splits: SplitText[] = [];
  const h1 = root.querySelector<HTMLElement>("[data-h1]");
  if (h1) {
    const s = SplitText.create(h1, { type: "words", wordsClass: "rx-w" }); splits.push(s);
    gsap.from(s.words, { yPercent: 40, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: 0.07, delay: 0.1 });
  }
  root.querySelectorAll<HTMLElement>("[data-split]").forEach((h) => {
    const s = SplitText.create(h, { type: "words", wordsClass: "rx-w" }); splits.push(s);
    gsap.from(s.words, { yPercent: 40, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: 0.06, scrollTrigger: { trigger: h, start: "top 92%", once: true } });
  });
  root.querySelectorAll<HTMLElement>("[data-in]").forEach((el, i) => {
    el.style.setProperty("--d", `${(0.35 + i * 0.1).toFixed(2)}s`);
    requestAnimationFrame(() => requestAnimationFrame(() => { if (!dead) el.classList.add("is-in"); }));
  });

  // the header graphic: the build (after ../b/kit.ts buildTimeline), then the sheet's float, only while the hero is near the screen
  const svg = root.querySelector<SVGSVGElement>("svg.rx-stack");
  let io: IntersectionObserver | undefined, tick: ((t: number, dt: number) => void) | undefined;
  if (svg) {
    const tl = gsap.timeline({ delay: 0.3 });
    const step = (els: Element[], from: gsap.TweenVars, to: gsap.TweenVars, at: number) => { if (!els.length) return; gsap.set(els, from); tl.to(els, to, at); };
    const pops = $$(svg, ".d-p");
    step($$(svg, ".d-floor"), { opacity: 0 }, { opacity: 1, duration: 0.9, ease: "power2.out" }, 0);
    step($$(svg, ".d-e"), { strokeDasharray: "1 1", strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut", stagger: 0.05 }, 0.1);
    step($$(svg, ".d-f"), { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out", stagger: 0.05 }, 0.55);
    step(pops, { y: -26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "back.out(1.6)", stagger: Math.min(0.06, 1.1 / (pops.length || 1)) }, 0.85);
    step($$(svg, ".d-o"), { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out", stagger: 0.06 }, 1.3);

    const sheet = svg.querySelector<SVGGElement>(".rx-sheet"), shadow = svg.querySelector<SVGElement>(".rx-shadow");
    let near = false, time = 0, lift = 0, built = false;
    tl.call(() => { built = true; });
    io = new IntersectionObserver(([e]) => { near = e.isIntersecting; }, { rootMargin: "10% 0px" });
    io.observe(svg);
    tick = (_t, dt) => {
      if (!near || !built || !sheet) return;
      time += Math.min(dt, 64) / 1000;
      lift = Math.min(1, lift + 0.01);
      const w = Math.sin(time * 1.1);
      sheet.setAttribute("transform", `translate(0 ${f(w * 4 * lift - 2 * lift)})`);
      if (shadow) shadow.style.opacity = f(1 - 0.25 * (w * 0.5 + 0.5) * lift);
    };
    gsap.ticker.add(tick);
  }

  return () => {
    dead = true;
    io?.disconnect(); if (tick) gsap.ticker.remove(tick);
    splits.forEach((s) => s.revert());
    root.querySelectorAll("[data-in]").forEach((el) => el.classList.remove("is-in"));
    if (typeof grid === "function") grid();
  };
}
