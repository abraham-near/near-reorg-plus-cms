/* r17 v1 · the "intelligence" illustration (Figma 521:6082, public/v1/vig2/intelligence.svg) behind the vignette contract (./index.ts).
 * The story: a request goes down into the enclave, a signed proof comes back.
 *   arrive a 0 -> 1   .03-.33 the floor draws (its two edges from the back corner, then the dashed grid line by line);
 *                     .16-.40 the receipt (with its seal, still blank) comes down onto the floor, its two text lines draw;
 *                     .30-.56 the keyhole plate comes down over it, its lines draw, .52-.66 the keyhole fills green (a wipe along the plate);
 *                     .46-.70 the bubble lands on top, .66-.77 its three dots appear one by one;
 *                     .70-.80 the seal lights (a green wipe rising the other way: the proof coming back), .79-.91 a paper glint crosses it;
 *                     .80-.94 the SIGNED PROOF tag pops (scale .9 -> 1 about its left middle, fade), its green dot a beat later.
 *   rest  a = 1       exactly the Figma art.
 *   leave a 1 -> 2    quicker, top first: the tag goes (1.00-1.14), the bubble, the keyhole plate and the receipt lift and fade in turn
 *                     (1.04-1.34, 1.12-1.42, 1.20-1.50), the grid un-draws (1.30-1.62), then the edges and the floor (1.40-1.72).
 *   idle(t, w)        the three plates breathe 1 px up, out of phase (4.6 s); the "..." types (2.4 s); a paper glint crosses the seal every 4.2 s.
 * set() writes only transforms, opacity and stroke-dashoffset (plus, on state change only, toggling the grid's draw mask and a drawn line's dasharray). */
import type { Vignette } from "./index";
import { mountArt, liveTf, q } from "./art";

const NS = "http://www.w3.org/2000/svg";
const VW = 412, VH = 294;
const cl = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const seg = (a: number, t0: number, t1: number) => cl((a - t0) / (t1 - t0));
const out3 = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t);
const in2 = (t: number) => t * t;
const io = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const TAU = Math.PI * 2;
const HID = 1.05;                                   /* dashoffset of an undrawn line (pathLength 1, dasharray "1.001 2") */
let UID = 0;

type Rig = { set: (a: number) => void; idle: (t: number, w: number) => void };
type Observe = (target: Element, cb: (w: number, h: number) => void) => void;

export function create(host: HTMLElement): Vignette {
  let a = 0, R: Rig | null = null;
  const art = mountArt("intelligence", host, (svg) => {
    svg.removeAttribute("width"); svg.removeAttribute("height"); svg.setAttribute("preserveAspectRatio", "xMidYMax meet");
    R = build(svg, art.observe); R.set(a);
  });
  return {
    el: art.el,
    set(v) { if (art.dead()) return; v = +v; a = v === v ? (v < 0 ? 0 : v > 2 ? 2 : v) : 0; if (R) R.set(a); },
    idle(t, w) { if (R && !art.dead()) R.idle(t, w); },
    dispose() { art.kill(); R = null; },
  };
}

