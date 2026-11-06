import DATA from "../../cinematic/data/c.json";
import DESIGN from "./design.json";
import type { P } from "./warp";

// Dune (D90): the static concept's layer (cinematic/layers/Dune.tsx, drawn on the still in its own pixels, 2688 x 1520)
// as a display list for any frame of the camera move. Every point is placed on the still, carried to the video's
// first frame (`toFrame0`, fitted by register.py), then to frame f by the measured warp (warp.ts), so every line,
// tick and marker rides the sand it was drawn on. What moves with the scroll beyond that: the protractor's green arc
// reads the crest's tangent as the camera turns it; a sun marker on the protractor's rim follows the light (measured
// from the frames: how brightly the climbing sun lights the slope facing it, sun.py); one small marker travels up the
// crest from its lower bend to the peak; and six more wind ripples, traced where the late light rakes them
// (trace_ripples.py), draw on one after another as the camera pushes in, so the sand keeps its density as it grows.
// Idle life on the clock (`amb`, seconds; 0 with reduced motion, D44): the crest marker drifts a little along the crest,
// one contour leader at a time draws off into its feature and back out to the scale, and the protractor's major ticks
// breathe in place. Nothing runs along a line (D45). Lines join and fade as in the stations' vocabulary (D59, D60).
export type Tone = "ink" | "deep" | "green";
export type Item =
  // a polyline; `dip` (0-1) makes it a gradient run, full at its ends and `dip` in the middle
  | { k: "l"; p: number[]; tone: Tone; a: number; w?: number; dash?: number[]; dip?: number }
  | { k: "d"; x: number; y: number; r: number; tone: Tone; a: number };

type Pt = readonly [number, number];
const pts = (a: number[][]): Pt[] => a.map(([x, y]) => [x, y] as const);
const rad = (d: number) => (d * Math.PI) / 180;

// The concept's anchors (still px). The crest is the concept's trace snapped to the crest's real edge on the video's
// first frame (snap.py; it moved half a pixel on average), and the peak is its end
const CREST = pts(DESIGN.crest);
const PEAK: Pt = CREST[CREST.length - 1];
const BEND_UP: Pt = [2001, 600];
const BEND_LO: Pt = [1928, 1040];
const PRO_R = 150;
const SCALE_X = 2400;
// `on`: drawn on from its first point to its last between these two points of the move (0-1); absent at frame 0
type Trace = { p: Pt[]; every: number; tick: number; a: number; dip?: number; on?: [number, number] };
const TRACES: Trace[] = [
  { p: CREST, every: 4, tick: 10, a: 0.55 },
  // the lead crest: c.json's trace with its one stray vertex put back on the line and lightly smoothed (snap.py)
  { p: pts(DESIGN.lead), every: 4, tick: 7, a: 0.32 },
  { p: pts(DATA.far1), every: 4, tick: 6, a: 0.26 },
  { p: pts(DATA.far2), every: 4, tick: 6, a: 0.3 },
  ...DATA.rip.map((r) => ({ p: pts(r), every: 3, tick: 5, a: 0.2, dip: 0.4 })),
  ...DESIGN.rip2.map((r, i): Trace => ({ p: pts(r), every: 3, tick: 5, a: 0.2, dip: 0.4, on: [0.16 + 0.07 * i, 0.4 + 0.07 * i] })),
];

export type Frame = {
  // still px -> this frame's px (1920-wide video frame)
  T: (p: Pt) => P;
  // 0-1: how far through the move (t linear, for the ripples drawing on; q eased, for the travelling marker); sun: 0-1,
  // the light's reading at this frame
  t: number; q: number; sun: number;
  // seconds of idle time (0 = at rest: reduced motion, the still)
  amb: number;
  // a strength factor for a point in frame px (keeps clear of the headline), 1 where unknown
  fade: (x: number, y: number) => number;
};

