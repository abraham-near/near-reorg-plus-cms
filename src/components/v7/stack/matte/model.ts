// Home v6's Stack drawing in 3D, for the lit matte look (D149): v2/stack/geometry.ts's boxes (Lawrence's buildStack: x, y across, z up), the model
// v6's iso faces were drawn from, here in three.js's axes (X = x, Y = z up, Z = y). Checked against v6's faces (./../geometry.ts): projected with
// proj() they land on them, box for box. NEAR AI's boxes are tagged by product by matching their faces to v6's AI list.
import { AI, type Seg } from "../geometry";

export type Box3 = { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number };
export type Layer = "protocol" | "intents" | "ai" | "com";

const BEAM = 29.5, P = 33.5, TOP = 0, BOTTOM = -644;
const FRAMES = { intents: { h: 93.5, zb: -343, zt: -279.5 }, ai: { h: 138.6, zb: -393.5, zt: -231.5 }, com: { h: 185.3, zb: -442, zt: -183 } };
type Gap = [string, number?, number?];
const GAPS: Record<keyof typeof FRAMES, Gap[]> = {
  intents: [["B"], ["E3", 40.9, 999], ["E4", 40.9, 999]], ai: [["E1", -42, 4], ["E3", -41, 6], ["E5", -338, -291.5]], com: [["E4", -85.5, -40]],
};
/* a ring: a square frame of beams (corners and edges), with its gaps (v2's buildStack), in v2's axes */
function frame(layer: keyof typeof FRAMES): Box3[] {
  const { h, zb, zt } = FRAMES[layer], c = BEAM, out: Box3[] = [], gaps = GAPS[layer];
  const add = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) => out.push({ x0, x1, y0, y1, z0, z1 });
  const corners: Record<string, [number, number, number]> = { T: [-h, -h, zt - c], UR: [h - c, -h, zt - c], LR: [h - c, -h, zb], B: [h - c, h - c, zb], LL: [-h, h - c, zb], UL: [-h, h - c, zt - c] };
  for (const [k, [x, y, z]] of Object.entries(corners)) if (!gaps.some((g) => g[0] === k)) add(x, x + c, y, y + c, z, z + c);
  const edge = (e: string, lo: number, hi: number, mk: (a: number, b: number) => void) => {
    let a = lo;
    for (const [, g0 = lo, g1 = hi] of gaps.filter((g) => g[0] === e).sort((p, q) => (p[1] ?? 0) - (q[1] ?? 0))) {
      if (Math.max(lo, g0) > a) mk(a, Math.max(lo, g0));
      a = Math.max(a, Math.min(hi, g1));
    }
    if (a < hi) mk(a, hi);
  };
  edge("E1", -h + c, h - c, (a, b) => add(a, b, -h, -h + c, zt - c, zt));
  edge("E2", zb + c, zt - c, (a, b) => add(h - c, h, -h, -h + c, a, b));
  edge("E3", -h + c, h - c, (a, b) => add(h - c, h, a, b, zb, zb + c));
  edge("E4", -h + c, h - c, (a, b) => add(a, b, h - c, h, zb, zb + c));
  edge("E5", zb + c, zt - c, (a, b) => add(-h, -h + c, h - c, h, a, b));
  edge("E6", -h + c, h - c, (a, b) => add(-h, -h + c, a, b, zt - c, zt));
  return out;
}
/* v2's axes to three's */
const toThree = (b: Box3): Box3 => ({ x0: b.x0, x1: b.x1, y0: b.z0, y1: b.z1, z0: b.y0, z1: b.y1 });

/* v2's isometric projection (the drawing's): a box's faces as v6 lists them, to match NEAR AI's boxes to their products */
const C = Math.cos(Math.PI / 6);
const proj = (x: number, y: number, z: number) => [(x - y) * C, (x + y) * 0.5 - z];
/* rounded as v6's list is written (to .1), then to whole units, so a .5 lands the same way on both sides */
const faceKey = (pts: number[][]) => pts.map(([x, y]) => `${Math.round(+x.toFixed(1))},${Math.round(+y.toFixed(1))}`).sort().join(" ");
const keyOf = ({ x0, x1, y0, y1, z0, z1 }: Box3) => [
  [proj(x0, y1, z0), proj(x1, y1, z0), proj(x1, y1, z1), proj(x0, y1, z1)],
  [proj(x1, y0, z0), proj(x1, y1, z0), proj(x1, y1, z1), proj(x1, y0, z1)],
  [proj(x0, y0, z1), proj(x1, y0, z1), proj(x1, y1, z1), proj(x0, y1, z1)],
].map(faceKey).join("|");
const SEG = new Map(AI.map(([seg, ...b]) => [b.map((f) => faceKey(f.split(" ").map((p) => p.split(",").map(Number)))).join("|"), seg]));

export const CUBES = 6;
export const CUBE_H = (TOP - BOTTOM) / CUBES;
/* none between the pillar's cubes: together they read as one tall piece, no joints (D150, Lawrence; D149 had a hair, .8, a fine dark line at each) */
const JOINT = 0;

export type Piece = { key: string; layer: Layer; cube?: number; seg?: Seg; boxes: Box3[] };
export const PIECES: Piece[] = [
  ...Array.from({ length: CUBES }, (_, i): Piece => {
    const top = TOP - i * CUBE_H - (i ? JOINT / 2 : 0), bot = TOP - (i + 1) * CUBE_H + (i < CUBES - 1 ? JOINT / 2 : 0);
    return { key: `cube${i}`, layer: "protocol", cube: i, boxes: [{ x0: -P, x1: P, y0: bot, y1: top, z0: -P, z1: P }] };
  }),
  { key: "intents", layer: "intents", boxes: frame("intents").map(toThree) },
  ...(["ironclaw", "cloud", "market"] as const).map((seg): Piece => ({
    key: `ai-${seg}`, layer: "ai", seg, boxes: frame("ai").filter((b) => SEG.get(keyOf(b)) === seg).map(toThree),
  })),
  { key: "com", layer: "com", boxes: frame("com").map(toThree) },
];
/* every box, in pieces' order (the shader's occluders) */
export const BOX_COUNT = PIECES.reduce((n, p) => n + p.boxes.length, 0);
/* the cap's top face is at Y 0, its half-width P */
export const CAP = { y: TOP, half: P };
