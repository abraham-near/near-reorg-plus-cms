// Community B ("Drawn"): the hand's small kit. Geometry on Foundation C's isometric helpers (../../foundation/c/iso.ts: 2:1 iso, x right-down, y left-down,
// z up, one unit = one screen unit) plus what this page draws a lot of: people (pawns), arcs between places, dotted floors. And the motion every drawing
// shares: a drawing builds once as it arrives (svg[data-draw]: edges draw, faces fill, figures drop in, accents last), text rises ([data-up]), figures
// count once ([data-count]), and a living loop runs only while its section is near the screen. Reduced motion: none of it runs; the markup is the
// finished frame.
import type { MotionCtx } from "@/lib/motion/scroll";
import { P, f, coin, line, type V } from "../../foundation/c/iso";

export { P, f, pts, line, box, faces, wire, grid, vbox, corners, coin, rng, type Box, type V } from "../../foundation/c/iso";

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const ease3 = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ───────────────────────── a person: a short cylinder and a head, drawn at the origin (its foot), placed by a translate ───────────────────────── */
export const PAWN = (() => {
  const c = coin(0, 0, 0, 7, 15);
  return { side: c.side, cx: c.cx, cy: c.cy, rx: c.rx, ry: c.ry, hy: c.cy - 7.6, hr: 6.3 };
})();
/** where a pawn standing on world (x, y, z) has its foot, on screen */
export const foot = (x: number, y: number, z = 0): V => P(x, y, z);
export const tr = (v: V) => `translate(${f(v[0])} ${f(v[1])})`;

/** n spots for people on a slab's top (x0, y0, w, d), in rows, centred */
export function spots(x0: number, y0: number, w: number, d: number, n: number, gap = 22): [number, number][] {
  const per = n <= 2 ? n : n <= 4 ? 2 : 3, rows = Math.ceil(n / per), out: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    const k = Math.min(per, n - r * per);
    for (let c = 0; c < k; c++) out.push([x0 + w / 2 + (c - (k - 1) / 2) * gap, y0 + d / 2 + (r - (rows - 1) / 2) * gap]);
  }
  return out.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
}

/** an arc through the air between two world points (it lifts by h at its middle): its path and the screen points along it */
export function arc(a: [number, number, number], b: [number, number, number], h: number, n = 20) {
  const ps: V[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    ps.push(P(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t) + h * 4 * t * (1 - t)));
  }
  return { d: line(...ps), ps };
}
/** a point a fraction u along a polyline of screen points */
export function along(ps: V[], u: number): V {
  const k = clamp01(u) * (ps.length - 1), i = Math.min(ps.length - 2, Math.floor(k)), t = k - i;
  return [lerp(ps[i][0], ps[i + 1][0], t), lerp(ps[i][1], ps[i + 1][1], t)];
}
/** a lattice of floor dots over [x0, x1] × [y0, y1] at z, one path of round caps */
export function dots(x0: number, y0: number, x1: number, y1: number, step: number, z = 0) {
  let d = "";
  for (let x = x0; x <= x1 + 1e-6; x += step) for (let y = y0; y <= y1 + 1e-6; y += step) { const [a, b] = P(x, y, z); d += `M${f(a)},${f(b)}h0`; }
  return d;
}
/** a matrix that lays a flat 2D drawing (a right, b down, in world units) on a top face, origin at world (x, y, z) */
export const onTop = (x: number, y: number, z: number) => { const o = P(x, y, z), C = Math.cos(Math.PI / 6); return `matrix(${f(C)},0.5,${f(-C)},0.5,${f(o[0])},${f(o[1])})`; };
/** …on the y = max face (it faces the lower left): a along +x, b down */
export const onLeft = (x: number, y: number, z: number) => { const o = P(x, y, z), C = Math.cos(Math.PI / 6); return `matrix(${f(C)},0.5,0,1,${f(o[0])},${f(o[1])})`; };
/** …on the x = max face (it faces the lower right): a along −y, b down */
export const onRight = (x: number, y: number, z: number) => { const o = P(x, y, z), C = Math.cos(Math.PI / 6); return `matrix(${f(C)},-0.5,0,1,${f(o[0])},${f(o[1])})`; };

/* ───────────────────────── motion ───────────────────────── */
type G = MotionCtx["gsap"];
const $$ = <T extends Element = SVGElement>(el: ParentNode, s: string) => [...el.querySelectorAll<T>(s)];

/** the build every drawing shares: floor, edges, faces, figures, accents (svg[data-draw]); it plays once the drawing is well in view */
export function buildTimeline(gsap: G, svg: Element) {
  const floor = $$(svg, ".d-floor"), edges = $$(svg, ".d-e"), fills = $$(svg, ".d-f"), pops = $$(svg, ".d-p"), accents = $$(svg, ".d-o");
  const tl = gsap.timeline({ paused: true });
  // each group only when the drawing has it (gsap warns about empty targets)
  const step = (els: Element[], from: gsap.TweenVars, to: gsap.TweenVars, at: number) => { if (!els.length) return; gsap.set(els, from); tl.to(els, to, at); };
  const per = (n: number, total: number, max: number) => Math.min(max, total / (n || 1));
  step(floor, { opacity: 0 }, { opacity: 1, duration: 0.9, ease: "power2.out" }, 0);
  step(edges, { strokeDasharray: "1 1", strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut", stagger: per(edges.length, 0.9, 0.08) }, 0.1);
  step(fills, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out", stagger: per(fills.length, 0.6, 0.05) }, 0.55);
  step(pops, { y: -26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "back.out(1.6)", stagger: per(pops.length, 1.1, 0.06) }, 0.85);
  step(accents, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out", stagger: 0.06 }, 1.3);
  return tl;
}
/** every svg[data-draw] in root that has no motion of its own (data-draw="self" is built by its section) builds as it arrives */
export function mountDraw(root: HTMLElement, { gsap, ScrollTrigger, reduced }: MotionCtx) {
  if (reduced) return;
  $$<SVGSVGElement>(root, "svg[data-draw='']").forEach((svg) => {
    const tl = buildTimeline(gsap, svg);
    ScrollTrigger.create({ trigger: svg, start: "top 85%", once: true, onEnter: () => tl.play() });
  });
}

/** text that rises once as it comes in ([data-up]; siblings stagger) */
export function mountRise(root: HTMLElement, { reduced }: MotionCtx) {
  const els = $$<HTMLElement>(root, "[data-up]");
  if (reduced || !els.length) return;
  root.classList.add("is-rise");
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return; io.unobserve(e.target);
    const el = e.target as HTMLElement, sibs = $$<HTMLElement>(el.parentElement || root, ":scope > [data-up]");
    el.style.setProperty("--rv", (0.06 + Math.max(0, sibs.indexOf(el)) * 0.09).toFixed(2) + "s");
    el.classList.add("is-in");
  }), { rootMargin: "0px 0px -8% 0px" });
  els.forEach((el) => { if (el.getBoundingClientRect().bottom < 0) el.classList.add("is-in"); else io.observe(el); });
  return () => { io.disconnect(); root.classList.remove("is-rise"); };
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
