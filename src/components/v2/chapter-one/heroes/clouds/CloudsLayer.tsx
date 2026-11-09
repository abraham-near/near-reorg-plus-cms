"use client";

import { useEffect, useRef } from "react";
import type { Ell, Pt } from "../../cinematic/geom";
import type { Tone } from "../../cinematic/vec";
import { ALT, AXIS_TOP, BASE, MARKS, RUNGS, LINES, ORB, PINS, SUMMIT, SUMMIT_LINE, TOPS, TOP_DROP, breathe, flicker, needle, orbitRing, orbitSquare, pinRing, rider, type LineKey } from "./design";
import { lineAt, lineTicks, type LineAt } from "./lines";
import { Still } from "./Still";
import styles from "./CloudsLayer.module.css";

// The "Above the clouds" hero's layer (D90), tracked to its camera move. Nothing plays on its own: the frame is the
// video's frame on screen, so the marks only move with the reader's scroll. Phones, tablets, reduced motion and no-JS
// show the SVG still (the first frame); desktop with motion draws every frame on a canvas, the same marks carried by the
// footage: the ridge lines point by point on their crests (thinning where cloud rolls over them), the summit's sight,
// altimeter and orbit with the massif, tree tops and survey pins on the forest as it rises into view. A little life
// follows the scroll too: markers travel round the orbit, the altimeter's needle falls as the camera descends, the
// pins on the slope that rises into view grow up from their trees. And it stays alive when the scroll rests (D44): on an
// ambient clock a small ring rides the orbit round the summit, the altimeter's inner ticks breathe, the pins' rings
// draw on and off in turn and a few marks fade down and back (design.ts); never a light along a line. The layer thins towards the headline and keeps
// clear of its text (D49, D64-D66). Token colours only.
type Motion = { frames: number; step: number; at: number[]; lines: Record<LineKey, { d: number[][]; v: number[][] }>; massif: number[][] };

const FPS = 24, VW = BASE.w, VH = BASE.h;
const KEYS = Object.keys(LINES) as LineKey[];
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (v: number) => { const t = clamp(v); return t * t * (3 - 2 * t); };
const rad = (d: number) => (d * Math.PI) / 180;

// An ellipse's point and outward normal at t (cinematic/geom's convention: degrees, clockwise from 3 o'clock)
function ePt(e: Ell, t: number, s = 1): Pt {
  const a = rad(t), r = rad(e.rot ?? 0), x = e.rx * s * Math.cos(a), y = e.ry * s * Math.sin(a);
  return [e.cx + x * Math.cos(r) - y * Math.sin(r), e.cy + x * Math.sin(r) + y * Math.cos(r)];
}
function eNorm(e: Ell, t: number): Pt {
  const a = rad(t), r = rad(e.rot ?? 0), nx = Math.cos(a) / e.rx, ny = Math.sin(a) / e.ry;
  const x = nx * Math.cos(r) - ny * Math.sin(r), y = nx * Math.sin(r) + ny * Math.cos(r), l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
}
const arcPts = (e: Ell, t0: number, t1: number, s = 1) => {
  const n = Math.max(8, Math.ceil(Math.abs(t1 - t0) / 2));
  return Array.from({ length: n + 1 }, (_, i) => ePt(e, t0 + ((t1 - t0) * i) / n, s));
};
// Tick segments along an ellipse, as [from, to] pairs
const tickSegs = (e: Ell, t0: number, t1: number, step: number, len: number, major = 0, majorLen = len, s = 1) => {
  const out: [Pt, Pt][] = [];
  for (let t = t0, i = 0; t <= t1 + 1e-6; t += step, i++) {
    const p = ePt(e, t, s), n = eNorm(e, t), l = major && i % major === 0 ? majorLen : len;
    out.push([p, [p[0] + n[0] * l, p[1] + n[1] * l]]);
  }
  return out;
};

