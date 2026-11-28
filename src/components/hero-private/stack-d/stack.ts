// Hero study "Stack D"'s geometry: the drawing of Figma node 1123:6508 ("VEC03_STACK_11") measured into a 3-D model. Units: one world unit along a
// floor axis (or up) is 100 of the drawing's px in its isometric (true isometric: a floor axis projects to (±86.6, 50) px, up to (0, −100) px);
// the origin is the drawing's point (1108.06, 1681.86) at height 0: the stack's axis at the base's underside. World +X runs down-right in the
// drawing, +Z down-left, +Y up (so the camera at rest looks from +X +Y +Z).
// The stack, bottom to top (heights from the drawing's top faces and thicknesses):
//   A5 the green glass base (half side 3.105, 0 → 0.69), its green dot grid; B3 a white cube standing on it, in front;
//   A4 the white perforated plate (half 2.76, 4.226 → 4.485; a 13 × 13 grid of holes, four big ones by the corners);
//   B2 the glass column (side 1.207, 5.52 → 8.19), through
//   A3 the middle green glass sheet (half 2.76, 6.555 → 6.9, two round holes by its left and right corners);
//   A2 the white plate with the arm (half 2.76, 8.884 → 9.143, a square hole round the axis, a 7 × 7 grid of small holes, an arm off its right
//      corner with a round hole); A1 the top green glass sheet (half 2.76, 10.865 → 11.21, a square hole round the axis); B1 the green cube on it.
// (The drawing is not quite one solid model: its holes sit a little in front of the axis. Here every hole is on the axis, where the column runs.)
// Every piece is a `Piece`: its meshes merged by material (one draw per material), its own material instances (each piece fades on its own), and
// its fat outlines (hard edges): ink, except the edges of the glass seen only through the glass, which the drawing draws in green.
import * as THREE from "three";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export const F = { x: 1108.06, y: 1681.86 };
/** a point of the drawing (sx, sy) placed at height y: the world point that projects there in the isometric */
export function fromDrawing(sx: number, sy: number, y: number) {
  const u = (sx - F.x) / 86.6, v = (sy - F.y + 100 * y) / 50;
  return new THREE.Vector3((u + v) / 2, y, (v - u) / 2);
}

/* ── the measures ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
export type PlateKind = "base" | "perf" | "sheet" | "arm" | "top";
export type PlateDef = { id: string; kind: PlateKind; y0: number; y1: number; half: number; hole: number; level: number };
/** bottom to top. `level`: the data's level shown on it (0 sharp, 1 soft, 2 glow) */
export const PLATES: PlateDef[] = [
  { id: "A5", kind: "base", y0: 0, y1: 0.69, half: 3.105, hole: 0, level: 0 },
  { id: "A4", kind: "perf", y0: 4.226, y1: 4.485, half: 2.76, hole: 0, level: 1 },
  { id: "A3", kind: "sheet", y0: 6.555, y1: 6.9, half: 2.76, hole: 0, level: 1 },
  { id: "A2", kind: "arm", y0: 8.884, y1: 9.143, half: 2.76, hole: 0.8626, level: 2 },
  { id: "A1", kind: "top", y0: 10.865, y1: 11.21, half: 2.76, hole: 0.69, level: 2 },
];
export const COLUMN = { s: 1.207, y0: 5.52, y1: 8.19 };
export const CUBE = { s: 1.207, y0: 11.39 };                 // B1, the green cube on the top sheet
export const BASE_CUBE = { s: 1.035, at: 1.04 };              // B3, on the base, in front (at x = z = 1.04)
/** the arm off A2's right corner: x from the plate's edge to 3.62, z from −2.76 to −1.38; a round hole in it */
export const ARM = { x1: 3.623, z0: -2.76, z1: -1.38, hole: { x: 3.19, z: -2.07, r: 0.183 } };
/** A3's two round holes (by its left and right corners) */
export const SHEET_HOLES: [number, number, number][] = [[-1.72, 1.72, 0.21], [1.72, -1.72, 0.21]];
/** the satellites: the drawing's centre (sx, sy), side, the height chosen for it, which plate it feeds (index in PLATES), along which axis */
export const SATS: { sx: number; sy: number; s: number; y: number; feeds: number }[] = [
  { sx: 630.36, sy: 378, s: 0.69, y: 11.04, feeds: 4 },     // B5_2, upper left: the top sheet
  { sx: 1780.23, sy: 707.15, s: 0.69, y: 9.02, feeds: 3 },  // B5, upper right: the arm plate
  { sx: 495.64, sy: 1172.94, s: 1.035, y: 6.73, feeds: 2 }, // B4, left: the middle sheet
  { sx: 1798.95, sy: 1354.1, s: 1.035, y: 1.2, feeds: 0 },  // B4_2, right: the base
];
/** the grey guides (vertical dashed lines of the drawing): sx, sy top, sy bottom; and the dimension ticks (E7) */
export const VGUIDES: [number, number, number][] = [
  [645.01, 836.5, 1690.5], [1541.25, 603.6, 1807.8], [1003.49, 543.3, 836.5], [1212.62, 543.3, 836.5],
];
export const AXIS = { sx: 1108.06, syBottom: 1474.8 };      // the axis guide: from the perforated plate's level up off the top edge
export const TOPLINE = { sx: 1287.31, sy: 733.03 };         // the top guide: from a black dot on A2 up off the top edge
export const COTAS: [number, number, number][] = [[566.19, 595.0, 698.5], [566.19, 1371.3, 1474.8], [1690.18, 896.9, 1009.1], [1651.37, 1095.3, 1242.0]];
export const FLOOR = { half: 4.31, y: -0.1725 };              // the drawing's floor diamond (C1), under the base

