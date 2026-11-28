// Hero study "Pillar D"'s geometry: the drawing of Figma node 1120:6520 (public/hero-private/pillar.svg) measured into a 3-D model (study C's
// measures, ../pillar-c/pillar.ts, copied here so D owns them), changed to tell "privacy through glass": the column below the frame stays solid white
// (the public chain, its faces carry the data), the column above it is frosted glass, and inside the frame three horizontal panes stack up round the
// core (clear, frosted, deep frosted) where C had its glass bubble. Units: one world unit along a floor axis (or up) is 100 of the drawing's px in its
// isometric; the origin is the drawing's point (1226.1, 1097) on the floor (y = 0), the column's axis. World +X runs down-right in the drawing, +Z
// down-left, +Y up (so the camera at rest looks from +X +Y +Z).
// Every piece is a `Piece`: its meshes merged by material (one draw per material), its own material instances (so each piece fades on its own), and
// one set of fat outlines (its hard edges). Materials come from the scene's library (`Lib`, ./fx.ts), so the look lives there.
import * as THREE from "three";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export const F = { x: 1226.1, y: 1097 };
/** a point of the drawing (sx, sy) placed at height y: the world point that projects there in the isometric */
export function fromDrawing(sx: number, sy: number, y: number) {
  const u = (sx - F.x) / 86.6, v = (sy - F.y + 100 * y) / 50;
  return new THREE.Vector3((u + v) / 2, y, (v - u) / 2);
}

/* ── the measures ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
export const COL = 0.88;                     // the column's side
export const A = 4.04;                       // the frame: its corners' centres at (±A, ±A)
export const YC = 0.32;                      // the frame's mid height (tubes 0.68 tall, from the floor)
export const TUBE = { w: 0.95, h: 0.68 };
export const COLLAR = { y0: 1.53, y1: 1.78, s: 1.11 };
export const SAT_Y = 0.4;                    // the satellites' and the dotted lines' height
/** the satellites: drawing bbox [x, y, w, h], their kind */
export const SATS: [string, number, number, number, number, "cap" | "cube" | "window" | "chamfer" | "leaf"][] = [
  ["D1", 419, 525, 130, 126, "cap"], ["D2", 641, 661, 51, 69, "leaf"], ["D5", 1760, 549, 40, 48, "cube"], ["D4", 1868, 423, 130, 126, "cap"],
  ["D7", 1778, 697, 51, 77, "leaf"], ["D6", 1903, 586, 106, 126, "window"], ["D10", 612, 1391, 51, 59, "leaf"], ["D9", 412, 1484, 84, 112, "chamfer"],
  ["D13", 1802, 1377, 51, 77, "leaf"], ["D12", 1966, 1481, 52, 62, "cube"],
];
/** the dotted rows to the satellites: drawing [x1, y1, x2, y2, dots], from the frame outward */
export const DOTS: [number, number, number, number, number][] = [
  [791.5, 763.5, 723.5, 724.2, 3], [621.5, 665.2, 553.5, 625.8, 3], [1579.5, 687.8, 1756.2, 585.8, 6], [1826.8, 545, 1862.2, 524.7, 2],
  [1745.3, 768.9, 1890.5, 685, 3], [730.3, 1375.3, 693.8, 1396.5, 2], [584.2, 1459.7, 511.1, 1501.8, 3], [1727.2, 1357.9, 1798.7, 1399.3, 3],
  [1870.2, 1440.5, 1941.8, 1481.9, 3],
];
/** the grey guides: three floor lines off the corners, five verticals (drawing [x1, y1, x2, y2, dots]) */
export const GUIDES: [number, number, number, number, number][] = [
  [378.1, 1136.7, 1.1, 919, 49], [2074.1, 1136.7, 2451.1, 919, 49], [1438.2, 1503.9, 1814.9, 1721.5, 49],
  [448.7, 1177.4, 448.7, 1507.9, 37], [1956.3, 987, 1956.3, 681, 34], [1779.7, 888.5, 1779.7, 585.9, 34], [1991.7, 1184.3, 1991.7, 1493, 35],
  [2074.1, 1136.7, 2074.1, 1510.7, 42],
];

