// The hero's structure (Foundation C): a stepped plinth (the Foundation) on a dotted ground, and on it a field of green columns of many heights (the ecosystem).
// Some columns are still only drawn (wireframes: the ecosystem still being built). Geometry only: HeroIso.tsx draws it, hero-motion.ts grows it.
import { P, box, faces, wire, grid, rng, corners, vbox, type Box, type V } from "./iso";

export const CELL = 60, N = 6, PW = 32, PO = (CELL - PW) / 2;   // the top's grid: N × N cells; a column's footprint and its inset
export const TOP: Box = box(0, 0, CELL * N, CELL * N, -44, 44);  // the plinth: the upper slab (its top is z = 0)
export const BASE: Box = box(-40, -40, CELL * N + 80, CELL * N + 80, -80, 36); // the lower, wider step
export const GROUND = { x0: -170, x1: CELL * N + 170, y0: -170, y1: CELL * N + 170, z: -80 };

// the four greens of home v4's Stack (tokens.css --stack-*), top / left / right
export const TONES = [
  { t: "#5fe0ae", l: "#3cc994", r: "#22a374" },
  { t: "#d4f8e7", l: "#9debc8", r: "#6dd9aa" },
  { t: "#4fd09c", l: "#33b482", r: "#208e64" },
  { t: "#2a9a6d", l: "#1e7a55", r: "#145b3f" },
];

export type Pillar = { i: number; j: number; h: number; tone: number; ghost: boolean; breathe: number };
export const PILLARS: Pillar[] = (() => {
  const r = rng(11), out: Pillar[] = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const k = r(), back = (2 * (N - 1) - (i + j)) / (2 * (N - 1));   // 1 at the back corner, 0 at the front
    if (k < 0.2 && !(i === 1 && j === 1)) continue;               // some cells stay open
    const ghost = k > 0.2 && k < 0.31;
    let h = 26 + r() * 70 + back * back * (90 + r() * 170);
    if (i === 1 && j === 1) h = 330;                                // one landmark at the back
    if (i === 3 && j === 0) h = 250;
    const tone = r() < 0.12 ? 1 : r() < 0.4 ? 3 : r() < 0.55 ? 2 : 0;
    out.push({ i, j, h: Math.round(h), tone, ghost, breathe: r() < 0.45 ? r() * Math.PI * 2 : -1 });
  }
  return out.sort((a, b) => a.i + a.j - (b.i + b.j) || a.i - b.i);   // back to front
})();
export const pBox = (p: Pillar, t = 1): Box => box(p.i * CELL + PO, p.j * CELL + PO, PW, PW, 0, Math.max(0.01, p.h * t));
export const pFaces = (p: Pillar, t = 1) => faces(pBox(p, t));
export const pWire = (p: Pillar) => wire(pBox(p));

export const GROUND_GRID = grid(GROUND.x0, GROUND.x1, GROUND.y0, GROUND.y1, GROUND.z, 16, 16);
export const TOP_GRID = grid(0, CELL * N, 0, CELL * N, 0, N, N);

// lanes on the top for the green signals: along the cell seams
export const LANES: { a: V; b: V }[] = [
  { a: P(CELL * 2, 0, 0), b: P(CELL * 2, CELL * N, 0) },
  { a: P(0, CELL * 4, 0), b: P(CELL * N, CELL * 4, 0) },
  { a: P(CELL * 5, 0, 0), b: P(CELL * 5, CELL * N, 0) },
  { a: P(0, CELL * 1, 0), b: P(CELL * N, CELL * 1, 0) },
];

// the chips: FOUNDATION off the plinth's left foot; ECOSYSTEM over the landmark
const land = PILLARS.find((p) => p.i === 1 && p.j === 1)!;
const lt = P(land.i * CELL + PO + PW / 2, land.j * CELL + PO + PW / 2, land.h);
export const ECO_LEAD: [V, V] = [lt, [lt[0], lt[1] - 46]];
const fa = P(BASE.x1, BASE.y1 - 120, BASE.z0 + 18);
export const FND_LEAD: [V, V] = [fa, [fa[0] + 64, fa[1] + 40]];

const all: V[] = [...corners(BASE), ...PILLARS.flatMap((p) => corners(pBox(p))), P(GROUND.x0, GROUND.y1, GROUND.z), P(GROUND.x1, GROUND.y0, GROUND.z), P(GROUND.x1, GROUND.y1, GROUND.z), ECO_LEAD[1], FND_LEAD[1]];
export const VB = vbox(all, 40);