/* ── the material library (./fx.ts makes it) ──────────────────────────────────────────────────────────────────────────────────────────────── */
export type MatKind = "white" | "dim" | "green" | "glass" | "column" | "perf" | "perfArm";
export interface Lib {
  make(kind: MatKind): THREE.Material;
  /** a new outline material: ink (1.3 px, 0.85), or the drawing's green for the edges seen through glass */
  line(green?: boolean): LineMaterial;
}
const GLASSY: MatKind[] = ["glass", "column"];

/* ── a piece ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
type Mat = THREE.Material & { opacity: number; transparent: boolean };
export class Piece {
  /** the piece's centre (world, at rest) */
  c = new THREE.Vector3();
  private op = 1;
  private base = new Map<Mat, number>();
  constructor(public g: THREE.Group, public mats: Map<MatKind, THREE.Material>, public lines: { m: LineMaterial; k: number }[]) {
    for (const m of mats.values()) this.base.set(m as Mat, (m as Mat).opacity);
    new THREE.Box3().setFromObject(g).getCenter(this.c);
  }
  mat<T extends THREE.Material = THREE.Material>(k: MatKind) { return this.mats.get(k) as T | undefined; }
  /** fades the whole piece (its materials and its outlines); a piece at 0 is hidden */
  fade(o: number) {
    o = Math.min(1, Math.max(0, o));
    this.g.visible = o > 0.003;
    if (Math.abs(o - this.op) < 1e-4) return;
    this.op = o;
    for (const [m, b] of this.base) {
      m.opacity = b * o;
      const tr = b < 1 || o < 0.999 || m.userData.glass === true;
      if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; }
    }
    for (const l of this.lines) l.m.opacity = l.k * o;
  }
  get opacity() { return this.op; }
}

/** the view direction at rest (toward the camera): edges whose every face looks away from it are "seen through the glass" */
const VIEW = new THREE.Vector3(1, 1, 1).normalize();
const key = (v: THREE.Vector3) => `${Math.round(v.x * 1e3)},${Math.round(v.y * 1e3)},${Math.round(v.z * 1e3)}`;

/** builds a piece: meshes merged per material, plus the outline of their edges sharper than `edges` degrees */
export class Kit {
  private mats = new Map<MatKind, THREE.Material>();
  private parts = new Map<MatKind, { geos: THREE.BufferGeometry[]; order: number }>();
  private segs: number[] = [];
  private back: number[] = [];
  constructor(private lib: Lib) {}
  mat(k: MatKind) { let m = this.mats.get(k); if (!m) { m = this.lib.make(k); this.mats.set(k, m); } return m; }
  add(geo: THREE.BufferGeometry, kind: MatKind, pos?: [number, number, number], edges = 25, order = 0) {
    const mx = new THREE.Matrix4().makeTranslation(...(pos ?? [0, 0, 0]));
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    geo.dispose();
    for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal" && k !== "uv") g.deleteAttribute(k);
    g.clearGroups(); g.applyMatrix4(mx);
    if (edges) {
      const glassy = GLASSY.includes(kind);
      // for the glass: the faces round each edge, so the ones seen only through it can be told apart
      const faces = new Map<string, boolean>();
      if (glassy) {
        const p = g.attributes.position as THREE.BufferAttribute, a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
        for (let i = 0; i < p.count; i += 3) {
          a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
          n.subVectors(c, b).cross(new THREE.Vector3().subVectors(a, b)).normalize();
          const front = n.dot(VIEW) > 0.01;
          for (const [u, v] of [[a, b], [b, c], [c, a]]) {
            const k1 = key(u), k2 = key(v), k = k1 < k2 ? k1 + "|" + k2 : k2 + "|" + k1;
            faces.set(k, (faces.get(k) ?? false) || front);
          }
        }
      }
      const e = new THREE.EdgesGeometry(g, edges), p = e.attributes.position as THREE.BufferAttribute, v = new THREE.Vector3(), w = new THREE.Vector3();
      for (let i = 0; i < p.count; i += 2) {
        v.fromBufferAttribute(p, i); w.fromBufferAttribute(p, i + 1);
        let out = this.segs;
        if (glassy) { const k1 = key(v), k2 = key(w), k = k1 < k2 ? k1 + "|" + k2 : k2 + "|" + k1; if (faces.get(k) === false) out = this.back; }
        out.push(v.x, v.y, v.z, w.x, w.y, w.z);
      }
      e.dispose();
    }
    this.mat(kind);
    const slot = this.parts.get(kind) ?? { geos: [], order: 0 };
    slot.geos.push(g); slot.order = Math.max(slot.order, order); this.parts.set(kind, slot);
  }
  done(lineK = 0.85): Piece {
    const g = new THREE.Group();
    for (const [kind, { geos, order }] of this.parts) {
      const merged = geos.length > 1 ? mergeGeometries(geos, false)! : geos[0];
      if (geos.length > 1) geos.forEach((x) => x.dispose());
      const mesh = new THREE.Mesh(merged, this.mats.get(kind));
      mesh.renderOrder = order; mesh.userData.kind = kind;
      const solid = !GLASSY.includes(kind);
      mesh.castShadow = solid; mesh.receiveShadow = false;
      g.add(mesh);
    }
    const lines: { m: LineMaterial; k: number }[] = [];
    const addLines = (segs: number[], green: boolean, k: number, order: number) => {
      if (!segs.length) return;
      const m = this.lib.line(green);
      const lg = new LineSegmentsGeometry(); lg.setPositions(segs);
      const l = new LineSegments2(lg, m); l.renderOrder = order; l.userData.kind = "line"; g.add(l);
      lines.push({ m, k });
    };
    const order = Math.max(0, ...[...this.parts.values()].map((x) => x.order));
    addLines(this.back, true, 0.55, order);
    addLines(this.segs, false, lineK, order + 1);
    this.segs = []; this.back = [];
    return new Piece(g, this.mats, lines);
  }
}

