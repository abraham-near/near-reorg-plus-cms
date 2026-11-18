/* Home v7 · "Own your identity." (D189): the signed account. Your coin (the account) signs the document above; the signed document acts on three places on
 * the board below. Behind the vignette contract (./index.ts): create(host) -> { el, set(a), idle(t, w), dispose() }, in place of ./identity.ts wherever the
 * rail's section carries data-identity="sign" (RailV4 identity="sign": home v7 only).
 * The art: public/v1/vig2/sign.svg, the Figma "P5 · editable" (TJ38G7245lEghviUBaCTFJ 918:299) regrouped so its parts can move; at rest it is the export:
 *   .s-base (the lower plate: faces .s-bf, the grid's outline .s-gln, 33 dots .s-dot, three green places: halo .s-tr, dot .s-td) · 3 × .s-ar (line .s-al,
 *   head .s-ah) · 3 × .s-dl (the dotted verticals) · .s-doc (faces, its outline .s-fln, the folded corner, three text lines .s-tx, the box .s-box, the
 *   signature .s-sig, the check .s-chk) · .s-car (the coin's arrow: .s-cal, .s-cah) · .s-coin.
 *
 * set(a), a in [0, 2] (A = the arrival 0..1, L = the leave 0..1), the identity graphic's beat (./identity.ts): things land, lines draw, the green comes last:
 *   A .02-.30  the lower plate lands (26 units, out3, fading in), its grid's outline draws (.08-.30), the dots pop from the back to the front (.12-.38)
 *   A .22-.42  the dotted verticals draw up from the lower plate
 *   A .26-.50  the document lands (34 units); its outline draws (.40-.54), the text lines draw one after another (.44-.60), the box draws (.46-.60)
 *   A .42-.62  the coin drops in (60 units) to just above the card (it rests 30 units lower than in the Figma, closer to the card), then its arrow draws
 *              down onto the document (.58-.70) and the head lands
 *   A .60-.70  the signature is written in ink, left to right; as the coin settles it wipes to green, left to right (.70-.82), and stays green; the
 *              check is ticked (.78-.84)
 *   A .78-1    the document acts: each arrow draws down to its place in turn (.04 apart), its head lands and the place turns green (its black dot gives
 *              way to the green one, the halo opens round it); everything is home by a = 1
 *   L .00-.80  the leave, quicker, roughly the reverse: the places go grey and the arrows retract into them; the check and the signature go; the coin's arrow
 *              pulls back up and the coin lifts away; the document lifts and fades; the verticals; the lower plate. a = 2: hidden.
 *   At a = 1 every transform is the identity, every opacity 1, every mask removed: the dom is the art (Figma's, with Lawrence's two changes: the coin
 *   30 units lower, the signature green); the idle's added nodes sit at opacity 0.
 *
 * idle(t, w), additive on set(a)'s values, all along the iso vertical, out of phase; v4's rail (.layer--v4, as home v7) the LIVE amplitudes, else small ones:
 *   the coin floats (5.8 s) and the document breathes (4.6 s), every line between them stretching so it still meets both ends; and every 7.2 s the act again:
 *   a green bead runs down the coin's arrow and the check flashes green, then a bead drops down each arrow to its place
 *   (.35 s apart) and the place's halo pings out. At w = 0 the offsets are written back to zero once and idle goes dormant.
 */
import type { Vignette } from "./index";
import { mountArt, liveTf, q } from "./art";

const NS = "http://www.w3.org/2000/svg";
const GREEN = "#00DC8D", INK = "#111111";
const cl = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const seg = (a: number, t0: number, t1: number) => cl((a - t0) / (t1 - t0));
const o3 = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t);
const o2 = (t: number) => 1 - (1 - t) * (1 - t);
const io = (t: number) => t * t * (3 - 2 * t);
const mod = (x: number, m: number) => ((x % m) + m) % m;
const TAU = Math.PI * 2;
const VW = 264, VH = 321;
const CY = 7.2;                                             /* the idle's act: its cycle (s) */
let UID = 0;

