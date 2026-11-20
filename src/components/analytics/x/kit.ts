// Analytics X ("MVP"): the small kit the two kept drawings need (trimmed from D's, ../d/kit.ts, so each version stands alone). Geometry on Foundation C's
// isometric helpers (../../foundation/c/iso.ts: 2:1 iso, x right-down, y left-down, z up). Motion: a drawing builds once as it arrives (edges draw,
// faces fill, accents last), figures count once ([data-count]), a living loop runs only while its drawing is near the screen. Reduced motion: none of
// it runs; the markup is the finished frame.
import type { MotionCtx } from "@/lib/motion/scroll";
import { P, f } from "../../foundation/c/iso";

export { P, f, pts, line, box, faces, wire, vbox, corners, type Box, type V } from "../../foundation/c/iso";

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const tr = (v: [number, number]) => `translate(${f(v[0])} ${f(v[1])})`;

/** a lattice of floor dots over [x0, x1] × [y0, y1] at z, one path of round caps */
export function dots(x0: number, y0: number, x1: number, y1: number, step: number, z = 0) {
  let d = "";
  for (let x = x0; x <= x1 + 1e-6; x += step) for (let y = y0; y <= y1 + 1e-6; y += step) { const [a, b] = P(x, y, z); d += `M${f(a)},${f(b)}h0`; }
  return d;
}
/** a matrix that lays a flat 2D drawing (a right, b down, in world units) on a top face, origin at world (x, y, z) */
export const onTop = (x: number, y: number, z: number) => { const o = P(x, y, z), C = Math.cos(Math.PI / 6); return `matrix(${f(C)},0.5,${f(-C)},0.5,${f(o[0])},${f(o[1])})`; };

/* ───────────────────────── motion ───────────────────────── */
type G = MotionCtx["gsap"];
const $$ = <T extends Element = SVGElement>(el: ParentNode, s: string) => [...el.querySelectorAll<T>(s)];

/** the build both drawings share: floor, edges, faces, accents (svg[data-draw]) */
export function buildTimeline(gsap: G, svg: Element) {
  const floor = $$(svg, ".d-floor"), edges = $$(svg, ".d-e"), fills = $$(svg, ".d-f"), accents = $$(svg, ".d-o");
  const tl = gsap.timeline({ paused: true });
  // each group only when the drawing has it (gsap warns about empty targets)
  const step = (els: Element[], from: gsap.TweenVars, to: gsap.TweenVars, at: number) => { if (!els.length) return; gsap.set(els, from); tl.to(els, to, at); };
  const per = (n: number, total: number, max: number) => Math.min(max, total / (n || 1));
  step(floor, { opacity: 0 }, { opacity: 1, duration: 0.9, ease: "power2.out" }, 0);
  step(edges, { strokeDasharray: "1 1", strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut", stagger: per(edges.length, 0.9, 0.08) }, 0.1);
  step(fills, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out", stagger: per(fills.length, 0.6, 0.05) }, 0.55);
  step(accents, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out", stagger: 0.06 }, 1.3);
  return tl;
}

/** figures that count up once ([data-count] on an element whose text is the final value; the counting copy is a sibling .cnt__live) */
export function mountCount(root: HTMLElement, { reduced }: MotionCtx) {
  if (reduced) return;
  const els = $$<HTMLElement>(root, "[data-count]"), rafs = new Set<number>();
  const parts = (el: HTMLElement) => {
    const v = el.dataset.count ?? "", m = v.match(/^([^\d]*)([\d,.]+)(.*)$/);
    if (!m) return null;
    const raw = m[2].replace(/,/g, ""), dec = (raw.split(".")[1] ?? "").length, comma = m[2].includes(",");
    return { pre: m[1], n: parseFloat(raw), dec, comma, post: m[3], live: el.querySelector<HTMLElement>(".cnt__live") };
  };
  const fmt = (p: NonNullable<ReturnType<typeof parts>>, v: number) => {
    const s = v.toFixed(p.dec);
    return p.pre + (p.comma ? Number(s).toLocaleString("en-US", { minimumFractionDigits: p.dec, maximumFractionDigits: p.dec }) : s) + p.post;
  };
  const run = (el: HTMLElement) => {
    const p = parts(el); if (!p?.live) return;
    const live = p.live, dur = 1400, t0 = performance.now() + Number(el.dataset.delay || 0);
    const step = (now: number) => {
      const t = clamp01((now - t0) / dur), e = 1 - Math.pow(1 - t, 4);
      live.textContent = t >= 1 ? el.dataset.count! : fmt(p, p.n * e);
      if (t < 1) rafs.add(requestAnimationFrame(step));
    };
    rafs.add(requestAnimationFrame(step));
  };
  els.forEach((el) => { const p = parts(el); if (p?.live) p.live.textContent = fmt(p, 0); });
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); run(e.target as HTMLElement); } }), { rootMargin: "0px 0px -10% 0px" });
  els.forEach((el) => {
    if (el.getBoundingClientRect().bottom < 0) { const l = el.querySelector(".cnt__live"); if (l) l.textContent = el.dataset.count!; }
    else io.observe(el);
  });
  return () => { io.disconnect(); rafs.forEach(cancelAnimationFrame); };
}

/** a loop on gsap's ticker that runs only while `el` is near the screen (IntersectionObserver) */
export function whileNear(gsap: G, el: Element, tick: (t: number, dt: number) => void, margin = "15% 0px 15% 0px") {
  let on = false, time = 0;
  const io = new IntersectionObserver(([e]) => { on = e.isIntersecting; }, { rootMargin: margin });
  io.observe(el);
  const fn = (_t: number, dt: number) => { if (!on) return; time += Math.min(dt, 64) / 1000; tick(time, dt); };
  gsap.ticker.add(fn);
  return () => { io.disconnect(); gsap.ticker.remove(fn); };
}
