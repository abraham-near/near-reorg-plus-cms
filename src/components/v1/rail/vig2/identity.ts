/* The "identity" illustration ("Own your identity."): Figma TJ38G7245lEghviUBaCTFJ 918:299 ("P5 · editable"): a coin drops onto a signed document, and
 * the document's three arrows reach down to a dotted plate where three accounts light up green. Behind the vignette contract (./index.ts):
 * create(host) -> { el, set(a), idle(t, w), dispose() }.
 * The art: public/v1/vig2/identity.svg, the Figma export regrouped with hooks (pixel-identical at rest, minus the page backdrop): .p-lo (the lower plate's
 * faces, its inset outline and .p-dots, the 33 dots) · .p-gs (3 × .p-g: a green ring .p-gr and its dot) · .p-ar (3 × .p-a: a line .p-l, pathLength 1, and its
 * head .p-h) · .p-dl (the dotted verticals between the plates) · .p-up (the document plate: .p-upf faces, .p-fil its inset and lines, .p-sign, .p-check) ·
 * .p-ca (the arrow from the coin: .p-l, .p-h) · .p-coin.
 *
 * set(a), a in [0, 2] (A = the arrival 0..1, L = the leave 0..1):
 *   A .00-.30  the lower plate rises 22 units into place, fading in; its dots pop in, back to front (.08-.40)
 *   A .20-.46  the document plate comes down 30 units onto its place, fading in; the dotted verticals fade in under it (.30-.50)
 *   A .40-.62  the document's lines draw (fade + slide), then the signature (.50-.66) and the check (.60-.72)
 *   A .52-.74  the coin drops 36 units onto its place; its arrow draws down to the document (.64-.80) and its head lands
 *   A .74-.96  the three arrows draw down to the plate, left to right (.05 apart), and each lights its account (the green dot pops, the ring opens)
 *   L .00-.80  the leave, quicker, roughly the reverse: the coin lifts away; the arrows retract; the document lifts and fades; the plate sinks and fades.
 *   At a = 1 every transform is the identity and every opacity 1: the dom is exactly the Figma art.
 *
 * idle(t, w), additive on set(a)'s values: the coin floats 3 px on the vertical (4.4 s); the document breathes 1.6 px (5.2 s);
 * a green bead runs down each of the three arrows in turn (1.4 s apart) and its account pings (the ring swells and fades) as it lands; the check redraws
 * every 7 s. At w = 0 the offsets are back to zero and idle goes dormant.
 */
import type { Vignette } from "./index";
import { mountArt, q } from "./art";

