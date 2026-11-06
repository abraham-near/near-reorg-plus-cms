import { arc, r2, seg, ticks, type Ell, type Pt } from "../../cinematic/geom";
import DATA from "./unfurl.json";

// The Unfurl hero's layer (D90), frame by frame: the static concept (cinematic/layers/Fern.tsx, B · Unfurl) carried on
// the footage, in the video's pixels (1920 × 1080). The tracking (assets/generated/2026-11-05_hero-unfurl/track.py)
// gives, every few frames:
// - the spiral as material: points every 10° along a spiral fitted to the coiled band (tightening inwards) on the first
//   frame and then followed with optical flow, so the line opens with the coil as its outer turn unrolls into the stem;
// - the coil's eye, zoom and turn (a similarity of its inner turns), which the construction rides;
// - the stem's points and the dew drops themselves (each followed on its own), so the rings stay on the drops as they
//   slide.
// Nothing moves on its own: the frame is the video frame on screen, which only the reader's scroll changes.

export type Tone = "ink" | "deep" | "green";
type Track = { from: number; pts: number[] };
type Data = {
  frames: number; fps: number; step: number; w: number; h: number;
  ang: [number, number, number]; turnI: number; cstep: number;
  coil: number[]; // per sample: eye x, eye y, zoom × 1000, turn (degrees, anticlockwise on screen)
  curve: number[]; // per sample: ang[2] points (x, y)
  stem: Track[]; drops: Track[]; links: number[][];
};
const D = DATA as unknown as Data;
export const FRAMES = D.frames;
export const FPS = D.fps; // 30: the take retimed to even steps (assets/…/retime.py)