/* ── the material library (./fx.ts makes it) ──────────────────────────────────────────────────────────────────────────────────────────────── */
export type MatKind = "white" | "chain" | "dim" | "screw" | "core" | "green" | "glass" | "gline" | "frost" | "pane";
export interface Lib {
  /** a new material of that kind (one per piece, so pieces fade on their own) */
  make(kind: MatKind): THREE.Material;
  /** a new outline material (1.3 px ink) */
  line(): LineMaterial;
}

/* ── a piece ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
type Mat = THREE.Material & { opacity: number; transparent: boolean };
export class Piece {
  /** the piece's centre (world, at rest): the scene scales pieces about it */
  c = new THREE.Vector3();
  private op = 1;
  private base = new Map<Mat, number>();
  /** the outline's opacity at rest */
  lineK = 0.85;
  constructor(public g: THREE.Group, public mats: Map<MatKind, THREE.Material>, public line: LineMaterial | null) {
    for (const m of mats.values()) this.base.set(m as Mat, (m as Mat).opacity);
    new THREE.Box3().setFromObject(g).getCenter(this.c);
  }
  mat<T extends THREE.Material = THREE.Material>(k: MatKind) { return this.mats.get(k) as T | undefined; }
  /** sets a material's resting opacity (the fade multiplies it) */
  setBase(m: THREE.Material, o: number) { this.base.set(m as Mat, o); (m as Mat).opacity = o * this.op; }
  /** fades the whole piece (its materials and its outline); a piece at 0 is hidden. Toggling `transparent` swaps the program variant (OPAQUE). */
  fade(o: number) {
    o = Math.min(1, Math.max(0, o));
    this.g.visible = o > 0.003;
    if (Math.abs(o - this.op) < 1e-4) return;
    this.op = o;
    for (const [m, b] of this.base) {
      m.opacity = b * o;
      const tr = b < 1 || o < 0.999 || m.userData.glass === true;   // the glass is always blended
      if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; }
    }
    if (this.line) this.line.opacity = this.lineK * o;
  }
  get opacity() { return this.op; }
}

/** builds a piece: meshes (placed by pos / rot) merged per material, plus the outline of their edges sharper than `edges` degrees */
export class Kit {
  private mats = new Map<MatKind, THREE.Material>();
  private parts = new Map<MatKind, { geos: THREE.BufferGeometry[]; order: number }>();
  private segs: number[] = [];
  constructor(private lib: Lib) {}
  mat(k: MatKind) { let m = this.mats.get(k); if (!m) { m = this.lib.make(k); this.mats.set(k, m); } return m; }
  add(geo: THREE.BufferGeometry, kind: MatKind, pos?: THREE.Vector3 | [number, number, number], edges = 25, rot?: THREE.Euler, order = 0) {
    const mx = new THREE.Matrix4().compose(
      pos ? (Array.isArray(pos) ? new THREE.Vector3(...pos) : pos.clone()) : new THREE.Vector3(),
      new THREE.Quaternion().setFromEuler(rot ?? new THREE.Euler()), new THREE.Vector3(1, 1, 1));
    if (edges) {
      const e = new THREE.EdgesGeometry(geo, edges), p = e.attributes.position as THREE.BufferAttribute, v = new THREE.Vector3();
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(mx); this.segs.push(v.x, v.y, v.z); }
      e.dispose();
    }
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    geo.dispose();
    for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal" && k !== "uv") g.deleteAttribute(k);
    g.clearGroups(); g.applyMatrix4(mx);
    this.mat(kind);
    const slot = this.parts.get(kind) ?? { geos: [], order: 0 };
    slot.geos.push(g); slot.order = Math.max(slot.order, order); this.parts.set(kind, slot);
  }
  done(): Piece {
    const g = new THREE.Group();
    for (const [kind, { geos, order }] of this.parts) {
      const merged = geos.length > 1 ? mergeGeometries(geos, false)! : geos[0];
      if (geos.length > 1) geos.forEach((x) => x.dispose());
      const mesh = new THREE.Mesh(merged, this.mats.get(kind));
      mesh.renderOrder = order; mesh.userData.kind = kind;
      const solid = kind === "white" || kind === "chain" || kind === "dim" || kind === "screw" || kind === "core" || kind === "green";
      mesh.castShadow = solid; mesh.receiveShadow = solid;
      g.add(mesh);
    }
    let line: LineMaterial | null = null;
    if (this.segs.length) {
      line = this.lib.line();
      const lg = new LineSegmentsGeometry(); lg.setPositions(this.segs);
      const l = new LineSegments2(lg, line); l.renderOrder = 2; l.userData.kind = "line"; g.add(l);
    }
    this.segs = [];
    return new Piece(g, this.mats, line);
  }
}

