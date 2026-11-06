import type { ScrollTrigger as ST } from "gsap/ScrollTrigger";

/** Keeps a section's triggers in place when the page above it changes height (late content, fonts): when the section's
 *  absolute top moves, its triggers refresh. Returns the clean-up. Used by Get into NEAR and Close. */
export function follow(ScrollTrigger: typeof ST, root: HTMLElement, sts: ST[], after?: () => void) {
  let top = -1, raf = 0;
  const absTop = () => Math.round(root.getBoundingClientRect().top + window.scrollY);
  const onRefresh = () => { top = absTop(); if (after) after(); };
  ScrollTrigger.addEventListener("refresh", onRefresh);
  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const t = absTop();
      if (top >= 0 && Math.abs(t - top) > 1) { top = t; sts.forEach((s) => s.refresh()); if (after) after(); }
      else if (top < 0) top = t;
    });
  });
  ro.observe(document.body);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); ScrollTrigger.removeEventListener("refresh", onRefresh); };
}
