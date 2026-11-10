/* hero -> statement, "the type follows the dots" (r17 v1 js/transition.js, mode "letra")
 *
 * The globe's dots detach and flow along gentle arcs straight to the glyph positions of the statement (peeled from the left), and the real vector type takes over AS SOON AS
 * each part of the text is painted: a soft front runs through every word right behind its landed dots (letter by letter), so the type chases the dots across the lines.
 * The dots under the type shrink away just after the type is opaque over them. The green marker wipes in right after the last word. Pure function of the playhead.
 *   (1) the view is captured when the morph starts (the turn holds while the pin runs and resumes at the top) and the mapping is built from what is on screen;
 *   (2) only the dots that face us travel, one per letter point, matched by vertical strips left -> right (each strip top -> bottom): no crossings in x;
 *   (3) every other dot (the far side, the limb) shrinks where it is, invisibly; (4) the letter points are sampled where a whole dot fits inside the glyph, so the opaque type
 *   covers its dots exactly (phones, with thinner type, take smaller dots).
 *
 * Beats (units of the timeline, END = 0.755; the pin is 2.5 screens (1.85 on phones), the last 0.6 of them rest):
 *   0.00 - 0.14  anticipation: the world breathes in (zoom .965) while the hero copy leaves
 *   0.05 - 0.62  the flight: sphere -> dotted lettering, peeled from the left; a dot lands at m0 + (m1 - m0) (delay * stagger + LANDQ (1 - stagger))
 *   0.24 - 0.66  the type follows: per part of the text, open = (last landing there) + LAG
 *   0.63 - 0.74  the green marker
 * With html[data-world-spin] (v3, b10's beat) the globe spins as the scroll starts: an extra SPIN over T.spin, scrubbed (fastest mid-way), while the hero copy leaves; the
 * flight starts at the fastest moment and the turn eases out while the dots fly (each dot leaves from where the turning globe has it). No breath (the globe never shrinks).
 * The mapping is built for the view at the middle of the remaining turn; the dots keep their alpha in flight (keepVis off), so one that turns away still lands.
 * Every beat from the flight on moves later by SPIN_SHIFT and the pin is longer by SPIN_PIN screens, so the rest keeps its pace. */
import type { gsap } from "gsap";
import { textItemsFromDom, N_PATH, N_VIEWBOX, KEEP, rotation } from "./globe";
import { introOwnsTurn } from "./intro";
import type { WorldCtx } from "./boot";

/** b10's spin as the break starts (v3 sets html[data-world-spin]): an extra 0.36 of a turn over ~0.9 screens of scroll, overlapping the flight's start */
const spinOn = () => typeof document !== "undefined" && document.documentElement.hasAttribute("data-world-spin");
const SPIN = Math.PI * 2 * 0.36;
const SPIN_W = 0.36;                    /* END units: the turn's window from the top (fastest at its middle) */
const SPIN_SHIFT = SPIN_W / 2 - 0.05;   /* the flight (m0, 0.05 without the spin) moves to the turn's middle */
const SPIN_AT = 0.26;                   /* the mapping's view (85 % of the turn): about where the dots leave, on average (the left half leave while it turns, the rest after) */
const SPIN_PIN = 0.33, SPIN_PIN_MOBILE = 0.22;   /* SPIN_SHIFT at the pin's pace, in screens */

