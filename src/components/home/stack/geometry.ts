// Isometric geometry for the Stack drawing (D18, after Lawrence's reference). Pure functions, run on the server, so
// the drawing ships as plain SVG. Boxes of any size, three visible faces each, painted back to front.
//
// The composition: the Protocol pillar rises through three concentric box frames (Intents, NEAR AI, near.com). Each
// frame is the six silhouette edges of a box (a hexagon in iso), built from square beams, with openings. Units are the
// reference drawing's pixels, measured from it (pillar 67 wide, beams 29.5).

export type Layer = "protocol" | "intents" | "ai" | "com";
export type Face = { kind: "t" | "l" | "r"; points: string };
export type Piece = { key: string; layer: Layer; faces: Face[] };

const C = Math.cos(Math.PI / 6);
const proj = (x: number, y: number, z: number) => [(x - y) * C, (x + y) * 0.5 - z] as const;
const fmt = (pts: readonly (readonly [number, number])[]) => pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

type Box = { layer: Layer; x0: number; x1: number; y0: number; y1: number; z0: number; z1: number };

const BEAM = 29.5;
const P = 33.5; // pillar half-width
const PILLAR = { bottom: -644, top: 0 }; // one box: same-colour blocks left hairline seams
// Frame half-size (x and y), bottom and top (z)
const FRAMES: Record<Exclude<Layer, "protocol">, { h: number; zb: number; zt: number }> = {
  intents: { h: 93.5, zb: -343, zt: -279.5 },
  ai: { h: 138.6, zb: -393.5, zt: -231.5 },
  com: { h: 185.3, zb: -442, zt: -183 },
};
// Openings, as [edge, from, to] along the edge's running coordinate, or a corner name. Edges go round the hexagon:
// E1 back top (along x), E2 right upright, E3 front bottom right (along y), E4 front bottom left (along x),
// E5 left upright, E6 back top left (along y). Corners: T (top), UR, LR, B (bottom, in front of the pillar), LL, UL.
type Gap = [edge: string, from?: number, to?: number];
const GAPS: Record<Exclude<Layer, "protocol">, Gap[]> = {
  intents: [["B"], ["E3", 40.9, 999], ["E4", 40.9, 999]], // open at the front, either side of the pillar
  ai: [["E1", -42, 4], ["E3", -41, 6], ["E5", -338, -291.5]],
  com: [["E4", -85.5, -40]],
};

function frame(layer: Exclude<Layer, "protocol">): Box[] {
  const { h, zb, zt } = FRAMES[layer], c = BEAM, out: Box[] = [];
  const gaps = GAPS[layer];
  const add = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) => out.push({ layer, x0, x1, y0, y1, z0, z1 });
  const corners: Record<string, [number, number, number]> = {
    T: [-h, -h, zt - c], UR: [h - c, -h, zt - c], LR: [h - c, -h, zb], B: [h - c, h - c, zb], LL: [-h, h - c, zb], UL: [-h, h - c, zt - c],
  };
  for (const [k, [x, y, z]] of Object.entries(corners)) if (!gaps.some((g) => g[0] === k)) add(x, x + c, y, y + c, z, z + c);
  // One edge, minus its openings
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

function boxes(): Box[] {
  const pillar: Box = { layer: "protocol", x0: -P, x1: P, y0: -P, y1: P, z0: PILLAR.bottom, z1: PILLAR.top };
  return [pillar, ...frame("intents"), ...frame("ai"), ...frame("com")];
}

// Back-to-front order for disjoint boxes: a box goes after every box it sits in front of (a separating plane facing
// the viewer, who looks from +x +y +z).
const inFront = (a: Box, b: Box) => a.x0 >= b.x1 - 1e-6 || a.y0 >= b.y1 - 1e-6 || a.z0 >= b.z1 - 1e-6;
function paintOrder(bs: Box[]): Box[] {
  const out: Box[] = [], done = new Set<number>(), busy = new Set<number>();
  const visit = (i: number) => {
    if (done.has(i) || busy.has(i)) return;
    busy.add(i);
    bs.forEach((b, j) => { if (j !== i && inFront(bs[i], b) && !inFront(b, bs[i])) visit(j); });
    busy.delete(i); done.add(i); out.push(bs[i]);
  };
  bs.forEach((_, i) => visit(i));
  return out;
}