const A = 1920 / 2688; // the concept's photo pixels to the video's
const PHI = 1.618;
const R = 262; // the coil's circle (concept px)
const NA = D.ang[2];
const TURN_I = D.turnI; // the last inner turn: green from here

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
// Catmull-Rom through samples (as layer/core.ts does), so speeds change smoothly at each sample; held at the ends
function cr(p: number[], stride: number, o: number, k: number, n: number) {
  const i = Math.min(Math.max(Math.floor(k), 0), n - 2), u = clamp(k - i);
  const a = Math.max(i - 1, 0), d = Math.min(i + 2, n - 1), u2 = u * u, u3 = u2 * u;
  const p0 = p[a * stride + o], p1 = p[i * stride + o], p2 = p[(i + 1) * stride + o], p3 = p[d * stride + o];
  return 0.5 * (2 * p1 + (p2 - p0) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (3 * p1 - p0 - 3 * p2 + p3) * u3);
}
const NC = D.coil.length / 4;
const coilAt = (f: number) => {
  const k = clamp(f / D.cstep, 0, NC - 1);
  return { eye: [cr(D.coil, 4, 0, k, NC), cr(D.coil, 4, 1, k, NC)] as Pt, zoom: cr(D.coil, 4, 2, k, NC) / 1000, turn: cr(D.coil, 4, 3, k, NC) };
};
const curveAt = (f: number): Pt[] => {
  const k = clamp(f / D.cstep, 0, NC - 1), s = NA * 2;
  return Array.from({ length: NA }, (_, i) => [cr(D.curve, s, 2 * i, k, NC), cr(D.curve, s, 2 * i + 1, k, NC)] as Pt);
};
// A track at frame f, and how present it is (fading over 6 frames at the ends of its span, unless the span reaches the
// clip's own ends)
function trackAt(t: Track, f: number): [Pt, number] | null {
  const n = t.pts.length / 2, k = (f - t.from) / D.step;
  if (k < 0 || k > n - 1) return null;
  const end = t.from + (n - 1) * D.step;
  const a = Math.min(t.from <= 0 ? 1 : clamp((f - t.from) / 6), end >= D.frames - 1 - D.step ? 1 : clamp((end - f) / 6));
  return [[cr(t.pts, 2, 0, k, n), cr(t.pts, 2, 1, k, n)], a];
}
// Smooth curves through points: cubic Béziers whose tangent at each point runs from its neighbour before to its
// neighbour after, each handle a third of its own segment long, so the curve stays smooth where the spacing changes
// (the spiral's 10° points meet the stem's sparser ones without a corner)
function tangent(q: Pt[], j: number): Pt {
  const a = q[Math.max(j - 1, 0)], b = q[Math.min(j + 1, q.length - 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
}
function bez(q: Pt[], i: number) {
  const a = q[i], b = q[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]) / 3, ta = tangent(q, i), tb = tangent(q, i + 1);
  return `C${r2(a[0] + ta[0] * l)} ${r2(a[1] + ta[1] * l)} ${r2(b[0] - tb[0] * l)} ${r2(b[1] - tb[1] * l)} ${r2(b[0])} ${r2(b[1])}`;
}
function curvePath(q: Pt[], from = 0, to = q.length - 1) {
  if (to - from < 1) return "";
  let d = `M${r2(q[from][0])} ${r2(q[from][1])}`;
  for (let i = from; i < to; i++) d += bez(q, i);
  return d;
}

export type Part =
  | { k: string; t: "path"; d: string; tone: Tone; a: number; w?: number; dash?: string; o?: number }
  | { k: string; t: "grad"; d: string; tone: Tone; a: number; mid: number; g: [Pt, Pt]; w?: number; o?: number }
  | { k: string; t: "circle"; c: Pt; r: number; tone: Tone; a: number; fill?: boolean; w?: number; o?: number };

const ptOn = (e: Ell, t: number, s = 1): Pt => {
  const a = (t * Math.PI) / 180;
  return [r2(e.cx + e.rx * s * Math.cos(a)), r2(e.cy + e.ry * s * Math.sin(a))];
};
const sq = (p: Pt, s: number) => `M${r2(p[0] - s)} ${r2(p[1] - s)}h${r2(2 * s)}v${r2(2 * s)}h${r2(-2 * s)}Z`;
const TURN0 = coilAt(0).turn;

// Idle life (D44, D76/D77/D82), on the clock `time` (seconds; 0 with reduced motion, and the still's state at 0): a
// marker drifts along the outer scale, the inner golden circle draws off and back on, the coil's ticks breathe and one
// dew link at a time draws off towards its drop and back. Lines only draw on and off; only markers travel.
const wave = (time: number, period: number) => 0.5 - 0.5 * Math.cos((2 * Math.PI * time) / period); // 0 at 0
function drawOn(time: number) {
  // a 16 s cycle: whole for 6 s, draws off (its start retracts) over 3 s, off 1 s, draws on over 3 s, whole for 3 s
  const u = time % 16;
  if (u < 6 || u >= 13) return [0, 1];
  if (u < 9) return [smoothstep((u - 6) / 3), 1];
  if (u < 10) return [1, 1];
  return [0, smoothstep((u - 10) / 3)];
}
const smoothstep = (v: number) => { const x = clamp(v); return x * x * (3 - 2 * x); };

export function scene(f: number, time = 0): Part[] {
  const { eye: E, zoom, turn } = coilAt(f);
  const L = (v: number) => v * A * zoom; // a concept length (photo px) at this frame's scale
  const C: Ell = { cx: E[0], cy: E[1], rx: L(R), ry: L(R) };
  const t = -(turn - TURN0); // the construction turns with the coil (screen angles run clockwise)
  const out: Part[] = [];
  const P = (k: string, d: string, tone: Tone, a: number, w?: number, dash?: string) => out.push({ k, t: "path", d, tone, a, w, dash });
  const dot = (k: string, c: Pt, r: number, tone: Tone, a: number, o = 1) => out.push({ k, t: "circle", c, r, tone, a, fill: true, o });
  const ring = (k: string, c: Pt, r: number, a: number, o = 1) => out.push({ k, t: "circle", c, r, tone: "ink", a, o });

  // Construction: the coil's circle and the golden circles inside it, ticked. Idle: the inner golden circle draws off
  // and back on from 200°, and the ticks breathe
  P("circ", arc(C, 0, 360), "ink", 0.3);
  P("circ-phi", arc(C, 0, 360, 1 / PHI), "ink", 0.26, undefined, "6 6");
  const [d0, d1] = drawOn(time);
  P("circ-phi2", d1 - d0 > 0.002 ? arc(C, 200 + t + 360 * d0, 200 + t + 360 * d1, 1 / (PHI * PHI)) : "", "ink", 0.22, undefined, "1 5");
  P("circ-ticks", ticks(C, 100 + t, 260 + t, 1, -L(7), 5, -L(13)), "ink", 0.3 * (1 - 0.35 * wave(time, 7)));
  P("circ-sq", [0, 90, 180, 270].map((a) => sq(ptOn(C, a + t), L(5))).join(""), "ink", 0.55);

  // The outer scale; its index runs on as the coil turns open (the unfurl, read off the scale). Idle: its square
  // marker drifts slowly along the scale and back (120°-200°)
  const open = Math.abs(turn - TURN0);
  P("scale", arc(C, 118 + t, 250 + t, 1.3), "ink", 0.45);
  P("scale-ticks", ticks(C, 118 + t, 250 + t, 2, L(9), 5, L(20), 1.3), "ink", 0.4);
  P("scale-index", arc(C, 250 + t, 272 + t + open, 1.3), "ink", 0.7, 1);
  ring("scale-ring", ptOn(C, 250 + t, 1.3), L(7), 0.6);
  P("scale-sq", sq(ptOn(C, 160 + t + 40 * Math.sin((2 * Math.PI * time) / 22), 1.3), L(4.5)), "ink", 0.55);

  // Axes (level) and the dial at the eye
  const axis = (k: string, a: Pt, b: Pt) => {
    P(k, seg(a, b), "ink", 0.3, undefined, "14 6 2 6");
    dot(`${k}-a`, a, L(3) + 0.6, "ink", 0.5);
    dot(`${k}-b`, b, L(3) + 0.6, "ink", 0.5);
  };
  axis("axis-x", [E[0] - L(400), E[1]], [E[0] + L(330), E[1]]);
  axis("axis-y", [E[0], E[1] - L(380)], [E[0], E[1] + L(340)]);
  const dial: Ell = { cx: E[0], cy: E[1], rx: L(34), ry: L(34) };
  P("dial", ticks(dial, t, 350 + t, 10, -L(4), 3, -L(8)), "ink", 0.4);
  const bw = L(52), bl = L(12);
  P("brackets", [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y]) => `M${r2(E[0] + x * bw)} ${r2(E[1] + y * (bw - bl))}V${r2(E[1] + y * bw)}H${r2(E[0] + x * (bw - bl))}`).join(""), "ink", 0.45);

  // The spiral on the coiled band, opening with it, in ink as in the still; the last inner turn in green, a green dot at
  // the tip. One smooth curve runs from the stem's tracked points into the spiral, so the line leaves the stem in the
  // direction it enters the coil (no corner where they meet)
  // the line starts 30° in from the band's tracked end, whose last few points bend off the band where it meets the stem
  const cv = curveAt(f).slice(3), NV = cv.length;
  const stem: { i: number; p: Pt; a: number }[] = [];
  let lastY = cv[0][1];
  D.stem.forEach((s, i) => {
    const q = trackAt(s, f);
    if (q && q[0][1] > lastY + L(stem.length ? 40 : 120)) { stem.push({ i, p: q[0], a: q[1] }); lastY = q[0][1]; }
  });
  const Q: Pt[] = [...stem.map((s) => s.p).reverse(), ...cv];
  const S0 = stem.length; // cv[0] in Q
  P("spiral", curvePath(Q, S0, S0 + TURN_I - 3), "ink", 0.6, 0.75);
  P("spiral-in", curvePath(Q, S0 + TURN_I - 3), "green", 1, 0.9);
  dot("tip", cv[NV - 1], L(3.5) + 0.5, "green", 1);
  // The dial's needle points at where the stem leaves the coil, so it turns as the coil unrolls
  const j = cv[0], ang = Math.atan2(j[1] - E[1], j[0] - E[0]);
  P("needle", seg([E[0] + Math.cos(ang) * L(30), E[1] + Math.sin(ang) * L(30)], [E[0] + Math.cos(ang) * L(66), E[1] + Math.sin(ang) * L(66)]), "ink", 0.55, 0.75);

  // The stem: its trace from the spiral's start through the tracked points (on that same curve), ticked at each point,
  // strongest at the ticks (D60)
  D.stem.forEach((_, i) => {
    const k = stem.findIndex((s) => s.i === i);
    if (k < 0) { out.push({ k: `stem-${i}`, t: "grad", d: "", tone: "ink", a: 0.5, mid: 0.45, g: [[0, 0], [1, 0]], o: 0 }); return; }
    const qi = S0 - 1 - k; // this point in Q; its segment runs to the next one up the stem (towards the coil)
    out.push({ k: `stem-${i}`, t: "grad", d: `M${r2(Q[qi][0])} ${r2(Q[qi][1])}${bez(Q, qi)}`, tone: "ink", a: 0.5, mid: 0.45, g: [Q[qi], Q[qi + 1]], o: Math.min(stem[k].a, k ? stem[k - 1].a : 1) });
  });
  let td = "";
  for (let k = 0; k < S0; k++) { // at the stem's points (not where the spiral hands over: no hook there)
    const p = Q[k], [tx, ty] = tangent(Q, k);
    let nx = ty, ny = -tx;
    if (ny > 0) { nx = -nx; ny = -ny; }
    td += `M${r2(p[0])} ${r2(p[1])}L${r2(p[0] + nx * L(8))} ${r2(p[1] + ny * L(8))}`;
  }
  P("stem-ticks", td, "ink", 0.5);
  P("stem-echo", curvePath(Q.slice(0, S0 + 1).map(([x, y]) => [x + L(46), y - L(4)] as Pt)), "ink", 0.18, undefined, "2 6");

  // The dew, tracked: the drops joined (strongest at the drops, D59) and ringed; the first one green
  const drops = D.drops.map((d) => trackAt(d, f));
  // Idle: one link at a time (a new one every 4.5 s from 4 s in) draws off towards one of its drops and back on
  const live = time > 4 ? Math.floor((time - 4) / 4.5) : -1, ph = time > 4 ? ((time - 4) % 4.5) / 1.8 : 1;
  const cut = ph < 1 ? 1 - Math.sin(Math.PI * ph) : 1; // 1 → 0 → 1 over 1.8 s
  D.links.forEach(([i, k], n) => {
    const a = drops[i], b = drops[k];
    const frac = live >= 0 && (live * 7) % D.links.length === n ? cut : 1;
    const ends: [Pt, Pt] | null = a && b ? [[b[0][0] + (a[0][0] - b[0][0]) * frac, b[0][1] + (a[0][1] - b[0][1]) * frac], b[0]] : null;
    out.push({ k: `dew-${i}-${k}`, t: "grad", d: ends && frac > 0.01 ? seg(ends[0], ends[1]) : "", tone: "ink", a: 0.55, mid: 0.15, g: ends ?? [[0, 0], [1, 0]], o: a && b ? Math.min(a[1], b[1]) : 0 });
  });
  drops.forEach((d, i) => {
    const p: Pt = d ? d[0] : [0, 0], o = d ? d[1] : 0;
    dot(`dew-dot-${i}`, p, i === 0 ? L(3.6) + 0.4 : L(2.4) + 0.4, i === 0 ? "green" : "ink", i === 0 ? 1 : 0.7, o);
    ring(`dew-ring-${i}`, p, L(i === 0 ? 20 : 13), 0.5, o);
  });
  return out;
}
