/* r17 v1 · the "identity" illustration ("Own your identity.": the key, the four chains, the plate with its green slot, the 35+ CHAINS tag), behind the
 * vignette contract (./index.ts): create(host) -> { el, set(a), idle(t, w), dispose() }.
 * The art: public/v1/vig2/identity.svg, the Figma export (TJ38G7245lEghviUBaCTFJ 521:6785) regrouped so its parts can move (pixel-identical at rest to the raw
 * export minus the Figma page backdrop): .i-floor (slab fill, slab outline, dotted grid) · .i-plate (faces, the green .i-green, the four sockets) · .i-plane
 * (the dashed plane: fill + outline) · .i-arrows (line + head per chain) · 4 × .i-tank · .i-key (key, ring, network lines .i-nl, nodes .i-nd) · .i-tag.
 *
 * set(a), a in [0, 2] (A = the arrival 0..1, L = the leave 0..1):
 *   A .02-.31  the floor: its fill fades in, its outline draws, the dotted grid draws from the back edges to the front (two families together, staggered)
 *   A .14-.36  the base plate lands: comes down 26 units onto the floor (out3), fading in over its first half
 *   A .26-.48  the dashed plane draws (its outline through a mask), its fill fades in under it
 *   A .36-.80  the four chains drop in, left to right (.075 apart): each comes down 34 units to its place, then its arrow draws down to its socket and the
 *              head lands; the green slot wipes along its long iso axis (A .43-.81, linear) so its front reaches each socket as that arrow lands
 *   A .50-.80  the key slides in tip-first along its shaft's iso axis (36 units); its ring draws (.62-.80); the network's nodes pop in, centre first
 *              then round the hexagon (.66-.85), the spokes draw out from the centre (.70-.84) and the hexagon closes (.76-.88)
 *   A .80-.96  the 35+ CHAINS tag pops (scale .9 -> 1, fade), its green dot fills in last (.86-.96)
 *   L .00-.80  the leave, quicker, roughly the reverse: the tag goes (0-.16); the key slides on out along its axis and fades (.06-.40); the arrows retract
 *              into their sockets, last chain first (.04-.30) and the heads go; the chains lift away, last first (.08-.49); the green unwipes (.22-.48); the
 *              plane lifts and fades (.30-.56); the plate lifts and fades (.40-.70); the floor fades (.50-.80). a = 2: hidden.
 *   At a = 1 every transform is the identity, every opacity 1, every mask removed: the dom is exactly the Figma art.
 *
 * idle(t, w), additive on set(a)'s values: the dashed plane and the key breathe 1 px along the iso vertical (4.6 s, out of phase); the four chains bob .6 px
 * (3.2 s, out of phase); a pulse travels the key's network (each node swells 30 % in turn, .32 s apart, centre first); a flat paper glint runs along the
 * green slot every 4.2 s. At w = 0 the offsets are written back to zero once and idle goes dormant.
 */
import type { Vignette } from "./index";
import { mountArt, liveTf, q } from "./art";

const NS = "http://www.w3.org/2000/svg";
const cl = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const seg = (a: number, t0: number, t1: number) => cl((a - t0) / (t1 - t0));
const o3 = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t);
const o2 = (t: number) => 1 - (1 - t) * (1 - t);
const io = (t: number) => t * t * (3 - 2 * t);
const TAU = Math.PI * 2;
const VW = 495, VH = 328;
const KU = [0.866, -0.5];                                   /* the key's shaft: the 30° iso axis, toward its tip */
let UID = 0;

type Rig = { set: (a: number) => void; idle: (t: number, w: number) => void };