type Rig = { set: (a: number) => void; idle: (t: number, w: number) => void };

export function create(host: HTMLElement): Vignette {
  let a = 0, R: Rig | null = null, SPU = VW / 300;           /* SPU: svg units per css px (contain), from a ResizeObserver: no layout reads in set() */
  const LIVE = !!host.closest(".layer--v4");

  const art = mountArt("sign", host, (svg) => {
    svg.removeAttribute("width"); svg.removeAttribute("height"); svg.setAttribute("preserveAspectRatio", "xMidYMax meet");
    svg.style.cssText = "display:block;width:100%;height:100%;overflow:visible";
    R = build(svg); R.set(a);
  });
  art.observe(art.el, (w, h) => { if (w > 0 && h > 0) SPU = 1 / Math.min(w / VW, h / VH); });

  function build(svg: SVGSVGElement): Rig {
    const u = ++UID, { $, $$ } = q(svg);
    const id = (n: string) => `v2s${u}${n}`;
    const MX = svg.createSVGMatrix();
    /* write caches: a value is written only when it changes */
    const SL = new Float64Array(512).fill(NaN); let nS = 0;
    const slot = (n = 1) => { const s = nS; nS += n; return s; };
    const W = (s: number, n: Element, attr: string, v: number) => { const o = SL[s]; if (o === v || (o === o && v !== 0 && v !== 1 && Math.abs(o - v) < 1e-4)) return; SL[s] = v; n.setAttribute(attr, String(v)); };
    const TM = (s: number, t: SVGTransform, ma: number, mb: number, mc: number, md: number, me: number, mf: number) => {
      if (SL[s] === ma && SL[s + 1] === mb && SL[s + 2] === mc && SL[s + 3] === md && SL[s + 4] === me && SL[s + 5] === mf) return;
      SL[s] = ma; SL[s + 1] = mb; SL[s + 2] = mc; SL[s + 3] = md; SL[s + 4] = me; SL[s + 5] = mf;
      MX.a = ma; MX.b = mb; MX.c = mc; MX.d = md; MX.e = me; MX.f = mf; t.setMatrix(MX);
    };
    type Part = { n: SVGGraphicsElement; t: SVGTransform; s: number; so: number };
    type Line = { n: SVGGraphicsElement; s: number; so: number };
    const part = (n: SVGGraphicsElement): Part => ({ n, t: liveTf(svg, n), s: slot(6), so: slot() });
    const tr = (P: Part, x: number, y: number) => TM(P.s, P.t, 1, 0, 0, 1, x, y);
    const sc = (P: Part, k: number, cx: number, cy: number) => TM(P.s, P.t, k, 0, 0, k, cx * (1 - k), cy * (1 - k));
    /* a vertical segment y0..y1 moved so its ends land at y0 + d0 and y1 + d1 (a scale about the line, then a shift) */
    const span = (P: Part, y0: number, y1: number, d0: number, d1: number) => { const k = (y1 + d1 - y0 - d0) / (y1 - y0), kk = k < 0.001 ? 0.001 : k; TM(P.s, P.t, 1, 0, 0, kk, 0, y0 + d0 - kk * y0); };
    const op = (P: Part, v: number) => W(P.so, P.n, "opacity", v);
    /* a drawn stroke (pathLength 1, dasharray 1 1 in the art): p 0 -> 1 draws it; gated to opacity 0 at p = 0 (a zero-length round-capped dash leaves a dot) */
    const line = (n: SVGGraphicsElement): Line => ({ n, s: slot(), so: slot() });
    const draw = (Q: Line, p: number, o = 1) => { W(Q.s, Q.n, "stroke-dashoffset", 1 - p); W(Q.so, Q.n, "opacity", p > 0.0005 ? o : 0); };
    const nums = (d: string) => d.match(/-?\d+\.?\d*/g)!.map(Number);
    const el = (tagName: string, at: Record<string, string>) => { const n = document.createElementNS(NS, tagName) as SVGGraphicsElement; for (const k in at) n.setAttribute(k, at[k]); return n; };
    const after = (n: Element, ref: Element) => ref.parentNode!.insertBefore(n, ref.nextSibling);
    const defs = svg.insertBefore(document.createElementNS(NS, "defs"), svg.firstChild);

    /* ── the parts ── */
    const base = part($(".s-base"));
    const gln = line($(".s-gln"));
    const dots = $$(".s-dot").map((n) => ({ ...part(n), cx: +n.getAttribute("cx")!, cy: +n.getAttribute("cy")! }));
    /* the dots pop from the back of the plate to the front: by their depth (cy) */
    const DY0 = Math.min(...dots.map((d) => d.cy)), DY1 = Math.max(...dots.map((d) => d.cy));
    const tds = $$(".s-td"), trs = $$(".s-tr");
    const places = tds.map((n, k) => {
      const cx = +n.getAttribute("cx")!, cy = +n.getAttribute("cy")!;
      /* a black dot in the place, as the board's others, until the place turns green (opacity 0 at rest) */
      const g = el("ellipse", { cx: String(cx), cy: String(cy), rx: "1.99944", ry: "1.15333", fill: INK, stroke: INK, "stroke-width": "0.201455", opacity: "0", class: "s-ph" });
      trs[k].parentNode!.insertBefore(g, trs[k]);
      return { cx, cy, D: part(n), H: part(trs[k]), P: part(g) };
    });
    const arrows = $$(".s-ar").map((g) => { const L = g.querySelector<SVGGraphicsElement>(".s-al")!, H = g.querySelector<SVGGraphicsElement>(".s-ah")!, v = nums(L.getAttribute("d")!);
      return { x: v[0], y0: v[1], y1: v[2], L: part(L), H: part(H) }; });
    const dls = $$(".s-dl").map((n) => { const v = nums(n.getAttribute("d")!); return { P: part(n), yb: v[1], yt: v[2] }; });   /* each from the lower plate (yb) up to the document (yt) */
    /* the verticals are dotted (a dash array of their own): they draw through a mask, removed once drawn */
    const dlMask = el("mask", { id: id("m"), maskUnits: "userSpaceOnUse", x: "0", y: "0", width: "554", height: "434" });
    const dlM = dls.map((D) => { const p = el("path", { d: `M${nums(D.P.n.getAttribute("d")!)[0]} ${D.yb + 3}V${D.yt - 3}`, stroke: "#fff", "stroke-width": "4", "stroke-linecap": "round", fill: "none", pathLength: "1", "stroke-dasharray": "1 1" });
      dlMask.appendChild(p); return line(p); });
    defs.appendChild(dlMask);
    const dlG = el("g", { class: "s-dlg" }); dls[0].P.n.parentNode!.insertBefore(dlG, dls[0].P.n); dls.forEach((D) => dlG.appendChild(D.P.n));
    let dlOn = -1; const dlMaskOn = (v: number) => { if (v === dlOn) return; dlOn = v; if (v) dlG.setAttribute("mask", `url(#${id("m")})`); else dlG.removeAttribute("mask"); };
    const doc = part($(".s-doc"));
    const fln = line($(".s-fln")), corner = part($(".s-corner")), txs = $$(".s-tx").map(line), box = line($(".s-box"));
    const sigEl = $(".s-sig"), sig = line(sigEl), chkEl = $(".s-chk"), chk = line(chkEl);
    const calEl = $(".s-cal"), cv = nums(calEl.getAttribute("d")!), CAL = { x: cv[0], y0: cv[1], y1: cv[2], L: part(calEl), H: part($(".s-cah")) };
    const coin = part($(".s-coin"));

    /* ── LIVE only: the act's extra nodes (opacity 0 unless idle) ── */
    const bead = (ref: Element) => { const b = el("rect", { x: "-1.6", y: "-1.6", width: "3.2", height: "3.2", fill: GREEN, stroke: INK, "stroke-width": "0.5", opacity: "0", class: "s-bead" }); after(b, ref); return part(b); };
    /* the signature in green: a copy over the ink one that wipes along it, left to right, as the coin settles; it stays (the resting look, D189) */
    const gs = sigEl.cloneNode(false) as SVGGraphicsElement; gs.setAttribute("class", "s-gsig"); gs.setAttribute("stroke", GREEN); gs.setAttribute("stroke-width", "0.75"); gs.setAttribute("opacity", "0"); after(gs, sigEl);
    const gSig = line(gs);
    let cBead: Part | null = null, aBeads: Part[] = [], gChk: Part | null = null, pings: { P: Part; cx: number; cy: number }[] = [];
    if (LIVE) {
      cBead = bead(calEl);
      aBeads = arrows.map((Ar) => bead(Ar.L.n));
      /* the check in green */
      const gc = chkEl.cloneNode(false) as SVGGraphicsElement; gc.setAttribute("class", "s-gchk"); gc.setAttribute("stroke", GREEN); gc.setAttribute("stroke-width", "1.2"); gc.setAttribute("opacity", "0"); gc.removeAttribute("stroke-dasharray"); gc.removeAttribute("pathLength"); after(gc, chkEl); gChk = part(gc);
      /* a ring pings out of each place as its bead lands */
      pings = places.map((Pl, k) => { const r = trs[k].cloneNode(false) as SVGGraphicsElement; r.setAttribute("class", "s-ping"); r.setAttribute("stroke-width", "0.6"); r.setAttribute("opacity", "0"); after(r, trs[k]); return { P: part(r), cx: Pl.cx, cy: Pl.cy }; });
    }

    /* ── the bases set() computes and the offsets idle() adds ── */
    let docY = 0, coinY = 0, offDoc = 0, offCoin = 0;
    const arS = new Float64Array(3), arMode = new Float64Array(3);   /* each arrow's drawn share; mode 0: grows down from the document, 1: retracts into its place */
    let calS = 0;
    /* the lines that join the moving parts: each arrow's top rides the document; the coin's arrow's top rides the coin and its foot the document; the verticals'
       tops ride the document */
    const wArrow = (k: number) => {
      const Ar = arrows[k], s = arS[k], top = Ar.y0 + docY + offDoc, full = Ar.y1 - top;
      if (arMode[k]) span(Ar.L, Ar.y0, Ar.y1, Ar.y1 - s * full - Ar.y0, 0);   /* retracting: the foot stays in the place, the top comes down */
      else span(Ar.L, Ar.y0, Ar.y1, top - Ar.y0, top + s * full - Ar.y1);   /* growing: the top rides the document, the foot comes down */
    };
    /* the coin's arrow: its top rides the coin; it grows down to the document (and on the leave pulls back up into the coin, the same motion run back) */
    const wCal = () => {
      const top = CAL.y0 + coinY + offCoin, foot = top + calS * (CAL.y1 + docY + offDoc - top);
      span(CAL.L, CAL.y0, CAL.y1, top - CAL.y0, foot - CAL.y1);
      tr(CAL.H, 0, docY + offDoc);
    };
    const wDls = () => { for (const D of dls) span(D.P, D.yt, D.yb, docY + offDoc, 0); };
    const wDoc = () => { tr(doc, 0, docY + offDoc); for (let k = 0; k < 3; k++) wArrow(k); wDls(); wCal(); };
    const wCoin = () => { tr(coin, 0, coinY + offCoin); wCal(); };

    let vis = -1, last = NaN;
    function set(v: number) {
      if (v === last) return; last = v;
      const A = v < 1 ? v : 1, L = v > 1 ? v - 1 : 0;
      const sh = v > 0 && v < 2 ? 1 : 0;
      if (sh !== vis) { vis = sh; svg.style.visibility = sh ? "visible" : "hidden"; }

      /* the lower plate, its grid, its dots */
      { const p = o3(seg(A, 0.02, 0.24)), q = seg(L, 0.45, 0.8); tr(base, 0, -26 * (1 - p) - 20 * q * q); op(base, seg(A, 0.02, 0.13) * (1 - q)); }
      draw(gln, o3(seg(A, 0.08, 0.3)));
      for (const D of dots) { const t0 = 0.12 + 0.18 * (D.cy - DY0) / (DY1 - DY0), k = o3(seg(A, t0, t0 + 0.08)); sc(D, k < 0.001 ? 0.001 : k, D.cx, D.cy); op(D, k > 0.001 ? 1 : 0); }

      /* the verticals */
      { let done = 1; dls.forEach((D, i) => { const p = io(seg(A, 0.22 + 0.03 * i, 0.38 + 0.03 * i)); if (p < 1) done = 0; draw(dlM[i], p); }); dlMaskOn(done ? 0 : 1);
        const q = seg(L, 0.3, 0.5); for (const D of dls) op(D.P, 1 - q); }

      /* the document and what is on it */
      { const p = o3(seg(A, 0.26, 0.5)), q = seg(L, 0.28, 0.58);
        docY = -34 * (1 - p) - 30 * q * q; op(doc, seg(A, 0.26, 0.38) * (1 - q));
        draw(fln, o3(seg(A, 0.4, 0.54))); op(corner, seg(A, 0.48, 0.56));
        txs.forEach((T, i) => draw(T, o3(seg(A, 0.44 + 0.04 * i, 0.54 + 0.04 * i))));
        draw(box, o3(seg(A, 0.46, 0.6)));
        draw(sig, io(seg(A, 0.6, 0.7)) * (1 - io(seg(L, 0.06, 0.24))));
        draw(gSig, io(seg(A, 0.7, 0.82)) * (1 - io(seg(L, 0.02, 0.14))));
        draw(chk, o2(seg(A, 0.78, 0.84)), 1 - seg(L, 0.04, 0.14)); }

      /* the coin and its arrow */
      { const p = o3(seg(A, 0.42, 0.62)), q = seg(L, 0.14, 0.44);
        coinY = -60 * (1 - p) - 40 * q * q; op(coin, seg(A, 0.42, 0.52) * (1 - q));
        const d = o3(seg(A, 0.58, 0.7)), x = io(seg(L, 0.08, 0.24));
        calS = x > 0 ? 1 - x : d; op(CAL.L, calS > 0.001 ? 1 : 0);
        const h = o2(seg(A, 0.68, 0.71)); op(CAL.H, h * (1 - seg(L, 0.06, 0.12))); }

      /* the act: each arrow down to its place, the place turns green */
      for (let k = 0; k < 3; k++) {
        const t0 = 0.78 + 0.04 * k, r = 2 - k, d = o3(seg(A, t0, t0 + 0.08)), x = io(seg(L, 0.02 + 0.03 * r, 0.16 + 0.03 * r));
        arS[k] = x > 0 ? 1 - x : d; arMode[k] = x > 0 ? 1 : 0; op(arrows[k].L, arS[k] > 0.001 ? 1 : 0);
        const h = o2(seg(A, t0 + 0.06, t0 + 0.09)); tr(arrows[k].H, 0, -4 * (1 - h)); op(arrows[k].H, h * (1 - seg(L, 0.0 + 0.03 * r, 0.06 + 0.03 * r)));
        const Pl = places[k], g = o3(seg(A, t0 + 0.07, t0 + 0.12)) * (1 - seg(L, 0.0 + 0.03 * r, 0.1 + 0.03 * r));
        const ring = o3(seg(A, t0 + 0.08, t0 + 0.14)) * (1 - seg(L, 0.0 + 0.03 * r, 0.08 + 0.03 * r));
        sc(Pl.D, g < 0.001 ? 0.001 : g, Pl.cx, Pl.cy); op(Pl.D, g > 0.001 ? 1 : 0);
        const rk = 0.5 + 0.5 * ring; sc(Pl.H, rk, Pl.cx, Pl.cy); op(Pl.H, ring);
        /* the black dot holds the place till the green comes */
        const ph = o3(seg(A, 0.12 + 0.18 * (Pl.cy - DY0) / (DY1 - DY0), 0.2 + 0.18 * (Pl.cy - DY0) / (DY1 - DY0)));
        op(Pl.P, ph * (1 - g)); sc(Pl.P, ph < 0.001 ? 0.001 : ph, Pl.cx, Pl.cy);
      }
      wDoc(); wCoin();
    }

    /* the idle: amplitudes in css px, periods in s */
    const AD = LIVE ? 2.2 : 1.0, AC = LIVE ? 3.0 : 1.0;
    let dormant = 1;
    function idle(t: number, w: number) {
      w = +w; w = w > 0 ? (w > 1 ? 1 : w) : 0; t = +t || 0;
      if (w === 0 && dormant) return;
      const px = SPU * w;
      offDoc = -AD * px * (0.5 - 0.5 * Math.cos(TAU * t / 4.6));
      offCoin = -AC * px * (0.5 - 0.5 * Math.cos(TAU * t / 5.8 + 2.2));
      wDoc(); wCoin();
      if (LIVE) act(t, w);
      dormant = w === 0 ? 1 : 0;
    }

    /* the act, every CY s: the bead down the coin's arrow (0 - 1.0), the check flashes green (2.1 - 3.2), then a bead
       down each arrow (from 2.6, .35 s apart, .9 s each), each place's ring pinging out as its bead lands (1.1 s) */
    function act(t: number, w: number) {
      const c = mod(t, CY);
      /* the coin's bead: from under the coin to the head on the document (both ends ride the idle) */
      if (cBead) {
        if (c < 1.0 && w > 0) { const p = c / 1.0, e = p * p * (3 - 2 * p), ya = CAL.y0 + 4 + coinY + offCoin, yb = CAL.y1 - 5 + docY + offDoc;
          tr(cBead, CAL.x, ya + (yb - ya) * e); op(cBead, w * (p < 0.15 ? p / 0.15 : p > 0.88 ? (1 - p) / 0.12 : 1)); }
        else { if (w === 0) tr(cBead, 0, 0); op(cBead, 0); }
      }
      if (gChk) { const p = seg(c, 2.1, 2.25), f = 1 - seg(c, 2.5, 3.2); op(gChk, w * p * f); }
      for (let k = 0; k < 3; k++) {
        const Ar = arrows[k], d = c - (2.6 + 0.35 * k), B = aBeads[k];
        if (d >= 0 && d < 0.9 && w > 0) { const p = d / 0.9, e = p * p * (3 - 2 * p), ya = Ar.y0 + 4 + docY + offDoc, yb = Ar.y1 - 6;
          tr(B, Ar.x, ya + (yb - ya) * e); op(B, w * (p < 0.15 ? p / 0.15 : p > 0.88 ? (1 - p) / 0.12 : 1)); }
        else { if (w === 0) tr(B, 0, 0); op(B, 0); }
        const Pg = pings[k], f = d - 0.9;
        if (f >= 0 && f < 1.1 && w > 0) { const e = o2(f / 1.1); sc(Pg.P, 1 + 1.4 * e, Pg.cx, Pg.cy); op(Pg.P, 0.9 * (1 - e) * w); }
        else { if (w === 0) sc(Pg.P, 1, Pg.cx, Pg.cy); op(Pg.P, 0); }
      }
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
