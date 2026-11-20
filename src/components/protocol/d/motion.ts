// Protocol D's motion. The homepage's ruled grid does the arrivals (../../v3/proof-deeper/motion.ts: rows draw in, [data-rv] rises, the proof strip's
// green rule and figures, the dot icons). On top of it:
//   - the h1 rises word by word on load, each h2 ([data-split]) as it arrives (SplitText, no masks: the Kepler word is never clipped); the hero's
//     [data-in] lines follow the h1;
//   - the hero's convergence (hero.ts) draws in over ~2.4 s, then runs (only while near the view and the tab is visible); as the hero scrolls away,
//     the sources gather in toward the point (scrubbed);
//   - the dark band opens out to the page's width as it arrives (scrubbed clip);
//   - the chapter (desktop, motion on): the stage pins for about 4.4 screens and the scroll drives the one model (morph.ts) through its five states,
//     continuously; the step's copy crossfades beside it and five segments fill under it. Phones: the steps stacked, each model playing its own step
//     on a loop. Reduced motion: each at its finished state;
//   - Speed's field and Chain Signatures' towers run while near the view; both pictures drift a little against the scroll.
// Reduced motion: no split, no draw-in, no pin, no loop, no drift: every picture at a finished frame.
import { SplitText } from "gsap/SplitText";
import type { MotionCtx } from "@/lib/motion/scroll";
import { mount as gridMount } from "../../v3/proof-deeper/motion";
import { clamp01, stage, type Stage } from "./stage";
import { createHero, type HeroParams } from "./hero";
import { createMorph, stateAt, STATES } from "./morph";
import { createSpeed } from "./speed";
import { createSign } from "./sign";

const N = STATES.length - 1;   // the model's transitions (four)
/** a step's model on its own (phones): from the state before to its own, hold, start over */
const loopP = (i: number, t: number) => { if (i === 0) return 0; const tau = t % 9, u = clamp01((tau - 0.8) / 5.4); return (i - 1 + u) / N; };