// The rigid pieces on the massif, in the first frame's pixels
const RIG = {
  orbFar: arcPts(ORB, 180, 360), orbNear: arcPts(ORB, 0, 180), orbOuter: arcPts(ORB, 20, 160, 1.18),
  orbTicks: tickSegs(ORB, 10, 170, 2, 5, 5, 13),
  alt: arcPts(ALT, 226, 314), altDeep: arcPts(ALT, 262, 270),
  altTicks: tickSegs(ALT, 226, 314, 2, 5, 5, 10), altIn: tickSegs(ALT, 226, 314, 1, -3.5),
  ladder: Array.from({ length: RUNGS }, (_, i) => { const h = i % 4 === 0 ? 8.7 : 4.35, y = SUMMIT[1] - 35 - i * 8.7; return [[SUMMIT[0] - h, y], [SUMMIT[0] + h, y]] as [Pt, Pt]; }),
};

export function CloudsLayer() {
  const ref = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = ref.current, canvas = canvasRef.current;
    const media = host?.closest<HTMLElement>("[data-ch='media']");
    const g = canvas?.getContext("2d");
    if (!host || !canvas || !media || !g) return;
    const video = media.querySelector<HTMLVideoElement>("[data-ch='video']");
    const img = media.querySelector<HTMLImageElement>("img");
    const copyEl = host.closest("[data-ch='root']")?.querySelector<HTMLElement>("[data-ch='copy']") ?? null;
    const playing = () => !!video?.hasAttribute("data-ready");

    // Token colours, as rgb triples
    const css = getComputedStyle(document.documentElement);
    const rgb = (n: string) => {
      const v = css.getPropertyValue(n).trim();
      if (v.startsWith("#")) { const h = v.length === 4 ? v.replace(/(\w)/g, "$1$1").slice(1) : v.slice(1); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(","); }
      return (v.match(/[\d.]+/g) ?? ["0", "0", "0"]).slice(0, 3).join(",");
    };
    const COL: Record<Tone, string> = { ink: rgb("--color-ink"), deep: rgb("--color-green-text"), green: rgb("--color-green"), white: rgb("--color-white") };
    const rgba = (t: Tone, a: number) => `rgba(${COL[t]},${clamp(a).toFixed(3)})`;

    let motion: Motion | null = null, dead = false;
    // The frame on screen: the presented frame's own time where the browser reports it (during a seek currentTime is
    // already the target while the old frame still shows), otherwise the last time while seeking
    let shownT = 0, vfc = 0;
    const hasVFC = !!video && "requestVideoFrameCallback" in video;
    if (video && hasVFC) {
      const onFrame = (_: number, m: VideoFrameCallbackMetadata) => { shownT = m.mediaTime; vfc = video.requestVideoFrameCallback(onFrame); };
      vfc = video.requestVideoFrameCallback(onFrame);
    }
    const frameNow = () => {
      if (!playing() || !motion) return 0;
      if (!hasVFC && !video!.seeking) shownT = video!.currentTime;
      return clamp(shownT * FPS, 0, motion.frames - 1);
    };

    // One frame's data: each line's control displacements and clearness, and the massif's similarity
    const dataAt = (f: number) => {
      if (!motion || f <= 0) return { lines: Object.fromEntries(KEYS.map((k) => [k, { d: BASE.lines[k].d0, v: BASE.lines[k].v0 }])) as unknown as Record<LineKey, { d: ArrayLike<number>; v: ArrayLike<number> }>, m: [1, 0, 0, 0, 1, 0] };
      const k = f / motion.step, i0 = Math.min(Math.floor(k), motion.at.length - 1), i1 = Math.min(i0 + 1, motion.at.length - 1);
      const u = i1 > i0 ? (f - motion.at[i0]) / (motion.at[i1] - motion.at[i0]) : 0;
      const mix = (a: number[], b: number[]) => a.map((v, i) => v + (b[i] - v) * u);
      const lines = Object.fromEntries(KEYS.map((key) => { const L = motion!.lines[key]; return [key, { d: mix(L.d[i0], L.d[i1]), v: mix(L.v[i0], L.v[i1]) }]; })) as Record<LineKey, { d: number[]; v: number[] }>;
      return { lines, m: mix(motion.massif[i0], motion.massif[i1]) };
    };

    // The headline's text as a box relative to its block (its lines and its button), measured once per size
    let tight: [number, number, number, number] | null = null, tightKey = "";
    const textBox = (el: HTMLElement, a: DOMRect): [number, number, number, number] | null => {
      let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
      const grow = (q: DOMRect) => { l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom); };
      const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), range = document.createRange();
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        if (!n.textContent?.trim()) continue;
        range.selectNodeContents(n);
        for (const q of range.getClientRects()) grow(q);
      }
      el.querySelectorAll("a, button").forEach((q) => grow(q.getBoundingClientRect()));
      return r > l ? [l - a.left, t - a.top, r - l, b - t] : null;
    };

    let W = 0, H = 0, dpr = 1, key = "", raf = 0, inView = true, pos = [0.3, 0.5], posKey = "";
    let lastStill = "", lastMove = 0, lastDraw = 0;
    const draw = () => {
      const w = host.clientWidth, h = host.clientHeight;
      if (w !== W || h !== H) {
        W = w; H = h; dpr = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); key = "";
      }
      if (!W || !H) return;
      // the picture's crop: object-fit cover at its object-position (read once per size and source)
      const el = playing() ? video : img, pk = `${W}|${H}|${playing()}`;
      if (pk !== posKey && el) { posKey = pk; pos = getComputedStyle(el).objectPosition.split(" ").map((v) => parseFloat(v) / 100); }
      const s = Math.max(W / VW, H / VH), ox = (W - VW * s) * pos[0], oy = (H - VH * s) * (pos[1] ?? 0.5);
      // the headline's text where it sits now (it scrolls up over the pinned stage)
      let copy: [number, number, number, number] | null = null;
      if (copyEl && copyEl.offsetParent) {
        const a = copyEl.getBoundingClientRect(), b = host.getBoundingClientRect();
        if (tightKey !== `${W}|${H}`) { tightKey = `${W}|${H}`; tight = textBox(copyEl, a); }
        if (a.bottom > b.top && a.top < b.bottom && tight) copy = [a.left + tight[0] - b.left, a.top + tight[1] - b.top, tight[2], tight[3]];
      }
      const f = frameNow(), now = performance.now();
      const still = `${f.toFixed(2)}|${W}|${H}|${copy ? copy[1].toFixed(0) : "-"}`, changed = still !== lastStill;
      if (changed) { lastStill = still; lastMove = now; }
      // at rest (no scroll frame for 250 ms) the idle life redraws at 30 fps; while the reader scrolls, every frame
      if (!changed && key && now - lastMove > 250 && now - lastDraw < 33) return;
      const t = clock;
      const k = `${still}#${t.toFixed(3)}`;
      if (k === key) return;
      key = k; lastDraw = now;

      const map = (p: Pt): Pt => [ox + p[0] * s, oy + p[1] * s];
      // How much the layer carries at a point on screen: it thins towards the headline across the left of the picture
      // and keeps clear of the text itself (a soft 4 px then 160 px feather), and fades at the picture's edges
      const strength = (x: number, y: number) => {
        let c = 1;
        if (copy) {
          const [cx, cy, cw, ch] = copy;
          const dx = Math.max(cx - 4 - x, 0, x - (cx + cw + 4)), dy = Math.max(cy - 4 - y, 0, y - (cy + ch + 4));
          const t = clamp(Math.hypot(dx, dy) / 160); c = t * (2 - t);
        }
        const ramp = 0.3 + 0.7 * smooth((x / W - 0.28) / 0.3);
        const edge = Math.min(clamp(y / 30), clamp((H - y) / 30), clamp(x / 30), clamp((W - x) / 30));
        return c * ramp * edge;
      };

      const D = dataAt(f), p = motion ? f / (motion.frames - 1) : 0;
      const lines = {} as Record<LineKey, LineAt>;
      for (const key2 of KEYS) lines[key2] = lineAt(key2, D.lines[key2].d, D.lines[key2].v);

      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      g.lineCap = "round"; g.lineJoin = "round"; g.lineWidth = 0.75;

      // Strokes batched per tone and alpha step (1/32), so ticks and markers are a few draw calls
      const batch = new Map<string, Path2D>();
      const add = (t: Tone, a: number, w = 0.75) => {
        const q = Math.round(clamp(a) * 32) / 32;
        if (q <= 0) return null;
        const id = `${t}|${q}|${w}`;
        let path = batch.get(id);
        if (!path) { path = new Path2D(); batch.set(id, path); }
        return path;
      };
      const seg = (path: Path2D | null, a: Pt, b: Pt) => { if (path) { path.moveTo(a[0], a[1]); path.lineTo(b[0], b[1]); } };
      const poly = (path: Path2D | null, ps: Pt[]) => { if (path) ps.forEach((q, i) => (i ? path.lineTo(q[0], q[1]) : path.moveTo(q[0], q[1]))); };
      const ring = (path: Path2D | null, c: Pt, r: number) => { if (path) { path.moveTo(c[0] + r, c[1]); path.arc(c[0], c[1], r, 0, Math.PI * 2); } };
      const cross = (path: Path2D | null, c: Pt, r: number) => { seg(path, [c[0] - r, c[1]], [c[0] + r, c[1]]); seg(path, [c[0], c[1] - r], [c[0], c[1] + r]); };
      const square = (path: Path2D | null, c: Pt, r: number) => { if (path) path.rect(c[0] - r, c[1] - r, 2 * r, 2 * r); };

      // ── The land: each line in runs between its ticks, strongest at the ticks (D60), thinning where cloud covers it
      const STOPS = [0, 0.2, 0.35, 0.5, 0.65, 0.8, 1];
      for (const key2 of KEYS) {
        const st = LINES[key2], L = lines[key2], from = st.from ?? 0;
        const S = L.pts.map(map);
        const w = S.map((q, i) => (i < from ? 0 : (st.cloud ? smooth(L.vis[i] * 1.4 - 0.2) : 1) * strength(q[0], q[1])));
        const idx: number[] = [];
        for (let i = from; i < S.length; i += st.every) idx.push(i);
        if (idx[idx.length - 1] !== S.length - 1) idx.push(S.length - 1);
        for (let n = 0; n + 1 < idx.length; n++) {
          const i = idx[n], j = idx[n + 1];
          if (w[i] < 0.01 && w[j] < 0.01) continue;
          const grad = g.createLinearGradient(S[i][0], S[i][1], S[j][0], S[j][1]);
          for (const t of STOPS) grad.addColorStop(t, rgba(st.tone, st.a * (0.3 + 0.7 * Math.pow(Math.abs(2 * t - 1), 1.2)) * (w[i] + (w[j] - w[i]) * t)));
          g.strokeStyle = grad;
          g.beginPath();
          g.moveTo(S[i][0], S[i][1]);
          for (let m = i + 1; m <= j; m++) g.lineTo(S[m][0], S[m][1]);
          g.stroke();
        }
        // ticks square to the line, towards the sky, spaced out along it
        for (const [a, b, i] of lineTicks(S, st, s)) if (w[i] >= 0.01) seg(add(st.tone, st.a * st.tickA * w[i]), a, b);
      }

      // ── Tree tops and survey pins, on their forest's crest; they come in as their trees rise into the picture
      const top = (line: LineKey, i: number): [Pt, number] => {
        const L = lines[line], q = map([L.pts[i][0], L.pts[i][1] + TOP_DROP]);
        const cloud = LINES[line].cloud ? smooth(L.vis[i] * 1.4 - 0.2) : 1;
        return [q, cloud * strength(q[0], q[1]) * smooth((H - q[1] - 8) / 50)];
      };
      for (const tp of TOPS) {
        const [q, a] = top(tp.line, tp.i);
        if (a <= 0.01) continue;
        if (tp.ring) ring(add("white", 0.75 * a), q, 5.2 * s); else cross(add("white", 0.7 * a), q, 5.2 * s);
      }
      // the mid-ground's micro-detail: small marks along the ridges, the spur, the far peak and the skyline's shoulder
      MARKS.forEach((mk, n) => {
        const L = lines[mk.line], q = map([L.pts[mk.i][0], L.pts[mk.i][1] + mk.drop]);
        const a = mk.a * (LINES[mk.line].cloud ? smooth(L.vis[mk.i] * 1.4 - 0.2) : 1) * strength(q[0], q[1]) * smooth((H - q[1] - 8) / 50) * (t ? flicker(t, n) : 1);
        if (a <= 0.01) return;
        const path = add(mk.tone, a), r = mk.r * s;
        if (mk.kind === "ring") ring(path, q, r); else if (mk.kind === "square") square(path, q, r); else cross(path, q, r);
      });
      for (const pin of PINS) {
        const [q, a] = top(pin.line, pin.i);
        if (a <= 0.01) continue;
        // the staff grows up from the tree as it rises into view (whole by the time it is 120 px inside the picture)
        const e = smooth((H - q[1] - 20) / 120);
        const y0 = q[1] - 9 * s, y1 = q[1] - (9 + 31 * e) * s;
        seg(add("white", 0.7 * a), [q[0], y0], [q[0], y1]);
        const bar = smooth((e - 0.4) / 0.25);
        if (bar > 0) seg(add("white", 0.7 * a * bar), [q[0] - 4.5 * s, q[1] - 24 * s], [q[0] + 4.5 * s, q[1] - 24 * s]);
        const head = smooth((e - 0.75) / 0.25);
        if (head > 0) {
          // at rest each ring draws on and off in turn (from its top, clockwise); without the clock it is whole
          const [r0, r1] = t ? pinRing(t, PINS.indexOf(pin)) : [0, 1], path = add(pin.deep ? "deep" : "white", 0.85 * a * head);
          if (path && r1 - r0 > 0.005) { const c: Pt = [q[0], q[1] - 45 * s], A0 = -Math.PI / 2 + r0 * 2 * Math.PI, A1 = -Math.PI / 2 + r1 * 2 * Math.PI; path.moveTo(c[0] + 5.2 * s * Math.cos(A0), c[1] + 5.2 * s * Math.sin(A0)); path.arc(c[0], c[1], 5.2 * s, A0, A1); }
        }
      }

      // ── The massif's pieces: one similarity from the footage, held so the summit node sits on the skyline's peak
      const m = D.m, peak = lines[SUMMIT_LINE.line].pts[SUMMIT_LINE.i];
      const T0: Pt = [m[0] * SUMMIT[0] + m[1] * SUMMIT[1] + m[2], m[3] * SUMMIT[0] + m[4] * SUMMIT[1] + m[5]];
      const R = (q: Pt): Pt => map([m[0] * q[0] + m[1] * q[1] + m[2] - T0[0] + peak[0], m[3] * q[0] + m[4] * q[1] + m[5] - T0[1] + peak[1]]);
      const sc = Math.hypot(m[0], m[3]) * s;
      const sum = R(SUMMIT), k0 = strength(sum[0], sum[1]);
      const orbC = R([ORB.cx, ORB.cy]), k1 = strength(orbC[0], orbC[1]);
      // the orbit: far side dashed behind the rock, near side whole with its scale, a dotted outer arc
      const open = (ps: Pt[]) => { g.beginPath(); ps.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.stroke(); };
      g.setLineDash([5, 7]); g.strokeStyle = rgba("ink", 0.24 * k1); open(RIG.orbFar.map(R));
      g.setLineDash([1, 5]); g.strokeStyle = rgba("ink", 0.22 * k1); open(RIG.orbOuter.map(R));
      g.setLineDash([14, 6, 2, 6]); g.strokeStyle = rgba("ink", 0.4 * k0); g.beginPath();
      { const a = R([SUMMIT[0], SUMMIT[1] - AXIS_TOP]), b = R([SUMMIT[0], SUMMIT[1] - 26]); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
      g.setLineDash([]);
      // critic round: the near arc lighter (it read as a dark bar across the rock), in runs strongest at its ends
      {
        const Q = RIG.orbNear.map(R), n = Q.length - 1;
        for (let r = 0; r < 6; r++) {
          const i = Math.round((n * r) / 6), j = Math.round((n * (r + 1)) / 6);
          const grad = g.createLinearGradient(Q[i][0], Q[i][1], Q[j][0], Q[j][1]);
          for (const u of STOPS) grad.addColorStop(u, rgba("ink", 0.34 * k1 * (0.35 + 0.65 * Math.pow(Math.abs(2 * u - 1), 1.2))));
          g.strokeStyle = grad; open(Q.slice(i, j + 1));
        }
      }
      RIG.orbTicks.forEach(([a, b]) => seg(add("ink", 0.3 * k1), R(a), R(b)));
      ring(add("ink", 0.6 * k1), R(ePt(ORB, orbitRing(p))), 7 * sc);
      square(add("ink", 0.55 * k1), R(ePt(ORB, orbitSquare(p))), 4.3 * sc);
      cross(add("ink", 0.45 * k1), R(ePt(ORB, 0)), 7 * sc);
      cross(add("ink", 0.3 * k1), R(ePt(ORB, 180)), 7 * sc);
      // the idle rider: a small ring going round the summit on the orbit, dimmer on the far side behind the rock
      if (t) { const th = rider(t), far = smooth((Math.sin((th * Math.PI) / 180) + 0.15) / 0.3); ring(add("ink", (0.25 + 0.4 * far) * k1), R(ePt(ORB, th)), 3.6 * sc); }
      // the summit sighted: the ladder, the altimeter arc and scale, its needle (falling with the camera), brackets
      RIG.ladder.forEach(([a, b]) => seg(add("ink", 0.35 * k0), R(a), R(b)));
      poly(add("ink", 0.5 * k0), RIG.alt.map(R));
      RIG.altTicks.forEach(([a, b]) => seg(add("ink", 0.45 * k0), R(a), R(b)));
      // the inner ticks breathe together at rest (length and strength)
      { const br = t ? breathe(t) : 1, pth = add("ink", (0.16 + 0.12 * br) * k0);
        RIG.altIn.forEach(([a, b]) => seg(pth, R(a), R([a[0] + (b[0] - a[0]) * (0.55 + 0.45 * br), a[1] + (b[1] - a[1]) * (0.55 + 0.45 * br)]))); }
      { const t = needle(p), n = eNorm(ALT, t), a = ePt(ALT, t, 0.93); seg(add("ink", 0.6 * k0), R(a), R([a[0] + n[0] * 17, a[1] + n[1] * 17])); }
      square(add("ink", 0.6 * k0), R(ePt(ALT, 246)), 3.9 * sc);
      ring(add("ink", 0.6 * k0), R(ePt(ALT, 298)), 4.3 * sc);
      { const b = 30 * sc, l = 9 * sc, path = add("ink", 0.5 * k0);
        if (path) for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { path.moveTo(sum[0] + sx * b, sum[1] + sy * (b - l)); path.lineTo(sum[0] + sx * b, sum[1] + sy * b); path.lineTo(sum[0] + sx * (b - l), sum[1] + sy * b); } }
      cross(add("ink", 0.45 * k0), sum, 21 * sc);
      ring(add("deep", 0.9 * k0), sum, 11 * sc);

      for (const [id, path] of batch) {
        const [t, a, wd] = id.split("|");
        g.strokeStyle = rgba(t as Tone, Number(a)); g.lineWidth = Number(wd); g.stroke(path);
      }
      // the altimeter's reading band, the axis's end dots and the node (fills)
      g.lineWidth = 1.5; g.strokeStyle = rgba("deep", k0); open(RIG.altDeep.map(R));
      g.lineWidth = 0.75;
      g.fillStyle = rgba("ink", 0.6 * k0);
      for (const q of [R([SUMMIT[0], SUMMIT[1] - AXIS_TOP]), R([SUMMIT[0], SUMMIT[1] - 26])]) { g.beginPath(); g.arc(q[0], q[1], 3 * sc, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = rgba("green", k0); g.beginPath(); g.arc(sum[0], sum[1], 4 * sc, 0, Math.PI * 2); g.fill();
      host.setAttribute("data-live", "");
    };

    // Desktop with motion only: the canvas draws every frame (the still's SVG is hidden there by CSS)
    const mq = window.matchMedia("(min-width: 1280px) and (prefers-reduced-motion: no-preference)");
    // the ambient clock: it runs only while the hero is in view (and rAF only runs while the tab is shown), so the idle
    // life resumes where it stopped; it starts just above zero (zero means "no idle life" to the drawing)
    let clock = 1e-4, lastNow = performance.now();
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = performance.now();
      if (inView) { clock += Math.min(now - lastNow, 100) / 1000; draw(); }
      lastNow = now;
    };
    const start = () => {
      cancelAnimationFrame(raf); raf = 0;
      if (!mq.matches) return;
      if (!motion) import("./data/motion.json").then((m) => { if (!dead) { motion = m.default as unknown as Motion; key = ""; } });
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { rootMargin: "100px" });
    io.observe(media);
    mq.addEventListener("change", start);
    start();
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      if (video && hasVFC && vfc) video.cancelVideoFrameCallback(vfc);
      io.disconnect();
      mq.removeEventListener("change", start);
    };
  }, []);

  return (
    <div ref={ref} className={styles.layer} aria-hidden="true">
      <svg className={styles.svg} viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none">
        <Still />
      </svg>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
