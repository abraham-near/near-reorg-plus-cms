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
 *   (fade to .3, shrink to .7) and comes back, a new pair every .45 s (each dip lasts .9 s, so two pairs overlap).
 * Idle, v4 (LIVE: the host sits in .layer--v4, where idle runs whenever the station is at rest on screen, scroll or not): "alive while seen", several
 *   out-of-phase loops, all x w, all along iso axes (vertical or the floor's +-30 deg diagonals):
 *     the plates hover 2.6 units up/down the iso vertical (5.8 s, phases 2.1 rad apart, so the gaps open and close by up to ~4.5);
 *     a green scan line (a hairline + a faint trailing tint band, clipped to the plate's top face) sweeps across one plate's face along its rows' axis,
 *       2.4 s every 4.8 s, top -> middle -> bottom in turn; the dots it passes swell (+45 %) as it reads them;
 *     the scramble is stronger (dips to .12 opacity / .55 scale) and every 5.3 s one row (hashed plate + row) is retyped: backspaced right to left
 *       (.45 s), blank, then typed left to right (.9 s);
 *     the locks click in turn (7.8 s each, 2.6 s apart): the keyhole goes dark, the shackle lifts 2.2, drops shut, the keyhole relights with a pop;
 *     a packet of three tiny green iso tiles rides the floor grid along the front (left tip -> front -> right tip, turning at a grid crossing; 4.6 s
 *       every 9.2 s, direction alternating), under the plates' front edges;
 *     the PRIVATE tag's dot swells and a green hairline ring pulses out of it (1.7 s every 2.6 s).
 *   The added nodes (a clip + scan group per plate, the three packet tiles on the floor, the ring in the tag) exist only when LIVE and are display:none
 *   at w = 0; v1 / v3 get none of this (their idle is the one above, unchanged). */
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
/* LIVE geometry (art units, the top plate's face; the others sit SEP, 2 SEP lower): P0 its back-left corner, V along its rows (back-left edge), W across them
   (left-front edge) */
const P0X = 66.0391, P0Y = 51.9771, VX = 118.111, VY = -68.186, WX = 131.219, WY = 75.79;
/* the packet's route on the floor grid: in at the left tip along a grid line (B9), turn at its crossing with A8, out at the right tip */
const PAX = 20.0078, PAY = 180.197, PCX = 197.15, PCY = 282.45, PBX = 374.293, PBY = 180.197;
const PL1 = Math.hypot(PCX - PAX, PCY - PAY), PLT = PL1 + Math.hypot(PBX - PCX, PBY - PCY), PGAP = 7;
const PKO = [1, 0.6, 0.32];
const md = (x: number, p: number) => ((x % p) + p) % p;
let UID = 0;

type Live = {
  scanG: SVGGElement[]; iScan: number; dotS: Float64Array; rows: number[][]; /* per plate: [start, count, start, count, ...] (dot index within the plate) */
  pk: SVGGraphicsElement[]; iPk: number; ring: SVGCircleElement; iTagDot: number;
};
type Rig = {
  M: DOMMatrix; tf: SVGTransform[]; cx: number[]; cy: number[];
  fHalf: SVGPathElement[]; fFill: SVGPathElement; fEdge: SVGPathElement;
  grid: SVGPathElement[]; gridK: number[]; gridG: SVGPathElement;
  arrows: SVGGraphicsElement; plates: SVGGElement;
  iPlate: number; iShk: number; iKey: number; iDot: number; iTag: number;
  lines: SVGGraphicsElement[]; keys: SVGGraphicsElement[]; dots: SVGGraphicsElement[];
  tag: SVGGraphicsElement; tagDot: SVGGraphicsElement;
  lv: Live | null;
};

export function create(host: HTMLElement): Vignette {
  const u = ++UID;
  const LIVE = !!host.closest(".layer--v4");
  let a = 0, ready = false, R: Rig | null = null;
  /* idle offsets (additive): per plate y, per dot dip 0..1 */
  const breathe = new Float64Array(3), dip = new Float64Array(3 * NDOT), dipIdx = new Int32Array(4).fill(-1);
  /* LIVE idle state (all 0 = set(a)'s look): per dot gone (retype) / pop (scan); per plate scan pos + opacity, keyhole off / pop, shackle lift;
     the packet's tiles; the tag's ring and dot */
  const gone = new Float64Array(3 * NDOT), pop = new Float64Array(3 * NDOT);
  const scanS = new Float64Array(3), scanO = new Float64Array(3), kOff = new Float64Array(3), kPop = new Float64Array(3), shk = new Float64Array(3);
  const pkX = new Float64Array(3), pkY = new Float64Array(3), pkO = new Float64Array(3);
  let ringR = 5, ringO = 0, dotK = 1;
  /* the scramble's dip depth (opacity, scale) and the plates' breathing (amplitude, period): v1 / v3's faint values, v4's readable ones */
  const DIPO = LIVE ? 0.88 : 0.7, DIPK = LIVE ? 0.45 : 0.3, BA = LIVE ? 2.6 : 1, BP = LIVE ? 5.8 : 4.6;

  const apply = () => { if (ready) render(); };

  const art = mountArt("data", host, (svg) => {
    svg.removeAttribute("width"); svg.removeAttribute("height");
    svg.setAttribute("preserveAspectRatio", "xMidYMax meet");
    R = build(svg, u, LIVE);
    ready = true; render();
  });

  /* write cache: one slot per (element, property); a write only when the value moved */
  const SL = new Float64Array(2048).fill(NaN);
  const op = (s: number, e: SVGElement, v: number) => { const o = SL[s]; if (o === o && Math.abs(o - v) < 1e-4) return; SL[s] = v; e.style.opacity = String(v); };
  /* opacity for the LIVE-only nodes: display:none at 0 */
  const opD = (s: number, e: SVGElement, v: number) => { const o = SL[s]; if (o === o && Math.abs(o - v) < 1e-4) return; const was = o === o && o > 0; SL[s] = v; e.style.opacity = String(v); if (was !== (v > 0)) e.style.display = v > 0 ? "" : "none"; };
  /* a drawn stroke (pathLength 1, dasharray 1 2): g = how much shows; hidden = the middle of the gap (no round-cap dot at the start).
     fully drawn = no dash at all (the dashed render anti-aliases a hair differently from the art's plain stroke) */
  const dsh = (s: number, e: SVGElement, g: number) => { const v = g <= 0 ? 1.5 : 1 - g; const o = SL[s]; if (o === o && Math.abs(o - v) < 1e-4) return; SL[s] = v; e.style.strokeDashoffset = String(v); const f = v === 0 ? 1 : 0; if (SL[s + 1024] !== f) { SL[s + 1024] = f; e.style.strokeDasharray = f ? "none" : ""; } };
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
      mat(s, R, R.iShk + p, 1, 0, -2.4 * (1 - lk) - shk[p]); s += 3;
      const gk = arr ? out3(seg(A, 0.74 + d * 0.6, 0.86 + d * 0.6)) : 1 - seg(L, 0.03 + d * 0.3, 0.12 + d * 0.3);
      op(s++, R.keys[p], gk * (1 - kOff[p])); mat(s, R, R.iKey + p, (0.4 + 0.6 * gk) * (1 - 0.35 * kOff[p] + 0.3 * kPop[p]), 0, 0); s += 3;
      /* dots: typed in, row by row, left to right */
      const t0 = 0.52 + p * 0.05;
      for (let j = 0; j < NDOT; j++) {
        const q = j / (NDOT - 1), n = p * NDOT + j;
        let v;
        if (arr) v = out3(seg(A, t0 + q * 0.16, t0 + q * 0.16 + 0.06));
        else { const r0 = 0.05 + (1 - q) * 0.14 + p * 0.02; v = 1 - seg(L, r0, r0 + 0.06); }
        const dp = dip[n], gn = gone[n];
        op(s++, R.dots[n], v * (1 - DIPO * dp) * (1 - gn));
        mat(s, R, R.iDot + n, (0.3 + 0.7 * v) * (1 - DIPK * dp) * (1 - 0.7 * gn) * (1 + 0.45 * pop[n]), 0, 0); s += 3;
      }
    }
    /* ── the tag pops last ── */
    const tg = arr ? out3(seg(A, 0.84, 0.97)) : 1 - seg(L, 0, 0.14);
    op(s++, R.tag, tg);
    mat(s, R, R.iTag, arr ? 0.9 + 0.1 * tg : 0.94 + 0.06 * tg, 0, 0); s += 3;
    op(s++, R.tagDot, arr ? seg(A, 0.9, 0.99) : 1 - seg(L, 0, 0.08));
    /* ── LIVE only: the scan lines, the packet, the tag's ring and dot ── */
    const V = R.lv;
    if (V) {
      for (let p = 0; p < 3; p++) { opD(s++, V.scanG[p], scanO[p]); mat(s, R, V.iScan + p, 1, scanS[p] * WX, scanS[p] * WY); s += 3; }
      for (let i = 0; i < 3; i++) { opD(s++, V.pk[i], pkO[i] * fill); mat(s, R, V.iPk + i, 1, pkX[i], pkY[i]); s += 3; }
      opD(s++, V.ring, ringO);
      if (SL[s] !== ringR) { SL[s] = ringR; V.ring.r.baseVal.value = ringR; } s++;
      mat(s, R, V.iTagDot, dotK, 0, 0); s += 3;
    }
  }

  function idle(t: number, w: number) {
    if (!ready || art.dead()) return;
    const W = w > 0 ? w : 0;
    for (let p = 0; p < 3; p++) breathe[p] = W * BA * Math.sin((t / BP) * 2 * Math.PI + p * 2.1);
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
    if (LIVE) live(t, W);
    render();
  }

  /* v4's extra loops (see the header); W = 0 puts every one back to 0 (set(a)'s look) */
  function live(t: number, W: number) {
    const V = R && R.lv;
    gone.fill(0); pop.fill(0); scanS.fill(0); scanO.fill(0); kOff.fill(0); kPop.fill(0); shk.fill(0); pkX.fill(0); pkY.fill(0); pkO.fill(0);
    ringR = 5; ringO = 0; dotK = 1;
    if (!V || W <= 0) return;
    /* the scan: 2.4 s every 4.8 s, one plate at a time (top, middle, bottom); s runs -.1 -> 1.1 across the face, the dots near the line swell */
    const ks = Math.floor(t / 4.8), us = (t - ks * 4.8) / 2.4;
    if (us < 1) {
      const sp = md(ks, 3), sNow = -0.1 + 1.2 * us;
      scanS[sp] = sNow; scanO[sp] = W * 0.9 * cl(Math.min(us, 1 - us) / 0.12);
      for (let j = 0; j < NDOT; j++) { const n = sp * NDOT + j, d = Math.abs(V.dotS[n] - sNow) / 0.07; if (d < 1) { const b = 1 - d * d; pop[n] = W * b * b; } }
    }
    /* the retype: every 5.3 s one row backspaces (right to left, .45 s), stays blank, then types back in (left to right, .9 s) */
    const kr = Math.floor(t / 5.3), tr = t - kr * 5.3;
    if (tr < 1.8) {
      let x = (kr + 7) * 2654435761; x = (x ^ (x >>> 15)) >>> 0; x = Math.imul(x, 2246822519) >>> 0; x = (x ^ (x >>> 13)) >>> 0;
      const rp = x % 3, rw = V.rows[rp], ri = ((x >>> 8) % (rw.length / 2)) * 2, r0 = rw[ri], rn = rw[ri + 1];
      for (let j = 0; j < rn; j++) {
        const tOff = (0.45 * (rn - 1 - j)) / rn, tOn = 0.75 + (0.9 * j) / rn;
        gone[rp * NDOT + r0 + j] = W * seg(tr, tOff, tOff + 0.08) * (1 - out3(seg(tr, tOn, tOn + 0.14)));
      }
    }
    /* the locks click in turn: keyhole dark, shackle lifts, drops shut, keyhole relights with a pop (7.8 s each, 2.6 s apart, top first) */
    for (let p = 0; p < 3; p++) {
      const tl = md(t - p * 2.6, 7.8);
      if (tl > 1.5) continue;
      shk[p] = W * 2.2 * out3(seg(tl, 0.15, 0.45)) * (1 - in2(seg(tl, 0.8, 0.98)));
      kOff[p] = W * io2(seg(tl, 0, 0.25)) * (1 - seg(tl, 1.0, 1.12));
      kPop[p] = W * Math.sin(Math.PI * seg(tl, 1.0, 1.45));
    }
    /* the packet: three iso tiles along the front of the floor grid, 4.6 s every 9.2 s, the direction alternating */
    const kp = Math.floor(t / 9.2), up = (t - kp * 9.2) / 4.6;
    if (up < 1) {
      for (let i = 0; i < 3; i++) {
        let d = up * (PLT + 2 * PGAP) - i * PGAP;
        if (d < 0 || d > PLT) continue;
        pkO[i] = W * PKO[i] * cl(Math.min(d, PLT - d) / 30);
        if (kp & 1) d = PLT - d;
        if (d < PL1) { const f = d / PL1; pkX[i] = PAX + (PCX - PAX) * f; pkY[i] = PAY + (PCY - PAY) * f; }
        else { const f = (d - PL1) / (PLT - PL1); pkX[i] = PCX + (PBX - PCX) * f; pkY[i] = PCY + (PBY - PCY) * f; }
      }
    }
    /* the tag: its dot swells and a ring pulses out of it, 1.7 s every 2.6 s */
    const tt = md(t, 2.6), ph = tt / 1.7;
    dotK = 1 + 0.16 * W * Math.sin(Math.PI * cl(tt / 0.35));
    if (ph < 1) { ringR = 5 + 5.5 * out3(ph); ringO = W * 0.85 * (1 - ph) * cl(ph / 0.06); }
  }

  return {
    el: art.el,
    set(v) { if (art.dead()) return; a = v < 0 ? 0 : v > 2 ? 2 : v; apply(); },
    idle,
    dispose() { art.kill(); R = null; ready = false; },
  };
}

