import type { Ell, Pt } from "@/components/v2/chapter-one/cinematic/geom";
import type { Tone } from "@/components/v2/chapter-one/cinematic/vec";
import BASE from "./data/base.json";

// G1's traced layer (D163-D165; /home-v7's hero since D167), in the clouds layer's language (D90), drawn on the time-lapse film's own
// first frame in the video's pixels (1920 × 1080) and carried through the move. D164 (Lawrence: "more sweeping and extend
// to the vista … too concentrated on the crystals … more tracking dots fade up"): long arcs across the sky and the vista,
// sightlines from the shard out to the peaks, and real tracking dots on the land, the cloud sea and the sky that fade up
// through the move; the crystals keep only the node and its goniometer; a small station stands on the boulder in front (D165). Constant life at rest, before any scroll.
// The skylines, the far range, the ridge and the big shard each ride one similarity per frame (assets/generated/
// 2026-11-15_hero-g1-timelapse/layer: crest.py, track.py, export.py); the dots are their own LK tracks (dots2.py).
// Nothing here is a fact or a number: the marks are drawing, not data.
export type LineKey = keyof typeof BASE.lines;
export type Group = "far" | "ridge" | "shard" | "left" | "rock" | "fg";
export type LineStyle = { tone: Tone; a: number; every: number; tickEvery: number; tick: number; major: number; tickA: number; group: Group };
export const LINES: Record<LineKey, LineStyle> = {
  far: { tone: "ink", a: 0.56, every: 6, tickEvery: 12, tick: 3, major: 6, tickA: 0.7, group: "far" },
  snow: { tone: "ink", a: 0.62, every: 6, tickEvery: 10, tick: 4, major: 8, tickA: 0.75, group: "far" },
  ridge: { tone: "white", a: 0.36, every: 6, tickEvery: 14, tick: 3, major: 5, tickA: 0.7, group: "ridge" },
};

// The film's first frame inside G1's still (vista-s1-grade-blog, 2400 × 1340), for tablets and reduced motion
export const STILL = { m: [1.18956, 0.00272, 59.9614, -0.00272, 1.18956, 48.68464], w: 2400, h: 1340, src: "home-hero-g1-still-v1" };

// ── The sweep across the sky: a great arc over the whole horizon (a circle 4000 px round, its crown above the
// goniometer), ticked, carried with the far range; it rises out of the picture as the camera comes down
export const SKY: Ell = { cx: 1000, cy: 4180, rx: 4000, ry: 4000 }; // critic: raised so it clears the headline at frame 0
export const SKY_FROM = 253.5, SKY_TO = 286.5;
// ── The sweep across the vista: a level ring laid on the cloud sea round the middle ridge, out past the left edge;
// its near side sweeps under the headline across the cloud sea (stopping short of the rock), its far side dashed over
// the ridge's flank. Carried with the ridge.
export const VISTA: Ell = { cx: 700, cy: 800, rx: 1100, ry: 110, rot: -1.2 };
export const VISTA_NEAR: [number, number] = [82, 200];
export const VISTA_FAR: [number, number] = [184, 300]; // critic: dashed across the cloud sea, so the ring closes

// ── The big shard, sighted: its top corner is the node (deep ring, green dot, cross, brackets), a sight above it and a
// goniometer arc over the corner whose needle turns as the camera comes down. Sightlines run from the node out across
// the vista to peaks on the far range, the snow and the ridge, each with a ring at its end.
export const TIP: Pt = [1416, 530];
export const GON: Ell = { cx: TIP[0], cy: TIP[1], rx: 86, ry: 86 };
export const GON_FROM = 204, GON_TO = 336;
export const AXIS_TOP = 118;
export const SIGHTS: { line: LineKey; i: number }[] = [
  { line: "far", i: 39 }, { line: "snow", i: 35 }, { line: "far", i: 107 }, { line: "ridge", i: 32 }, { line: "far", i: 148 }, { line: "far", i: 10 }, { line: "snow", i: 77 },
];
// ── The foreground station (D165): a small instrument set on the lichen of the boulder in front, on its own track (a
// similarity fitted on the rock within 110 px of it, fg.py: the rock's one group drifted 25-100 px this near, in
// perspective). It grows as the camera comes in, as the foreground does (to 1.4x at most): a ring with a short cross inside,
// a white centre that turns green as the rider passes the top, a dotted outer ring with a marker that travels it at rest, and a short level beneath whose index
// slides with the scroll and sways at rest.
export const STATION: Pt = [1510, 905];
export const stationRider = (t: number) => (t * 24) % 360;
export const levelIndex = (p: number, t: number) => -14 + 28 * p + (t ? 3 * Math.sin(t * 0.7) : 0);

// Small marks on the skylines' peaks
export type Mark = { line: LineKey; i: number; kind: "cross" | "ring" | "square"; a: number; r: number };
export const MARKS: Mark[] = [
  ...[72, 176].map((i): Mark => ({ line: "far", i, kind: "square", a: 0.44, r: 2.6 })),
  ...[35, 49, 71].map((i): Mark => ({ line: "snow", i, kind: "square", a: 0.46, r: 2.6 })),
  ...[62, 104, 139, 170].map((i, k): Mark => ({ line: "ridge", i, kind: k % 2 ? "ring" : "cross", a: 0.4, r: 3 })),
];

// The scroll's life (it follows the video frame): the needle turns towards the vertical, markers travel the arcs
export const needle = (p: number) => 246 + 18 * p;
export const skyRing = (p: number) => 262 + 14 * p;
export const vistaRing = (p: number) => 150 - 40 * p;
export const vistaSquare = (p: number) => 118 - 30 * p;

// Constant life at rest (D44; Lawrence, D164: "constant animation happening before the scroll"), on the ambient clock t
// (seconds; it holds when the tab is hidden or the hero is off screen; reduced motion never runs it). Only marks move:
// riders travel the two arcs, the sightlines draw out from the node and back in turn, the dots lock on and let go.
export const skyRider = (t: number) => SKY_FROM + ((t * 0.9) % (SKY_TO - SKY_FROM));
export const vistaRider = (t: number) => VISTA_NEAR[0] + ((t * 9) % (VISTA_NEAR[1] - VISTA_NEAR[0]));
export const needleSway = (t: number) => 2.2 * Math.sin(t * 0.45);
const ease = (u: number) => u * u * (3 - 2 * u);
// a sightline: drawn out from the node over 1.8 s, held 5.2 s, drawn back over 1.8 s, absent 1.6 s (10.5 s), staggered so
// a new one starts every 1.5 s (critic: the idle life read as static);
// [start, end] of the line as fractions from the node
export function sightOn(t: number, k: number): [number, number] {
  const c = ((t + k * 1.5) % 10.5 + 10.5) % 10.5;
  if (c < 1.8) return [0, ease(c / 1.8)];
  if (c < 7) return [0, 1];
  if (c < 8.8) return [ease((c - 7) / 1.8), 1];
  return [1, 1];
}
// a dot's lock-on: most dots fade up with a ring closing in on them, hold, then let go and come back (8-14 s cycles,
// staggered); every fifth holds steady. Returns [strength 0-1, how far the ring has closed 0-1].
export function dotLock(t: number, k: number): [number, number] {
  if (k % 5 === 4) return [1, 1];
  const P = 8 + ((k * 37) % 7), c = (t + ((k * 2.618) % P)) % P;
  if (c < 0.9) { const u = ease(c / 0.9); return [u, u]; }
  if (c < P - 1.4) return [1, 1];
  if (c < P - 0.5) return [1 - ease((c - (P - 1.4)) / 0.9), 1];
  return [0, 0];
}

export { BASE };
