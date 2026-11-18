"use client";

import { useEffect, useRef } from "react";
import type { Ell, Pt } from "@/components/v2/chapter-one/cinematic/geom";
import type { Tone } from "@/components/v2/chapter-one/cinematic/vec";
import { breathe, flicker } from "@/components/v2/chapter-one/heroes/clouds/design";
import { lineTicks } from "@/components/v2/chapter-one/heroes/clouds/lines";
import { AXIS_TOP, BASE, STATION, levelIndex, stationRider, GON, GON_FROM, GON_TO, LINES, MARKS, SIGHTS, SKY, SKY_FROM, SKY_TO, STILL, TIP, VISTA, VISTA_FAR, VISTA_NEAR, dotLock, needle, needleSway, sightOn, skyRider, skyRing, vistaRider, vistaRing, vistaSquare, type Group, type LineKey } from "./design";
import styles from "./G1Layer.module.css";

// G1's traced layer (D163-D165; /home-v7's hero since D167), tracked to the time-lapse film's camera move. The film never plays on its
// own (D26): the frame is the video's frame on screen, so the land's marks move only with the reader's scroll. Desktop
// with motion draws the film's frame; tablets and reduced motion draw the first frame over G1's still (STILL); phones
// show no layer. The layer is alive before any scroll (D44, D164): riders travel the sky arc and the vista ring, the
// sightlines draw out from the node and back, the tracking dots lock on and let go, the goniometer breathes and its
// needle sways. Through the move new dots fade up as the land and the clouds come into view, each riding its own track.
// It thins towards the headline and keeps clear of its text (D49, D64-D66). Token colours only.
type Motion = { frames: number; step: number; at: number[]; lines: Record<LineKey, { v: string[] }>; groups: Record<Group, number[][]> };
type Dot = { k: "l" | "c" | "s"; t: "i" | "w"; f: number; p: number[] };
type M6 = number[];

const FPS = 24, VW = BASE.w, VH = BASE.h;
const KEYS = Object.keys(LINES) as LineKey[];
const ID: M6 = [1, 0, 0, 0, 1, 0];
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (v: number) => { const t = clamp(v); return t * t * (3 - 2 * t); };
const rad = (d: number) => (d * Math.PI) / 180;
const apply = (m: M6, p: Pt): Pt => [m[0] * p[0] + m[1] * p[1] + m[2], m[3] * p[0] + m[4] * p[1] + m[5]];

function ePt(e: Ell, t: number, s = 1): Pt {
  const a = rad(t), r = rad(e.rot ?? 0), x = e.rx * s * Math.cos(a), y = e.ry * s * Math.sin(a);
  return [e.cx + x * Math.cos(r) - y * Math.sin(r), e.cy + x * Math.sin(r) + y * Math.cos(r)];
}
function eNorm(e: Ell, t: number): Pt {
  const a = rad(t), r = rad(e.rot ?? 0), nx = Math.cos(a) / e.rx, ny = Math.sin(a) / e.ry;
  const x = nx * Math.cos(r) - ny * Math.sin(r), y = nx * Math.sin(r) + ny * Math.cos(r), l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
}
const arcPts = (e: Ell, t0: number, t1: number, step = 2, s = 1) => {
  const n = Math.max(8, Math.ceil(Math.abs(t1 - t0) / step));
  return Array.from({ length: n + 1 }, (_, i) => ePt(e, t0 + ((t1 - t0) * i) / n, s));
};
const tickSegs = (e: Ell, t0: number, t1: number, step: number, len: number, major = 0, majorLen = len) => {
  const out: [Pt, Pt][] = [];
  for (let t = t0, i = 0; t <= t1 + 1e-6; t += step, i++) {
    const p = ePt(e, t), n = eNorm(e, t), l = major && i % major === 0 ? majorLen : len;
    out.push([p, [p[0] + n[0] * l, p[1] + n[1] * l]]);
  }
  return out;
};