/* ── shapes ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
/** a square prism with chamfered vertical edges, from y0 to y1 */
export function prism(s: number, y0: number, y1: number, c = 0.045) {
  const h = s / 2, sh = new THREE.Shape();
  sh.moveTo(-h + c, -h); sh.lineTo(h - c, -h); sh.lineTo(h, -h + c); sh.lineTo(h, h - c); sh.lineTo(h - c, h); sh.lineTo(-h + c, h); sh.lineTo(-h, h - c); sh.lineTo(-h, -h + c); sh.closePath();
  return new THREE.ExtrudeGeometry(sh, { depth: y1 - y0, bevelEnabled: false }).rotateX(-Math.PI / 2).translate(0, y0, 0);
}
/** an L block (a frame corner): legs `reach` long along local +x and +y (shape space), `w` wide, `h` tall, its outer corner rounded */
function cornerGeo(reach: number, w: number, h: number, r: number) {
  const a = w / 2, sh = new THREE.Shape();
  sh.moveTo(reach, -a); sh.lineTo(-a + r, -a); sh.absarc(-a + r, -a + r, r, -Math.PI / 2, -Math.PI, true);
  sh.lineTo(-a, reach); sh.lineTo(a, reach); sh.lineTo(a, a + 0.08); sh.absarc(a + 0.08, a + 0.08, 0.08, Math.PI, Math.PI * 1.5, false); sh.lineTo(reach, a); sh.closePath();
  return new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false, curveSegments: 10 }).rotateX(-Math.PI / 2).translate(0, -h / 2, 0);
}
/** a quarter disc (the satellites' glass leaves) of radius r, thickness t, centred on its own middle */
function leafGeo(r: number, t: number) {
  const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(r, 0); sh.absarc(0, 0, r, 0, Math.PI / 2, false); sh.closePath();
  return new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false, curveSegments: 12 }).translate(-r / 2, -r / 2, -t / 2);
}
/** a cap: a cube with a slot down one side */
function capGeo(s: number) {
  const h = s / 2, n = s * 0.24, d = s * 0.42, sh = new THREE.Shape();
  sh.moveTo(-h, -h); sh.lineTo(h, -h); sh.lineTo(h, h); sh.lineTo(n, h); sh.lineTo(n, h - d); sh.lineTo(-n, h - d); sh.lineTo(-n, h); sh.lineTo(-h, h); sh.closePath();
  return new THREE.ExtrudeGeometry(sh, { depth: s, bevelEnabled: false }).translate(0, 0, -h);
}
/** a cube with one edge chamfered */
function chamferGeo(s: number) {
  const h = s / 2, c = s * 0.34, sh = new THREE.Shape();
  sh.moveTo(-h, -h); sh.lineTo(h, -h); sh.lineTo(h, h - c); sh.lineTo(h - c, h); sh.lineTo(-h, h); sh.closePath();
  return new THREE.ExtrudeGeometry(sh, { depth: s, bevelEnabled: false }).translate(0, 0, -h);
}
const box = (x: number, y: number, z: number) => new THREE.BoxGeometry(x, y, z);