// Each ring fades on as one flat group (D21), so the pieces are grouped per layer. A layer group can't interleave with
// the others the way single boxes can, so wherever an inner piece sits in front of a ring piece (the pillar in front of
// each ring's back edges), that inner piece is drawn again above the ring, clipped to the ring piece's footprint swept
// over its build drop and lift (SWEEP), so the overlap stays right while the ring moves.
const SWEEP = { up: 60, down: 16 };
const ORDER: Layer[] = ["protocol", "intents", "ai", "com"];
type Pt = readonly [number, number];
const corners = (b: Box): Pt[] => [b.x0, b.x1].flatMap((x) => [b.y0, b.y1].flatMap((y) => [b.z0, b.z1].map((z) => proj(x, y, z))));
function hull(pts: Pt[]): Pt[] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: Pt[] = [], up: Pt[] = [];
  for (const q of p) { while (lo.length > 1 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of [...p].reverse()) { while (up.length > 1 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
}
const bbox = (pts: Pt[]) => ({ x0: Math.min(...pts.map((q) => q[0])), x1: Math.max(...pts.map((q) => q[0])), y0: Math.min(...pts.map((q) => q[1])), y1: Math.max(...pts.map((q) => q[1])) });
const meets = (a: ReturnType<typeof bbox>, b: ReturnType<typeof bbox>) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
// Two convex polygons overlap unless one of their edges separates them (separating axis test)
function overlaps(a: Pt[], b: Pt[]) {
  for (const poly of [a, b]) for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length], nx = y2 - y1, ny = x1 - x2;
    const pa = a.map(([x, y]) => x * nx + y * ny), pb = b.map(([x, y]) => x * nx + y * ny);
    if (Math.max(...pa) <= Math.min(...pb) + 0.5 || Math.max(...pb) <= Math.min(...pa) + 0.5) return false;
  }
  return true;
}

export type Cover = { id: string; layer: Layer; ring: number; clip: string[]; faces: Face[] };

export function buildStack(extraTop = 56) {
  const sorted = paintOrder(boxes());
  const all: number[][] = [];
  const facesOf = (b: Box): Face[] => {
    const { x0, x1, y0, y1, z0, z1 } = b;
    const f: Record<Face["kind"], Pt[]> = {
      l: [proj(x0, y1, z0), proj(x1, y1, z0), proj(x1, y1, z1), proj(x0, y1, z1)],
      r: [proj(x1, y0, z0), proj(x1, y1, z0), proj(x1, y1, z1), proj(x1, y0, z1)],
      t: [proj(x0, y0, z1), proj(x1, y0, z1), proj(x1, y1, z1), proj(x0, y1, z1)],
    };
    return (["l", "r", "t"] as const).map((k) => ({ kind: k, points: fmt(f[k]) }));
  };
  sorted.forEach((b) => all.push(...corners(b).map((q) => [...q])));
  const layers = ORDER.map((layer, index) => ({
    layer, index,
    pieces: sorted.filter((b) => b.layer === layer).map((b, n): Piece => ({ key: `${layer}-${n}`, layer, faces: facesOf(b) })),
  }));
  const covers: Cover[] = [];
  ORDER.forEach((layer, k) => {
    if (k === 0) return;
    const inner = new Map<Box, Pt[][]>();
    sorted.forEach((p, ip) => {
      if (p.layer !== layer) return;
      const own = corners(p);
      const sweep = hull([...own.map(([x, y]) => [x, y - SWEEP.up] as Pt), ...own.map(([x, y]) => [x, y + SWEEP.down] as Pt)]);
      sorted.forEach((q, iq) => {
        if (iq <= ip || ORDER.indexOf(q.layer) >= k || !meets(bbox(hull(corners(q))), bbox(sweep)) || !overlaps(hull(corners(q)), sweep)) return;
        inner.set(q, [...(inner.get(q) ?? []), sweep]);
      });
    });
    [...inner].forEach(([q, clips], n) => covers.push({ id: `stack-cover-${layer}-${n}`, layer: q.layer, ring: k, clip: clips.map((c) => fmt(c)), faces: facesOf(q) }));
  });
  const pad = 8;
  const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
  const minX = Math.min(...xs) - pad, minY = Math.min(...ys) - pad - extraTop;
  const width = Math.max(...xs) - minX + pad, height = Math.max(...ys) - minY + pad;

  // The official N mark lies flat on the pillar top (an affine map of the unit square onto the top face).
  const inset = 6, side = 2 * P - 2 * inset;
  const o = proj(-P + inset, -P + inset, PILLAR.top);
  const ex = proj(side, 0, 0), ey = proj(0, side, 0);
  const markTransform = `matrix(${ex[0].toFixed(3)},${ex[1].toFixed(3)},${ey[0].toFixed(3)},${ey[1].toFixed(3)},${o[0].toFixed(2)},${o[1].toFixed(2)})`;

  // The Chapter 1 thread lands on the pillar top's back tip (same x as its centre), leaving the N mark clear.
  const [tx, ty] = proj(-P, -P, PILLAR.top);

  return { layers, covers, viewBox: `${minX.toFixed(1)} ${minY.toFixed(1)} ${width.toFixed(1)} ${height.toFixed(1)}`, minY, height, markTransform, thread: { x: tx, y1: minY, y2: ty } };
}