/* one-time restructure of the Figma export (resting look unchanged) */
function build(svg: SVGSVGElement, u: number, LIVE: boolean): Rig {
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
  const tag = $("#v2d-tag"), iTag = reg(tag, 288.445, 113.83), tagDot = kid(tag, 1);

  /* v4 only (LIVE): the extra nodes, all hidden until idle shows them */
  let lv: Live | null = null;
  if (LIVE) {
    const hide = <T extends SVGElement>(e: T) => { e.style.opacity = "0"; e.style.display = "none"; return e; };
    /* per plate: a clip (its top face) holding a moving group: a green hairline along the rows' axis + a faint tint band trailing it */
    const scanG: SVGGElement[] = [], iScan = tf.length;
    const x1 = P0X - 0.1 * VX, x2 = P0X + 1.1 * VX, bx = 0.06 * WX, by = 0.06 * WY;
    PL.forEach((g, p) => {
      const y1 = P0Y - 0.1 * VY + p * SEP, y2 = P0Y + 1.1 * VY + p * SEP, cid = `v2d${u}face${p}`;
      const cp = mk("clipPath", { id: cid }); cp.appendChild(mk("path", { d: kid(g, 3).getAttribute("d")! })); defs.appendChild(cp);
      const cg = hide(mk<SVGGElement>("g", { "clip-path": `url(#${cid})`, class: "d-scan" }));
      const mv = mk<SVGGElement>("g", {});
      mv.appendChild(mk("path", { d: `M${x1} ${y1}L${x2} ${y2}L${x2 - bx} ${y2 - by}L${x1 - bx} ${y1 - by}Z`, fill: "#00DC8D", "fill-opacity": "0.12" }));
      mv.appendChild(mk("path", { d: `M${x1} ${y1}L${x2} ${y2}`, stroke: "#00DC8D", "stroke-width": "0.9", fill: "none" }));
      cg.appendChild(mv); g.insertBefore(cg, kid(g, 5)); /* over the face and its tab, under the lock, the lines and the dots */
      reg(mv, 0, 0); scanG.push(cg);
    });
    /* each dot's place across its plate's face (0 at the back-left edge, 1 at the front-right one), for the scan; its rows (a new row where x steps back) */
    const dotS = new Float64Array(3 * NDOT), rows: number[][] = [[], [], []];
    const crs = (ax: number, ay: number, bx2: number, by2: number) => ax * by2 - ay * bx2, den = crs(WX, WY, VX, VY);
    for (let p = 0; p < 3; p++) for (let j = 0; j < NDOT; j++) {
      const n = p * NDOT + j, ix = iDot + n;
      dotS[n] = crs(cx[ix] - P0X, cy[ix] - (P0Y + p * SEP), VX, VY) / den;
      if (j === 0 || cx[ix] < cx[ix - 1] - 1) rows[p].push(j, 0);
      rows[p][rows[p].length - 1]++;
    }
    /* the packet: three tiny iso tiles (a floor square, foreshortened) on the floor, over the grid, under the plates */
    const iPk = tf.length, pk: SVGGraphicsElement[] = [];
    for (let i = 0; i < 3; i++) { const e = hide(mk<SVGPathElement>("path", { d: "M0 -1.4L2.42 0L0 1.4L-2.42 0Z", fill: "#00DC8D" })); fl.appendChild(e); reg(e, 0, 0); pk.push(e); }
    /* the tag: a hairline ring out of its green dot (under the text), the dot itself gets a matrix */
    const ring = hide(mk<SVGCircleElement>("circle", { cx: "304.107", cy: "113.83", r: "5", fill: "none", stroke: "#00DC8D", "stroke-width": "0.8" }));
    tag.insertBefore(ring, tagDot.nextSibling);
    const iTagDot = reg(tagDot, 304.107, 113.83);
    lv = { scanG, iScan, dotS, rows, pk, iPk, ring, iTagDot };
  }
  return {
    M: svg.createSVGMatrix(), tf, cx, cy,
    fHalf, fFill: dia, fEdge, grid: gridLs, gridK, gridG: grid,
    arrows: $("#v2d-arrows"), plates,
    iPlate, iShk, iKey, iDot, iTag, lines, keys, dots,
    tag, tagDot, lv,
  };
}
