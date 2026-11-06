import type { Ell, Pt } from "../../cinematic/geom";
import type { Tone } from "../../cinematic/vec";
import BASE from "./data/base.json";

// A · Above the clouds, as a moving hero (D90): the static concept's layer (cinematic/layers/Summit.tsx) redrawn on the
// camera move's own first frame, in the video's pixels (1920 × 1080). The ridge lines were snapped to the footage's
// crests and are carried through the move point by point (assets/generated/2026-11-05_hero-clouds: snap.py, track.py,
// vtrack.py); the summit's sight, the altimeter and the level orbit ride the massif as one rigid piece (fit.py). The
// near forest and the knoll in front of it rise into view as the camera descends; their lines were snapped on the last
// frame and carried back. Sizes are the concept's, scaled to the video (× 0.87).
export type LineKey = keyof typeof BASE.lines;
// `every`: points per run of the line (each run is strongest at its ends, D60); ticks stand on every `tickEvery`-th
// point (a run end), `tick` px long, every third `major` px (critic round: the concept's comb read as barbed wire at 1×,
// so the ticks are now spaced 2–3× further apart, shorter, and a little lighter than the line: `tickA`)
export type LineStyle = { tone: Tone; a: number; every: number; tickEvery: number; tick: number; major: number; tickA: number; cloud: boolean; from?: number };

// The land: the massif's skyline (ticked, strongest), the far peak, two forest ridges stepping down into the cloud, the
// near forest's crest and the slope and knoll that rise in front of it. `cloud`: the line thins where cloud rolls over
// its crest (measured on the footage); `from`: the first point drawn (keeps the skyline's shoulder off the headline).
export const LINES: Record<LineKey, LineStyle> = {
  sky: { tone: "ink", a: 0.5, every: 4, tickEvery: 8, tick: 4, major: 8, tickA: 0.75, cloud: false, from: 12 },
  far: { tone: "ink", a: 0.34, every: 4, tickEvery: 12, tick: 3, major: 5, tickA: 0.7, cloud: true },
  ridge: { tone: "ink", a: 0.4, every: 4, tickEvery: 12, tick: 3, major: 5, tickA: 0.7, cloud: true },
  spur: { tone: "ink", a: 0.34, every: 4, tickEvery: 12, tick: 3, major: 5, tickA: 0.7, cloud: true },
  front: { tone: "white", a: 0.6, every: 5, tickEvery: 10, tick: 4, major: 7, tickA: 0.75, cloud: true },
  near: { tone: "white", a: 0.62, every: 5, tickEvery: 10, tick: 4, major: 7, tickA: 0.75, cloud: true },
  knoll: { tone: "white", a: 0.5, every: 4, tickEvery: 8, tick: 4, major: 6, tickA: 0.75, cloud: true },
};

// The summit (the skyline's highest point on the first frame) and the pieces that ride the massif with it
export const SUMMIT: Pt = [1334, 259];
export const SUMMIT_LINE = { line: "sky" as LineKey, i: BASE.lines.sky.pts.findIndex((p) => Math.abs(p[0] - SUMMIT[0]) < 0.5 && Math.abs(p[1] - SUMMIT[1]) < 0.5) };
// The altimeter a little tighter than the concept's (× 0.74), so its arc clears the floating nav at 1440 × 900
export const ALT: Ell = { cx: SUMMIT[0], cy: SUMMIT[1], rx: 118, ry: 118 };
export const AXIS_TOP = 128; // the sighting axis runs from AXIS_TOP px above the summit down to 26 px above it
export const RUNGS = 10; // its ladder, 8.7 px apart from 35 px above the summit
export const ORB: Ell = { cx: SUMMIT[0] + 21, cy: SUMMIT[1] + 186, rx: 287, ry: 40, rot: -1.5 };

// Tree tops on the forest crests (crosses, every third a ring), a touch inside the crest
export type Top = { line: LineKey; i: number; ring: boolean };
const tops = (line: LineKey, from: number, step: number, n: number): Top[] =>
  Array.from({ length: n }, (_, k) => ({ line, i: from + k * step, ring: k % 3 === 1 })).filter((t) => t.i < BASE.lines[line].pts.length);
