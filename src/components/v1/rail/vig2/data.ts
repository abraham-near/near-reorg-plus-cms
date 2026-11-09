/* r17 v1 · the "data" illustration ("Own your data.": three locked document plates over a dashed iso floor, a PRIVATE tag) behind the vignette contract (./index.ts).
 * The art: public/v1/vig2/data.svg (Figma 501:4977, unchanged but for its ids, prefixed v2d- so they can't clash with the page's); this module restructures it
 * once on load (resting look identical):
 *   the floor diamond is split into a fill and a drawn edge (pathLength 1); the dashed grid gets a mask of 20 solid lines that draw (dashoffset);
 *   the three plates are wrapped in one group (they fade as one slab, no see-through); the lines get pathLength 1; every dot / green keyhole gets a live matrix.
 * Motion (a = the rail's playhead):
 *   arrive  .02-.20  the floor's edge draws from its back vertex, its fill fades in; .06-.32 the dashed grid draws from the two back edges forward (staggered)
 *           .12-.36  one collapsed slab (the three plates stacked on the bottom one) fades in, settling 14 px down the iso vertical
 *           .28-.60  the plates separate upward from the slab (top first, power3.out)
 *           .48-.70  each plate's title / rule lines draw (top plate first)
 *           .52-.84  the dotted rows fill in, typed row by row, left to right (each dot fades + grows .3 -> 1), the top plate leading
 *           .68-.80  the locks' shackles drop shut (2.4 px); .74-.88 the keyholes light green (fade + grow)
 *           .84-.97  the PRIVATE tag pops (scale .9 -> 1 about its left edge, fade); its green dot lights .90-.99
 *   rest    1        exactly the Figma art
 *   leave   1.00-1.14 the tag goes (fade, scale .94); 1.03-1.15 keyholes off, shackles open; 1.05-1.30 the dots drop out (last typed first); 1.08-1.28 lines undraw
 *           1.16-1.44 the plates fold back into one slab; 1.38-1.66 the slab lifts 18 px and fades; 1.48-1.80 the grid undraws, 1.56-1.92 the edge and fill go
 * Idle (additive, w scales it): each plate breathes 1 px along the iso vertical (4.6 s, out of phase); the dotted text scrambles: a pair of dots dips
 *   (fade to .3, shrink to .7) and comes back, a new pair every .45 s (each dip lasts .9 s, so two pairs overlap). */
import type { Vignette } from "./index";
import { mountArt, liveTf, q } from "./art";

const NS = "http://www.w3.org/2000/svg";
const cl = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const seg = (a: number, t0: number, t1: number) => cl((a - t0) / (t1 - t0));
const out3 = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t);
const io2 = (t: number) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));
const in2 = (t: number) => t * t;
const SEP = 58.8037; /* the plates' spacing in the art (layer_2 sits 58.80 below layer_3, layer 58.80 below layer_2) */
const NDOT = 34;
let UID = 0;

type Rig = {
  M: DOMMatrix; tf: SVGTransform[]; cx: number[]; cy: number[];
  fHalf: SVGPathElement[]; fFill: SVGPathElement; fEdge: SVGPathElement;
  grid: SVGPathElement[]; gridK: number[]; gridG: SVGPathElement;
  arrows: SVGGraphicsElement; plates: SVGGElement;
  iPlate: number; iShk: number; iKey: number; iDot: number; iTag: number;
  lines: SVGGraphicsElement[]; keys: SVGGraphicsElement[]; dots: SVGGraphicsElement[];
  tag: SVGGraphicsElement; tagDot: SVGGraphicsElement;
};