/** a screw: a domed head (local +Y out of the surface) with a slot cut across it; `n` is the face's normal, `pos` its centre on the face */
function screw(kit: Kit, pos: THREE.Vector3 | [number, number, number], n: THREE.Vector3, r = 0.058, turn = 0.7) {
  const p = Array.isArray(pos) ? new THREE.Vector3(...pos) : pos;
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n.clone().normalize());
  const e = new THREE.Euler().setFromQuaternion(q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), turn)));
  const head = new THREE.CylinderGeometry(r * 0.86, r, 0.022, 18).translate(0, 0.011, 0);
  const dome = new THREE.SphereGeometry(r * 0.86, 18, 6, 0, Math.PI * 2, 0, 0.55).scale(1, 0.35, 1).translate(0, 0.016, 0);
  kit.add(head, "screw", p, 40, e);
  kit.add(dome, "screw", p, 0, e);
  kit.add(box(r * 1.7, 0.03, r * 0.32).translate(0, 0.026, 0), "dim", p, 0, e);
}
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/* ── the column ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
export type Seg = { p: Piece; k: number; dir: 1 | -1; y0: number; y1: number };
/** the column's segments above the core (dir 1: frosted glass, the private side) and below it (dir -1: the public chain, solid white with screws,
 *  its seen faces carrying the data), k counting from the core; each a body with its neck */
export function buildColumn(lib: Lib, reach = 30): Seg[] {
  const out: Seg[] = [];
  const seg = (y0: number, y1: number, neck: [number, number] | null, k: number, dir: 1 | -1) => {
    const kit = new Kit(lib), m = dir > 0 ? "frost" : "chain";
    kit.add(prism(COL, y0, y1), m, undefined, 25, undefined, dir > 0 ? 5 : 0);
    if (neck) kit.add(prism(0.75, neck[0], neck[1], 0.04), dir > 0 ? "frost" : "white", undefined, 25, undefined, dir > 0 ? 5 : 0);
    // the chain's screws: one near the bottom of the body's left face (+Z), another on its right face (+X)
    if (dir < 0 && y1 - y0 > 1.5) {
      screw(kit, [-0.27, y0 + 0.22, COL / 2], V(0, 0, 1));
      screw(kit, [COL / 2, y1 - 0.22, 0.27], V(1, 0, 0));
    }
    const p = kit.done();
    if (dir > 0) p.lineK = 0.62;
    out.push({ p, k, dir, y0: neck ? Math.min(y0, neck[0]) : y0, y1: neck ? Math.max(y1, neck[1]) : y1 });
  };
  // above: a short body over the collar, then bodies of 2.38 every 2.64 (C's heights)
  seg(1.6, 2.66, [2.66, 2.94], 0, 1);
  seg(2.94, 4.84, [4.84, 5.12], 1, 1);
  seg(5.12, 7.02, [7.02, 7.29], 2, 1);
  for (let k = 3, y = 7.29; y < reach; k++, y += 2.64) seg(y, y + 2.38, [y + 2.38, y + 2.64], k, 1);
  // below: the neck under the core, a long body, then bodies of 1.9 every 2.16
  seg(-6.04, -1.35, [-1.35, -1.21], 0, -1);
  for (let k = 1, y = -6.04; y > -reach; k++, y -= 2.16) seg(y - 2.16, y - 0.26, [y - 0.26, y], k, -1);
  return out;
}

/* ── the core, the collar ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
export function buildCore(lib: Lib) {
  const kit = new Kit(lib);
  const tiers: [number, number, number][] = [[1.9, -1.21, -1.07], [1.6, -1.07, -0.82], [1.25, -0.82, 0.34], [1.45, 0.34, 0.5], [0.98, 0.5, 1.02], [0.7, 1.02, 1.32]];
  for (const [s, y0, y1] of tiers) kit.add(prism(s, y0, y1, 0.05), "core");
  // the body's framed panels (front faces), recessed, and its corner posts
  for (const [x, z, ry] of [[0, 0.626, 0], [0.626, 0, Math.PI / 2]] as const) {
    kit.add(box(0.72, 0.78, 0.02), "dim", [x, -0.24, z], 30, new THREE.Euler(0, ry, 0));
    kit.add(box(0.44, 0.5, 0.03), "core", [x * 1.02, -0.24, z * 1.02], 30, new THREE.Euler(0, ry, 0));
  }
  for (const [x, z] of [[0.56, 0.56], [-0.56, 0.56], [0.56, -0.56]]) kit.add(box(0.16, 1.16, 0.16), "core", [x, -0.24, z]);
  return kit.done();
}
export function buildCollar(lib: Lib) {
  const kit = new Kit(lib); kit.add(prism(COLLAR.s, COLLAR.y0, COLLAR.y1, 0.06), "green"); return kit.done();
}

/* ── the panes ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
/** the three panes, bottom to top: clear (the data still legible), set in the frame; frosted (soft); deep frosted (only a glow). Each a slab of glass
 *  `half` wide (half its side) at height `y`, with a square hole round the core / column (`hole`, half its side); a ziggurat, so each one's rim shows
 *  round the one above it. */