export function mount(root: HTMLElement, ctx: MotionCtx) {
  const { reduced, gsap, ScrollTrigger } = ctx;
  const grid = gridMount(root, ctx);
  const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = root) => el.querySelector<T>(s);
  const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = root) => [...el.querySelectorAll<T>(s)];
  const stages: Stage[] = [], splits: SplitText[] = [];
  let dead = false;

  /* ── the headings and the hero's lines ── */
  if (!reduced) {
    gsap.registerPlugin(SplitText);
    const h1 = $("[data-h1]");
    if (h1) { const s = SplitText.create(h1, { type: "words", wordsClass: "pd-w" }); splits.push(s); gsap.from(s.words, { yPercent: 40, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: 0.07, delay: 0.1 }); }
    $$("[data-split]").forEach((h) => {
      const s = SplitText.create(h, { type: "words", wordsClass: "pd-w" }); splits.push(s);
      gsap.from(s.words, { yPercent: 40, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: 0.06, scrollTrigger: { trigger: h, start: "top 90%", once: true } });
    });
    $$("[data-in]").forEach((el, i) => {
      el.style.setProperty("--d", `${(0.4 + i * 0.12).toFixed(2)}s`);
      requestAnimationFrame(() => requestAnimationFrame(() => { if (!dead) el.classList.add("is-in"); }));
    });
  }

  /* ── 1 · the hero's convergence ── */
  const hero = $(".pd-hero"), heroArt = $(".pd-hero__art"), heroCv = $<HTMLCanvasElement>("canvas[data-scene='hero']");
  if (hero && heroArt && heroCv) {
    const draw = createHero(), hp: HeroParams = { reveal: reduced ? 1 : 0, gather: 0 };
    stages.push(stage(heroCv, (c, w, h, t) => draw(c, w, h, t + 6, hp), { reduced, still: 9 }));
    heroArt.classList.add("is-ready");   // every starting state is set: the CSS gate (protocol-d.css) lets the picture show
    if (!reduced) {
      gsap.to(hp, { reveal: 1, duration: 2.4, ease: "power2.inOut", delay: 0.45 });
      ScrollTrigger.create({ trigger: hero, start: "top top", end: "bottom top", onUpdate: (s) => { hp.gather = s.progress; } });
    }
  }

  /* ── 3 · the chapter ── */
  const band = $(".pd-band"), stageEl = $("[data-stage]");
  const stepCanvases = () => $$<HTMLCanvasElement>("canvas[data-scene='step']", band ?? root);
  const stacked = (loop: boolean) => {
    const local: Stage[] = [];
    stepCanvases().forEach((cv) => {
      const i = Number(cv.dataset.step) || 0, draw = createMorph();
      local.push(stage(cv, (c, w, h, t) => draw(c, w, h, t, stateAt(loop ? loopP(i, t) : i / N).s), { reduced: !loop, still: 4 }));
    });
    return local;
  };
  if (band && stageEl) {
    if (reduced) stages.push(...stacked(false));
    else {
      // the band opens out to the page's width as it comes up
      gsap.fromTo(band, { clipPath: "inset(0% 3.5% 0% 3.5% round 28px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none",
        scrollTrigger: { trigger: band, start: "top bottom", end: "top 12%", scrub: 0.6 } });
      const mm = gsap.matchMedia();
      mm.add({ pin: "(min-width: 960px) and (min-height: 600px)", stack: "(max-width: 959px), (max-height: 599px)" }, (cx) => {
        if (cx.conditions?.stack) { const local = stacked(true); return () => local.forEach((s) => s.destroy()); }
        const local: Stage[] = [];
        band.classList.add("is-pinned");
        const steps = $$(".pd-step", band), segs = $$<HTMLElement>(".pd-prog__s i", band);
        const cv = $<HTMLCanvasElement>("canvas[data-scene='chapter']", band);
        let target = 0, cur = 0, on = -1;
        const show = (i: number) => {
          if (i === on) return; on = i;
          steps.forEach((s, j) => { s.classList.toggle("is-on", j === i); s.toggleAttribute("inert", j !== i); });
        };
        show(0);
        const draw = createMorph();
        if (cv) local.push(stage(cv, (c, w, h, t, dt) => {
          cur += (target - cur) * Math.min(1, dt * 6 || 1);   // the model eases after the scroll, never jumps
          draw(c, w, h, t, stateAt(cur).s);
        }, { reduced: false, margin: "0px" }));
        const paint = (p: number) => {
          target = p; show(stateAt(p).on);
          const q = p * N;
          segs.forEach((el, i) => { el.style.transform = `scaleX(${(i === 0 ? 1 : clamp01(q - i + 1)).toFixed(4)})`; });
        };
        const st = ScrollTrigger.create({
          trigger: stageEl, start: "top top", end: () => "+=" + Math.round(innerHeight * 4.4), pin: true, pinSpacing: true, anticipatePin: 1,
          onUpdate: (s) => paint(s.progress), onRefresh: (s) => paint(s.progress),
        });
        paint(st.progress);
        return () => {
          local.forEach((s) => s.destroy()); band.classList.remove("is-pinned");
          steps.forEach((s) => { s.classList.remove("is-on"); s.removeAttribute("inert"); });
          segs.forEach((el) => { el.style.transform = ""; });
        };
      });
      stages.push({ redraw() {}, destroy: () => mm.revert(), w: 0, h: 0 });
    }
  }

  /* ── 4 · Speed: deploy once, run everywhere ── */
  const spCv = $<HTMLCanvasElement>("canvas[data-scene='speed']");
  if (spCv) { const draw = createSpeed(); stages.push(stage(spCv, (c, w, h, t) => draw(c, w, h, t), { reduced, still: 2.4 })); }

  /* ── 5 · Chain Signatures ── */
  const csCv = $<HTMLCanvasElement>("canvas[data-scene='chains']");
  if (csCv) { const draw = createSign(); stages.push(stage(csCv, (c, w, h, t) => draw(c, w, h, t + 12), { reduced, still: 13.4 })); }

  /* ── the two pictures drift a little against the scroll ── */
  if (!reduced) $$(".pd-pair__art .pd-fig-art").forEach((fig) => {
    gsap.fromTo(fig, { y: 36 }, { y: -36, ease: "none", scrollTrigger: { trigger: fig.closest(".l-row") ?? fig, start: "top bottom", end: "bottom top", scrub: 0.8 } });
  });

  return () => {
    dead = true;
    stages.forEach((s) => s.destroy()); splits.forEach((s) => s.revert());
    heroArt?.classList.remove("is-ready");
    $$("[data-in]").forEach((el) => el.classList.remove("is-in"));
    if (typeof grid === "function") grid();
  };
}