const NS = "http://www.w3.org/2000/svg";
const cl = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const seg = (a: number, t0: number, t1: number) => cl((a - t0) / (t1 - t0));
const o3 = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t);
const io = (t: number) => t * t * (3 - 2 * t);
const back = (t: number) => { const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const TAU = Math.PI * 2;
const f2 = (n: number) => Math.round(n * 100) / 100;

type Rig = { set: (a: number) => void; idle: (t: number, w: number) => void };

export function create(host: HTMLElement): Vignette {
  let a = 0, R: Rig | null = null;
  const art = mountArt("identity", host, (svg) => {
    svg.removeAttribute("width"); svg.removeAttribute("height"); svg.setAttribute("preserveAspectRatio", "xMidYMax meet");
    svg.style.cssText = "display:block;width:100%;height:100%;overflow:visible";
    R = build(svg); R.set(a);
  });

  function build(svg: SVGSVGElement): Rig {
    const { $, $$ } = q(svg);
    /* writes only when the value changes */
    const memo = new WeakMap<Element, Record<string, string>>();
    const put = (n: Element, attr: string, v: string) => { let m = memo.get(n); if (!m) memo.set(n, (m = {})); if (m[attr] === v) return; m[attr] = v; if (v === "") n.removeAttribute(attr); else n.setAttribute(attr, v); };
    const op = (n: Element, v: number) => put(n, "opacity", v >= 1 ? "" : String(f2(Math.max(0, v))));
    const tr = (n: Element, x: number, y: number) => put(n, "transform", Math.abs(x) < 0.01 && Math.abs(y) < 0.01 ? "" : `translate(${f2(x)} ${f2(y)})`);
    const scl = (n: Element, k: number, cx: number, cy: number) => put(n, "transform", Math.abs(k - 1) < 0.001 ? "" : `translate(${f2(cx * (1 - k))} ${f2(cy * (1 - k))}) scale(${f2(k * 1000) / 1000})`);
    /* a stroke drawn by its dash (pathLength 1); none at rest */
    const draw = (n: Element, p: number) => { put(n, "stroke-dasharray", p >= 1 ? "" : "1 1"); put(n, "stroke-dashoffset", p >= 1 ? "" : String(f2((1 - p) * 1000) / 1000)); op(n, p > 0.002 ? 1 : 0); };
    const ell = (n: Element) => { const e = n as SVGEllipseElement; return [+e.getAttribute("cx")!, +e.getAttribute("cy")!]; };

    const lo = $(".p-lo"), dots = $$(".p-dots ellipse"), up = $(".p-up"), dl = $(".p-dl"), coin = $(".p-coin");
    const fil = $(".p-fil"), sign = $(".p-sign"), check = $(".p-check path");
    check.setAttribute("pathLength", "1"); $(".p-sign path").setAttribute("pathLength", "1");
    const signP = $(".p-sign path");
    const greens = $$(".p-g").map((g) => { const [ring, dot] = [...g.children] as Element[]; const [cx, cy] = ell(dot); return { g, ring, dot, cx, cy }; });
    const arrows = $$(".p-a").map((g) => ({ g, l: g.querySelector(".p-l")!, h: g.querySelector(".p-h")! }));
    const ca = { l: $(".p-ca .p-l"), h: $(".p-ca .p-h") };
    /* dots back to front: by their depth (y), the back corner first */
    const order = dots.map((d, i) => ({ i, y: ell(d)[1] })).sort((p, q2) => p.y - q2.y).map((p, k) => ({ n: dots[p.i], k }));
    /* the beads (idle): a green dot per arrow, running down its line; under the head */
    const beads = arrows.map(({ g, l }) => {
      const b = document.createElementNS(NS, "circle"); b.setAttribute("r", "1.8"); b.setAttribute("fill", "#00DC8D"); b.setAttribute("opacity", "0");
      g.insertBefore(b, g.querySelector(".p-h")); return { b, l: l as SVGGeometryElement };
    });
    let idleOn = false;

    function set(v: number) {
      const A = v <= 1 ? v : 1, L = v > 1 ? Math.min(1, v - 1) : 0;
      /* the lower plate */
      const loIn = o3(seg(A, 0, 0.3)), loOut = io(seg(L, 0.5, 0.8));
      tr(lo, 0, 22 * (1 - loIn) + 18 * loOut); op(lo, loIn * (1 - loOut));
      order.forEach(({ n, k }) => { const p = back(seg(A, 0.08 + (k / order.length) * 0.22, 0.18 + (k / order.length) * 0.22)); const [cx, cy] = ell(n); scl(n, Math.max(0.001, p), cx, cy); });
      /* the document plate and its verticals */
      const upIn = o3(seg(A, 0.2, 0.46)), upOut = io(seg(L, 0.3, 0.6));
      tr(up, 0, -30 * (1 - upIn) - 26 * upOut); op(up, upIn * (1 - upOut));
      op(dl, io(seg(A, 0.3, 0.5)) * (1 - io(seg(L, 0.25, 0.45))));
      const fl = o3(seg(A, 0.4, 0.62)); op(fil, fl); tr(fil, -6 * (1 - fl), 3.5 * (1 - fl));
      draw(signP, io(seg(A, 0.5, 0.66)));
      draw(check, io(seg(A, 0.6, 0.72)));
      op(sign, 1);
      /* the coin and its arrow */
      const cIn = o3(seg(A, 0.52, 0.74)), cOut = io(seg(L, 0, 0.3));
      tr(coin, 0, -36 * (1 - cIn) - 40 * cOut); op(coin, cIn * (1 - cOut));
      const caP = io(seg(A, 0.64, 0.8)) * (1 - io(seg(L, 0.04, 0.24)));
      draw(ca.l, caP); op(ca.h, caP > 0.95 ? 1 : 0);
      /* the three arrows and their accounts */
      arrows.forEach(({ l, h }, k) => {
        const p = io(seg(A, 0.74 + k * 0.05, 0.86 + k * 0.05)) * (1 - io(seg(L, 0.06 + (2 - k) * 0.04, 0.22 + (2 - k) * 0.04)));
        draw(l, p); op(h, p > 0.95 ? 1 : 0);
        const G = greens[k], gp = back(seg(A, 0.82 + k * 0.05, 0.94 + k * 0.05)) * (1 - io(seg(L, 0.1, 0.3)));
        scl(G.dot, Math.max(0.001, gp), G.cx, G.cy); op(G.ring, cl(gp));
      });
    }

    function idle(t: number, w: number) {
      if (w <= 0) {
        if (!idleOn) return;
        idleOn = false; beads.forEach(({ b }) => b.setAttribute("opacity", "0")); set(a); return;
      }
      idleOn = true;
      set(a);   /* the base, then the additive offsets on top */
      const fy = -3 * w * Math.sin((t / 4.4) * TAU);
      tr(coin, 0, fy);
      const by = -1.6 * w * Math.sin((t / 5.2) * TAU + 1.2);
      tr(up, 0, by);
      /* beads: one per arrow, 1.4 s apart, a 4.2 s cycle; each falls in .9 s, then its account pings */
      beads.forEach(({ b, l }, k) => {
        const ph = ((t - k * 1.4) % 4.2 + 4.2) % 4.2, u = ph / 0.9;
        if (u < 1) {
          const len = l.getTotalLength(), pt = l.getPointAtLength(len * io(u));
          b.setAttribute("cx", String(f2(pt.x))); b.setAttribute("cy", String(f2(pt.y + by))); b.setAttribute("opacity", String(f2(w * Math.min(1, u * 6, (1 - u) * 6))));
        } else b.setAttribute("opacity", "0");
        const G = greens[k], pg = u >= 1 ? cl((ph - 0.9) / 0.9) : 1;   /* the ping: the ring swells 70 % and fades back to its rest over .9 s */
        scl(G.ring, 1 + 0.7 * w * Math.sin(pg * Math.PI) * (1 - pg * 0.3), G.cx, G.cy); op(G.ring, 1 - 0.6 * w * Math.sin(pg * Math.PI));
      });
      /* the check redraws every 7 s */
      const cp = (t % 7) / 7;
      if (cp > 0.9) draw(check, io(seg(cp, 0.9, 1)));
    }

    return { set, idle };
  }

  return {
    el: art.el,
    set(v: number) { a = v; R?.set(v); },
    idle(t: number, w: number) { R?.idle(t, w); },
    dispose() { art.kill(); R = null; },
  };
}
