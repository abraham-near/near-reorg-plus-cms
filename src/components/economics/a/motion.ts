// Economics A's motion. The homepage's ruled grid does the arrivals (../../v3/proof-deeper/motion.ts: rows draw in, + crosshairs, [data-rv] rises, the
// proof strip's green rule); on top of it:
//   - the h1 rises word by word on load, each h2 ([data-split]) as it comes in (SplitText, no masks: the Kepler word's overhang is never clipped);
//     the hero's [data-in] lines follow the h1;
//   - the loop: the step crossing 60 % of the view is the one on show (data-step on the row: its diagram cell, its quarter of the ring, the arrow into it,
//     the step itself at full ink); a dot runs the ring with the steps' scroll, a quarter per step, and ends where it began.
// Reduced motion: no split, no dot; the step on show still follows the scroll, without transitions (economics-a.css).
import { SplitText } from "gsap/SplitText";
import type { MotionCtx } from "@/lib/motion/scroll";
import { mount as gridMount } from "../../v3/proof-deeper/motion";

const R = 24;   // the ring's radius in the diagram's 100 × 100 (EconomicsA.tsx)

export function mount(root: HTMLElement, ctx: MotionCtx) {
  const { reduced, gsap, ScrollTrigger } = ctx;
  const grid = gridMount(root, ctx);
  let dead = false;
  const splits: SplitText[] = [];

  /* ── the loop ── */
  const loop = root.querySelector<HTMLElement>("[data-loop]");
  const steps = loop ? [...loop.querySelectorAll<HTMLElement>("[data-step-i]")] : [];
  const dot = loop?.querySelector<SVGCircleElement>("[data-dot]") ?? null;
  let cur = -1;
  const show = (i: number, p: number) => {
    if (!loop) return;
    if (i !== cur) {
      cur = i; loop.dataset.step = String(i + 1);
      steps.forEach((s, j) => s.toggleAttribute("data-on", j === i));
    }
    if (dot && !reduced) {
      const a = Math.PI * (1 + (i + p) / 2);   // from 9 o'clock, clockwise: a quarter per step
      dot.setAttribute("cx", (50 + R * Math.cos(a)).toFixed(2));
      dot.setAttribute("cy", (50 + R * Math.sin(a)).toFixed(2));
    }
  };
  if (loop && steps.length) {
    loop.setAttribute("data-live", "");
    show(0, 0);
    const last = steps.length - 1;
    steps.forEach((s, i) => ScrollTrigger.create({
      trigger: s, start: "top 60%", end: "bottom 60%",
      onUpdate: (st) => { if (st.isActive) show(i, st.progress); },
      onToggle: (st) => { if (st.isActive) show(i, st.progress); },
      onLeave: () => { if (i === last) show(i, 1); },
      onLeaveBack: () => { if (i === 0) show(0, 0); },
    }));
  }

  /* ── the headings, word by word ── */
  if (!reduced) {
    gsap.registerPlugin(SplitText);
    const h1 = root.querySelector<HTMLElement>("[data-h1]");
    if (h1) {
      const s = SplitText.create(h1, { type: "words", wordsClass: "ea-w" }); splits.push(s);
      gsap.from(s.words, { yPercent: 40, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: 0.07, delay: 0.1 });
    }
    root.querySelectorAll<HTMLElement>("[data-split]").forEach((h) => {
      const s = SplitText.create(h, { type: "words", wordsClass: "ea-w" }); splits.push(s);
      gsap.from(s.words, { yPercent: 40, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: 0.06,
        scrollTrigger: { trigger: h, start: "top 92%", once: true } });
    });
    root.querySelectorAll<HTMLElement>("[data-in]").forEach((el, i) => {
      el.style.setProperty("--d", `${(0.35 + i * 0.1).toFixed(2)}s`);
      requestAnimationFrame(() => requestAnimationFrame(() => { if (!dead) el.classList.add("is-in"); }));
    });
  }

  return () => {
    dead = true; splits.forEach((s) => s.revert());
    root.querySelectorAll("[data-in]").forEach((el) => el.classList.remove("is-in"));
    if (loop) { loop.removeAttribute("data-live"); loop.dataset.step = "1"; steps.forEach((s) => s.removeAttribute("data-on")); }
    if (typeof grid === "function") grid();
  };
}
