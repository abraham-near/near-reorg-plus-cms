// Research A's motion. The homepage's ruled grid does the arrivals (../../v3/proof-deeper/motion.ts: rows draw in, + crosshairs, [data-rv] rises, the
// dotted icons draw); on top of it:
//   - the h1 rises word by word on load, each h2 ([data-split]) as it comes in (SplitText, no masks: the Kepler word's overhang is never clipped);
//     the hero's [data-in] lines follow the h1;
//   - the filter's rows that come back rise in again (research-a.css, .is-filtered): no script.
// Reduced motion: no split, no rise; the grid stands finished.
import { SplitText } from "gsap/SplitText";
import type { MotionCtx } from "@/lib/motion/scroll";
import { mount as gridMount } from "../../v3/proof-deeper/motion";

export function mount(root: HTMLElement, ctx: MotionCtx) {
  const { reduced, gsap } = ctx;
  const grid = gridMount(root, ctx);
  let dead = false;
  const splits: SplitText[] = [];

  if (!reduced) {
    gsap.registerPlugin(SplitText);
    const h1 = root.querySelector<HTMLElement>("[data-h1]");
    if (h1) {
      const s = SplitText.create(h1, { type: "words", wordsClass: "ra-w" }); splits.push(s);
      gsap.from(s.words, { yPercent: 40, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: 0.07, delay: 0.1 });
    }
    root.querySelectorAll<HTMLElement>("[data-split]").forEach((h) => {
      const s = SplitText.create(h, { type: "words", wordsClass: "ra-w" }); splits.push(s);
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
    if (typeof grid === "function") grid();
  };
}
