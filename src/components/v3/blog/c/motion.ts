// Blog C's motion: grid.ts (rows draw, crosshairs, icons) and the list's own arrival: each post row rises as it comes into view, a few at a time
// (in turn within the batch). Rows React adds later (a search, a filter) are not observed: blog-c.css lets them rise as they mount (.is-live).
// The preview photo swaps in blog-c.css (a soft wipe from below). Reduced motion: all of it is simply there.
import type { MotionCtx } from "@/lib/motion/scroll";
import { mountGrid, type Grid } from "../grid";

export function mount(root: HTMLElement, ctx: MotionCtx): Grid {
  const grid = mountGrid(root, ctx);
  if (ctx.reduced) return grid;
  let batch = 0, bt = 0;
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    (e.target as HTMLElement).style.setProperty("--d", `${Math.min(batch++, 10) * 45}ms`);
    e.target.classList.add("is-in");
    clearTimeout(bt); bt = window.setTimeout(() => { batch = 0; }, 120);
  }), { rootMargin: "0px 0px -6% 0px" });
  root.querySelectorAll<HTMLElement>(".bl-c__li").forEach((li) => {
    if (li.getBoundingClientRect().bottom < 0) li.classList.add("is-in"); else io.observe(li);
  });
  root.setAttribute("data-list-motion", "");
  return {
    sync: grid.sync,
    dispose() {
      io.disconnect(); clearTimeout(bt); root.removeAttribute("data-list-motion");
      root.querySelectorAll(".bl-c__li").forEach((li) => li.classList.remove("is-in"));
      grid.dispose();
    },
  };
}