export function create(host: HTMLElement): Vignette {
  let a = 0, R: Rig | null = null, SPU = VW / 400;           /* SPU: svg units per css px (contain), from a ResizeObserver: no layout reads in set() */

  const art = mountArt("identity", host, (svg) => {
    svg.removeAttribute("width"); svg.removeAttribute("height"); svg.setAttribute("preserveAspectRatio", "xMidYMax meet");
    svg.style.cssText = "display:block;width:100%;height:100%;overflow:visible";
    R = build(svg); R.set(a);
  });
  art.observe(art.el, (w, h) => { if (w > 0 && h > 0) SPU = 1 / Math.min(w / VW, h / VH); });

  function build(svg: SVGSVGElement): Rig {
    const u = ++UID, { $, $$ } = q(svg);
    const id = (n: string) => `v2i${u}${n}`;
    const live = (n: SVGGraphicsElement) => liveTf(svg, n);
    const MX = svg.createSVGMatrix();
    /* write caches: a value is written only when it changes */
    const SL = new Float64Array(512).fill(NaN); let nS = 0;
    const slot = (n = 1) => { const s = nS; nS += n; return s; };
    const W = (s: number, n: Element, attr: string, v: number) => { const o = SL[s]; if (o === v || (o === o && v !== 0 && v !== 1 && Math.abs(o - v) < 1e-4)) return; SL[s] = v; n.setAttribute(attr, String(v)); };   /* the end values (0, 1) are always written exactly */
    const TM = (s: number, t: SVGTransform, ma: number, mb: number, mc: number, md: number, me: number, mf: number) => {
      if (SL[s] === ma && SL[s + 1] === mb && SL[s + 2] === mc && SL[s + 3] === md && SL[s + 4] === me && SL[s + 5] === mf) return;
      SL[s] = ma; SL[s + 1] = mb; SL[s + 2] = mc; SL[s + 3] = md; SL[s + 4] = me; SL[s + 5] = mf;
      MX.a = ma; MX.b = mb; MX.c = mc; MX.d = md; MX.e = me; MX.f = mf; t.setMatrix(MX);
    };
    type Part = { n: SVGGraphicsElement; t: SVGTransform; s: number; so: number };
    type Line = { n: SVGGraphicsElement; s: number; so: number };
    const part = (n: SVGGraphicsElement): Part => ({ n, t: live(n), s: slot(6), so: slot() });
    const tr = (P: Part, x: number, y: number) => TM(P.s, P.t, 1, 0, 0, 1, x, y);
    const sc = (P: Part, k: number, cx: number, cy: number) => TM(P.s, P.t, k, 0, 0, k, cx * (1 - k), cy * (1 - k));
    const op = (P: Part, v: number) => W(P.so, P.n, "opacity", v);
    /* a drawn stroke (pathLength 1, dasharray 1 1): p 0 -> 1 draws it; gated to opacity 0 at p = 0 (a zero-length round-capped dash would leave a dot) */
    const line = (n: SVGGraphicsElement): Line => ({ n, s: slot(), so: slot() });
    const draw = (Q: Line, p: number) => { W(Q.s, Q.n, "stroke-dashoffset", 1 - p); W(Q.so, Q.n, "opacity", p > 0.0005 ? 1 : 0); };
    /* a mask whose white strokes draw: the dotted grid, the dashed plane, the ring (dashed / closed strokes can't draw by their own dash offset);
       removed once fully drawn so the resting art is untouched */
    const defs = svg.insertBefore(document.createElementNS(NS, "defs"), svg.firstChild);
    type Mask = { target: Element; url: string; ls: Line[]; on: number };
    const mkMask = (target: Element, ds: string[], sw: number): Mask => {
      const m = document.createElementNS(NS, "mask"); m.setAttribute("id", id("m" + defs.children.length));
      m.setAttribute("maskUnits", "userSpaceOnUse"); m.setAttribute("x", "-300"); m.setAttribute("y", "-300"); m.setAttribute("width", String(VW + 600)); m.setAttribute("height", String(VH + 600));
      const ls = ds.map((d) => { const p = document.createElementNS(NS, "path"); p.setAttribute("d", d); p.setAttribute("fill", "none"); p.setAttribute("stroke", "#fff"); p.setAttribute("stroke-width", String(sw));
        p.setAttribute("stroke-linecap", "round"); p.setAttribute("stroke-linejoin", "round"); p.setAttribute("pathLength", "1"); p.setAttribute("stroke-dasharray", "1 1"); m.appendChild(p); return line(p); });
      defs.appendChild(m);
      return { target, url: `url(#${m.getAttribute("id")})`, ls, on: -1 };
    };
    const maskOn = (M: Mask, v: number) => { if (v === M.on) return; M.on = v; if (v) M.target.setAttribute("mask", M.url); else M.target.removeAttribute("mask"); };
    const nums = (d: string) => d.match(/-?\d+\.?\d*/g)!.map(Number);

    /* ── the parts ── */
    const floor = part($(".i-floor")), slab = part($(".i-slab")), slabLn = line($(".i-slab-ln"));
    const gridEl = $(".i-grid"), gridD: string[] = [], re = /M([-\d.]+) ([-\d.]+)L([-\d.]+) ([-\d.]+)/g; let mm: RegExpExecArray | null;
    while ((mm = re.exec(gridEl.getAttribute("d")!))) gridD.push(`M${mm[1]} ${mm[2]}L${mm[3]} ${mm[4]}`);
    const grid = mkMask(gridEl, gridD, 3.5), NG = gridD.length, HG = NG >> 1;   /* two families of 9: [0, 9) and [9, 18), each from the back edge to the front */
    const plate = part($(".i-plate"));
    const greenEl = $(".i-green"), green = part(greenEl);
    const gp = nums(greenEl.getAttribute("d")!);
    const O = [gp[0], gp[1]], GU = [gp[2] - gp[0], gp[3] - gp[1]], GV = [gp[6] - gp[0], gp[7] - gp[1]];   /* the slot: corner O, long axis GU, short axis GV */
    const det = GU[0] * GV[1] - GU[1] * GV[0], r1 = [GV[1] / det, -GV[0] / det], r1O = r1[0] * O[0] + r1[1] * O[1];
    /* the wipe: scale by s along GU in the (GU, GV) basis about the short edge at O, so the slot grows as a parallelogram from its lower-left end */
    const wipe = (s: number) => { const k = s - 1; TM(green.s, green.t, 1 + k * GU[0] * r1[0], k * GU[1] * r1[0], k * GU[0] * r1[1], 1 + k * GU[1] * r1[1], -k * GU[0] * r1O, -k * GU[1] * r1O); };
    /* the glint: a paper band along GV, clipped to the slot, swept along GU (opacity 0 unless idle) */
    const cp = document.createElementNS(NS, "clipPath"); cp.setAttribute("id", id("c")); { const p = document.createElementNS(NS, "path"); p.setAttribute("d", greenEl.getAttribute("d")!); cp.appendChild(p); } defs.appendChild(cp);
    const BW = 0.14, pt = (al: number, be: number) => `${(O[0] + al * GU[0] + be * GV[0]).toFixed(2)} ${(O[1] + al * GU[1] + be * GV[1]).toFixed(2)}`;
    const gg = document.createElementNS(NS, "g"); gg.setAttribute("clip-path", `url(#${id("c")})`);
    const band = document.createElementNS(NS, "path"); band.setAttribute("d", `M${pt(-BW, -0.3)}L${pt(0, -0.3)}L${pt(0, 1.3)}L${pt(-BW, 1.3)}Z`); band.setAttribute("class", "i-glint"); band.setAttribute("fill", "#F5F5F5"); band.setAttribute("opacity", "0");
    gg.appendChild(band); greenEl.parentNode!.insertBefore(gg, greenEl.nextSibling);
    const glint = part(band);
    const plane = part($(".i-plane")), planeF = part($(".i-plane-f")), planeLnEl = $(".i-plane-ln");
    const planeM = mkMask(planeLnEl, [planeLnEl.getAttribute("d")!], 6);
    const arrows = $$(".i-al").map((n) => { const v = nums(n.getAttribute("d")!); return { L: part(n), y0: v[1], y1: v[2], H: null as Part | null }; });
    $$(".i-ah").forEach((n, k) => { arrows[k].H = part(n); });
    const tanks = $$(".i-tank").map(part);
    const key = part($(".i-key")), ringEl = $(".i-ring"), ringM = mkMask(ringEl, [ringEl.getAttribute("d")!], 4);
    const nls = $$(".i-nl").map(line);                         /* six spokes (from the centre node out) + the hexagon */
    const nodes = $$(".i-nd").map((n) => ({ ...part(n), cx: +(n.dataset.cx ?? 0), cy: +(n.dataset.cy ?? 0) }));
    const tagEl = $(".i-tag"), tag = part(tagEl), TCX = +(tagEl.dataset.cx ?? 0), TCY = +(tagEl.dataset.cy ?? 0);
    const tdotEl = $(".i-tdot"), tdot = part(tdotEl), DCX = +(tdotEl.dataset.cx ?? 0), DCY = +(tdotEl.dataset.cy ?? 0);

    /* ── the bases set() computes and the offsets idle() adds ── */
    let planeY = 0, keyD = 0, offPlane = 0, offKey = 0;
    const keyY = 0;
    const tankY = new Float64Array(4), offTank = new Float64Array(4), nodeK = new Float64Array(nodes.length), offNode = new Float64Array(nodes.length);
    const wPlane = () => tr(plane, 0, planeY + offPlane);
    const wKey = () => tr(key, KU[0] * keyD, KU[1] * keyD + keyY + offKey);
    const wTank = (k: number) => tr(tanks[k], 0, tankY[k] + offTank[k]);
    const wNode = (q: number) => { const N = nodes[q], k = nodeK[q] * (1 + offNode[q]); sc(N, k < 0.001 ? 0.001 : k, N.cx, N.cy); op(N, nodeK[q] > 0.001 ? 1 : 0); };

    let vis = -1, last = NaN;
    function set(v: number) {
      if (v === last) return; last = v;
      const A = v < 1 ? v : 1, L = v > 1 ? v - 1 : 0;
      const sh = v > 0 && v < 2 ? 1 : 0;
      if (sh !== vis) { vis = sh; svg.style.visibility = sh ? "visible" : "hidden"; }

      /* floor */
      op(floor, 1 - seg(L, 0.5, 0.8));
      op(slab, seg(A, 0.02, 0.16));
      draw(slabLn, o3(seg(A, 0.02, 0.24)));
      let gDone = 1;
      for (let i = 0; i < NG; i++) { const j = i < HG ? i : i - HG, p = o3(seg(A, 0.04 + 0.016 * j, 0.18 + 0.016 * j)); if (p < 1) gDone = 0; draw(grid.ls[i], p); }
      maskOn(grid, gDone ? 0 : 1);

      /* plate */
      { const p = o3(seg(A, 0.14, 0.36)), q = seg(L, 0.4, 0.7); tr(plate, 0, -26 * (1 - p) - 20 * q * q); op(plate, seg(A, 0.14, 0.25) * (1 - q)); }

      /* dashed plane */
      { const p = o3(seg(A, 0.26, 0.48)), q = seg(L, 0.3, 0.56); draw(planeM.ls[0], p); maskOn(planeM, p < 1 ? 1 : 0);
        op(planeF, seg(A, 0.32, 0.48)); op(plane, 1 - q); planeY = -16 * q * q; wPlane(); }

      /* the chains, their arrows, the green slot */
      for (let k = 0; k < 4; k++) {
        const t0 = 0.36 + 0.075 * k, p = o3(seg(A, t0, t0 + 0.16)), r = 3 - k;
        const q = seg(L, 0.08 + 0.05 * r, 0.34 + 0.05 * r);
        tankY[k] = -34 * (1 - p) - 30 * q * q; wTank(k); op(tanks[k], seg(A, t0, t0 + 0.08) * (1 - q));
        const Ar = arrows[k], d = o3(seg(A, t0 + 0.11, t0 + 0.21)), x = io(seg(L, 0.04 + 0.04 * r, 0.18 + 0.04 * r));
        /* the line grows down from the chain (scale about its top); on the leave it retracts into its socket (scale about its bottom) */
        if (x > 0) { const s = 1 - x; TM(Ar.L.s, Ar.L.t, 1, 0, 0, s < 0.001 ? 0.001 : s, 0, Ar.y1 * (1 - s)); op(Ar.L, s > 0.001 ? 1 : 0); }
        else { TM(Ar.L.s, Ar.L.t, 1, 0, 0, d < 0.001 ? 0.001 : d, 0, Ar.y0 * (1 - d)); op(Ar.L, d > 0.001 ? 1 : 0); }
        const h = o2(seg(A, t0 + 0.18, t0 + 0.21));
        if (Ar.H) { tr(Ar.H, 0, -4 * (1 - h)); op(Ar.H, h * (1 - seg(L, 0.14 + 0.04 * r, 0.22 + 0.04 * r))); }
      }
      { const s = seg(A, 0.43, 0.81) * (1 - io(seg(L, 0.22, 0.48))); wipe(s < 0.001 ? 0.001 : s); op(green, s > 0.001 ? 1 : 0); }

      /* the key: slides in tip-first along its axis, its ring draws, its network's nodes pop and connect */
      { const p = o3(seg(A, 0.5, 0.8)), q = seg(L, 0.06, 0.4);
        keyD = -36 * (1 - p) + 44 * q * q; wKey(); op(key, seg(A, 0.5, 0.62) * (1 - seg(L, 0.14, 0.4)));
        const rp = o3(seg(A, 0.62, 0.8)); draw(ringM.ls[0], rp); maskOn(ringM, rp < 1 ? 1 : 0);
        for (let qn = 0; qn < nodes.length; qn++) { const t0 = 0.66 + 0.02 * qn; nodeK[qn] = o3(seg(A, t0, t0 + 0.07)); wNode(qn); }
        for (let i = 0; i < nls.length; i++) draw(nls[i], i < 6 ? o3(seg(A, 0.7 + 0.01 * i, 0.78 + 0.01 * i)) : io(seg(A, 0.76, 0.88))); }

      /* the tag */
      { const p = o3(seg(A, 0.8, 0.93)), q = seg(L, 0, 0.16), k = (0.9 + 0.1 * p) * (1 - 0.04 * q);
        sc(tag, k, TCX, TCY); op(tag, p * (1 - q));
        const dp = o3(seg(A, 0.86, 0.96)); sc(tdot, dp < 0.001 ? 0.001 : dp, DCX, DCY); op(tdot, dp > 0.001 ? 1 : 0); }
    }

    let dormant = 1;
    function idle(t: number, w: number) {
      w = +w; w = w > 0 ? (w > 1 ? 1 : w) : 0; t = +t || 0;
      if (w === 0 && dormant) return;
      const px = SPU * w;
      offPlane = -1.0 * px * (0.5 - 0.5 * Math.cos(TAU * t / 4.6)); wPlane();
      offKey = -1.0 * px * (0.5 - 0.5 * Math.cos(TAU * t / 4.6 + 2.2)); wKey();
      for (let k = 0; k < 4; k++) { offTank[k] = -0.6 * px * (0.5 - 0.5 * Math.cos(TAU * t / 3.2 + 0.8 * k)); wTank(k); }
      /* the pulse: centre node, then round the hexagon, .32 s apart, each swelling over .5 s; then a 1.2 s rest */
      const n = nodes.length, P = n * 0.32 + 1.2, c = (t % P + P) % P;
      for (let q = 0; q < n; q++) { const d = c - q * 0.32, e = d > 0 && d < 0.5 ? Math.sin(Math.PI * d / 0.5) : 0; offNode[q] = 0.3 * e * w; wNode(q); }
      /* the glint: crosses the slot over .9 s, every 4.2 s */
      { const g = (t % 4.2 + 4.2) % 4.2, k = g < 0.9 ? g / 0.9 : 1, on = g < 0.9 ? Math.sin(Math.PI * k) : 0, f = (1 + BW) * k;
        if (w > 0) tr(glint, GU[0] * f, GU[1] * f); else tr(glint, 0, 0); op(glint, 0.45 * on * w); }
      dormant = w === 0 ? 1 : 0;
    }
    return { set, idle };
  }

  return {
    el: art.el,
    set(v) { if (art.dead()) return; v = +v; if (!(v === v)) v = 0; a = v < 0 ? 0 : v > 2 ? 2 : v; if (R) R.set(a); },
    idle(t, w) { if (R && !art.dead()) R.idle(t, w); },
    dispose() { art.kill(); R = null; },
  };
}
