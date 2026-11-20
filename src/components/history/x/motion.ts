// History X's motion. The homepage's ruled grid does the rows' arrivals and mounts the dot icons (../../v3/proof-deeper/motion.ts: rows draw in,
// + crosshairs, [data-rv] rises, <i data-icon> drawn from dots as they come into view); on top of it:
//   - the h1 rises word by word (SplitText, no masks: the Kepler word's overhang is never clipped); the hero's [data-in] lines follow, once;
//   - the off-grid blocks ([data-up]: Origin) rise and fade in as they come into view (CSS, keyed on .is-in);
//   - the milestones' rail (the homepage's rail, simpler; 860 px and up, motion on): the section pins and the years travel sideways under the scroll
//     (scrubbed, the scroll free, no snapping), one at a time at the centre: 2017 first (the side before it empty, 2018 faint after it), then each year in
//     turn slides in, its title and text brightening, with the others faint (their text kept, at low opacity), ending on 2026.
//     Below 860 px or with reduced motion there is no pin: the rail scrolls sideways by hand (CSS scroll snapping).
// Reduced motion: no data-motion (the grid's mount leaves it off), so everything is finished from the first paint.
import { SplitText } from "gsap/SplitText";
import type { MotionCtx } from "@/lib/motion/scroll";
import { mount as gridMount } from "../../v3/proof-deeper/motion";

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
  const undo = () => { unrail?.(); if (typeof grid === "function") grid(); };
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
