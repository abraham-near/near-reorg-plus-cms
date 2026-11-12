// Blog J's motion, light on purpose (no ruled grid to draw):
//   - the heading rises word by word (gsap SplitText, as E);
//   - [data-in] blocks fade and rise as they come in: the ones already in view in turn (their own --d), the rest as they reach it; a block above the view
//     is simply there. sync() picks up what React has just made (a filter, sort, view or page change re-keys the posts, so they rise again);
//   - the line icons (header/icons.ts), mounted block by block ([data-ic]) as React makes them.
// Reduced motion: no data-motion on the root, so every block is simply finished.
import { SplitText } from "gsap/SplitText";
import type { MotionCtx } from "@/lib/motion/scroll";
import { mountIcons } from "../../header/icons";

export type JMotion = { sync: () => void; dispose: () => void };

export function mount(root: HTMLElement, ctx: MotionCtx): JMotion {
  const { reduced } = ctx;
  let dead = false;
  const ac = new AbortController();
  if (!reduced) root.setAttribute("data-motion", "");

  /* ── the heading ── */
  let split: SplitText | null = null;
  const h = root.querySelector<HTMLElement>(".bj-h1");
  if (h && !reduced) {
    ctx.gsap.registerPlugin(SplitText);
    split = SplitText.create(h, { type: "words", mask: "words", wordsClass: "bj-w" });
    ctx.gsap.from(split.words, { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.07, delay: 0.1 });
  }

  /* ── arrivals ── */
  const seen = new WeakSet<Element>();
  const show = (el: Element) => el.classList.add("is-in");
  const io = reduced ? null : new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io!.unobserve(e.target); show(e.target); } }), { rootMargin: "0px 0px -6% 0px" });
  // a block reached by keyboard before it arrived: simply there
  if (io) root.addEventListener("focusin", (e) => { const b = (e.target as Element).closest?.("[data-in]"); if (b && !b.classList.contains("is-in")) b.classList.add("is-in", "is-now"); }, { signal: ac.signal });

  /* ── icons, block by block ── */
  const icons = new Map<HTMLElement, ReturnType<typeof mountIcons>>();

  const sync = () => {
    if (dead) return;
    icons.forEach((s, el) => { if (!el.isConnected) { s.dispose(); icons.delete(el); } });
    root.querySelectorAll<HTMLElement>("[data-ic]").forEach((el) => { if (!icons.has(el)) icons.set(el, mountIcons(el, reduced)); });
    const now: HTMLElement[] = [];
    root.querySelectorAll<HTMLElement>("[data-in]").forEach((el) => {
      if (seen.has(el)) return;
      seen.add(el);
      if (!io) { show(el); return; }
      const b = el.getBoundingClientRect();
      if (b.bottom < 0) el.classList.add("is-in", "is-now");
      else if (b.top < innerHeight) now.push(el);
      else io.observe(el);
    });
    // in view: one frame at rest (hidden), then they rise in turn
    now.forEach((el, i) => el.style.setProperty("--d", `${(Math.min(i, 8) * 0.07).toFixed(2)}s`));
    if (now.length) requestAnimationFrame(() => requestAnimationFrame(() => { if (!dead) now.forEach(show); }));
  };
  sync();

  return {
    sync,
    dispose() {
      dead = true; ac.abort(); io?.disconnect(); split?.revert();
      icons.forEach((s) => s.dispose()); icons.clear();
      root.removeAttribute("data-motion");
      root.querySelectorAll("[data-in]").forEach((el) => el.classList.remove("is-in", "is-now"));
    },
  };
}