/* ── shapes ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
/** a closed outline in the floor plane (shape x → world X, shape y → world −Z) extruded from y0 to y1 */
function slab(sh: THREE.Shape, y0: number, y1: number, curve = 24) {
  return new THREE.ExtrudeGeometry(sh, { depth: y1 - y0, bevelEnabled: false, curveSegments: curve }).rotateX(-Math.PI / 2).translate(0, y0, 0);
}
const squarePath = (h: number, cx = 0, cy = 0) => {
  const p = new THREE.Path(); p.moveTo(cx - h, cy - h); p.lineTo(cx - h, cy + h); p.lineTo(cx + h, cy + h); p.lineTo(cx + h, cy - h); p.closePath(); return p;
};
const circlePath = (x: number, y: number, r: number) => { const p = new THREE.Path(); p.absarc(x, y, r, 0, Math.PI * 2, true); return p; };

export function buildPlate(lib: Lib, d: PlateDef): Piece {
  const kit = new Kit(lib), h = d.half, sh = new THREE.Shape();
  if (d.kind === "arm") {
    // the square and its arm (shape y = −z): from the right corner (h, h) along +X to x1, over z ∈ [z0, z1]
    sh.moveTo(-h, -h); sh.lineTo(h, -h); sh.lineTo(h, -ARM.z1); sh.lineTo(ARM.x1, -ARM.z1); sh.lineTo(ARM.x1, -ARM.z0); sh.lineTo(-h, h); sh.closePath();
    sh.holes.push(circlePath(ARM.hole.x, -ARM.hole.z, ARM.hole.r));
  } else {
    sh.moveTo(-h, -h); sh.lineTo(h, -h); sh.lineTo(h, h); sh.lineTo(-h, h); sh.closePath();
  }
  if (d.hole > 0) sh.holes.push(squarePath(d.hole));
  if (d.kind === "sheet") for (const [x, z, r] of SHEET_HOLES) sh.holes.push(circlePath(x, -z, r));
  const kind: MatKind = d.kind === "perf" ? "perf" : d.kind === "arm" ? "perfArm" : "glass";
  // the glass draws bottom to top (each sheet over what lies under it)
  kit.add(slab(sh, d.y0, d.y1), kind, undefined, 30, kind === "glass" ? 3 + PLATES.indexOf(d) : 0);
  return kit.done();
}
export function buildColumn(lib: Lib) {
  const kit = new Kit(lib), h = COLUMN.s / 2, sh = new THREE.Shape();
  sh.moveTo(-h, -h); sh.lineTo(h, -h); sh.lineTo(h, h); sh.lineTo(-h, h); sh.closePath();
  kit.add(slab(sh, COLUMN.y0, COLUMN.y1), "column", undefined, 30, 6);
  return kit.done();
}
/** a cube of side s, its base centre at (x, y0, z) */
export function buildCube(lib: Lib, s: number, kind: MatKind, at: [number, number, number]) {
  const kit = new Kit(lib);
  kit.add(new THREE.BoxGeometry(s, s, s), kind, [at[0], at[1] + s / 2, at[2]], 30);
  return kit.done();
}