function build(svg: SVGSVGElement, observe: Observe): Rig {
  const u = ++UID, id = (n: string) => `v2i${u}-${n}`;
  const { $, $$ } = q(svg);
  const MX = svg.createSVGMatrix();
  const live = (e: SVGGraphicsElement) => liveTf(svg, e);
  const scaleAbout = (t: SVGTransform, s: number, ox: number, oy: number) => { MX.a = s; MX.b = 0; MX.c = 0; MX.d = s; MX.e = ox * (1 - s); MX.f = oy * (1 - s); t.setMatrix(MX); };
  /* a write cache: attribute writes are skipped when the value has not moved */
  const SL = new Float64Array(96).fill(NaN); let nS = 0;
  const slot = () => nS++;
  const W = (s: number, e: Element, attr: string, v: number, eps = 1e-4) => { const o = SL[s]; if (o === o && Math.abs(o - v) < eps) return; SL[s] = v; e.setAttribute(attr, String(v)); };
  /* a line that draws (pathLength 1): dashed while it draws, a plain stroke once whole (Chrome paints a dashed stroke a hair darker) */
  type DLine = { e: Element; s: number; d: number };
  const DL = (o: DLine, off: number) => {
    const full = off === 0 ? 1 : 0;
    if (full !== o.d) { o.d = full; if (full) { o.e.removeAttribute("stroke-dasharray"); o.e.removeAttribute("stroke-dashoffset"); SL[o.s] = NaN; } else o.e.setAttribute("stroke-dasharray", "1.001 2"); }
    if (!full) W(o.s, o.e, "stroke-dashoffset", off);
  };
  const node = <T extends SVGElement = SVGElement>(tag: string, attrs: Record<string, string | number>, parent?: Element) => { const e = document.createElementNS(NS, tag) as T; for (const k in attrs) e.setAttribute(k, String(attrs[k])); if (parent) parent.appendChild(e); return e; };
  const defs = svg.insertBefore(document.createElementNS(NS, "defs"), svg.firstChild);
  const pts = (d: string) => { const n = d.match(/-?\d*\.?\d+(?:e-?\d+)?/g)!.map(Number), r: number[] = []; for (let i = 0; i + 1 < n.length; i += 2) r.push(n[i], n[i + 1]); return r; };   /* M/L-only paths */

  /* ── the floor: fill, two edges, the dashed grid drawn through a mask of white strokes (one per grid line) ── */
  const flFill = $(".fl-fill"), edges: DLine[] = $$(".fl-e").map((e) => ({ e, s: slot(), d: -1 })), grid = $(".fl-grid");
  const gm = node("mask", { id: id("gm"), maskUnits: "userSpaceOnUse", x: -20, y: 40, width: VW + 40, height: VH }, defs);
  const gridLines = grid.getAttribute("d")!.split("M").filter((s) => s.trim()).map((s, i) => {
    const p = node("path", { d: "M" + s.trim(), fill: "none", stroke: "#fff", "stroke-width": 3, "stroke-linecap": "square", pathLength: 1, "stroke-dasharray": "1.001 2", "stroke-dashoffset": HID }, gm);
    return { e: p, s: slot(), k: i % 10 };            /* the d holds two families of 10: k = the line's place in its family, from the back corner forward */
  });
  let gridMasked = -1;
  const sFl = slot();

  /* ── the plates (iso vertical = screen y): receipt (+ coin), keyhole plate, bubble ── */
  const plates = [".p3", ".p2", ".p1"].map((s) => { const g = $(s); return { g, tf: live(g), s: slot(), y: 0 }; });
  /* a plate's drawn lines: .ln, each drawn by dashoffset. A multi-segment original (.lnr) is kept for the rest state and its split copies (the .ln right
     after it) draw; once they are all whole the original shows and they hide (Chrome rasterises a lone segment a hair differently from a multi-segment path) */
  type Grp = { r: Element; s: number; full: number; parts: Ln[] };
  type Ln = DLine & { so: number; g: Grp | null };
  const lines = (sel: string) => {
    const L: Ln[] = [], G: Grp[] = []; let cur: Grp | null = null, prev: Element | null = null;
    svg.querySelectorAll(sel + " .ln, " + sel + " .lnr").forEach((e) => {
      if (e.classList.contains("lnr")) { cur = { r: e, s: slot(), full: 0, parts: [] }; G.push(cur); prev = e; return; }
      if (e.previousElementSibling !== prev) cur = null;
      const o: Ln = { e, s: slot(), so: slot(), d: -1, g: cur }; if (cur) cur.parts.push(o); L.push(o); prev = e;
    });
    return { L, G };
  };
  const ln3 = lines(".p3"), ln2 = lines(".p2");
  const drawLines = (LS: { L: Ln[]; G: Grp[] }, t: number, t0: number, step: number, dur: number) => {
    for (let j = 0; j < LS.G.length; j++) LS.G[j].full = 1;
    for (let i = 0; i < LS.L.length; i++) { const o = LS.L[i], off = HID * (1 - out3(seg(t, t0 + step * i, t0 + dur + step * i))); DL(o, off); if (o.g && off !== 0) o.g.full = 0; }
    for (let j = 0; j < LS.G.length; j++) { const g = LS.G[j]; W(g.s, g.r, "opacity", g.full); for (let i = 0; i < g.parts.length; i++) W(g.parts[i].so, g.parts[i].e, "opacity", 1 - g.full); }
  };
  const dots = $$(".p1 .dot").map((e) => ({ e, s: slot(), b: 1 }));

  /* ── the green wipes: the fill is clipped by a big parallelogram whose leading edge lies along one iso axis and travels along the other ── */
  const C = Math.cos(Math.PI / 6), S = 0.5;
  let nW = 0;
  function wipe(target: Element, U: [number, number], V: [number, number]) {   /* U: travel direction, V: the leading edge's direction */
    const det = U[0] * V[1] - U[1] * V[0], al = (x: number, y: number) => (x * V[1] - y * V[0]) / det;   /* alpha: the coordinate along U */
    const p = pts(target.getAttribute("d")!); let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < p.length; i += 2) { const v = al(p[i], p[i + 1]); if (v < lo) lo = v; if (v > hi) hi = v; }
    lo -= 2; hi += 2;
    const P = (A: number, B: number) => `${(A * U[0] + B * V[0]).toFixed(2)} ${(A * U[1] + B * V[1]).toFixed(2)}`;
    const cp = node("clipPath", { id: id("w" + nW++), clipPathUnits: "userSpaceOnUse" }, defs);
    const r = node<SVGPathElement>("path", { d: `M${P(lo, -400)}L${P(lo, 400)}L${P(lo - 600, 400)}L${P(lo - 600, -400)}Z` }, cp);
    target.setAttribute("clip-path", `url(#${cp.id})`);
    const tf = live(r), span = hi - lo;
    return (k: number) => tf.setTranslate(U[0] * span * k, U[1] * span * k);
  }
  const keyG = $(".key-g"), coinG = $(".coin-g"), coinB = $(".coin-b"), sCB = slot();
  const keyW = wipe(keyG, [C, S], [C, -S]);           /* down the plate, the way the keyhole points */
  const coinW = wipe(coinG, [C, -S], [C, S]);         /* the other way: the proof coming back */

  /* ── the glint: a flat paper band, clipped to the seal's face, swept across it ── */
  const cd = coinG.getAttribute("d")!, cp = pts(cd); let bx0 = Infinity, bx1 = -Infinity, by0 = Infinity, by1 = -Infinity;
  for (let i = 0; i < cp.length; i += 2) { bx0 = Math.min(bx0, cp[i]); bx1 = Math.max(bx1, cp[i]); by0 = Math.min(by0, cp[i + 1]); by1 = Math.max(by1, cp[i + 1]); }
  const gcp = node("clipPath", { id: id("gl"), clipPathUnits: "userSpaceOnUse" }, defs); node("path", { d: cd }, gcp);
  const glG = $(".coin-gl"); glG.setAttribute("clip-path", `url(#${gcp.id})`);
  const GH = by1 - by0 + 8, GB = 6, GK = GH * 0.577;
  const band = node<SVGPathElement>("path", { class: "v2i-glint", d: `M0 ${(by0 - 4).toFixed(2)}h${GB}l${(-GK).toFixed(2)} ${GH.toFixed(2)}h${-GB}Z`, opacity: 0 }, glG);
  const bandTf = live(band), GX0 = bx0, GX1 = bx1 + GK + GB, sGl = slot();
  let glK = 0, glO = 0;                                /* set()'s glint (the arrival's sweep): idle adds on top */

  /* ── the tag ── */
  const tag = $(".tag"), tagTf = live(tag), tagDot = $(".tag-dot"), sTg = slot(), sTd = slot();
  const TOX = 269.586, TOY = 209.283;

  let SPU = 1;                                         /* svg units per css px (contained: the smaller scale) */
  const fit = (w: number, h: number) => { if (w > 0 && h > 0) SPU = 1 / Math.min(w / VW, h / VH); };
  observe(svg, fit);

  let vis = -1, idleDirty = 1, idleOff = 1;

  function set(a: number) {
    const v = a > 0 && a < 2 ? 1 : 0;
    if (v !== vis) { vis = v; svg.style.visibility = v ? "visible" : "hidden"; }
    let fe, ff, y3, o3, y2, o2, y1, o1, l3, l2, kw, cw, tg, td, dA = 0, dB = 0;
    const gOff = (k: number) => (a <= 1 ? HID * (1 - out3(seg(a, 0.06 + 0.024 * k, 0.11 + 0.024 * k))) : -HID * seg(a - 1, 0.3 + 0.016 * k, 0.4 + 0.016 * k));
    if (a <= 1) {
      fe = out3(seg(a, 0.03, 0.24)); ff = seg(a, 0.03, 0.2);
      const p3 = out3(seg(a, 0.16, 0.40)), p2 = out3(seg(a, 0.30, 0.56)), p1 = out3(seg(a, 0.46, 0.70));
      y3 = -26 * (1 - p3); o3 = seg(a, 0.16, 0.27);
      y2 = -30 * (1 - p2); o2 = seg(a, 0.30, 0.41);
      y1 = -32 * (1 - p1); o1 = seg(a, 0.46, 0.57);
      l3 = a; l2 = a;
      kw = io(seg(a, 0.52, 0.66)); cw = io(seg(a, 0.70, 0.80));
      const gk = seg(a, 0.79, 0.91); glK = gk; glO = gk > 0 && gk < 1 ? 0.55 * Math.sin(Math.PI * gk) : 0;
      tg = out3(seg(a, 0.80, 0.94)); td = seg(a, 0.87, 0.96); dA = 1;
    } else {
      const l = a - 1;
      fe = 1 - in2(seg(l, 0.40, 0.66)); ff = 1 - seg(l, 0.45, 0.72);
      y1 = -24 * in2(seg(l, 0.04, 0.34)); o1 = 1 - seg(l, 0.12, 0.34);
      y2 = -24 * in2(seg(l, 0.12, 0.42)); o2 = 1 - seg(l, 0.20, 0.42);
      y3 = -20 * in2(seg(l, 0.20, 0.50)); o3 = 1 - seg(l, 0.28, 0.50);
      l3 = 1; l2 = 1; kw = 1; cw = 1; glK = 0; glO = 0;
      tg = 1 - seg(l, 0, 0.14); td = tg; dB = 1;
    }
    /* floor */
    for (let i = 0; i < edges.length; i++) { DL(edges[i], a <= 1 ? HID * (1 - fe) : -HID * (1 - fe)); }
    W(sFl, flFill, "opacity", ff);
    let gridFull = 1;
    for (let i = 0; i < gridLines.length; i++) { const g = gridLines[i], o = gOff(g.k); if (o !== 0) gridFull = 0; W(g.s, g.e, "stroke-dashoffset", o); }
    if (gridFull !== gridMasked) { gridMasked = gridFull; if (gridFull) grid.removeAttribute("mask"); else grid.setAttribute("mask", `url(#${gm.id})`); }
    /* plates */
    const Y = [y3, y2, y1], O = [o3, o2, o1];
    for (let k = 0; k < 3; k++) { const P = plates[k]; P.y = Y[k]; P.tf.setTranslate(0, Y[k]); W(P.s, P.g, "opacity", O[k]); }
    drawLines(ln3, l3, 0.32, 0.03, 0.12);
    drawLines(ln2, l2, 0.46, 0.03, 0.10);
    for (let q = 0; q < dots.length; q++) { const d = dots[q]; d.b = dA ? out3(seg(a, 0.66 + 0.035 * q, 0.70 + 0.035 * q)) : 1; W(d.s, d.e, "opacity", d.b); }
    /* green */
    keyW(kw); coinW(cw); W(sCB, coinB, "opacity", cw < 1 ? 1 : 0);
    bandTf.setTranslate(GX0 + (GX1 - GX0) * glK, 0); W(sGl, band, "opacity", glO);
    /* tag */
    W(sTg, tag, "opacity", tg); scaleAbout(tagTf, dB ? 1 - 0.04 * (1 - tg) : 0.9 + 0.1 * tg, TOX, TOY); W(sTd, tagDot, "opacity", td);
    idleDirty = 1;
  }

  function idle(t: number, w: number) {
    w = +w; w = w > 0 ? (w > 1 ? 1 : w) : 0; t = +t || 0;
    if (w === 0 && idleOff && !idleDirty) return;
    /* the plates breathe up (away from the floor) about 1 px, each a little out of phase */
    const A = SPU * w;
    for (let k = 0; k < 3; k++) { const P = plates[k], o = A * (0.5 - 0.5 * Math.cos(TAU * t / 4.6 + k * 1.1)); P.tf.setTranslate(0, P.y - o); }
    /* the "..." types: the dots come in one by one, hold, clear (2.4 s) */
    const c = t / 2.4 - Math.floor(t / 2.4);
    for (let q = 0; q < dots.length; q++) { const d = dots[q], on = c > 0.12 + 0.16 * q && c < 0.86 ? 1 : 0.22; W(d.s, d.e, "opacity", d.b * (1 - (1 - on) * w)); }
    /* a flat glint crosses the seal every 4.2 s, over .9 s */
    const g = (t + 1.3) % 4.2, k = g < 0.9 ? g / 0.9 : 1, on = g < 0.9 ? Math.sin(Math.PI * k) : 0;
    const kk = w > 0 && on > 0 ? k : glK;
    bandTf.setTranslate(GX0 + (GX1 - GX0) * kk, 0); W(sGl, band, "opacity", glO * (1 - w) + 0.45 * on * w);
    idleDirty = 0; idleOff = w === 0 ? 1 : 0;
  }

  { const r = svg.getBoundingClientRect(); fit(r.width, r.height); }   /* once, at build */
  return { set, idle };
}
