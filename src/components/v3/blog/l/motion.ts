// Blog L's motion, light on purpose: no rules draw, nothing is scrubbed, no photo drifts.
//   - arrivals: every [data-in] block fades and rises a little once it comes into view (in turn, by its --j); a block already above the view is simply
//     there. sync() picks up blocks React has just made (a filter, a sort, a page), so a new page of the archive rises in the same way;
//   - the line icons (header/icons.ts) of every [data-ic] block, mounted as React makes them and disposed when it unmakes them.
// Reduced motion: no data-lm on the root, so nothing is hidden and nothing moves; the icons are drawn.
import type { MotionCtx } from "@/lib/motion/scroll";
import { mountIcons } from "../../header/icons";

export type Motion = { sync: () => void; dispose: () => void };

export function mount(root: HTMLElement, { reduced }: Pick<MotionCtx, "reduced">): Motion {
  let dead = false;
  if (!reduced) root.setAttribute("data-lm", "");
  const io = reduced ? null : new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    io!.unobserve(e.target); e.target.classList.add("is-in");
  }), { rootMargin: "0px 0px -6% 0px" });
  const seen = new WeakSet<Element>();
  const icons = new Map<HTMLElement, ReturnType<typeof mountIcons>>();

  const sync = () => {
    if (dead) return;
    icons.forEach((s, el) => { if (!el.isConnected) { s.dispose(); icons.delete(el); } });
    root.querySelectorAll<HTMLElement>("[data-ic]").forEach((el) => { if (!icons.has(el)) icons.set(el, mountIcons(el, reduced)); });
    root.querySelectorAll<HTMLElement>("[data-in]").forEach((el) => {
      if (seen.has(el)) return;
      seen.add(el);
      if (!io || el.getBoundingClientRect().bottom < 0) { el.classList.add("is-in"); return; }
      io.observe(el);
    });
  };
  sync();

  return {
    sync,
    dispose() {
      dead = true; io?.disconnect();
      icons.forEach((s) => s.dispose()); icons.clear();
      root.removeAttribute("data-lm");
      root.querySelectorAll(".is-in").forEach((el) => el.classList.remove("is-in"));
    },
  };
}