export function create(host: HTMLElement): Vignette {
  const u = ++UID;
  let a = 0, ready = false, R: Rig | null = null;
  /* idle offsets (additive): per plate y, per dot dip 0..1 */
  const breathe = new Float64Array(3), dip = new Float64Array(3 * NDOT), dipIdx = new Int32Array(4).fill(-1);

  const apply = () => { if (ready) render(); };

  const art = mountArt("data", host, (svg) => {
    svg.removeAttribute("width"); svg.removeAttribute("height");
    svg.setAttribute("preserveAspectRatio", "xMidYMax meet");
    R = build(svg, u);
    ready = true; render();
  });

  /* write cache: one slot per (element, property); a write only when the value moved */
  const SL = new Float64Array(1024).fill(NaN);
  const op = (s: number, e: SVGElement, v: number) => { const o = SL[s]; if (o === o && Math.abs(o - v) < 1e-4) return; SL[s] = v; e.style.opacity = String(v); };
  /* a drawn stroke (pathLength 1, dasharray 1 2): g = how much shows; hidden = the middle of the gap (no round-cap dot at the start).
     fully drawn = no dash at all (the dashed render anti-aliases a hair differently from the art's plain stroke) */
  const dsh = (s: number, e: SVGElement, g: number) => { const v = g <= 0 ? 1.5 : 1 - g; const o = SL[s]; if (o === o && Math.abs(o - v) < 1e-4) return; SL[s] = v; e.style.strokeDashoffset = String(v); const f = v === 0 ? 1 : 0; if (SL[s + 512] !== f) { SL[s + 512] = f; e.style.strokeDasharray = f ? "none" : ""; } };
  /* matrix (scale k about cx, cy, then translate tx, ty); slots s .. s+2 */
  const mat = (s: number, R: Rig, i: number, k: number, tx: number, ty: number) => {
    const ox = SL[s], oy = SL[s + 1], ok = SL[s + 2];
    if (ox === ox && Math.abs(ox - tx) < 1e-3 && Math.abs(oy - ty) < 1e-3 && Math.abs(ok - k) < 1e-4) return;
    SL[s] = tx; SL[s + 1] = ty; SL[s + 2] = k;
    const M = R.M; M.a = k; M.b = 0; M.c = 0; M.d = k; M.e = R.cx[i] * (1 - k) + tx; M.f = R.cy[i] * (1 - k) + ty;
    R.tf[i].setMatrix(M);
  };

  function render() {
    if (!R) return;
    const A = a, arr = A <= 1, L = A - 1; /* L: 0..1 into the leave */
    let s = 0;
    /* ── floor ── */
    const edge = arr ? out3(seg(A, 0.02, 0.2)) : 1 - io2(seg(L, 0.56, 0.92));
    const fill = arr ? seg(A, 0.02, 0.16) : 1 - seg(L, 0.6, 0.92);
    /* drawing: two halves from the back vertex round to the front one; drawn: the art's closed edge */
    const eDone = edge >= 1 ? 1 : 0; op(s++, R.fEdge, eDone); op(s++, R.fHalf[0], 1 - eDone); op(s++, R.fHalf[1], 1 - eDone);
    dsh(s++, R.fHalf[0], edge); dsh(s++, R.fHalf[1], edge); op(s++, R.fFill, fill);
    let gAll = 1;
    for (let i = 0; i < R.grid.length; i++) {
      const k = R.gridK[i]; /* 0..1, its place from the back edge */
      const g = arr ? out3(seg(A, 0.06 + k * 0.14, 0.18 + k * 0.14)) : 1 - io2(seg(L, 0.48 + (1 - k) * 0.18, 0.62 + (1 - k) * 0.18));
      dsh(s++, R.grid[i], g); if (g < 1) gAll = 0;
    }
    if (SL[1023] !== gAll) { SL[1023] = gAll; R.gridG.style.mask = gAll ? "none" : ""; } /* the mask only while the grid draws: at rest the grid paints as the art's */
    /* ── the plates: one slab fades in and settles, separates up; on leave folds back, lifts, fades ── */
    let slabO, slabY, p3, p2;
    if (arr) {
      slabO = seg(A, 0.12, 0.26); slabY = -14 * (1 - out3(seg(A, 0.12, 0.36)));
      p3 = out3(seg(A, 0.28, 0.58)); p2 = out3(seg(A, 0.31, 0.6));
    } else {
      p3 = 1 - io2(seg(L, 0.16, 0.44)); p2 = 1 - io2(seg(L, 0.18, 0.44));
      slabO = 1 - seg(L, 0.42, 0.66); slabY = -18 * in2(seg(L, 0.38, 0.66));
    }
    op(s++, R.plates, slabO);
    const sep = Math.min(p2, p3);
    op(s++, R.arrows, seg(sep, 0.92, 1) * slabO); /* the art's arrows sit hidden behind the plates; keep them out of the gaps while they move */
    /* plate 0 = top (layer_3), 1 = middle (layer_2), 2 = bottom (layer) */
    mat(s, R, R.iPlate + 0, 1, 0, slabY + 2 * SEP * (1 - p3) + breathe[0]); s += 3;
    mat(s, R, R.iPlate + 1, 1, 0, slabY + SEP * (1 - p2) + breathe[1]); s += 3;
    mat(s, R, R.iPlate + 2, 1, 0, slabY + breathe[2]); s += 3;
    for (let p = 0; p < 3; p++) {
      const d = p * 0.03;
      /* lines */
      const ln = arr ? out3(seg(A, 0.48 + d, 0.64 + d)) : 1 - seg(L, 0.08 + d * 0.5, 0.26 + d * 0.5);
      dsh(s++, R.lines[2 * p], ln); dsh(s++, R.lines[2 * p + 1], out3(seg(ln, 0.15, 1)));
      /* shackle drops shut; keyhole lights */
      const lk = arr ? out3(seg(A, 0.68 + d * 0.5, 0.8 + d * 0.5)) : 1 - seg(L, 0.05 + d * 0.3, 0.15 + d * 0.3);
      mat(s, R, R.iShk + p, 1, 0, -2.4 * (1 - lk)); s += 3;
      const gk = arr ? out3(seg(A, 0.74 + d * 0.6, 0.86 + d * 0.6)) : 1 - seg(L, 0.03 + d * 0.3, 0.12 + d * 0.3);
      op(s++, R.keys[p], gk); mat(s, R, R.iKey + p, 0.4 + 0.6 * gk, 0, 0); s += 3;
      /* dots: typed in, row by row, left to right */
      const t0 = 0.52 + p * 0.05;
      for (let j = 0; j < NDOT; j++) {
        const q = j / (NDOT - 1), n = p * NDOT + j;
        let v;
        if (arr) v = out3(seg(A, t0 + q * 0.16, t0 + q * 0.16 + 0.06));
        else { const r0 = 0.05 + (1 - q) * 0.14 + p * 0.02; v = 1 - seg(L, r0, r0 + 0.06); }
        const dp = dip[n];
        op(s++, R.dots[n], v * (1 - 0.7 * dp));
        mat(s, R, R.iDot + n, (0.3 + 0.7 * v) * (1 - 0.3 * dp), 0, 0); s += 3;
      }
    }
    /* ── the tag pops last ── */
    const tg = arr ? out3(seg(A, 0.84, 0.97)) : 1 - seg(L, 0, 0.14);
    op(s++, R.tag, tg);
    mat(s, R, R.iTag, arr ? 0.9 + 0.1 * tg : 0.94 + 0.06 * tg, 0, 0); s += 3;
    op(s++, R.tagDot, arr ? seg(A, 0.9, 0.99) : 1 - seg(L, 0, 0.08));
  }

  function idle(t: number, w: number) {
    if (!ready || art.dead()) return;
    const W = w > 0 ? w : 0;
    for (let p = 0; p < 3; p++) breathe[p] = W * Math.sin((t / 4.6) * 2 * Math.PI + p * 2.1);
    for (let i = 0; i < 4; i++) { if (dipIdx[i] >= 0) dip[dipIdx[i]] = 0; dipIdx[i] = -1; }
    if (W > 0) {
      const step = Math.floor(t / 0.45);
      for (let h = 0; h < 2; h++) { /* the current pair and the previous one: each dips over .9 s */
        const st = step - h, ph = (t - st * 0.45) / 0.9, k = Math.sin(Math.PI * cl(ph)) * W;
        for (let m = 0; m < 2; m++) {
          let x = (st * 2 + m + 1) * 2654435761; x = (x ^ (x >>> 15)) >>> 0; x = Math.imul(x, 2246822519) >>> 0; x = (x ^ (x >>> 13)) >>> 0;
          const n = x % (3 * NDOT);
          dipIdx[h * 2 + m] = n; if (k > dip[n]) dip[n] = k;
        }
      }
    }
    render();
  }

  return {
    el: art.el,
    set(v) { if (art.dead()) return; a = v < 0 ? 0 : v > 2 ? 2 : v; apply(); },
    idle,
    dispose() { art.kill(); R = null; ready = false; },
  };
}