export const PANES = [
  { y: 0.3, half: 3.3, hole: 0.86, t: 0.11 },         // clear: set in the frame, at its height
  { y: 0.87, half: 2.3, hole: 0.64, t: 0.11 },        // frosted: over the core's body
  { y: 1.43, half: 1.36, hole: 0.5, t: 0.11 },        // deep frosted: over the core's top, under the collar (which rests on it)
];
/** a rounded square's outline (half side h, corner radius r), counter-clockwise */
function roundRect(h: number, r: number, n = 8) {
  const out: THREE.Vector2[] = [];
  for (const [cx, cy, a0] of [[h - r, -h + r, -Math.PI / 2], [h - r, h - r, 0], [-h + r, h - r, Math.PI / 2], [-h + r, -h + r, Math.PI]])
    for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * (Math.PI / 2); out.push(new THREE.Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r)); }
  return out;
}
export function buildPane(lib: Lib, i: number) {
  const { half, hole, t } = PANES[i], kit = new Kit(lib);
  const sh = new THREE.Shape(roundRect(half, 0.22));
  sh.holes.push(new THREE.Path(roundRect(hole, 0.12).reverse()));
  const geo = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false }).rotateX(-Math.PI / 2).translate(0, -t / 2, 0);
  kit.add(geo, "pane", undefined, 30, undefined, 3 + i);
  const p = kit.done();
  p.lineK = 0.5;
  p.g.position.y = PANES[i].y;
  p.c.set(0, PANES[i].y, 0);
  return p;
}

