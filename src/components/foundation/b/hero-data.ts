// The hero's world: one block (the Foundation, 4 × 4 × 3 cubes) in the middle of a dotted floor (20 × 20 units). Scrolled, 44 of its 48 cubes slide out onto
// the floor's lattice and become the ecosystem (four regions: wallets, apps, protocols, the community, plus some on their own); four stay (the Foundation,
// smaller). Then the network draws in between them. Pure data, shared by the markup (HeroIso.tsx) and the motion (hero-motion.ts).
import { P, type V } from "./iso";

export const U = 30;            // screen units per world unit at the camera's scale 1
export const G = 20, M = 10;    // the floor's size, its middle
export const B0 = 8, BN = 4, BH = 3;

/** a world point relative to the floor's middle, in screen units */
export const W = (x: number, y: number, z = 0): V => { const [a, b] = P(x - M, y - M, z); return [a * U, b * U]; };

type Slot = { x: number; y: number; z: number; r: number };   // r: its region (0 wallets, 1 apps, 2 protocols, 3 community, −1 on its own)
// the ecosystem's lattice: odd coordinates (a cube on n fills n..n+1: a unit of floor between neighbours); towers stack on a node
const N = (r: number, list: [number, number, number?][]): Slot[] => list.flatMap(([x, y, h = 1]) => Array.from({ length: h }, (_, z) => ({ x, y, z, r })));
const SLOTS: Slot[] = [
  // wallets: the front (x + y large)
  ...N(0, [[15, 13, 2], [17, 13], [13, 15], [15, 15], [17, 15, 2], [13, 17], [15, 17]]),
  // apps: the right (x − y large)
  ...N(1, [[13, 5], [15, 5, 3], [17, 5], [13, 3], [15, 7], [17, 7], [15, 3]]),
  // protocols: the back (x + y small)
  ...N(2, [[7, 3, 2], [9, 3], [5, 3], [7, 1], [9, 5], [5, 5], [11, 3]]),
  // the community: the left (y − x large)
  ...N(3, [[7, 15], [5, 15], [7, 17, 2], [9, 17], [5, 17], [7, 19], [9, 19], [9, 15]]),
  // on their own, between
  ...N(-1, [[13, 9], [9, 13], [13, 11], [11, 13], [9, 7], [7, 11], [11, 1], [3, 11], [17, 9]]),
];

export type Piece = {
  sx: number; sy: number; sz: number;   // in the block
  ex: number; ey: number; ez: number;   // on the floor
  core: boolean; g: boolean; s: number; r: number;   // stays; a green top; its start (0..1 of the scene); its region
};
export const T_MOVE = 0.3;              // each cube's move, as a share of the scene

function build(): Piece[] {
  const all: Piece[] = [];
  for (let z = 0; z < BH; z++) for (let i = 0; i < BN; i++) for (let j = 0; j < BN; j++) {
    const core = z === 0 && i > 0 && i < 3 && j > 0 && j < 3;
    all.push({ sx: B0 + i, sy: B0 + j, sz: z, ex: B0 + i, ey: B0 + j, ez: z, core, g: false, s: 0, r: -2 });
  }
  const movers = all.filter((p) => !p.core);
  const c = B0 + BN / 2, dist = (x: number, y: number) => Math.hypot(x + 0.5 - c, y + 0.5 - c), ang = (x: number, y: number) => Math.atan2(y + 0.5 - c, x + 0.5 - c);
  // the order out: the top layer first, the outside of each layer first (their way out is clear)
  movers.sort((a, b) => b.sz - a.sz || dist(b.sx, b.sy) - dist(a.sx, a.sy) || ang(a.sx, a.sy) - ang(b.sx, b.sy));
  const used = new Set<number>();
  const free = (k: number) => { const s = SLOTS[k]; return !used.has(k) && (s.z === 0 || SLOTS.some((o, m) => used.has(m) && o.x === s.x && o.y === s.y && o.z === s.z - 1)); };
  movers.forEach((p, n) => {
    const a = ang(p.sx, p.sy), inner = dist(p.sx, p.sy) < 1;
    let best = -1, cost = Infinity;
    SLOTS.forEach((s, k) => {
      if (!free(k)) return;
      let d = Math.abs(a - ang(s.x, s.y)); if (d > Math.PI) d = 2 * Math.PI - d;
      const v = (inner ? 0 : d) + dist(s.x, s.y) * (inner ? 0.02 : 0.004) + s.z * 0.3;
      if (v < cost) { cost = v; best = k; }
    });
    used.add(best);
    const s = SLOTS[best];
    p.ex = s.x; p.ey = s.y; p.ez = s.z; p.r = s.r;
    p.s = 0.05 + (n / (movers.length - 1)) * 0.5;
  });
  // one green top in each region (its highest cube), and on the Foundation
  [0, 1, 2, 3].forEach((r) => { const top = movers.filter((p) => p.r === r).sort((a, b) => b.ez - a.ez || b.ex + b.ey - (a.ex + a.ey))[0]; if (top) top.g = true; });
  const coreTop = all.find((p) => p.core && p.sx === B0 + 2 && p.sy === B0 + 2); if (coreTop) coreTop.g = true;
  return all;
}
export const PIECES = build();

