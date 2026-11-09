/* r17 v1 · the "assets" illustration ("Own your assets.", Figma 508:5715; the art: public/v1/vig2/assets.svg) behind the vignette contract (./index.ts).
 *
 * The art (classes in the svg): .a-floor (.a-floor-fill, two .a-edge halves, the dashed .a-grid); .a-stack > .a-p1, .a-p2, .a-p3 (the top slab .a-slab, the green
 * coin .a-coin-g with .a-green over its grey copy .a-green-base, the dashed swap arc .a-arc, the grey coin .a-coin-s); .a-tag (with its green .a-tag-dot).
 *
 * Motion (a = the playhead):
 *   arrival 0 -> 1   .02-.20 the floor's edges draw from its back corner, its fill comes up;  .05-.36 the grid's lines draw from the back edges, staggered;
 *                    .14-.30 the stack arrives as ONE slab (settling down 8 units);  .24-.56 the slabs separate upward along the art's own stacking axis
 *                    (the top one leads, so no slab passes through another);  .48-.62 the grey coin sits;  .58-.76 the swap arc draws from it to the green coin;
 *                    .68-.82 the green coin lands (still grey);  .76-.90 its face lights green (a wipe from the arc's side);  .80-.93 the SWAP tag pops
 *                    (scale .9 -> 1 + fade), its green dot last (.86-.95).
 *   rest     1       exactly the Figma art (no masks, no clip, identity transforms).
 *   leave    1 -> 2  faster, lifting away: the tag (1.00-1.20), the green coin lifts (1.04-1.28), the arc retracts to the grey coin (1.02-1.14), the grey coin
 *                    lifts (1.14-1.36), the slabs fold back into one (1.14-1.46), the slab lifts and fades (1.36-1.64), the floor fades (1.42-1.72).
 *   idle(t, w)       the two upper slabs breathe 1 px along the stacking axis (4.6 s, out of phase); the green coin hovers 1 px (2.8 s); the arc's dashes flow
 *                    from the grey coin to the green one (one dash period every 1.6 s). Additive on set(a)'s state; at w = 0 the dom is exactly set(a)'s.
 * set(a) is allocation free: cached refs and SVGTransforms, a write cache, only transforms, opacity and stroke-dashoffset (masks / clip are attached only
 * while something is mid-draw: a state change, not a per-frame write). */
import type { Vignette } from "./index";
import { mountArt, liveTf, q } from "./art";

const NS = "http://www.w3.org/2000/svg";
const cl = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const seg = (a: number, t0: number, t1: number) => cl((a - t0) / (t1 - t0));
const out3 = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t);
const io2 = (t: number) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));
const TAU = Math.PI * 2;
/* the stacking offsets at rest (svg units): plate_2 sits (12, -48) above plate, the top slab (26.75, -96.5) */
const D2X = 12, D2Y = -48, D3X = 26.75, D3Y = -96.5;
const UX = D3X / Math.hypot(D3X, D3Y), UY = D3Y / Math.hypot(D3X, D3Y);   /* the stacking axis (up) */
const TAG_CX = 336.66, TAG_CY = 18.95;                                     /* the tag's centre (its rect 299.3..374.1 x 4.7..33.2) */
const GREEN_X0 = 253.5;                                                    /* the green face's left edge: the wipe's origin */
let UID = 0;

type Stroke = { e: SVGPathElement; len: number; da: string; s: number; k?: number };
type Mover = { e: SVGGraphicsElement; tf: SVGTransform; bx: number; by: number };