export const TOPS: Top[] = [...tops("front", 10, 12, 11), ...tops("near", 6, 8, 8), ...tops("knoll", 8, 10, 4)];
// Seven survey pins on the tallest tops (two on the middle ridge, critic round): a short staff up from the tree, a ring
// at its head (the deep green one on the
// near forest's crest, in view from the start); the three on the slope in front grow up as it rises into view
export const PINS: { line: LineKey; i: number; deep: boolean }[] = [
  { line: "ridge", i: 36, deep: false },
  { line: "ridge", i: 96, deep: false },
  { line: "front", i: 46, deep: false },
  { line: "front", i: 106, deep: true },
  { line: "near", i: 14, deep: false },
  { line: "near", i: 38, deep: false },
  { line: "near", i: 60, deep: false },
];
export const TOP_DROP = 5; // px below the crest

// Micro-detail on the mid-ground (critic round: at 1× the layer read as just the summit's sight and the orbit): small
// registered marks along the middle ridges, the spur and the far peak, as in concept A, so the land carries detail at
// page scale. `drop`: px below the crest (on the trees), 0 on the line itself.
export type Mark = { line: LineKey; i: number; kind: "cross" | "ring" | "square"; tone: Tone; a: number; r: number; drop: number };
const marks = (line: LineKey, from: number, step: number, n: number, m: Omit<Mark, "line" | "i" | "kind">, kinds: Mark["kind"][]): Mark[] =>
  Array.from({ length: n }, (_, k) => ({ line, i: from + k * step, kind: kinds[k % kinds.length], ...m })).filter((t) => t.i < BASE.lines[line].pts.length);
export const MARKS: Mark[] = [
  ...marks("ridge", 6, 12, 10, { tone: "white", a: 0.6, r: 4, drop: 6 }, ["cross", "cross", "ring"]),
  ...marks("spur", 4, 9, 6, { tone: "ink", a: 0.42, r: 3, drop: 0 }, ["ring", "cross"]),
  ...marks("far", 6, 12, 3, { tone: "ink", a: 0.38, r: 3, drop: 0 }, ["cross"]),
  ...marks("sky", 22, 14, 4, { tone: "ink", a: 0.42, r: 2.6, drop: 0 }, ["square"]),
];

// The scroll's restrained life (all of it follows the video frame, so it only moves with the reader's scroll):
// markers travel round the orbit, the altimeter's needle falls as the camera descends.
export const orbitRing = (p: number) => 118 - 50 * p;
export const orbitSquare = (p: number) => 44 - 24 * p;
export const needle = (p: number) => 268 - 16 * p;

// Idle life (critic round; D44 "alive, not lit", like the rail stations D76/D77/D82): on the ambient clock `t` (seconds,
// desktop with motion only; it holds when the tab is hidden or the hero is off screen; reduced motion never runs it).
// Only markers travel: a small ring rides the orbit round the summit (one turn in 48 s, dimmer behind the rock); the
// altimeter's inner ticks breathe together; each survey pin's ring draws on and off in turn; a few tree-top marks on
// the ridge fade down and back.
export const rider = (t: number) => (90 + t * 7.5) % 360;
export const breathe = (t: number) => 0.5 + 0.5 * Math.sin(t * 0.8);
// a pin's ring: drawn on over 1.6 s, held 4 s, drawn off over 1.6 s, absent 1.8 s (9 s a cycle), staggered per pin;
// [start, end] of the arc as fractions of the circle
export function pinRing(t: number, k: number): [number, number] {
  const c = ((t + k * 1.9) % 9 + 9) % 9;
  if (c < 1.6) return [0, ease(c / 1.6)];
  if (c < 5.6) return [0, 1];
  if (c < 7.2) return [ease((c - 5.6) / 1.6), 1];
  return [1, 1];
}
const ease = (u: number) => u * u * (3 - 2 * u);
// a mark's idle strength: most hold; every fourth fades to a third and back over 7–10 s
export const flicker = (t: number, k: number) => (k % 4 === 1 ? 0.66 + 0.34 * Math.cos(t * (0.6 + 0.07 * k) + k) : 1);

export { BASE };