/* read when the boot starts (getters), so the pin is longer only where the spin runs */
export const config = {
  get pin() { return 2.5 + (spinOn() ? SPIN_PIN : 0); },
  get pinMobile() { return 1.85 + (spinOn() ? SPIN_PIN_MOBILE : 0); },
  rest: 0.6,
};

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const T0 = {
  spin: 0,                                          /* the spin before the break (0: none) */
  exit: 0.0, exitDur: 0.11, exitStagger: 0.024,
  breath: 0.05, breathBack: 0.14,
  m0: 0.05, m1: 0.62, stag: 0.62, landQ: 0.88,      /* a dot reads as landed at 88 % of its own eased window (inout3: 99 % of the way) */
  jitter: 0.06, arc: 0.26,                          /* the delay texture and the path bend */
  lag: 0.022,                                       /* ~45 px at 1440x900: the dotted letter is legible for a breath before the type takes it */
  lead: 0.014,                                      /* the soft edge fades in this long before the first letter of a word opens */
  bins: 14,                                         /* resolution of the front inside a word */
  feather: 0.3,                                     /* the dissolve edge, as a fraction of a word (matches statement.css) */
  shrink: 0.025,                                    /* a dot's own shrink window, starts when the type is opaque over it */
  b0: 0.22, b1: 0.665,                              /* channel B (the shrink) runs over this window; every open time falls inside it */
  mark0: 0.632, markDur: 0.11,
  END: 0.755,
};
/* the beats with the spin first: the hero exit and the breath stay where they are (the copy leaves while the globe turns), everything else moves later */
const withSpin = (t: typeof T0, d: number) => ({ ...t, spin: SPIN_W, m0: t.m0 + d, m1: t.m1 + d, b0: t.b0 + d, b1: t.b1 + d, mark0: t.mark0 + d, END: t.END + d });
const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const hash = (j: number) => { const s = Math.sin(j * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };

type Rect = { x0: number; x1: number; y0: number; y1: number };
type Rec = { el: Element; r: Rect; env: Float32Array; last: number; O: Float32Array; open0: number; open1: number; c?: number };
type Layout = { M: number; xs: Float32Array; ys: Float32Array; dly: Float32Array; dB: Float32Array; cut: Uint32Array; NS: number; ordP: Uint32Array; s: number; pitch: number; sd: number };

export default function setup(ctx: WorldCtx): gsap.core.Timeline {
  const G = ctx.gsap, g = ctx.globe!, S = ctx.statement!, U = g.uniforms;
  const T = spinOn() ? withSpin(T0, SPIN_SHIFT) : T0;
  const turn = (t: number) => (T.spin ? SPIN * easeInOut(clamp(t / T.spin, 0, 1)) : 0);   /* the extra yaw at timeline time t */

  let recs: Rec[] = [], lastP = 0, L: Layout | null = null;          /* L: the layout (letter points, strips, delays, shrink times); rebuilt on resize */
  let held: { yaw: number; pitch: number } | null = null;            /* the view while the pin runs (null = the globe turns freely); with the spin it turns from base to target */
  let base: { yaw: number; pitch: number } | null = null, target: { yaw: number; pitch: number } | null = null;   /* the view captured when the pin starts, and where the spin lands */
  let assignedFor: { L: Layout; yaw: number; pitch: number } | null = null;   /* the layout + view the channels were last built for */
  const rot = new Float32Array(9), proj = { x: new Float32Array(0), y: new Float32Array(0), z: new Float32Array(0) };

  ctx.onLayout(() => {
    const org = g.stageRect(), pad = 6;
    /* 1. the real type, measured: one record per word, + the N mark */
    const els: Element[] = S.words, items = textItemsFromDom(g, els);
    const rects: Rect[] = els.map((el) => { const r = el.getBoundingClientRect(); return { x0: r.left - org.left, x1: r.right - org.left, y0: r.top - org.top, y1: r.bottom - org.top }; });
    const nmark = S.nmark!, nr = nmark.getBoundingClientRect();
    const nBox = { x: nr.left - org.left, y: nr.top - org.top, w: nr.width, h: nr.height };
    const mk = (el: Element, r: Rect): Rec => ({ el, r, env: new Float32Array(T.bins), last: 0, O: new Float32Array(T.bins), open0: 0, open1: 0 });
    recs = rects.map((r, k) => mk(els[k], r));
    recs.push(mk(nmark, { x0: nBox.x, x1: nBox.x + nBox.w, y0: nBox.y, y1: nBox.y + nBox.h }));

    /* 2. raster of the type + the N */
    let bx0 = nBox.x, by0 = nBox.y, bx1 = nBox.x + nBox.w, by1 = nBox.y + nBox.h;
    for (const r of rects) { bx0 = Math.min(bx0, r.x0); by0 = Math.min(by0, r.y0); bx1 = Math.max(bx1, r.x1); by1 = Math.max(by1, r.y1); }
    const bounds = { x: Math.floor(bx0 - pad), y: Math.floor(by0 - pad), w: Math.ceil(bx1 - bx0 + 2 * pad), h: Math.ceil(by1 - by0 + 2 * pad) };
    const SC = 2, cv = document.createElement("canvas"); cv.width = bounds.w * SC; cv.height = bounds.h * SC;
    const cx = cv.getContext("2d", { willReadFrequently: true })!;
    cx.setTransform(SC, 0, 0, SC, 0, 0); cx.fillStyle = "#000"; cx.textBaseline = "alphabetic";
    cx.translate(-bounds.x, -bounds.y);
    for (const it of items) { cx.font = it.font; if ("letterSpacing" in cx) cx.letterSpacing = (it.ls || 0) + "px"; cx.fillText(it.text, it.x, it.y); }
    cx.save(); cx.translate(nBox.x, nBox.y); cx.scale(nBox.w / N_VIEWBOX[0], nBox.h / N_VIEWBOX[1]); cx.fill(new Path2D(N_PATH)); cx.restore();
    const img = cx.getImageData(0, 0, cv.width, cv.height).data, IW = cv.width, IH = cv.height;
    /* distance (raster px) from every ink pixel to the nearest paper pixel (a two-pass chamfer): a dot fits where that distance >= its radius */
    const dist = new Float32Array(IW * IH), R2 = Math.SQRT2;
    for (let i = 0; i < IW * IH; i++) dist[i] = img[4 * i + 3] > 127 ? 1e6 : 0;
    for (let y = 0; y < IH; y++) for (let x = 0, i = y * IW; x < IW; x++, i++) {
      if (!dist[i]) continue;
      let v = dist[i];
      v = x > 0 ? Math.min(v, dist[i - 1] + 1) : Math.min(v, 1);
      if (y > 0) { v = Math.min(v, dist[i - IW] + 1); if (x > 0) v = Math.min(v, dist[i - IW - 1] + R2); if (x < IW - 1) v = Math.min(v, dist[i - IW + 1] + R2); } else v = Math.min(v, 1);
      dist[i] = v;
    }
    for (let y = IH - 1; y >= 0; y--) for (let x = IW - 1, i = y * IW + x; x >= 0; x--, i--) {
      if (!dist[i]) continue;
      let v = dist[i];
      v = x < IW - 1 ? Math.min(v, dist[i + 1] + 1) : Math.min(v, 1);
      if (y < IH - 1) { v = Math.min(v, dist[i + IW] + 1); if (x < IW - 1) v = Math.min(v, dist[i + IW + 1] + R2); if (x > 0) v = Math.min(v, dist[i + IW - 1] + R2); } else v = Math.min(v, 1);
      dist[i] = v;
    }
    const solid = (x: number, y: number, rr: number) => { const px = Math.round(x * SC), py = Math.round(y * SC); return px >= 0 && py >= 0 && px < IW && py < IH && dist[py * IW + px] >= rr * SC; };   /* x, y: px inside the bounds */

    /* 3. hex-grid sampling: as many letter points as there are dots facing us (they all go to the text), each one a whole dot inside the glyph */
    const want = Math.max(200, Math.floor(0.97 * countFront(0.2)));
    type Sample = { pitch: number; xs: Float32Array; ys: Float32Array };
    const sample = (pitch: number, rr: number): Sample => {
      const rowH = pitch * 0.866, ax: number[] = [], ay: number[] = []; let r = 0;
      for (let y = rowH * 0.5; y < bounds.h; y += rowH, r++) {
        const off = (r & 1) ? pitch * 0.5 : 0;
        for (let x = off + pitch * 0.25; x < bounds.w; x += pitch) if (solid(x, y, rr)) { ax.push(bounds.x + x); ay.push(bounds.y + y); }
      }
      return { pitch, xs: Float32Array.from(ax), ys: Float32Array.from(ay) };
    };
    /* the smallest pitch (>= minP) whose sample fits the dots that face us, for a fixed erosion (the count is then monotone in the pitch): a bisection */
    const fit = (rr: number, minP: number) => {
      let best = sample(minP, rr);
      if (best.xs.length <= want) return best;
      let lo = minP, hi = minP * 1.4;
      for (let r = sample(hi, rr); r.xs.length > want; r = sample(hi, rr)) { lo = hi; hi *= 1.3; }
      best = sample(hi, rr);
      for (let k = 0; k < 9 && best.xs.length < want * 0.985; k++) { const mid = (lo + hi) / 2, r = sample(mid, rr); if (r.xs.length > want) lo = mid; else { hi = mid; best = r; } }
      return best;
    };
    /* the largest dot that sits (mostly: ERODE of its radius) inside the strokes with enough points; thin type (phones) takes smaller dots. Its sliver of rim that may cross the
       glyph edge lives only for the breath between the type going opaque and the dot's own shrink (channel B) */
    const ERODE = 0.6;
    let best: Sample | null = null, sd = 0;
    for (sd of [2.9, 2.6, 2.3, 2.05, 1.8, 1.6, 1.4, 1.25]) { best = fit(sd * 0.5 * ERODE, clamp(sd * 0.85, 1.1, 1.8)); if (best.xs.length >= want * 0.85) break; }
    const { xs, ys, pitch } = best!, M = xs.length;
    const s = Math.min(sd, clamp(pitch * 0.95, 1.2, 4.6));
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    for (let i = 0; i < M; i++) { minX = Math.min(minX, xs[i]); maxX = Math.max(maxX, xs[i]); minY = Math.min(minY, ys[i]); maxY = Math.max(maxY, ys[i]); }
    const w = Math.max(1, maxX - minX), h = Math.max(1, maxY - minY);

    /* 4. the delay field: peeled from the left (a little top first), + a little texture */
    const dly = new Float32Array(M);
    for (let j = 0; j < M; j++) dly[j] = clamp((clamp(0.8 * ((xs[j] - minX) / w) + 0.2 * ((ys[j] - minY) / h), 0, 1) + T.jitter * hash(j)) / (1 + T.jitter), 0, 1);

    /* 5. the strips: the letter points by x, cut into NS strips of equal count, each sorted top -> bottom (the dots are cut the same way at assign time) */
    const NS = Math.max(4, Math.round(Math.sqrt(M) / 1.15));
    const byX = new Uint32Array(M); for (let j = 0; j < M; j++) byX[j] = j;
    byX.sort((a, b) => xs[a] - xs[b]);
    const cut = new Uint32Array(NS + 1); for (let k = 0; k <= NS; k++) cut[k] = Math.round((k * M) / NS);
    const ordP = new Uint32Array(M);
    for (let k = 0; k < NS; k++) ordP.set(Array.from(byX.subarray(cut[k], cut[k + 1])).sort((a, b) => ys[a] - ys[b] || xs[a] - xs[b]), cut[k]);

    /* 6. when is each part of the text painted? every letter point -> its word (nearest box) and its place u (0..1) across it; its landing time from its delay */
    const owner = new Int32Array(M), uOf = new Float32Array(M);
    const land = (d: number) => T.m0 + (T.m1 - T.m0) * (d * T.stag + T.landQ * (1 - T.stag));
    const NB = T.bins;
    for (const rec of recs) { rec.env.fill(-1); rec.last = 0; }
    for (let j = 0; j < M; j++) {
      const x = xs[j], y = ys[j];
      let bi = 0, bd = 1e9;
      for (let k = 0; k < recs.length; k++) {
        const q = recs[k].r, dx = Math.max(q.x0 - x, 0, x - q.x1), dy = Math.max(q.y0 - y, 0, y - q.y1), d = dx * dx + dy * dy;
        if (d < bd) { bd = d; bi = k; if (!d) break; }
      }
      const rec = recs[bi], u = clamp((x - rec.r.x0) / Math.max(1, rec.r.x1 - rec.r.x0), 0, 1), Lt = land(dly[j]);
      owner[j] = bi; uOf[j] = u;
      const b = Math.min(NB - 1, Math.floor(u * NB));
      if (Lt > rec.env[b]) rec.env[b] = Lt;
      if (Lt > rec.last) rec.last = Lt;
    }
    /* open times: a monotone front per word (the type at u opens once every dot up to u has landed, + lag) */
    for (const rec of recs) {
      const O = rec.O; let m = -1, first = -1;
      for (let b = 0; b < NB; b++) if (rec.env[b] >= 0) { first = rec.env[b]; break; }
      if (first < 0) first = rec.last || T.m1;
      for (let b = 0; b < NB; b++) { m = Math.max(m, rec.env[b] >= 0 ? rec.env[b] : m < 0 ? first : m); O[b] = m + T.lag; }
      rec.open0 = O[0] - T.lead; rec.open1 = O[NB - 1];
    }
    /* 7. channel B: each letter point's dot shrinks to nothing once the type is opaque over it */
    const span = T.b1 - T.b0, dB = new Float32Array(M);
    for (let j = 0; j < M; j++) dB[j] = clamp((opaqueAt(recs[owner[j]], uOf[j]) + 0.004 - T.b0) / span, 0, 1);

    L = { M, xs, ys, dly, dB, cut, NS, ordP, s, pitch, sd };
    assignedFor = null;
    assign();
    wipe(lastP, true);
  });

  /* the dots of the globe as they are on screen for a view: x, y (stage px), z (facing us > 0) */
  function project(view: { yaw: number; pitch: number }) {
    const D = g.dots, n = D.n, p = D.pos, b = g.box;
    if (proj.x.length !== n) { proj.x = new Float32Array(n); proj.y = new Float32Array(n); proj.z = new Float32Array(n); }
    rotation(rot, view.yaw, view.pitch, g.cfg.roll);
    for (let i = 0; i < n; i++) {
      const x = p[3 * i], y = p[3 * i + 1], z = p[3 * i + 2];
      proj.x[i] = b.cx + (rot[0] * x + rot[1] * y + rot[2] * z) * b.r;
      proj.y[i] = b.cy - (rot[3] * x + rot[4] * y + rot[5] * z) * b.r;
      proj.z[i] = rot[6] * x + rot[7] * y + rot[8] * z;
    }
    return proj;
  }
  function countFront(zmin: number) { const P = project(g.view()); let c = 0; for (let i = 0; i < P.z.length; i++) if (P.z[i] > zmin) c++; return c; }

  /* the channels for the current view: the M dots that face us most, cut into the letter points' strips by x (each strip by y), k-th dot -> k-th point */
  function assign() {
    if (!L) return;
    const view = target || held || g.view();
    if (assignedFor && assignedFor.L === L && assignedFor.yaw === view.yaw && assignedFor.pitch === view.pitch) return;
    assignedFor = { L, yaw: view.yaw, pitch: view.pitch };
    const D = g.dots, n = D.n, total = D.total, P = project(view), M = Math.min(L.M, n);
    const front = new Uint32Array(n); for (let i = 0; i < n; i++) front[i] = i;
    front.sort((a, b) => P.z[b] - P.z[a]);
    const src = Array.from(front.subarray(0, M)).sort((a, b) => P.x[a] - P.x[b]);
    const dA = new Float32Array(4 * total), dBt = new Float32Array(4 * total);
    let gx0 = 1e9, gx1 = -1e9; for (let k = 0; k < M; k++) { gx0 = Math.min(gx0, P.x[src[k]]); gx1 = Math.max(gx1, P.x[src[k]]); }
    /* every other dot (the far side, the limb, the outline ring): shrinks where it is, as the peel passes it */
    for (let i = 0; i < total; i++) {
      dA[4 * i] = KEEP; dA[4 * i + 1] = KEEP; dA[4 * i + 2] = 0;
      dA[4 * i + 3] = i < n ? clamp((P.x[i] - gx0) / Math.max(1, gx1 - gx0), 0, 1) * 0.8 : 0;
      dBt[4 * i] = KEEP; dBt[4 * i + 1] = KEEP; dBt[4 * i + 2] = i < n ? -1 : 0; dBt[4 * i + 3] = 0;
    }
    const { cut, NS, ordP, xs, ys, dly, dB } = L;
    for (let k = 0; k < NS; k++) {
      const seg = src.slice(cut[k], cut[k + 1]).sort((a, b) => P.y[a] - P.y[b] || P.x[a] - P.x[b]);
      for (let q = 0; q < seg.length; q++) {
        const i = seg[q], j = ordP[cut[k] + q];
        dA[4 * i] = xs[j]; dA[4 * i + 1] = ys[j]; dA[4 * i + 2] = 1; dA[4 * i + 3] = dly[j];
        dBt[4 * i] = xs[j]; dBt[4 * i + 1] = ys[j]; dBt[4 * i + 2] = 0; dBt[4 * i + 3] = dB[j];
      }
    }
    const s = L.s, span = T.b1 - T.b0;
    g.bind("A", { name: "dotted-type", total, data: dA, defaults: { size: [s, s], alpha: [1, 1], stagger: T.stag, ease: "inout3", arc: T.arc, keepVis: !T.spin } });
    g.bind("B", { name: "dotted-type-out", total, data: dBt, defaults: { size: [s, s], alpha: [1, 1], stagger: span / (span + T.shrink), ease: "inout2", arc: 0, keepVis: false } });
  }

  /* the turn holds while the morph runs (so the mapping matches the screen), and resumes at the top if it was turning. With the hero intro (intro.ts) the turn always
     resumes: the intro drives the camera with the turn off and turns it on when it lands (its end state always turns), and `spinning` is read a frame late: a hold that starts
     during the intro or on its landing frame found it off, and the globe would stand still for good at the top. */
  let spinning: boolean | null = null, wasSpinning = false;
  ctx.offs.push(g.onFrame((dt, now, st) => { spinning = !!st.auto; if (held) g.setView(held); }));
  function hold(p: number) {
    if (p > 0 && !held) {
      base = g.view(); target = { yaw: base.yaw + turn(SPIN_AT), pitch: base.pitch }; held = { ...base };
      wasSpinning = spinning !== false || introOwnsTurn(); g.setRotation(false); assign();
    }
    else if (p <= 0 && held) { held = null; base = target = null; assignedFor = null; if (wasSpinning) g.setRotation(true); }
    if (held && base && T.spin) held.yaw = base.yaw + turn(p * T.END);   /* the spin, scrubbed; the onFrame hook applies it */
  }

  /* the time the type is fully opaque at place u of a word */
  function opaqueAt(rec: Rec, u: number) { return rec.O[Math.min(T.bins - 1, Math.floor(u * T.bins))]; }
  /* --c of a word at time t */
  function cAt(rec: Rec, t: number) {
    const O = rec.O, NB = T.bins, f0 = T.feather / (1 + T.feather);
    if (t < O[0]) return f0 * clamp((t - rec.open0) / T.lead, 0, 1);      /* the soft edge arrives just before the first letter */
    if (t >= O[NB - 1]) return 1;
    let b = 0; while (b < NB - 1 && O[b + 1] <= t) b++;                   /* opaque through bin b; inside bin b + 1, interpolate */
    const a = O[b], z = O[b + 1], fr = z > a ? clamp((t - a) / (z - a), 0, 1) : 1;
    const u = (b + 1 + fr) / NB;
    return clamp((Math.min(1, u) + T.feather) / (1 + T.feather), 0, 1);
  }
  function wipe(p: number, force: boolean) {
    lastP = p;
    const t = p * T.END;
    for (let i = 0; i < recs.length; i++) {
      const rec = recs[i];
      const c = cAt(rec, t);
      if (!force && rec.c === c) continue;
      rec.c = c;
      (rec.el as HTMLElement).style.setProperty("--c", c.toFixed(4));
      rec.el.classList.toggle("is-open", c >= 1);
    }
  }
  ctx.offs.push(ctx.progress((p) => { hold(p); wipe(p, false); }));
  ctx.offs.push(() => { for (const rec of recs) { (rec.el as HTMLElement).style.removeProperty("--c"); rec.el.classList.remove("is-open"); } });

  /* ───────── the timeline (END units) ───────── */
  const tl = G.timeline();
  U.uZoomSize.value = 0.4;
  if (!T.spin) {   /* the breath (the world zooms in a little); the spin replaces it */
    tl.to(U.uZoom, { value: 0.965, duration: T.breath, ease: "power2.out" }, 0);
    tl.to(U.uZoom, { value: 1, duration: T.breathBack - T.breath, ease: "power3.inOut" }, T.breath);
  }
  heroExit(tl, T.exit, T.exitDur, T.exitStagger);
  function heroExit(tl: gsap.core.Timeline, at: number, dur: number, st: number) {
    const H = ctx.hero, lines = H.lines, subs = ctx.mobile ? [H.sub!] : H.subLines, ease = "power3.inOut";
    lines.forEach((el, i) => tl.to(el, { yPercent: -(i + 1) * 100 - 60, duration: dur, ease }, at + i * st));
    const s0 = at + st * lines.length * 0.7;
    subs.forEach((el, i) => tl.to(el, { yPercent: -(i + 1) * 100 - 55, duration: dur, ease }, s0 + i * st));
    const end = s0 + st * subs.length + dur;
    tl.to(H.cta, { autoAlpha: 0, y: -18, duration: dur * 0.6, ease: "power2.in" }, s0 + st * subs.length + dur * 0.1);
    tl.set(H.el, { autoAlpha: 0 }, end + 0.001);
    return end;
  }
  /* the flight: LINEAR (the shader eases every dot on its own staggered window) */
  tl.to(U.uMorphA, { value: 1, duration: T.m1 - T.m0, ease: "none" }, T.m0);
  /* the type follows the dots: the section is visible from the first open (words still masked, see wipe()); the dots under it leave on channel B */
  tl.set(S.el, { opacity: 1 }, T.b0 - 0.01);
  tl.to(U.uMorphB, { value: 1, duration: T.b1 - T.b0 + T.shrink, ease: "none" }, T.b0);
  if (S.mark) tl.fromTo(S.mark, { "--mark": 0 }, { "--mark": 1, duration: T.markDur, ease: "power3.inOut" }, T.mark0);
  tl.set({}, {}, T.END);
  return tl;
}
