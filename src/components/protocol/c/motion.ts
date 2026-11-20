// Protocol C's motion. The homepage's ruled grid does the arrivals (../../v3/proof-deeper/motion.ts: rows draw in, [data-rv] rises, the proof strip's
// green rule and figures, the dot icons). On top of it:
//   - the h1 rises word by word on load, each h2 ([data-split]) as it arrives (SplitText, no masks: the Kepler word is never clipped); the hero's
//     [data-in] lines follow the h1; [data-up] (the band's lines, off the grid) rise as they arrive;
//   - the hero's dots (cloud.ts) gather into the sphere over ~3 s on load, then turn; the pointer leans it (fine pointers); as the hero leaves the view
//     the segments open wider and the copy drifts up (scrubbed);
//   - the chapter (desktop, motion on): the band pins for about 4.6 screens and its track slides sideways, panel by panel: each panel slides in, holds,
//     and its drawing plays its mechanism with the scroll (panels.ts), eased after it; a hairline with five marks shows the way. Phones: the panels
//     stacked, each drawing playing on a loop while in view;
//   - Speed's clock and Chain Signatures' flow run while near the view; their frames open as they arrive (scrubbed).
// Reduced motion: no split, no gathering, no pin, no loop: every drawing at a finished frame, the panels stacked.
import { SplitText } from "gsap/SplitText";
import type { MotionCtx } from "@/lib/motion/scroll";
import { mount as gridMount } from "../../v3/proof-deeper/motion";
import { clamp01, smooth, stage, type Stage } from "./stage";
import { createCloud, type CloudParams } from "./cloud";
import { createPanel } from "./panels";
import { createSpeed } from "./speed";
import { createChains } from "./chains";

/** a panel's drawing on its own (phones): plays, holds the end, starts over */
const loopU = (t: number) => { const tau = t % 11; return clamp01((tau - 0.8) / 7); };

/** the lateral chapter: four segments (to each panel after the first); in each, the track slides over its first 34 %, the panel's drawing plays over 16–96 % */
function lateral(p: number) {
  const q = Math.min(3.9999, Math.max(0, p * 4)), i = Math.floor(q), f = q - i;
  return { from: i, slide: smooth(f / 0.34), play: clamp01((f - 0.16) / 0.8), on: f < 0.2 ? i : i + 1 };
}

