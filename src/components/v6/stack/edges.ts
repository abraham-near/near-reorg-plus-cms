// The v6 Stack drawing's outlines, without the joints (D131). A ring is drawn as boxes, and where two boxes meet on one flat side (an arm running into its
// corner, a post stacked on a post) their shared edge would be drawn as a line across what reads as one surface. Lawrence wants each piece to read as an
// extruded tube bending at right angles: only its real edges (the folds and the outline) are drawn.
//
// For each face, each edge is walked in 1-unit steps; a step is a joint (left out) where the point just outside it lies on another face of the same kind
// (top, left or right) of the same piece, or where the point just inside it lies under a box of the piece drawn later. A piece: a ring, or for NEAR AI one product (its three are drawn and lit apart). The pillar's cubes keep all their
// edges: each is a layer of its own.
import { INTENTS, AI, COM, FRONT, type Box } from "./geometry";

type Pt = [number, number];
const pts = (s: string): Pt[] => s.split(" ").map((p) => p.split(",").map(Number) as Pt);
const inside = ([x, y]: Pt, poly: Pt[]) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const f1 = (n: number) => Math.round(n * 10) / 10;

/* one face's outline as a path, joints left out. others: the same piece's faces of the same kind; over: the faces of the piece's boxes drawn after this one
   (an edge with one of those on its inner side is under it: an arm's end, hidden in its corner, would show half its outline along the corner's side) */
function outline(face: Pt[], others: Pt[][], over: Pt[][]): string {
  const cx = face.reduce((s, p) => s + p[0], 0) / face.length, cy = face.reduce((s, p) => s + p[1], 0) / face.length;
  let d = "";
  for (let k = 0; k < face.length; k++) {
    const a = face[k], b = face[(k + 1) % face.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (!len) continue;
    let nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len;
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    if (nx * (mx - cx) + ny * (my - cy) < 0) { nx = -nx; ny = -ny; }   /* outward */
    const n = Math.max(1, Math.ceil(len)), keep: boolean[] = [];
    for (let s = 0; s < n; s++) {
      const t = (s + 0.5) / n, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
      const out: Pt = [x + nx * 0.8, y + ny * 0.8], inn: Pt = [x - nx * 0.8, y - ny * 0.8];
      keep.push(!others.some((o) => inside(out, o)) && !over.some((o) => inside(inn, o)));
    }
    for (let s = 0; s < n; ) {
      if (!keep[s]) { s++; continue; }
      let e = s; while (e < n && keep[e]) e++;
      const at = (t: number) => `${f1(a[0] + (b[0] - a[0]) * t)} ${f1(a[1] + (b[1] - a[1]) * t)}`;
      d += `M${at(s / n)}L${at(e / n)}`;
      s = e;
    }
  }
  return d;
}

/* a point on a polygon's edge counts as in it (to 0.05 units): a sample landing exactly on the line between two covering faces (a box's top and its side) is
   covered, though the ray test puts it outside both (D131 critic: 15 buried faces were still drawn, a darker line at the joints) */
const nearEdge = ([x, y]: Pt, poly: Pt[]) => poly.some((a, i) => {
  const b = poly[(i + 1) % poly.length], dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / l2)) : 0;
  return Math.hypot(x - (a[0] + dx * t), y - (a[1] + dy * t)) < 0.05;
});
const covered = (p: Pt, over: Pt[][]) => over.some((o) => inside(p, o) || nearEdge(p, o));
const grid = (face: Pt[]) => {
  const [p0, p1, , p3] = face, out: Pt[] = [];
  for (let u = 0.04; u < 1; u += 0.08) for (let v = 0.04; v < 1; v += 0.08) out.push([p0[0] + (p1[0] - p0[0]) * u + (p3[0] - p0[0]) * v, p0[1] + (p1[1] - p0[1]) * u + (p3[1] - p0[1]) * v]);
  return out;
};
/* a face wholly under the piece's later boxes (a stacked post's top, an arm's end in its corner): not drawn at all, or its colour bleeds into the
   anti-aliased edge of what covers it, a faint line at the joint */
const buried = (face: Pt[], over: Pt[][]) => grid(face).every((p) => covered(p, over));

/* a box's faces: their outlines (left, right, top; joints left out), and which of them are buried */
export type BoxEdges = { e: [string, string, string]; hide: [boolean, boolean, boolean] };
function piece(boxes: Box[]): BoxEdges[] {
  const faces = boxes.map((b) => b.map(pts));
  return faces.map((box, i) => {
    const over = faces.slice(i + 1).flat();
    return {
      e: box.map((face, k) => outline(face, faces.filter((_, j) => j !== i).map((o) => o[k]), over)) as [string, string, string],
      hide: box.map((face) => buried(face, over)) as [boolean, boolean, boolean],
    };
  });
}

export const EDGES = {
  intents: piece(INTENTS),
  com: piece(COM),
  ai: (() => {
    const out: BoxEdges[] = [];
    const segs = [...new Set(AI.map(([s]) => s))];
    for (const seg of segs) {
      const idx = AI.map(([s], i) => (s === seg ? i : -1)).filter((i) => i >= 0);
      const e = piece(idx.map((i) => AI[i].slice(1) as Box));
      idx.forEach((i, k) => { out[i] = e[k]; });
    }
    return out;
  })(),
};
/* each ring's boxes behind the pillar that its front boxes (FRONT) partly cover. While anything is lit the front boxes are drawn again, apart, over the
   parted pillar (D127), so under them these are masked out (StackArtV6: #stk6-nofront): a see-through front box shows no inside of its own piece (D131
   critic: the Agent Market post glowed through its arm) */
export const UNDER_FRONT = (() => {
  const all = { intents: INTENTS, com: COM, ai: AI.map(([, ...b]) => b as Box) };
  const out = {} as Record<keyof typeof all, number[]>;
  (Object.keys(all) as (keyof typeof all)[]).forEach((k) => {
    const faces = all[k].map((b) => b.map(pts)), front = FRONT[k].flatMap((i) => faces[i]);
    out[k] = faces.map((_, i) => i).filter((i) => !FRONT[k].includes(i) && faces[i].some((f) => grid(f).some((p) => front.some((o) => inside(p, o)))));
  });
  return out;
})();
/* a box with all its edges (the pillar's cubes) */
export const fullEdges = (b: Box): BoxEdges => ({ e: b.map((f) => `M${f.split(" ").join("L").replace(/,/g, " ")}Z`) as [string, string, string], hide: [false, false, false] });