// The rigid pieces, in the first frame's pixels
const RIG = {
  sky: arcPts(SKY, SKY_FROM, SKY_TO, 0.25), skyTicks: tickSegs(SKY, SKY_FROM, SKY_TO, 0.5, -5, 5, -11),
  vNear: arcPts(VISTA, VISTA_NEAR[0], VISTA_NEAR[1], 1.5), vFar: arcPts(VISTA, VISTA_FAR[0], VISTA_FAR[1], 1.5),
  vOuter: arcPts(VISTA, 100, 196, 1.5, 1.08), vTicks: tickSegs(VISTA, 84, 198, 2, 5, 5, 12),
  gon: arcPts(GON, GON_FROM, GON_TO), gonDeep: arcPts(GON, 266, 274),
  gonTicks: tickSegs(GON, GON_FROM, GON_TO, 3, 5, 5, 11), gonIn: tickSegs(GON, GON_FROM, GON_TO, 1.5, -3.5),
};

export function G1Layer() {
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

    const css = getComputedStyle(document.documentElement);
    const rgb = (n: string) => {
      const v = css.getPropertyValue(n).trim();
      if (v.startsWith("#")) { const h = v.length === 4 ? v.replace(/(\w)/g, "$1$1").slice(1) : v.slice(1); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(","); }
      return (v.match(/[\d.]+/g) ?? ["0", "0", "0"]).slice(0, 3).join(",");
    };
    const COL: Record<Tone, string> = { ink: rgb("--color-ink"), deep: rgb("--color-green-text"), green: rgb("--color-green"), white: rgb("--color-white") };
    const rgba = (t: Tone, a: number) => `rgba(${COL[t]},${clamp(a).toFixed(3)})`;

    let motion: Motion | null = null, dots: Dot[] = [], dead = false;
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
    const groupAt = (gr: Group, f: number): M6 => {
      if (!motion || f <= 0) return ID;
      const G = motion.groups[gr], i0 = Math.floor(f), i1 = Math.min(i0 + 1, G.length - 1), u = f - i0;
      return G[i0].map((v, i) => v + (G[i1][i] - v) * u);
    };
    const visAt = (k: LineKey, f: number): number[] => {
      const L = BASE.lines[k], n = L.pts.length;
      if (!motion) return new Array(n).fill(1);
      const at = motion.at, rows = motion.lines[k].v;
      let j = Math.min(at.length - 2, Math.floor(f / motion.step));
      while (j > 0 && at[j] > f) j--;
      const u = clamp((f - at[j]) / (at[j + 1] - at[j])), r0 = rows[j], r1 = rows[j + 1];
      const cv = L.ctl.map((_, c) => ((+r0[c]) * (1 - u) + (+r1[c]) * u) / 9);
      const out: number[] = [];
      let c = 0;
      for (let i = 0; i < n; i++) {
        while (c < L.ctl.length - 2 && L.ctl[c + 1] <= i) c++;
        const a = L.ctl[c], b = L.ctl[c + 1], w = b > a ? clamp((i - a) / (b - a)) : 0;
        out.push(cv[c] + (cv[c + 1] - cv[c]) * w);
      }
      return out;
    };

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

    const live = window.matchMedia("(prefers-reduced-motion: no-preference)");
    let W = 0, H = 0, dpr = 1, key = "", raf = 0, inView = true, pos = [0.7, 0.5], posKey = "";
    let lastStill = "", lastMove = 0, lastDraw = 0, clock = 1e-4, lastNow = performance.now();
    const draw = () => {
      const w = host.clientWidth, h = host.clientHeight;
      if (w !== W || h !== H) {
        W = w; H = h; dpr = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); key = "";
      }
      if (!W || !H) return;
      const film = playing(), el = film ? video : img;
      const onStill = !film && !!img?.currentSrc.includes(STILL.src);
      const IW = onStill ? STILL.w : VW, IH = onStill ? STILL.h : VH, pre = onStill ? STILL.m : ID;
      const pk = `${W}|${H}|${film}|${onStill}`;
      if (pk !== posKey && el) { posKey = pk; pos = getComputedStyle(el).objectPosition.split(" ").map((v) => parseFloat(v) / 100); }
      const s = Math.max(W / IW, H / IH), ox = (W - IW * s) * pos[0], oy = (H - IH * s) * (pos[1] ?? 0.5);
      let copy: [number, number, number, number] | null = null;
      if (copyEl && copyEl.offsetParent) {
        const a = copyEl.getBoundingClientRect(), b = host.getBoundingClientRect();
        if (tightKey !== `${W}|${H}`) { tightKey = `${W}|${H}`; tight = textBox(copyEl, a); }
        if (a.bottom > b.top && a.top < b.bottom && tight) copy = [a.left + tight[0] - b.left, a.top + tight[1] - b.top, tight[2], tight[3]];
      }
      const f = film ? frameNow() : 0, now = performance.now();
      const still = `${f.toFixed(2)}|${W}|${H}|${onStill}|${copy ? copy[1].toFixed(0) : "-"}|${dots.length}`, changed = still !== lastStill;
      if (changed) { lastStill = still; lastMove = now; }
      if (!changed && key && now - lastMove > 250 && now - lastDraw < 42) return;   /* the idle drift: ~24 fps */
      const t = live.matches ? clock : 0;
      const k = `${still}#${t.toFixed(3)}`;
      if (k === key) return;
      key = k; lastDraw = now;

      // how much the layer carries at a point: clear of the headline's text (a hard 24 px margin, then a 100 px feather; D164: tighter than D90's 160 so the vista under the copy carries), a little lighter across
      // the left of the picture (D164: it reaches out over the vista, so the ramp is gentler than the clouds layer's), and
      // faded at the edges
      const p = motion ? f / (motion.frames - 1) : 0;
      // critic: as transition I's grid comes in (about 40 % of the film), the layer eases down to a third, so the two don't stack
      const late = 1 - 0.68 * smooth((p - 0.38) / 0.22);
      const strength = (x: number, y: number) => {
        let c = 1;
        if (copy) {
          const [cx, cy, cw, ch] = copy;
          const dx = Math.max(cx - 24 - x, 0, x - (cx + cw + 24)), dy = Math.max(cy - 24 - y, 0, y - (cy + ch + 24));
          const u = clamp(Math.hypot(dx, dy) / 100); c = dx + dy > 0 ? u * (2 - u) : 0;
        }
        const ramp = 0.72 + 0.28 * smooth((x / W - 0.2) / 0.35);
        const edge = Math.min(clamp(y / 30), clamp((H - y) / 30), clamp(x / 30), clamp((W - x) / 30));
        return c * ramp * edge * late;
      };
      const preS = Math.hypot(pre[0], pre[3]);
      const toScreen = (v: Pt): Pt => { const q = apply(pre, v); return [ox + q[0] * s, oy + q[1] * s]; };
      const maps = {} as Record<Group, { R: (q: Pt) => Pt; sc: number }>;
      for (const gr of ["far", "ridge", "shard", "left", "rock", "fg"] as Group[]) {
        const m = groupAt(gr, f);
        maps[gr] = { R: (q: Pt) => toScreen(apply(m, q)), sc: Math.hypot(m[0], m[3]) * preS * s };
      }

      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      g.lineCap = "round"; g.lineJoin = "round"; g.lineWidth = 0.75;
      const batch = new Map<string, Path2D>();
      const add = (tone: Tone, a: number) => {
        const q = Math.round(clamp(a) * 32) / 32;
        if (q <= 0) return null;
        const id = `${tone}|${q}`;
        let path = batch.get(id);
        if (!path) { path = new Path2D(); batch.set(id, path); }
        return path;
      };
      const fills = new Map<string, Path2D>();
      const dot = (tone: Tone, a: number, c: Pt, r: number) => {
        const q = Math.round(clamp(a) * 32) / 32;
        if (q <= 0) return;
        const id = `${tone}|${q}`;
        let path = fills.get(id);
        if (!path) { path = new Path2D(); fills.set(id, path); }
        path.moveTo(c[0] + r, c[1]); path.arc(c[0], c[1], r, 0, Math.PI * 2);
      };
      const seg = (path: Path2D | null, a: Pt, b: Pt) => { if (path) { path.moveTo(a[0], a[1]); path.lineTo(b[0], b[1]); } };
      const poly = (path: Path2D | null, ps: Pt[]) => { if (path) ps.forEach((q, i) => (i ? path.lineTo(q[0], q[1]) : path.moveTo(q[0], q[1]))); };
      const ring = (path: Path2D | null, c: Pt, r: number) => { if (path) { path.moveTo(c[0] + r, c[1]); path.arc(c[0], c[1], r, 0, Math.PI * 2); } };
      const cross = (path: Path2D | null, c: Pt, r: number) => { seg(path, [c[0] - r, c[1]], [c[0] + r, c[1]]); seg(path, [c[0], c[1] - r], [c[0], c[1] + r]); };
      const square = (path: Path2D | null, c: Pt, r: number) => { if (path) path.rect(c[0] - r, c[1] - r, 2 * r, 2 * r); };
      const mark = (path: Path2D | null, kind: "cross" | "ring" | "square", c: Pt, r: number) => (kind === "ring" ? ring(path, c, r) : kind === "square" ? square(path, c, r) : cross(path, c, r));
      const open = (ps: Pt[]) => { g.beginPath(); ps.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.stroke(); };
      const STOPS = [0, 0.2, 0.35, 0.5, 0.65, 0.8, 1];
      // a polyline in runs, strongest at each run's ends (D60), at a strength per point
      const runs = (S: Pt[], wt: number[], every: number, tone: Tone, a: number, lw = 0.75) => {
        g.lineWidth = lw;
        const idx: number[] = [];
        for (let i = 0; i < S.length; i += every) idx.push(i);
        if (idx[idx.length - 1] !== S.length - 1) idx.push(S.length - 1);
        for (let n = 0; n + 1 < idx.length; n++) {
          const i = idx[n], j = idx[n + 1];
          if (wt[i] < 0.01 && wt[j] < 0.01) continue;
          const grad = g.createLinearGradient(S[i][0], S[i][1], S[j][0], S[j][1]);
          for (const u of STOPS) grad.addColorStop(u, rgba(tone, a * (0.3 + 0.7 * Math.pow(Math.abs(2 * u - 1), 1.2)) * (wt[i] + (wt[j] - wt[i]) * u)));
          g.strokeStyle = grad; open(S.slice(i, j + 1));
        }
        g.lineWidth = 0.75;
      };
      // a dashed polyline whose strength follows the layer's strength along it
      const dashed = (S: Pt[], dash: number[], tone: Tone, a: number, lw = 0.75) => {
        g.setLineDash(dash); g.lineWidth = lw;
        for (let i = 0; i + 1 < S.length; i += 6) {
          const j = Math.min(S.length - 1, i + 6), wa = strength(S[i][0], S[i][1]), wb = strength(S[j][0], S[j][1]);
          if (wa < 0.01 && wb < 0.01) continue;
          const grad = g.createLinearGradient(S[i][0], S[i][1], S[j][0], S[j][1]);
          grad.addColorStop(0, rgba(tone, a * wa)); grad.addColorStop(1, rgba(tone, a * wb));
          g.strokeStyle = grad; open(S.slice(i, j + 1));
        }
        g.setLineDash([]); g.lineWidth = 0.75;
      };

      // ── The sky's great arc: ticked downwards, with a ring travelling with the scroll and a rider at rest
      { const { R, sc } = maps.far, S = RIG.sky.map(R);
        runs(S, S.map((q) => strength(q[0], q[1])), 8, "ink", 0.6, 1);
        RIG.skyTicks.forEach(([a, b]) => { const A = R(a); seg(add("ink", 0.5 * strength(A[0], A[1])), A, R(b)); });
        const q = R(ePt(SKY, skyRing(p))); ring(add("ink", 0.6 * strength(q[0], q[1])), q, 5.5 * sc);
        if (t) { const r = R(ePt(SKY, skyRider(t))); ring(add("ink", 0.45 * strength(r[0], r[1])), r, 7 * sc); dot("ink", 0.75 * strength(r[0], r[1]), r, 3.4 * sc); }
      }

      // ── The skylines: in runs, thinning where cloud covers the crest, ticked towards the sky
      const linePts = {} as Record<LineKey, { S: Pt[]; w: number[] }>;
      for (const lk of KEYS) {
        const st = LINES[lk], R = maps[st.group].R, vis = visAt(lk, f);
        const S = BASE.lines[lk].pts.map((q) => R(q as unknown as Pt));
        const w = S.map((q, i) => smooth(vis[i] * 1.4 - 0.2) * strength(q[0], q[1]));
        linePts[lk] = { S, w };
        runs(S, w, st.every, st.tone, st.a);
        for (const [a, b, i] of lineTicks(S, st, maps[st.group].sc)) if (w[i] >= 0.01) seg(add(st.tone, st.a * st.tickA * w[i]), a, b);
      }
      MARKS.forEach((mk, n) => {
        const L = linePts[mk.line], q = L.S[mk.i], a = mk.a * L.w[mk.i] * (t ? flicker(t, n) : 1);
        if (a > 0.01) mark(add(LINES[mk.line].tone, a), mk.kind, q, mk.r * maps[LINES[mk.line].group].sc);
      });

      // ── The vista's ring on the cloud sea: the near side in runs with its scale and a dotted outer arc, the far side
      // dashed over the ridge; markers travel it with the scroll, a rider at rest
      { const { R, sc } = maps.ridge, near = RIG.vNear.map(R), nn = near.length - 1;
        // critic: the ends fade out rather than stop dead
        runs(near, near.map((q, i) => strength(q[0], q[1]) * smooth(i / (0.15 * nn)) * smooth((nn - i) / (0.15 * nn))), 8, "ink", 0.64, 1);
        dashed(RIG.vFar.map(R), [5, 7], "ink", 0.44);
        dashed(RIG.vOuter.map(R), [1, 5], "ink", 0.5);
        RIG.vTicks.forEach(([a, b]) => { const A = R(a); seg(add("ink", 0.5 * strength(A[0], A[1])), A, R(b)); });
        const at = (th: number, fn: (c: Pt, k: number) => void) => { const c = R(ePt(VISTA, th)); fn(c, strength(c[0], c[1])); };
        at(vistaRing(p), (c, k0) => ring(add("ink", 0.62 * k0), c, 6.5 * sc));
        at(vistaSquare(p), (c, k0) => square(add("ink", 0.56 * k0), c, 4 * sc));
        at(180, (c, k0) => cross(add("ink", 0.4 * k0), c, 7 * sc));
        if (t) at(vistaRider(t), (c, k0) => { ring(add("ink", 0.45 * k0), c, 7 * sc); dot("ink", 0.75 * k0, c, 3.4 * sc); });
      }

      // ── Sightlines from the node out over the vista to the peaks (drawn out and back in turn at rest)
      const { R: RS, sc: scS } = maps.shard, tip = RS(TIP), k0 = strength(tip[0], tip[1]);
      SIGHTS.forEach((sg, n) => {
        const L = linePts[sg.line], end = L.S[sg.i];
        const [u0, u1] = t ? sightOn(t, n) : [0, 1];
        if (u1 - u0 < 0.005) return;
        const P = (u: number): Pt => [tip[0] + (end[0] - tip[0]) * u, tip[1] + (end[1] - tip[1]) * u];
        const S = Array.from({ length: 25 }, (_, i) => P(u0 + ((u1 - u0) * i) / 24));
        dashed(S, [2, 5], "ink", 0.55);
        if (u1 > 0.98 && u0 < 0.02) ring(add("ink", 0.6 * L.w[sg.i]), end, 5 * maps[LINES[sg.line].group].sc);
      });

      // ── The big shard's node, sight and goniometer
      { const R = RS, sc = scS;
        g.setLineDash([14, 6, 2, 6]); g.strokeStyle = rgba("ink", 0.4 * k0); open([R([TIP[0], TIP[1] - AXIS_TOP]), R([TIP[0], TIP[1] - 26])]); g.setLineDash([]);
        poly(add("ink", 0.5 * k0), RIG.gon.map(R));
        RIG.gonTicks.forEach(([a, b]) => seg(add("ink", 0.45 * k0), R(a), R(b)));
        { const br = t ? breathe(t) : 1, pth = add("ink", (0.16 + 0.12 * br) * k0);
          RIG.gonIn.forEach(([a, b]) => seg(pth, R(a), R([a[0] + (b[0] - a[0]) * (0.55 + 0.45 * br), a[1] + (b[1] - a[1]) * (0.55 + 0.45 * br)]))); }
        { const th = needle(p) + (t ? needleSway(t) : 0), n = eNorm(GON, th), a = ePt(GON, th, 0.9); seg(add("ink", 0.6 * k0), R(a), R([a[0] + n[0] * 17, a[1] + n[1] * 17])); }
        square(add("ink", 0.6 * k0), R(ePt(GON, 222)), 3.9 * sc);
        ring(add("ink", 0.6 * k0), R(ePt(GON, 318)), 4.3 * sc);
        { const b = 30 * sc, l = 9 * sc, path = add("ink", 0.5 * k0);
          if (path) for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { path.moveTo(tip[0] + sx * b, tip[1] + sy * (b - l)); path.lineTo(tip[0] + sx * b, tip[1] + sy * b); path.lineTo(tip[0] + sx * (b - l), tip[1] + sy * b); } }
        cross(add("ink", 0.45 * k0), tip, 21 * sc);
        ring(add("deep", 0.9 * k0), tip, 11 * sc);
        dot("ink", 0.6 * k0, R([TIP[0], TIP[1] - AXIS_TOP]), 3 * sc);
        dot("ink", 0.6 * k0, R([TIP[0], TIP[1] - 26]), 3 * sc);
        dot("green", k0, tip, 4 * sc);
      }
      // ── The foreground station on the boulder (its own track). Critic (D165): a survey disc, not a reticle: the cross
      // stays inside its ring; the centre is white and turns green only as the rider passes the top, so the crystal's node
      // stays the one green fix; it grows with the foreground but no more than 1.4x; a faint ink under-stroke keeps it
      // legible on the pale lichen. It replaces the pin on the rock (two instruments on one rock read as clutter).
      { const { R } = maps.fg, c = R(STATION), a = strength(c[0], c[1]) * smooth((H - c[1] - 16) / 60);
        const m = groupAt("fg", f), grow = Math.min(1.4, Math.hypot(m[0], m[3])), sc = grow * preS * s, rot = Math.atan2(m[3], m[0]);
        if (a > 0.01) {
          const P = (dx: number, dy: number): Pt => [c[0] + (dx * Math.cos(rot) - dy * Math.sin(rot)) * sc, c[1] + (dx * Math.sin(rot) + dy * Math.cos(rot)) * sc];
          const lines = new Path2D(), sm = (q0: Pt, q1: Pt) => { lines.moveTo(q0[0], q0[1]); lines.lineTo(q1[0], q1[1]); };
          lines.moveTo(c[0] + 9.5 * sc, c[1]); lines.arc(c[0], c[1], 9.5 * sc, 0, Math.PI * 2);
          for (const [x, y] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) sm(P(x * 3.2, y * 3.2), P(x * 7, y * 7));
          sm(P(-28, 32), P(28, 32)); for (let x = -28; x <= 28; x += 7) sm(P(x, 32), P(x, x % 14 === 0 ? 27 : 29.5));
          const ix = levelIndex(p, t), A = P(ix, 34), B = P(ix - 3, 39), C = P(ix + 3, 39); lines.moveTo(A[0], A[1]); lines.lineTo(B[0], B[1]); lines.lineTo(C[0], C[1]); lines.closePath();
          g.lineWidth = 2.2; g.strokeStyle = rgba("ink", 0.2 * a); g.stroke(lines);
          g.lineWidth = 0.75; g.strokeStyle = rgba("white", 0.92 * a); g.stroke(lines);
          // the dotted outer ring, and its rider
          g.setLineDash([1, 4]); g.strokeStyle = rgba("white", 0.75 * a); g.beginPath(); g.arc(c[0], c[1], 17 * sc, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
          const th = t ? stationRider(t) : 270, top = smooth(1 - Math.abs(((th - 270 + 540) % 360) - 180) / 28);
          dot("white", 0.85 * a, [c[0] + 17 * sc * Math.cos(rad(th)), c[1] + 17 * sc * Math.sin(rad(th))], 1.8 * sc);
          dot("white", 0.9 * a * (1 - top), c, 1.8 * sc);
          if (top > 0.01) dot("green", 0.95 * a * top, c, 2.2 * sc);
        } }

      // ── The tracking dots: each on its own track (land, cloud sea, sky). Through the move a dot fades up where it is
      // born, its ring closing in on it, and fades out where its track ends; at rest most lock on and let go in turn.
      // Sizes are page-scale (they don't grow with the zoom).
      { const ds = Math.max(0.8, s * preS);
        dots.forEach((d, n) => {
          const len = d.p.length / 2, last = d.f + 2 * (len - 1);
          let q: Pt, life = 1, close = 1;
          if (film) {
            if (f < d.f || f > last) return;
            const kf = (f - d.f) / 2, i0 = Math.min(len - 1, Math.floor(kf)), i1 = Math.min(len - 1, i0 + 1), u = kf - i0;
            q = [d.p[2 * i0] + (d.p[2 * i1] - d.p[2 * i0]) * u, d.p[2 * i0 + 1] + (d.p[2 * i1 + 1] - d.p[2 * i0 + 1]) * u];
            const born = d.f === 0 ? 1 : smooth((f - d.f) / 10);
            life = born * smooth((last - f) / 10); close = born;
          } else {
            if (d.f !== 0) return;
            q = [d.p[0], d.p[1]];
          }
          if (t) { const [la, lc] = dotLock(t, n); life *= la; close = Math.min(close, lc); }
          const c = toScreen(q), a = life * strength(c[0], c[1]) * smooth((H - c[1] - 8) / 40);
          if (a <= 0.01) return;
          // D165 (Lawrence: "too prominent"): a small dot with a faint ring; the closing ring is the one brighter moment
          const tone: Tone = d.t === "w" ? "white" : "ink", base = d.t === "w" ? 0.5 : 0.52;
          const r = (2.8 + 5 * (1 - close)) * ds;
          ring(add(tone, base * a * (0.5 + 0.5 * (1 - close))), c, r);
          dot(tone, base * 1.1 * a, c, 1.1 * ds);
          if (n % 9 === 0) { const pth = add(tone, base * 0.6 * a); for (const [x, y] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) seg(pth, [c[0] + x * (r + 1.5 * ds), c[1] + y * (r + 1.5 * ds)], [c[0] + x * (r + 3.5 * ds), c[1] + y * (r + 3.5 * ds)]); }
        });
      }

      for (const [id, path] of batch) { const [tone, a] = id.split("|"); g.strokeStyle = rgba(tone as Tone, Number(a)); g.stroke(path); }
      for (const [id, path] of fills) { const [tone, a] = id.split("|"); g.fillStyle = rgba(tone as Tone, Number(a)); g.fill(path); }
      // the goniometer's reading band (a short deep-green arc)
      g.lineWidth = 1.5; g.strokeStyle = rgba("deep", k0); open(RIG.gonDeep.map(RS)); g.lineWidth = 0.75;
      host.setAttribute("data-live", "");
    };

    /* the loop runs only while the hero is in view (the observer starts and stops it), and the idle drift (the clock) waits until the page has loaded and
       gone idle: until then the layer is drawn when something changes (the film's frame, the size, the copy), not every frame */
    let idleOk = false, idleId = 0, idleT = 0;
    const tick = () => {
      raf = 0;
      if (!inView || dead) return;
      raf = requestAnimationFrame(tick);
      const now = performance.now();
      if (live.matches && idleOk) clock += Math.min(now - lastNow, 100) / 1000;
      draw();
      lastNow = now;
    };
    const goIdle = () => { idleT = window.setTimeout(() => { idleId = typeof requestIdleCallback === "function" ? requestIdleCallback(() => { idleOk = true; }, { timeout: 1500 }) : (idleOk = true, 0); }, 800); };
    if (document.readyState === "complete") goIdle(); else window.addEventListener("load", goIdle, { once: true });
    import("./data/motion.json").then((m) => { if (!dead) { motion = m.default as unknown as Motion; key = ""; } });
    import("./data/dots.json").then((m) => { if (!dead) { dots = m.default as unknown as Dot[]; key = ""; } });
    raf = requestAnimationFrame(tick);
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView && !raf) { lastNow = performance.now(); raf = requestAnimationFrame(tick); } }, { rootMargin: "100px" });
    io.observe(media);
    return () => {
      dead = true;
      window.removeEventListener("load", goIdle); clearTimeout(idleT); if (idleId && typeof cancelIdleCallback === "function") cancelIdleCallback(idleId);
      cancelAnimationFrame(raf);
      if (video && hasVFC && vfc) video.cancelVideoFrameCallback(vfc);
      io.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className={styles.layer} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