/* one-time restructure of the Figma export (resting look unchanged) */
function build(svg: SVGSVGElement, u: number): Rig {
  const { $ } = q(svg);
  const mk = <T extends SVGElement>(tag: string, attrs: Record<string, string>) => { const e = document.createElementNS(NS, tag) as T; for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
  const tf: SVGTransform[] = [], cx: number[] = [], cy: number[] = [];
  const reg = (e: SVGGraphicsElement, x: number, y: number) => { tf.push(liveTf(svg, e)); cx.push(x); cy.push(y); return tf.length - 1; };
  /* a shape's centre from its path data (the dots and keyholes are absolute M/L polygons): no layout read, works while the host is hidden */
  const ctr = (e: Element) => { const n = (e.getAttribute("d")!.match(/-?\d*\.?\d+/g) || []).map(Number); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (let i = 0; i + 1 < n.length; i += 2) { x0 = Math.min(x0, n[i]); x1 = Math.max(x1, n[i]); y0 = Math.min(y0, n[i + 1]); y1 = Math.max(y1, n[i + 1]); } return [(x0 + x1) / 2, (y0 + y1) / 2]; };
  const kid = (g: Element, i: number) => g.children[i] as SVGGraphicsElement;

  /* floor: the diamond -> a fill + a drawn edge */
  const fl = $("#v2d-floor"), dia = fl.children[0] as SVGPathElement, grid = fl.children[1] as SVGPathElement;
  const fEdge = dia.cloneNode() as SVGPathElement; fEdge.removeAttribute("id"); fEdge.setAttribute("fill", "none"); fEdge.setAttribute("pathLength", "1"); fEdge.setAttribute("stroke-dasharray", "1 2");
  dia.setAttribute("stroke", "none");
  fl.insertBefore(fEdge, grid); /* fill, edge, grid: the original's paint order */
  const fHalf = ["M197.154 77.894L393.845 191.614L196.987 305.5", "M197.154 77.894L0.351562 191.553L196.987 305.5"].map((d) => {
    const h = fEdge.cloneNode() as SVGPathElement; h.setAttribute("d", d); fl.insertBefore(h, grid); return h; });
  fEdge.removeAttribute("pathLength"); fEdge.removeAttribute("stroke-dasharray");
  /* the grid: a mask of its 20 segments, drawn solid; each draws from its back end (its first point) */
  const segs = grid.getAttribute("d")!.match(/M[^M]+/g) || [];
  const defs = mk("defs", {}); svg.insertBefore(defs, svg.firstChild);
  const mid = `v2d${u}grid`;
  const mask = mk("mask", { id: mid, maskUnits: "userSpaceOnUse", x: "-20", y: "-20", width: "440", height: "350" });
  defs.appendChild(mask);
  const gridLs: SVGPathElement[] = [], gridK: number[] = [];
  segs.forEach((d, i) => {
    const l = mk<SVGPathElement>("path", { d: d.trim(), stroke: "#fff", "stroke-width": "3", "stroke-linecap": "round", fill: "none", pathLength: "1", "stroke-dasharray": "1 2" });
    mask.appendChild(l); gridLs.push(l); gridK.push((i % 10) / 9);
  });
  grid.setAttribute("mask", `url(#${mid})`);

  /* plates: wrapped in one group (the slab fades as one) */
  const L1 = $("#v2d-layer"), L2 = $("#v2d-layer_2"), L3 = $("#v2d-layer_3");
  const plates = mk<SVGGElement>("g", { class: "d-plates" }); L1.parentNode!.insertBefore(plates, L1); plates.append(L1, L2, L3);
  const PL = [L3, L2, L1]; /* 0 top, 1 middle, 2 bottom */
  const iPlate = tf.length; PL.forEach((g) => reg(g, 0, 0));
  const lines: SVGGraphicsElement[] = [], keys: SVGGraphicsElement[] = [], dots: SVGGraphicsElement[] = [];
  const iShk = tf.length; PL.forEach((g) => reg(kid(g, 6), 0, 0));
  const iKey = tf.length; PL.forEach((g) => { const k = kid(g, 7), c = ctr(k); keys.push(k); reg(k, c[0], c[1]); });
  PL.forEach((g) => { [8, 9].forEach((i) => { const l = kid(g, i); l.setAttribute("pathLength", "1"); l.setAttribute("stroke-dasharray", "1 2"); lines.push(l); }); });
  const iDot = tf.length;
  PL.forEach((g) => { for (let j = 0; j < NDOT; j++) { const e = kid(g, 10 + j), c = ctr(e); dots.push(e); reg(e, c[0], c[1]); } });
  /* tag: scales about its left edge's middle */
  const tag = $("#v2d-tag"), iTag = reg(tag, 288.445, 113.83);
  return {
    M: svg.createSVGMatrix(), tf, cx, cy,
    fHalf, fFill: dia, fEdge, grid: gridLs, gridK, gridG: grid,
    arrows: $("#v2d-arrows"), plates,
    iPlate, iShk, iKey, iDot, iTag, lines, keys, dots,
    tag, tagDot: kid(tag, 1),
  };
}