/* ── the frame ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
export type FramePiece = { p: Piece; kind: "corner" | "glass" | "solid" | "clamp"; out: THREE.Vector3; arm: number; j: number; i: number; along?: [THREE.Vector3, THREE.Vector3] };
/** the four corners (left, back, right, front) and the four arms, each arm from its small corner: glass, clamp, then glass or solid */
export function buildFrame(lib: Lib) {
  const pieces: FramePiece[] = [];
  const corners: [THREE.Vector3, THREE.Vector3, THREE.Vector3, number][] = [
    [V(-A, YC, A), V(0, 0, -1), V(1, 0, 0), 0.97], [V(-A, YC, -A), V(1, 0, 0), V(0, 0, 1), 1.68],
    [V(A, YC, -A), V(-1, 0, 0), V(0, 0, 1), 0.97], [V(A, YC, A), V(-1, 0, 0), V(0, 0, -1), 1.68],
  ];
  corners.forEach(([c, dA, dB, reach], i) => {
    const kit = new Kit(lib), w = 1.12, h = 0.84;
    const geo = cornerGeo(reach + w / 2 - 0.02, w, h, 0.5);
    // local shape x → dA, shape y → dB (after the extrusion's turn, shape y lies along −Z)
    // (the L is symmetric: when that basis would mirror it, the legs swap, so the faces keep their winding)
    const basis = new THREE.Matrix4().makeBasis(dA, V(0, 1, 0), dB.clone().negate());
    geo.applyMatrix4(basis.determinant() > 0 ? basis : new THREE.Matrix4().makeBasis(dB, V(0, 1, 0), dA.clone().negate()));
    kit.add(geo, "white", c, 20);
    // screws on the top
    for (const [p, q] of [[0.25, -0.25], [-0.25, 0.25], [0.6, -0.1], [-0.1, 0.6]]) {
      const pos = c.clone().addScaledVector(dA, p + 0.15).addScaledVector(dB, q + 0.15).setY(YC + h / 2);
      if (reach > 1.2 || Math.abs(p) < 0.5) screw(kit, pos, V(0, 1, 0), 0.058, p * 3 + q);
    }
    pieces.push({ p: kit.done(), kind: "corner", out: c.clone().setY(0).normalize(), arm: -1, j: 0, i });
  });
  // arms: [small corner, big corner, outward normal, second piece glass?]
  const arms: [THREE.Vector3, THREE.Vector3, THREE.Vector3, boolean][] = [
    [V(A, YC, -A), V(-A, YC, -A), V(0, 0, -1), true],   // back right: from the right corner to the back one
    [V(A, YC, -A), V(A, YC, A), V(1, 0, 0), false],     // front right
    [V(-A, YC, A), V(A, YC, A), V(0, 0, 1), false],     // front left
    [V(-A, YC, A), V(-A, YC, -A), V(-1, 0, 0), false],  // back left
  ];
  arms.forEach(([S, L, n, glass2], a) => {
    const d = L.clone().sub(S).normalize();
    const ry = Math.atan2(d.x, d.z);                     // a box's local z along the arm
    const at = (t: number) => S.clone().addScaledVector(d, t);
    const part = (t0: number, t1: number, kind: "glass" | "solid" | "clamp", j: number) => {
      const kit = new Kit(lib), len = t1 - t0, mid = at((t0 + t1) / 2), rot = new THREE.Euler(0, ry, 0);
      if (kind === "glass") {
        kit.add(box(TUBE.w, TUBE.h, len - 0.02), "glass", mid, 25, rot, 3);
        // the inner green line: along the bottom, on the outer side
        const lp = mid.clone().addScaledVector(n, TUBE.w / 2 - 0.09).setY(YC - TUBE.h / 2 + 0.03);
        kit.add(box(0.1, 0.025, len - 0.06), "gline", lp, 0, rot, 4);
      } else if (kind === "solid") {
        kit.add(new RoundedBoxGeometry(TUBE.w, TUBE.h, len - 0.02, 2, 0.03), "white", mid, 25, rot);
        screw(kit, mid.clone().addScaledVector(n, TUBE.w / 2).addScaledVector(d, len * 0.3), n, 0.05);
      } else {
        kit.add(box(1.2, 0.92, len - 0.16), "white", mid, 25, rot);
        for (const f of [-1, 1]) kit.add(box(1.25, 0.97, 0.08), "white", mid.clone().addScaledVector(d, f * (len / 2 - 0.06)), 25, rot);
        // a recessed slot along its outer face, a screw beside it
        kit.add(new RoundedBoxGeometry(0.03, 0.14, len * 0.5, 2, 0.012), "dim", mid.clone().addScaledVector(n, 0.6).setY(YC + 0.12), 30, rot);
        screw(kit, mid.clone().addScaledVector(n, 0.6).setY(YC - 0.18), n, 0.05);
        screw(kit, mid.clone().setY(YC + 0.46), V(0, 1, 0), 0.05);
      }
      pieces.push({ p: kit.done(), kind, out: n.clone(), arm: a, j, i: pieces.length, along: [at(t0 - 0.2), at(t1 + 0.2)] });
    };
    part(0.97 + 0.02, 3.14, "glass", 0);
    part(3.14, 4.24, "clamp", 2);
    part(4.24, 6.4 - 0.02, glass2 ? "glass" : "solid", 1);
  });
  return pieces;
}

/* ── the satellites ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
export function buildSat(kind: (typeof SATS)[number][5], w: number, dir: THREE.Vector3, lib: Lib) {
  const kit = new Kit(lib), s = w / 173.2;
  if (kind === "cube") kit.add(new RoundedBoxGeometry(s, s, s, 2, s * 0.06), "white", undefined, 30);
  if (kind === "cap") kit.add(capGeo(s), "white");
  if (kind === "chamfer") kit.add(chamferGeo(s), "white", undefined, 25, new THREE.Euler(0, Math.PI / 2, 0));
  if (kind === "window") {
    kit.add(box(s, s, s), "white");
    kit.add(box(s * 0.56, s * 0.56, 0.02), "dim", [0, 0, s / 2 + 0.005]);
    kit.add(box(s * 0.32, s * 0.32, 0.03), "white", [0, 0, s / 2 + 0.01]);
  }
  if (kind === "leaf") {
    // standing, facing along its dotted row
    kit.add(leafGeo(0.4, 0.09), "glass", undefined, 25, new THREE.Euler(0, Math.atan2(dir.x, dir.z), 0), 3);
  }
  const p = kit.done();
  p.c.set(0, 0, 0);
  return p;
}
