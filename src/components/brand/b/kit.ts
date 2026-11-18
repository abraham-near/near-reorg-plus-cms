// Brand B ("Drawn"): the hand's small kit, copied from Economics B's (economics/b/kit.ts, itself after Community B's and Foundation C's isometric
// helpers) so this version stands on its own: 2:1 iso, x right-down, y left-down, z up, one unit = one screen unit. Only what this page draws: boxes,
// the matrices that lay a flat drawing on a face (the mark on its tile, the construction around it), floor dots and a viewBox round a drawing. And the
// build every small drawing shares: it builds once as it arrives (svg[data-draw]: floor, edges draw, faces fill, pieces drop in, accents last).
// Reduced motion: none of it runs; the markup is the finished frame.
import type { MotionCtx } from "@/lib/motion/scroll";

export const C30 = Math.cos(Math.PI / 6);
export type V = [number, number];
export type B6 = [number, number, number, number, number, number];
export const P = (x: number, y: number, z = 0): V => [(x - y) * C30, (x + y) * 0.5 - z];
export const f = (n: number) => (Math.round(n * 100) / 100).toString();
export const pts = (...ps: V[]) => ps.map((p) => `${f(p[0])},${f(p[1])}`).join(" ");
export const line = (...ps: V[]) => "M" + ps.map((p) => `${f(p[0])},${f(p[1])}`).join("L");

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const ease3 = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export type Box = { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number };
export const box = (x: number, y: number, w: number, d: number, z0: number, h: number): Box => ({ x0: x, x1: x + w, y0: y, y1: y + d, z0, z1: z0 + h });

/** the three visible faces of a box: top, left (the y = y1 face) and right (the x = x1 face) */
export function faces(b: Box) {
  const { x0, x1, y0, y1, z0, z1 } = b;
  return {
    top: pts(P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)),
    left: pts(P(x0, y1, z1), P(x1, y1, z1), P(x1, y1, z0), P(x0, y1, z0)),
    right: pts(P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0), P(x1, y0, z0)),
  };
}
/** the box's visible edges as one continuous path (one edge retraced), so a dash draws it in one stroke */
export function wire(b: Box) {
  const { x0, x1, y0, y1, z0, z1 } = b;
  const A = P(x1, y1, z0), B = P(x1, y1, z1), Cc = P(x0, y1, z1), D = P(x0, y1, z0), E = P(x1, y0, z0), F = P(x1, y0, z1), G = P(x0, y0, z1);
  return line(A, B, Cc, D, A, E, F, B, F, G, Cc);
}
/** the box's hidden (back) edges too: a box drawn as glass, or a ghost */
export function wireAll(b: Box) {
  const { x0, x1, y0, y1, z0, z1 } = b;
  return wire(b) + line(P(x0, y0, z1), P(x0, y0, z0), P(x1, y0, z0)) + line(P(x0, y0, z0), P(x0, y1, z0));
}
export const corners = (b: Box): V[] => [P(b.x0, b.y0, b.z1), P(b.x1, b.y0, b.z1), P(b.x1, b.y1, b.z1), P(b.x0, b.y1, b.z1), P(b.x1, b.y0, b.z0), P(b.x1, b.y1, b.z0), P(b.x0, b.y1, b.z0)];
export const cornersOf = (b: B6) => corners(box(...b));

/** a lattice of floor dots over [x0, x1] × [y0, y1] at z, one path of round caps */
export function dots(x0: number, y0: number, x1: number, y1: number, step: number, z = 0) {
  let d = "";
  for (let x = x0; x <= x1 + 1e-6; x += step) for (let y = y0; y <= y1 + 1e-6; y += step) { const [a, b] = P(x, y, z); d += `M${f(a)},${f(b)}h0`; }
  return d;
}
/** a viewBox around a set of points, with a margin */
export function vbox(ps: V[], m = 8) {
  let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
  for (const [x, y] of ps) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); }
  return { x: a - m, y: b - m, w: c - a + 2 * m, h: d - b + 2 * m, s: `${f(a - m)} ${f(b - m)} ${f(c - a + 2 * m)} ${f(d - b + 2 * m)}` };
}
/** a matrix that lays a flat 2D drawing (a right, b down, in world units) on a top face, origin at world (x, y, z) */
export const onTop = (x: number, y: number, z: number) => { const o = P(x, y, z); return `matrix(${f(C30)},0.5,${f(-C30)},0.5,${f(o[0])},${f(o[1])})`; };
/** …on the y = max face (it faces the lower left): a along +x, b down */
export const onLeft = (x: number, y: number, z: number) => { const o = P(x, y, z); return `matrix(${f(C30)},0.5,0,1,${f(o[0])},${f(o[1])})`; };
/** …on the x = max face (it faces the lower right): a along −y, b down */
export const onRight = (x: number, y: number, z: number) => { const o = P(x, y, z); return `matrix(${f(C30)},-0.5,0,1,${f(o[0])},${f(o[1])})`; };

/** a hex colour darkened by k (0…1), for a block's sides */
export function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16), c = (v: number) => Math.round(v * (1 - k)).toString(16).padStart(2, "0");
  return `#${c((n >> 16) & 255)}${c((n >> 8) & 255)}${c(n & 255)}`;
}

/* ───────────────────────── motion ───────────────────────── */
type G = MotionCtx["gsap"];
const $$ = <T extends Element = SVGElement>(el: ParentNode, s: string) => [...el.querySelectorAll<T>(s)];

/** the build every drawing shares: floor, edges, faces, pieces, accents (svg[data-draw]); it plays once the drawing is well in view */
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
/** every svg[data-draw=""] in root (data-draw="self" is built by its section) builds as it arrives */
export function mountDraw(root: HTMLElement, { gsap, ScrollTrigger, reduced }: MotionCtx) {
  if (reduced) return;
  $$<SVGSVGElement>(root, "svg[data-draw='']").forEach((svg) => {
    const tl = buildTimeline(gsap, svg);
    ScrollTrigger.create({ trigger: svg, start: "top 88%", once: true, onEnter: () => tl.play() });
  });
}