export function scene({ T, t, q, sun, amb, fade }: Frame): Item[] {
  const out: Item[] = [];
  const line = (ps: P[], tone: Tone, a: number, extra: Partial<Extract<Item, { k: "l" }>> = {}) => {
    const m = ps[Math.floor(ps.length / 2)];
    const s = a * fade(m[0], m[1]);
    if (s > 0.01) out.push({ k: "l", p: ps.flat(), tone, a: s, ...extra });
  };
  const dot = (p: P, r: number, tone: Tone, a: number) => { const s = a * fade(p[0], p[1]); if (s > 0.01) out.push({ k: "d", x: p[0], y: p[1], r, tone, a: s }); };
  // A circle (or arc) about a still-px centre, of still-px radius, carried point by point
  const arcPts = (c: Pt, r: number, t0: number, t1: number) => {
    const n = Math.max(8, Math.ceil(Math.abs(t1 - t0) / 3)), o: P[] = [];
    for (let i = 0; i <= n; i++) { const a = rad(t0 + ((t1 - t0) * i) / n); o.push(T([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)])); }
    return o;
  };
  const ring = (c: Pt, r: number, tone: Tone, a: number) => line(arcPts(c, r, 0, 360), tone, a);
  const seg = (a: Pt, b: Pt, tone: Tone, al: number, dash?: number[]) => line([T(a), T(b)], tone, al, { dash });
  // Local scale at a still point (frame px per still px), for sizes that should grow with the push-in
  const scaleAt = (c: Pt) => { const a = T([c[0] - 20, c[1]]), b = T([c[0] + 20, c[1]]); return Math.hypot(b[0] - a[0], b[1] - a[1]) / 40; };

  // The land: ticked traces, each run between ticks a gradient strongest at its ticks (D60)
  for (const tr of TRACES) {
    // how much of it is drawn (by point index; the traces are evenly sampled), eased
    const u = tr.on ? Math.min(1, Math.max(0, (t - tr.on[0]) / (tr.on[1] - tr.on[0]))) : 1;
    if (u <= 0) continue;
    const cut = (tr.p.length - 1) * u * u * (3 - 2 * u), whole = Math.floor(cut);
    const P_ = tr.p.slice(0, whole + 1).map(T), idx: number[] = [];
    if (whole < tr.p.length - 1 && cut > whole) {
      const a = tr.p[whole], b = tr.p[whole + 1], v = cut - whole;
      P_.push(T([a[0] + (b[0] - a[0]) * v, a[1] + (b[1] - a[1]) * v]));
    }
    if (P_.length < 2) continue;
    for (let i = 0; i < P_.length; i += tr.every) idx.push(i);
    if (idx[idx.length - 1] !== P_.length - 1) idx.push(P_.length - 1);
    for (let k = 1; k < idx.length; k++) line(P_.slice(idx[k - 1], idx[k] + 1), "ink", tr.a, { dip: tr.dip ?? 0.3 });
    for (const i of idx) {
      if (i > whole) continue; // the drawing end carries no tick until it reaches one
      // ticks square to the line, up towards the sky, measured on the still so they keep their angle to the sand
      const p = tr.p[i], q2 = tr.p[Math.min(tr.p.length - 1, i + 1)], o = tr.p[Math.max(0, i - 1)];
      const dx = q2[0] - o[0], dy = q2[1] - o[1], l = Math.hypot(dx, dy) || 1;
      let nx = dy / l, ny = -dx / l;
      if (ny > 0) { nx = -nx; ny = -ny; }
      line([T(p), T([p[0] + nx * tr.tick, p[1] + ny * tr.tick])], "ink", tr.a);
    }
  }

  // The contour scale at the right, carried with the dune, and the leaders to it from the peak and the two bends
  seg([SCALE_X, 300], [SCALE_X, 1480], "ink", 0.4);
  for (let i = 0; i < 60; i++) { const y = 300 + i * 20; seg([SCALE_X, y], [SCALE_X + (i % 5 === 0 ? 18 : 8), y], "ink", 0.38); }
  // Idle: one leader at a time (each every 12 s, a third apart) draws off into its feature, rests, and draws back out
  const sm = (v: number) => { const k = Math.min(1, Math.max(0, v)); return k * k * (3 - 2 * k); };
  [PEAK, BEND_UP, BEND_LO].forEach((p, i) => {
    const ph = amb > 0 ? (amb / 12 + i / 3 + 0.2) % 1 : 0;
    const f = ph < 0.78 ? 1 : ph < 0.86 ? 1 - sm((ph - 0.78) / 0.08) : ph < 0.9 ? 0 : sm((ph - 0.9) / 0.1);
    if (f > 0.01) seg(p, [p[0] + (SCALE_X - p[0]) * f, p[1]], "ink", 0.28, [3, 6]);
    const c = T([SCALE_X, p[1]]), s = 5 * scaleAt([SCALE_X, p[1]]);
    line([[c[0] - s, c[1] - s], [c[0] + s, c[1] - s], [c[0] + s, c[1] + s], [c[0] - s, c[1] + s], [c[0] - s, c[1] - s]], "ink", 0.3 + 0.3 * f);
  });

  // The lower bend: a protractor, its ticks, the crest's tangent and level; the green arc reads the tangent's angle as
  // the camera turns it (frame px, so it is the angle on screen)
  line(arcPts(BEND_LO, PRO_R, 150, 330), "ink", 0.35);
  // idle: the major ticks breathe in place, together (16 px, +-3, every 7 s)
  const major = 16 + (amb > 0 ? 3 * Math.sin((2 * Math.PI * amb) / 7) : 0);
  for (let d = 150, i = 0; d <= 330 + 1e-6; d += 3, i++) {
    const l = i % 5 === 0 ? major : 7, c = Math.cos(rad(d)), s = Math.sin(rad(d));
    seg([BEND_LO[0] + PRO_R * c, BEND_LO[1] + PRO_R * s], [BEND_LO[0] + (PRO_R + l) * c, BEND_LO[1] + (PRO_R + l) * s], "ink", 0.35);
  }
  const ta: Pt = [BEND_LO[0] - 150, BEND_LO[1] + 210], tb: Pt = [BEND_LO[0] + 130, BEND_LO[1] - 182];
  seg(ta, tb, "ink", 0.3, [8, 6]);
  seg([BEND_LO[0] - 170, BEND_LO[1]], [BEND_LO[0] + 170, BEND_LO[1]], "ink", 0.25, [2, 5]);
  {
    const c = T(BEND_LO), A = T(ta), B = T(tb), L0 = T([BEND_LO[0] - 170, BEND_LO[1]]), L1 = T([BEND_LO[0] + 170, BEND_LO[1]]);
    const tan = Math.atan2(B[1] - A[1], B[0] - A[0]), lev = Math.atan2(L1[1] - L0[1], L1[0] - L0[0]);
    const r = 70 * scaleAt(BEND_LO), o: P[] = [];
    for (let i = 0; i <= 18; i++) { const a = tan + ((lev - tan) * i) / 18; o.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]); }
    line(o, "deep", 0.8);
    const s = 12 * scaleAt(BEND_LO);
    line([[c[0] - s, c[1]], [c[0] + s, c[1]]], "ink", 0.6); line([[c[0], c[1] - s], [c[0], c[1] + s]], "ink", 0.6);
  }
  ring([BEND_LO[0] + PRO_R * Math.cos(rad(216)), BEND_LO[1] + PRO_R * Math.sin(rad(216))], 6, "ink", 0.55);
  // The sun on the same protractor (it stands on the crest, at the boundary of light and shade the reading compares):
  // a radial hairline outside the rim and a small ring, from low on the left (the first frame's raking light) up
  // towards the zenith as the time-lapse sun climbs
  {
    const ang = rad(195 + sun * 70), c = Math.cos(ang), s = Math.sin(ang);
    seg([BEND_LO[0] + (PRO_R + 22) * c, BEND_LO[1] + (PRO_R + 22) * s], [BEND_LO[0] + (PRO_R + 40) * c, BEND_LO[1] + (PRO_R + 40) * s], "deep", 0.75);
    ring([BEND_LO[0] + (PRO_R + 48) * c, BEND_LO[1] + (PRO_R + 48) * s], 5, "deep", 0.85);
  }
  ring(BEND_UP, 8, "ink", 0.6);
  seg([BEND_UP[0] - 14, BEND_UP[1]], [BEND_UP[0] + 14, BEND_UP[1]], "ink", 0.45);
  seg([BEND_UP[0], BEND_UP[1] - 14], [BEND_UP[0], BEND_UP[1] + 14], "ink", 0.45);

  // The peak sighted: its axis, the level ruler above it (fading in and out at its ends), brackets, the green node
  {
    const a0 = T([PEAK[0], 205]), a1 = T([PEAK[0], PEAK[1] - 26]);
    line([a0, a1], "ink", 0.4, { dash: [14, 6, 2, 6] });
    const k = scaleAt(PEAK);
    dot(a0, 3 * k, "ink", 0.6); dot(a1, 3 * k, "ink", 0.6);
    // the level ruler, short of the frame's right edge (it ran off it), fading in from the left and out to the right
    const x0 = PEAK[0] - 280, x1 = PEAK[0] + 70, y = 230;
    const ramp = (x: number) => Math.min(1, (x - x0) / 120, (x1 - x) / 60);
    for (let x = x0, i = 0; x < x1; x += 12, i++) {
      const al = 0.4 * Math.max(0, ramp(x + 6));
      if (al > 0.02) seg([x, y], [x + 12, y], "ink", al);
      const at = 0.4 * Math.max(0, ramp(x));
      if (at > 0.02) seg([x, y], [x, y + (i % 5 === 0 ? 12 : 5)], "ink", at);
    }
    const w = 30, l = 9;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      line([T([PEAK[0] + sx * w, PEAK[1] + sy * (w - l)]), T([PEAK[0] + sx * w, PEAK[1] + sy * w]), T([PEAK[0] + sx * (w - l), PEAK[1] + sy * w])], "ink", 0.5);
    }
    ring(PEAK, 12, "deep", 0.9);
    const p = T(PEAK);
    dot(p, 4.5 * scaleAt(PEAK), "green", 1);
  }

    // One marker travels up the crest, from the lower bend to the peak, with the scroll (D45: markers may travel); idle,
  // it drifts a little to and fro along the crest where it is (every 16 s)
  {
    const from = CREST.findIndex((p) => p[1] <= BEND_LO[1] + 10), P_ = CREST.slice(from).map(T);
    const len = P_.slice(1).map((p, i) => Math.hypot(p[0] - P_[i][0], p[1] - P_[i][1]));
    const u0 = 0.04 + 0.9 * Math.min(1, Math.max(0, q)) + (amb > 0 ? 0.03 * Math.sin((2 * Math.PI * amb) / 16) : 0);
    let d = (len.reduce((s, v) => s + v, 0)) * u0, i = 0;
    while (i < len.length - 1 && d > len[i]) { d -= len[i]; i++; }
    const u = len[i] ? d / len[i] : 0, m: P = [P_[i][0] + (P_[i + 1][0] - P_[i][0]) * u, P_[i][1] + (P_[i + 1][1] - P_[i][1]) * u];
    const show = Math.min(1, (0.99 - u0) / 0.04);
    if (show > 0) {
      const r = 7 * scaleAt(BEND_LO), o: P[] = [];
      for (let k = 0; k <= 24; k++) { const a = (k / 24) * 2 * Math.PI; o.push([m[0] + r * Math.cos(a), m[1] + r * Math.sin(a)]); }
      line(o, "deep", 0.85 * show);
      dot(m, 2.6 * scaleAt(BEND_LO), "deep", 0.9 * show);
    }
  }
  return out;
}