/** the network: floor-level lines between neighbouring nodes (and the Foundation), routed along the lattice; each draws once both ends have landed */
export type Edge = { d: string; at: number };
function edges(): Edge[] {
  const nodes = new Map<string, { x: number; y: number; land: number }>();
  PIECES.forEach((p) => {
    if (p.core) return;
    const k = `${p.ex},${p.ey}`, land = p.s + T_MOVE, n = nodes.get(k);
    if (!n || land < n.land) nodes.set(k, { x: p.ex, y: p.ey, land });
  });
  const list = [...nodes.values()], out: Edge[] = [], seen = new Set<string>();
  const route = (ax: number, ay: number, bx: number, by: number) => {
    const a = W(ax + 0.5, ay + 0.5), m = W(bx + 0.5, ay + 0.5), b = W(bx + 0.5, by + 0.5);
    return ax === bx || ay === by ? `M${a[0].toFixed(1)},${a[1].toFixed(1)}L${b[0].toFixed(1)},${b[1].toFixed(1)}` : `M${a[0].toFixed(1)},${a[1].toFixed(1)}L${m[0].toFixed(1)},${m[1].toFixed(1)}L${b[0].toFixed(1)},${b[1].toFixed(1)}`;
  };
  const deg = new Map<string, number>(), key = (n: { x: number; y: number }) => `${n.x},${n.y}`;
  const add = (a: { x: number; y: number; land: number }, b: { x: number; y: number; land: number }) => {
    const k = [a.x, a.y, b.x, b.y].join(), k2 = [b.x, b.y, a.x, a.y].join();
    if (seen.has(k) || seen.has(k2)) return; seen.add(k);
    deg.set(key(a), (deg.get(key(a)) || 0) + 1); deg.set(key(b), (deg.get(key(b)) || 0) + 1);
    out.push({ d: route(a.x, a.y, b.x, b.y), at: Math.max(a.land, b.land) });
  };
  // neighbours on the lattice (two units apart along an axis)
  list.forEach((a) => list.forEach((b) => { if ((a.x === b.x && Math.abs(a.y - b.y) === 2) || (a.y === b.y && Math.abs(a.x - b.x) === 2)) add(a, b); }));
  // a node with no neighbour: to its nearest
  list.forEach((a) => {
    if (deg.get(key(a))) return;
    const b = list.filter((o) => o !== a).sort((p, q) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(q.x - a.x, q.y - a.y))[0];
    if (b) add(a, b);
  });
  // the Foundation, wired to the four nodes on its axes
  const core = { x: M - 0.5, y: M - 0.5, land: 0 };
  [[13, 9], [9, 13], [9, 7], [7, 11]].forEach(([x, y]) => { const n = nodes.get(`${x},${y}`); if (n) add(core, n); });
  return out.sort((a, b) => a.at - b.at);
}
export const EDGES = edges();

/** the chips: the Foundation's rides its block's top; each region's sits over its green cube */
export const CHIPS = [
  { k: "f", label: "Foundation" },
  { k: "0", label: "Wallets" },
  { k: "1", label: "Apps" },
  { k: "2", label: "Protocols" },
  { k: "3", label: "Community" },
];