export function create(host: HTMLElement): Vignette {
  const u = ++UID;
  let a = 0, SPU = 1;
  let R: {
    svg: SVGSVGElement; M: DOMMatrix;
    floor: SVGGraphicsElement; fill: SVGGraphicsElement; edges: Stroke[]; grid: SVGGraphicsElement; gl: Stroke[]; gmUrl: string; gOn: number; line: SVGGraphicsElement;
    stack: Mover; p2: Mover; p3: Mover; cs: Mover; cg: Mover; tag: Mover;
    dot: SVGGraphicsElement; green: SVGGraphicsElement; base: SVGGraphicsElement; crt: SVGTransform; cpUrl: string; cOn: number;
    arc: SVGPathElement; amp: Stroke; amUrl: string; aOn: number;
    vis: number; idleOn: number; dashOn: number;
  } | null = null;

  function build(svg: SVGSVGElement) {
    svg.removeAttribute("width"); svg.removeAttribute("height");
    svg.setAttribute("preserveAspectRatio", "xMidYMax meet");
    const { $, $$ } = q(svg);
    const live = (g: SVGGraphicsElement) => { const l = g.transform.baseVal; l.initialize(svg.createSVGTransform()); return l.getItem(0); };
    const M = svg.createSVGMatrix();
    const defs = svg.insertBefore(document.createElementNS(NS, "defs"), svg.firstChild);
    /* a drawable stroke: one dash as long as the path (lengths from the d itself: every path drawn here is an absolute M/L polyline, so no layout and no
       pathLength, whose dash scaling is unreliable in masks), its offset = len (hidden) ... 0 (drawn) */
    const dr = (e: SVGPathElement): Stroke => { const n = e.getAttribute("d")!.match(/-?[\d.]+(?:e-?\d+)?/g)!.map(Number); let len = 0; for (let i = 2; i + 1 < n.length; i += 2) len += Math.hypot(n[i] - n[i - 2], n[i + 1] - n[i - 1]); const da = `${len.toFixed(2)} ${(len * 2 + 2).toFixed(2)}`; e.setAttribute("stroke-dasharray", da); return { e, len, da, s: NaN }; };
    const mkPath = (d: string, w: number) => { const p = document.createElementNS(NS, "path"); p.setAttribute("d", d); p.setAttribute("fill", "none"); p.setAttribute("stroke", "#fff"); p.setAttribute("stroke-width", String(w)); p.setAttribute("stroke-linecap", "butt"); const q = dr(p); p.setAttribute("stroke-dashoffset", q.len.toFixed(2)); return q; };
    const mkMask = (nm: string) => { const m = document.createElementNS(NS, "mask"); m.setAttribute("id", `v2a${u}${nm}`); m.setAttribute("maskUnits", "userSpaceOnUse"); m.setAttribute("x", "-60"); m.setAttribute("y", "-60"); m.setAttribute("width", "509"); m.setAttribute("height", "426"); defs.appendChild(m); return m; };

    /* the floor grid draws through a mask: one white line per grid line, its dash offset running 1 -> 0 (the lines start on the back edges) */
    const grid = $(".a-grid"), gm = mkMask("g");
    const gl = grid.getAttribute("d")!.split("M").filter(Boolean).map((d, i) => { const q = mkPath("M" + d, 3); gm.appendChild(q.e); q.k = i % 9; return q; });
    /* the swap arc draws through a mask the same way (the path itself is dashed: its own dash offset is left to the idle flow) */
    const arc = $<SVGPathElement>(".a-arc"), am = mkMask("a"), amp = mkPath(arc.getAttribute("d")!, 6); am.appendChild(amp.e);
    /* the green face wipes in through a clip: a rect scaled in x from the face's left edge */
    const cp = document.createElementNS(NS, "clipPath"), cr = document.createElementNS(NS, "rect");
    cp.setAttribute("id", `v2a${u}c`); cp.setAttribute("clipPathUnits", "userSpaceOnUse");
    cr.setAttribute("x", String(GREEN_X0)); cr.setAttribute("y", "24"); cr.setAttribute("width", "44"); cr.setAttribute("height", "40"); cp.appendChild(cr); defs.appendChild(cp);

    const g = (s: string): Mover => { const e = $(s); return { e, tf: live(e), bx: 0, by: 0 }; };
    R = {
      svg, M,
      floor: $(".a-floor"), fill: $(".a-floor-fill"), edges: $$<SVGPathElement>(".a-edge").map(dr), grid, gl, gmUrl: `url(#v2a${u}g)`, gOn: -1, line: $(".a-floor-line"),
      stack: g(".a-stack"), p2: g(".a-p2"), p3: g(".a-p3"), cs: g(".a-coin-s"), cg: g(".a-coin-g"), tag: g(".a-tag"),
      dot: $(".a-tag-dot"), green: $(".a-green"), base: $(".a-green-base"), crt: liveTf(svg, cr), cpUrl: `url(#v2a${u}c)`, cOn: -1,
      arc, amp, amUrl: `url(#v2a${u}a)`, aOn: -1,
      vis: -1, idleOn: 0, dashOn: 0,
    };
  }

  /* ── writes (cached: nothing is written when the value has not moved) ── */
  const OP = new WeakMap<Element, number>();
  const op = (e: Element, v: number) => { const o = OP.get(e); if (o !== undefined && Math.abs(o - v) < 1e-3) return; OP.set(e, v); e.setAttribute("opacity", String(v < 1e-3 ? 0 : v > 0.999 ? 1 : +v.toFixed(3))); };
  const tr = (q: Mover, x: number, y: number) => { q.tf.setTranslate(x, y); };
  const dash = (q: Stroke, f: number) => { const v = q.len * f; if (Math.abs(q.s - v) < 1e-3) return; q.s = v; q.e.setAttribute("stroke-dashoffset", String(+v.toFixed(3))); };   /* f: the hidden fraction */
  const att = (e: Element, name: string, on: boolean, url: string) => { if (on) e.setAttribute(name, url); else e.removeAttribute(name); };

  function apply() {
    if (!R) return;
    const v = a > 0 && a < 2 ? 1 : 0;
    if (v !== R.vis) { R.vis = v; R.svg.style.visibility = v ? "visible" : "hidden"; }
    const L = a > 1 ? a - 1 : 0, A = a < 1 ? a : 1;   /* L: the leave's progress (0 on arrival), A: the arrival's (1 once arrived) */

    /* the floor */
    const fe = out3(seg(A, 0.02, 0.2)), ff = seg(A, 0.02, 0.16), fo = 1 - seg(L, 0.42, 0.72);
    op(R.floor, fo); op(R.fill, ff);
    const eFull = fe >= 1 ? 1 : 0;                           /* drawn: the closed outline (the Figma path) replaces the two drawing halves */
    op(R.line, eFull);
    for (let n = 0; n < R.edges.length; n++) { const q = R.edges[n]; dash(q, 1 - fe); op(q.e, fe > 0.002 && !eFull ? 1 : 0); }
    let gAll = 1;
    for (let n = 0; n < R.gl.length; n++) { const q = R.gl[n], k = q.k ?? 0, d = out3(seg(A, 0.05 + 0.019 * k, 0.21 + 0.019 * k)); if (d < 1) gAll = 0; dash(q, 1 - d); }
    if (gAll !== R.gOn) { R.gOn = gAll; att(R.grid, "mask", !gAll, R.gmUrl); }

    /* the stack: arrives as one slab, separates, folds back, lifts away */
    const sa = out3(seg(A, 0.14, 0.3)), sl = io2(seg(L, 0.36, 0.64));
    R.stack.by = -8 * (1 - sa) - 12 * sl; tr(R.stack, 0, R.stack.by); op(R.stack.e, seg(A, 0.14, 0.22) * (1 - seg(L, 0.4, 0.64)));
    const e3 = out3(seg(A, 0.24, 0.54)) * (1 - io2(seg(L, 0.2, 0.46))), e2 = out3(seg(A, 0.28, 0.56)) * (1 - io2(seg(L, 0.14, 0.4)));
    R.p3.bx = -D3X * (1 - e3); R.p3.by = -D3Y * (1 - e3); R.p2.bx = -D2X * (1 - e2); R.p2.by = -D2Y * (1 - e2);
    tr(R.p3, R.p3.bx, R.p3.by); tr(R.p2, R.p2.bx, R.p2.by);

    /* the grey coin sits */
    const cs = out3(seg(A, 0.48, 0.62)), csl = seg(L, 0.14, 0.36);
    R.cs.by = -12 * (1 - cs) - 14 * out3(csl); tr(R.cs, 0, R.cs.by); op(R.cs.e, cs * (1 - csl));

    /* the swap arc draws from the grey coin to the green one (and retracts on the leave) */
    const ad = io2(seg(A, 0.58, 0.76)) * (1 - io2(seg(L, 0.02, 0.14)));
    dash(R.amp, 1 - ad);
    const aFull = ad >= 1 ? 1 : 0; if (aFull !== R.aOn) { R.aOn = aFull; att(R.arc, "mask", !aFull, R.amUrl); }
    op(R.arc, ad > 0.002 ? 1 : 0);

    /* the green coin lands, then lights green */
    const cg = out3(seg(A, 0.68, 0.82)), cgl = seg(L, 0.04, 0.28);
    R.cg.by = -14 * (1 - cg) - 18 * out3(cgl); tr(R.cg, 0, R.cg.by); op(R.cg.e, cg * (1 - cgl));
    const gw = io2(seg(A, 0.76, 0.9));
    R.M.a = gw; R.M.b = 0; R.M.c = 0; R.M.d = 1; R.M.e = GREEN_X0 * (1 - gw); R.M.f = 0; R.crt.setMatrix(R.M);
    const gFull = gw >= 1 ? 1 : 0; if (gFull !== R.cOn) { R.cOn = gFull; att(R.green, "clip-path", !gFull, R.cpUrl); }
    op(R.green, gw > 0.002 ? 1 : 0); op(R.base, gFull ? 0 : 1);

    /* the tag pops last (and leaves first) */
    const tp = out3(seg(A, 0.8, 0.93)), tl = seg(L, 0, 0.2), z = (0.9 + 0.1 * tp) * (1 - 0.06 * tl);
    R.M.a = z; R.M.d = z; R.M.e = TAG_CX * (1 - z); R.M.f = TAG_CY * (1 - z) - 6 * out3(tl); R.tag.tf.setMatrix(R.M);
    op(R.tag.e, tp * (1 - tl)); op(R.dot, seg(A, 0.86, 0.95));
    R.idleOn = 1;                                              /* set() rewrote the base state: idle re-applies its offsets on its next call */
  }

  function idle(t: number, w: number) {
    if (!R) return;
    w = +w; w = w > 0 ? (w > 1 ? 1 : w) : 0; t = +t || 0;
    if (w === 0) {
      if (!R.idleOn) return;                                   /* dormant: the dom is set(a)'s */
      tr(R.p2, R.p2.bx, R.p2.by); tr(R.p3, R.p3.bx, R.p3.by); tr(R.cg, 0, R.cg.by);
      if (R.dashOn) { R.arc.removeAttribute("stroke-dashoffset"); R.dashOn = 0; }
      R.idleOn = 0; return;
    }
    const A1 = SPU * w;                                        /* 1 screen px */
    const o2 = A1 * (0.5 - 0.5 * Math.cos(TAU * t / 4.6 + 0.9)), o3 = A1 * (0.5 - 0.5 * Math.cos(TAU * t / 4.6 + 1.8));
    tr(R.p2, R.p2.bx + UX * o2, R.p2.by + UY * o2); tr(R.p3, R.p3.bx + UX * o3, R.p3.by + UY * o3);
    tr(R.cg, 0, R.cg.by - A1 * (0.5 - 0.5 * Math.cos(TAU * t / 2.8)));
    const f = t / 1.6 - Math.floor(t / 1.6);
    R.arc.setAttribute("stroke-dashoffset", (-6.4 * f * w).toFixed(2)); R.dashOn = 1;
    R.idleOn = 1;
  }

  const art = mountArt("assets", host, (s) => { build(s); apply(); });
  /* svg units per css px (the art is contained): for the idle's screen-constant amplitudes */
  art.observe(art.el, (w, h) => { if (w > 0 && h > 0) SPU = 1 / Math.min(w / 389, h / 306); });

  return {
    el: art.el,
    set(v) { if (art.dead()) return; v = +v; a = v === v ? (v < 0 ? 0 : v > 2 ? 2 : v) : 0; apply(); },
    idle,
    dispose() { art.kill(); R = null; },
  };
}