export function mount(root: HTMLElement, ctx: MotionCtx) {
  const { reduced, gsap, ScrollTrigger } = ctx;
  const grid = gridMount(root, ctx);
  const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = root) => el.querySelector<T>(s);
  const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = root) => [...el.querySelectorAll<T>(s)];
  const stages: Stage[] = [], offs: (() => void)[] = [], splits: SplitText[] = [];
  let dead = false;

  /* ── the headings and the hero's lines ── */
  if (!reduced) {
    gsap.registerPlugin(SplitText);
    const h1 = $("[data-h1]");
    if (h1) { const s = SplitText.create(h1, { type: "words", wordsClass: "pc-w" }); splits.push(s); gsap.from(s.words, { yPercent: 40, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: 0.07, delay: 0.1 }); }
    $$("[data-split]").forEach((h) => {
      const s = SplitText.create(h, { type: "words", wordsClass: "pc-w" }); splits.push(s);
      gsap.from(s.words, { yPercent: 40, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: 0.06, scrollTrigger: { trigger: h, start: "top 90%", once: true } });
    });
    $$("[data-in]").forEach((el, i) => {
      el.style.setProperty("--d", `${(0.45 + i * 0.12).toFixed(2)}s`);
      requestAnimationFrame(() => requestAnimationFrame(() => { if (!dead) el.classList.add("is-in"); }));
    });
    $$("[data-up]").forEach((el, i) => {
      el.style.setProperty("--d", `${((i % 4) * 0.08).toFixed(2)}s`);
      ScrollTrigger.create({ trigger: el, start: "top 92%", once: true, onEnter: () => el.classList.add("is-in") });
    });
  }

  /* ── 1 · the hero's dots ── */
  const hero = $("[data-hero]"), heroArt = $(".pc-hero__art"), heroCv = $<HTMLCanvasElement>("canvas[data-scene='hero']");
  if (hero && heroArt && heroCv) {
    const small = innerWidth < 760;
    const cloud = createCloud({ dense: small ? 0.62 : 1 });
    const hp: CloudParams = { build: reduced ? 1 : 0, away: 0, px: 0, py: 0 };
    let tx = 0, ty = 0;
    stages.push(stage(heroCv, (c, w, h, t, dt) => {
      hp.px += (tx - hp.px) * Math.min(1, dt * 2.4); hp.py += (ty - hp.py) * Math.min(1, dt * 2.4);
      cloud(c, w, h, t + 2, hp);
    }, { reduced, still: 13 }));
    heroArt.classList.add("is-ready");   // every starting state is set: the CSS gate (protocol-c.css) lets the drawing show
    if (!reduced) {
      gsap.to(hp, { build: 1, duration: 3.2, ease: "power2.out", delay: 0.35 });
      if (matchMedia("(pointer: fine)").matches) {
        const move = (e: PointerEvent) => { tx = (e.clientX / innerWidth - 0.5) * 2; ty = (e.clientY / innerHeight - 0.5) * 2; };
        const leave = () => { tx = 0; ty = 0; };
        hero.addEventListener("pointermove", move); hero.addEventListener("pointerleave", leave);
        offs.push(() => { hero.removeEventListener("pointermove", move); hero.removeEventListener("pointerleave", leave); });
      }
      ScrollTrigger.create({ trigger: hero, start: "top top", end: "bottom top", scrub: true, onUpdate: (s) => { hp.away = s.progress; } });
      const copy = $("[data-hero-copy]");
      if (copy) gsap.to(copy, { yPercent: -18, autoAlpha: 0.2, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
    }
  }

  /* ── 3 · the chapter ── */
  const band = $(".pc-band"), pin = $("[data-pin]"), track = $("[data-track]");
  const panelCvs = $$<HTMLCanvasElement>("canvas[data-scene='panel']", band ?? root);
  const stacked = (loop: boolean) => {
    const local: Stage[] = [];
    panelCvs.forEach((cv) => {
      const draw = createPanel(Number(cv.dataset.step) || 0);
      local.push(stage(cv, (c, w, h, t, dt) => draw(c, w, h, t, dt, loop ? loopU(t) : 1), { reduced: !loop, still: 9 }));
    });
    return local;
  };
  let mm: gsap.MatchMedia | null = null;
  if (band && pin && track) {
    if (reduced) stages.push(...stacked(false));
    else {
      mm = gsap.matchMedia();
      mm.add({ wide: "(min-width: 1024px) and (min-height: 620px)", narrow: "(max-width: 1023px), (max-height: 619px)" }, (cx) => {
        if (cx.conditions?.narrow) { const local = stacked(true); return () => local.forEach((s) => s.destroy()); }
        band.classList.add("is-lateral");
        const panels = $$("[data-panel]", track), marks = $$("[data-mark]", band), bar = $("[data-bar]", band);
        const us = panelCvs.map(() => 0), cur = panelCvs.map(() => 0);
        const local = panelCvs.map((cv, i) => {
          const draw = createPanel(Number(cv.dataset.step) || 0);
          return stage(cv, (c, w, h, t, dt) => { cur[i] += (us[i] - cur[i]) * Math.min(1, dt * 6 || 1); draw(c, w, h, t, dt, cur[i]); }, { reduced: false, margin: "0px 0px" });
        });
        let xs: number[] = [];
        const measure = () => { xs = panels.map((p) => p.offsetLeft - (panels[0]?.offsetLeft ?? 0)); };
        measure();
        let on = -1;
        const apply = (p: number) => {
          const l = lateral(p), x = xs[l.from] + ((xs[l.from + 1] ?? xs[l.from]) - xs[l.from]) * l.slide;
          track.style.transform = `translate3d(${(-x).toFixed(1)}px,0,0)`;
          panelCvs.forEach((_, i) => { const k = i + 1; us[i] = k <= l.from ? 1 : k === l.from + 1 ? l.play : 0; });
          if (bar) bar.style.transform = `scaleX(${p.toFixed(4)})`;
          if (l.on !== on) { on = l.on; marks.forEach((m, k) => m.classList.toggle("is-on", k <= on)); panels.forEach((pn, k) => pn.classList.toggle("is-on", k === on)); }
        };
        const st = ScrollTrigger.create({
          trigger: pin, start: "top top", end: () => "+=" + Math.round(innerHeight * 4.6), pin: true, pinSpacing: true, anticipatePin: 1,
          onUpdate: (s) => apply(s.progress),
          onRefresh: (s) => { measure(); apply(s.progress); },
        });
        apply(st.progress);
        return () => {
          local.forEach((s) => s.destroy()); band.classList.remove("is-lateral"); track.style.transform = "";
          marks.forEach((m) => m.classList.remove("is-on")); panels.forEach((pn) => pn.classList.remove("is-on"));
        };
      });
    }
  }

  /* ── 4 · Speed's clock; 5 · Chain Signatures ── */
  const spCv = $<HTMLCanvasElement>("canvas[data-scene='speed']");
  if (spCv) { const draw = createSpeed(); stages.push(stage(spCv, (c, w, h, t) => draw(c, w, h, t + 1.5), { reduced, still: 9.9 })); }
  const csCv = $<HTMLCanvasElement>("canvas[data-scene='chains']");
  if (csCv) { const draw = createChains(); stages.push(stage(csCv, (c, w, h, t) => draw(c, w, h, t + 2.3), { reduced, still: 3.6 * 3 + 3.5 })); }
  // their frames open as they arrive
  if (!reduced) $$("[data-reveal]").forEach((el) => {
    gsap.fromTo(el, { clipPath: "inset(12% 10% 12% 10%)", scale: 0.96 }, { clipPath: "inset(0% 0% 0% 0%)", scale: 1, ease: "none", scrollTrigger: { trigger: el, start: "top 98%", end: "top 50%", scrub: true } });
  });

  return () => {
    dead = true;
    stages.forEach((s) => s.destroy()); offs.forEach((o) => o()); splits.forEach((s) => s.revert()); mm?.revert();
    heroArt?.classList.remove("is-ready");
    $$("[data-in], [data-up]").forEach((el) => el.classList.remove("is-in"));
    if (typeof grid === "function") grid();
  };
}
