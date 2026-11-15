// Analytics B, its own motion (the grid's draw-in, crosshairs and [data-rv] rises are the shared kit's: v3/proof-deeper/motion.ts, mounted beside this one).
//   - the figures ([data-count]) count up from zero once they are well in view, each after its own small delay, then settle on the exact text;
//   - everything else (the revenue line wiping in, the uptime bars filling day by day, the tools' scan) is CSS keyed on the row's .is-in (analytics-b.css).
// Reduced motion: nothing here runs; the figures are their final text from the first paint.
import type { MotionCtx } from "@/lib/motion/scroll";

const ease = (t: number) => 1 - Math.pow(1 - t, 4);

export function mount(root: HTMLElement, { reduced }: MotionCtx) {
  if (reduced) return;
  const els = [...root.querySelectorAll<HTMLElement>("[data-count]")];
  const rafs = new Set<number>();
  const parts = (el: HTMLElement) => {
    const v = el.dataset.count ?? "", m = v.match(/^([^\d]*)([\d.]+)(.*)$/);
    if (!m) return null;
    const dec = (m[2].split(".")[1] ?? "").length;
    return { pre: m[1], n: parseFloat(m[2]), dec, post: m[3], live: el.querySelector<HTMLElement>(".ab-num__live") };
  };
  const run = (el: HTMLElement) => {
    const p = parts(el); if (!p?.live) return;
    const live = p.live, dur = 1300, t0 = performance.now() + Number(el.dataset.delay || 0);
    const step = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - t0) / dur));
      live.textContent = t >= 1 ? el.dataset.count! : p.pre + (p.n * ease(t)).toFixed(p.dec) + p.post;
      el.classList.toggle("is-counting", t < 1);
      if (t < 1) { const r = requestAnimationFrame(step); rafs.add(r); }
    };
    rafs.add(requestAnimationFrame(step));
  };
  // set to zero now (same frame as the grid's data-motion), count when in view
  els.forEach((el) => { const p = parts(el); if (p?.live) p.live.textContent = p.pre + (0).toFixed(p.dec) + p.post; });
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return; io.unobserve(e.target); run(e.target as HTMLElement);
  }), { rootMargin: "0px 0px -10% 0px" });
  els.forEach((el) => {
    if (el.getBoundingClientRect().bottom < 0) { const live = el.querySelector(".ab-num__live"); if (live) live.textContent = el.dataset.count!; }
    else io.observe(el);
  });
  return () => { io.disconnect(); rafs.forEach(cancelAnimationFrame); };
}
