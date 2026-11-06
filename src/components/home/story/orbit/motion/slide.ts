"use client";

import { useEffect, type RefObject } from "react";

// The station's slide (D72): where a drawing is across the rail, as a number the motion options read every frame.
// -1 as it enters from the right (half a screen away), 0 at the centre, +1 as it leaves to the left. Measured against
// the window's centre, or against the nearest [data-slide-frame]'s centre (the review page's demo frames), so the same
// drawing works on the rail and in a demo. `onFrame(slide, t)` runs on every animation frame while the drawing is on
// screen (t: seconds since mount, for the loops), and not at all under reduced motion (the drawing shows its rest
// state: the slide at 0, the loops held).
export const REDUCED = "(prefers-reduced-motion: reduce)";

export function slideOf(el: Element) {
  const r = el.getBoundingClientRect();
  const frame = el.closest("[data-slide-frame]")?.getBoundingClientRect();
  const cx = frame ? frame.left + frame.width / 2 : window.innerWidth / 2;
  const half = frame ? frame.width / 2 : window.innerWidth / 2;
  return Math.max(-1, Math.min(1, (cx - (r.left + r.width / 2)) / half));
}

export function useSlide(ref: RefObject<HTMLElement | null>, onFrame: (slide: number, t: number) => void) {
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia(REDUCED).matches) return;
    let raf = 0, on = false;
    const t0 = performance.now();
    // The rail hides every station but the one being read (autoAlpha on its [data-art]): a hidden drawing skips its
    // frame (no layout read, no render), so only the station on show costs anything
    const holder = el.closest<HTMLElement>("[data-art]") ?? el;
    const tick = () => {
      raf = 0;
      if (!on) return;
      if (holder.style.visibility !== "hidden") onFrame(slideOf(el), (performance.now() - t0) / 1000);
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      on = e.isIntersecting;
      if (on && !raf) raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [ref, onFrame]);
}
